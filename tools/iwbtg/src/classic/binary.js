export const limit = 128 * 1024 * 1024;

/*//////////////////////////////////////////////////////////////////////*/

export class reader {
    constructor(bytes) {this.bytes = bytes; this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); this.position = 0;}
    take(size) {
        if (!Number.isSafeInteger(size) || size < 0 || size > limit || this.position + size > this.bytes.length) {throw new Error("Invalid classic GameMaker data at " + this.position);}
        const bytes = this.bytes.subarray(this.position, this.position + size);
        this.position += size;
        return bytes;
    }
    number() {const position = this.position; this.take(4); return this.view.getUint32(position, true);}
    count(maximum = 100000) {const value = this.number(); if (value > maximum) {throw new Error("Too many classic GameMaker records.");} return value;}
    words(count) {return Array.from({length: count}, () => this.number());}
    chunk() {return this.take(this.number());}
    text() {return new TextDecoder("windows-1252").decode(this.chunk());}
    version(...values) {const value = this.number(); if (!values.includes(value)) {throw new Error("Unsupported classic GameMaker record: " + value);} return value;}
}

export class writer {
    constructor() {this.parts = []; this.length = 0;}
    bytes(bytes) {
        this.length += bytes.length;
        if (this.length > limit) {throw new Error("Converted game data is too large.");}
        this.parts.push(bytes);
        return this;
    }
    numbers(...values) {
        const bytes = new Uint8Array(values.length * 4);
        const view = new DataView(bytes.buffer);
        values.forEach((value, index) => view.setUint32(index * 4, value, true));
        return this.bytes(bytes);
    }
    chunk(bytes) {return this.numbers(bytes.length).bytes(bytes);}
    finish() {const result = new Uint8Array(this.length); let offset = 0; for (const bytes of this.parts) {result.set(bytes, offset); offset += bytes.length;} return result;}
}

/*//////////////////////////////////////////////////////////////////////*/

export async function transform(bytes, compress = false, maximum = limit) {
    const stream = new Blob([bytes]).stream().pipeThrough(compress ? new CompressionStream("deflate") : new DecompressionStream("deflate"));
    const input = stream.getReader();
    const output = new writer();
    try {
        while (true) {
            const next = await input.read();
            if (next.done) {return output.finish();}
            if (output.length + next.value.length > maximum) {throw new Error("Expanded classic GameMaker data is too large.");}
            output.bytes(next.value);
        }
    } finally {await input.cancel();}
}

export function permutation(seed) {
    const table = Uint8Array.from({length: 256}, (_, index) => index);
    const step = 6 + seed % 250;
    const start = Math.floor(seed / 250);
    for (let index = 1; index <= 10000; index++) {
        const position = 1 + (index * step + start) % 254;
        [table[position], table[position + 1]] = [table[position + 1], table[position]];
    }
    const inverse = new Uint8Array(256);
    table.forEach((value, index) => {inverse[value] = index;});
    return inverse;
}
