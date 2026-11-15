import {reader, writer, transform, permutation} from "./binary.js";
import {resources} from "./resources.js";

/*//////////////////////////////////////////////////////////////////////*/

export function classicversion(bytes) {
    if (bytes.length < 64 || bytes[0] !== 77 || bytes[1] !== 90) {return null;}
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (const offset of [700000, 800000, 1420000, 1600000]) {
        if (offset + 8 <= bytes.length && view.getUint32(offset, true) === 1234321 && view.getUint32(offset + 4, true) === 600) {return {version: 6, offset};}
    }
    return null;
}

function encrypted(bytes) {
    const input = new reader(bytes);
    input.number();
    const first = input.count();
    const second = input.count();
    input.take(first * 4);
    const table = permutation(input.count(2147483647));
    input.take(second * 4);
    const result = input.take(bytes.length - input.position).slice();
    for (let index = 1; index < result.length; index++) {result[index] = table[result[index]];}
    return new reader(result);
}

function settings(input) {
    input.take(16);
    input.version(1234321);
    input.version(600);
    const identity = input.take(24);
    input.version(600);
    const values = input.words(20);
    const output = new writer();
    output.numbers(...values.slice(0, 14), 1, ...values.slice(14, 18), 0, 1, ...values.slice(18));
    const loading = input.number();
    output.numbers(loading);
    if (loading) {
        for (let index = 0; index < 2; index++) {
            const exists = input.number();
            output.numbers(exists);
            if (exists) {output.chunk(input.chunk());}
        }
    }
    const image = input.number();
    output.numbers(image);
    if (image) {output.chunk(input.chunk());}
    output.bytes(input.take(28));
    const constants = new writer();
    const count = input.count();
    constants.numbers(800, count);
    for (let index = 0; index < count; index++) {constants.chunk(input.chunk()).chunk(input.chunk());}
    return {identity, settings: output.finish(), constants: constants.finish()};
}

function envelope(settings, body) {
    const output = new writer();
    const header = new Uint8Array(0x144ad0);
    header.set([77, 90]);
    const view = new DataView(header.buffer);
    view.setUint32(60, 128, true);
    header.set([80, 69, 0, 0, 76, 1], 128);
    header.set([139, 69, 244, 232, 42, 189, 253, 255, 144], 0xa49be);
    view.setUint32(0x144ac0, header.length, true);
    output.bytes(header).numbers(1234321, 800, 0, 0).chunk(settings).numbers(0, 0);
    const table = Uint8Array.from({length: 256}, (_, index) => index);
    const data = body.slice();
    for (let index = 0; index < data.length; index++) {
        const other = Math.max(0, index - table[index & 255]);
        [data[index], data[other]] = [data[other], data[index]];
    }
    let previous = data.length >>> 24;
    for (let index = 0; index < data.length; index++) {previous = data[index] = (data[index] + previous + index) & 255;}
    return output.numbers(0, 0).bytes(table).chunk(data).finish();
}

/*//////////////////////////////////////////////////////////////////////*/

export async function convertclassic(bytes, format = classicversion(bytes)) {
    if (!format || format.version !== 6) {throw new Error("Unsupported classic GameMaker executable.");}
    const source = new reader(bytes);
    source.position = format.offset + 8;
    source.take(12);
    const files = [];
    let total = 0;
    for (let count = 0; count <= 4096; count++) {
        const name = source.text();
        if (name === "READY") {break;}
        if (count === 4096) {throw new Error("Too many included game files.");}
        const data = source.chunk();
        if (name.toLowerCase() !== "d3dx8.dll") {
            const bytes = await transform(data);
            total += bytes.length;
            if (total > 512 * 1024 * 1024) {throw new Error("The included game files are too large.");}
            files.push([name, bytes]);
        }
    }
    const input = encrypted(await transform(source.chunk()));
    const config = settings(input);
    const body = new writer();
    body.numbers(64).bytes(new Uint8Array(256)).bytes(config.identity).numbers(700, 0, 800, 0).bytes(config.constants);
    const counts = await resources(input, body);
    body.bytes(input.take(8)).numbers(800, 0);
    input.version(430, 600);
    const help = new writer();
    help.bytes(input.take(8)).chunk(input.chunk()).bytes(input.take(32)).chunk(await transform(input.chunk()));
    body.numbers(800).chunk(await transform(help.finish(), true));
    input.version(500);
    const libraries = input.count();
    body.numbers(500, libraries);
    for (let index = 0; index < libraries; index++) {body.chunk(input.chunk());}
    input.version(500, 540, 700);
    const rooms = input.count();
    body.numbers(700, rooms).bytes(input.take(rooms * 4));
    return {bytes: envelope(await transform(config.settings, true), body.finish()), files, counts};
}

