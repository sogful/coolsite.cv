import {reader, writer, transform, permutation} from "./binary.js";

/*//////////////////////////////////////////////////////////////////////*/

function actions(input) {
    input.version(400);
    for (let count = input.count(); count > 0; count--) {
        input.take(32);
        input.chunk(); input.chunk(); input.number();
        input.take(input.count(8) * 4);
        input.take(8);
        for (let count = input.count(8); count > 0; count--) {input.chunk();}
        input.number();
    }
}

async function pixels(input) {
    input.version(540);
    input.number();
    const width = input.count(16384);
    const height = input.count(16384);
    if (width * height > 16777216) {throw new Error("Classic GameMaker image is too large.");}
    const bytes = await transform(input.chunk(), false, width * height * 4);
    if (bytes.length !== width * height * 4) {throw new Error("Invalid classic GameMaker image size.");}
    return {width, height, bytes};
}

async function sprite(input, output) {
    input.version(542);
    const [width, height, left, right, bottom, top, transparent, smooth, preload, mode, precise, x, y] = input.words(13);
    if (width * height > 16777216) {throw new Error("Classic GameMaker sprite is too large.");}
    const count = input.count(10000);
    output.numbers(800, x, y, count);
    const mask = new Uint8Array(width * height);
    for (let frame = 0; frame < count; frame++) {
        const image = await pixels(input);
        if (image.width !== width || image.height !== height) {throw new Error("Unsupported classic GameMaker frame size.");}
        output.numbers(800, width, height).chunk(image.bytes);
        for (let row = top; row <= bottom && row < height; row++) {
            for (let column = left; column <= right && column < width; column++) {
                const index = row * width + column;
                if (!precise || image.bytes[index * 4 + 3]) {mask[index] = 1;}
            }
        }
    }
    if (count) {
        output.numbers(0, 800, width, height, left, right, bottom, top);
        const collision = new Uint8Array(mask.length * 4);
        for (let index = 0; index < mask.length; index++) {collision[index * 4] = mask[index];}
        output.bytes(collision);
    }
}

async function background(input, output) {
    input.version(543);
    input.take(20);
    output.numbers(710, 800);
    if (input.number()) {
        const image = await pixels(input);
        output.numbers(image.width, image.height).chunk(image.bytes);
    } else {output.numbers(0, 0);}
}

async function sound(input, output) {
    input.version(600);
    output.numbers(800, input.number()).chunk(input.chunk()).chunk(input.chunk());
    const exists = input.number();
    output.numbers(exists);
    if (exists) {output.chunk(await transform(input.chunk()));}
    output.bytes(input.take(24));
}

async function script(input, output) {
    input.version(400);
    const data = await transform(input.chunk());
    const table = permutation(12345);
    for (let index = 0; index < data.length; index++) {data[index] = table[data[index]];}
    const source = new reader(data);
    output.numbers(800).chunk(source.chunk());
    if (source.position !== data.length) {throw new Error("Invalid classic GameMaker script.");}
}

async function font(input, output) {
    input.version(540);
    output.numbers(800).chunk(input.chunk()).bytes(input.take(20 + 6144));
    const width = input.count(16384);
    const height = input.count(16384);
    if (width * height > 16777216) {throw new Error("Classic GameMaker font is too large.");}
    const bytes = await transform(input.chunk(), false, width * height);
    if (bytes.length !== width * height) {throw new Error("Invalid classic GameMaker font.");}
    output.numbers(width, height).chunk(bytes);
}

function path(input, output) {
    input.version(530);
    output.numbers(530).bytes(input.take(12));
    const count = input.count();
    output.numbers(count).bytes(input.take(count * 24));
}

function timeline(input, output) {
    const start = input.position;
    input.version(500);
    for (let count = input.count(); count > 0; count--) {input.number(); actions(input);}
    output.bytes(input.bytes.subarray(start, input.position));
}

function object(input, output) {
    input.version(430);
    output.numbers(430).bytes(input.take(28));
    const last = input.count(11);
    if (last !== 10) {throw new Error("Unsupported classic GameMaker event groups.");}
    output.numbers(11);
    const start = input.position;
    for (let group = 0; group <= last; group++) {
        let count = 0;
        while (input.number() !== 4294967295) {
            if (++count > 100000) {throw new Error("Too many classic GameMaker events.");}
            actions(input);
        }
    }
    output.bytes(input.bytes.subarray(start, input.position)).numbers(4294967295);
}

function room(input, output) {
    input.version(541);
    output.numbers(541).chunk(input.chunk()).bytes(input.take(24)).chunk(input.chunk());
    const backgrounds = input.count(8);
    output.numbers(backgrounds).bytes(input.take(backgrounds * 40)).numbers(input.number());
    const views = input.count(8);
    output.numbers(views).bytes(input.take(views * 56));
    const count = input.count();
    output.numbers(count);
    for (let index = 0; index < count; index++) {output.bytes(input.take(16)).chunk(input.chunk());}
    const tiles = input.count();
    output.numbers(tiles).bytes(input.take(tiles * 36));
}

/*//////////////////////////////////////////////////////////////////////*/

export async function resources(input, output) {
    const counts = {};
    for (const [name, convert] of Object.entries({sound, sprite, background, path, script, font, timeline, object, room})) {
        input.version(400, 420, 500, 540);
        const count = input.count();
        counts[name] = count;
        output.numbers(800, count);
        for (let index = 0; index < count; index++) {
            const item = new writer();
            const exists = input.number();
            item.numbers(exists);
            if (exists) {
                item.chunk(input.chunk());
                try {await convert(input, item);}
                catch (error) {throw new Error(name + " " + index + ": " + error.message);}
            }
            output.chunk(await transform(item.finish(), true));
        }
    }
    return counts;
}



