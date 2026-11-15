/*//////////////////////////////////////////////////////////////////////*/

const limit = 128 * 1024 * 1024;

function sections(bytes, bare = false) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.length < 64) {throw new Error("The executable header is incomplete.");}
    const start = bare ? 0 : view.getUint32(60, true);
    if (start + 24 > bytes.length || view.getUint32(start, true) !== 17744) {throw new Error("Invalid executable header.");}
    const count = view.getUint16(start + 6, true);
    const table = start + 24 + view.getUint16(start + 20, true);
    if (count > 96 || table + count * 40 > bytes.length) {throw new Error("Invalid executable sections.");}
    const result = [];
    for (let index = 0; index < count; index++) {
        const offset = table + index * 40;
        result.push({
            name: new TextDecoder().decode(bytes.subarray(offset, offset + 8)).replaceAll("\0", ""),
            address: view.getUint32(offset + 12, true), size: view.getUint32(offset + 16, true), offset: view.getUint32(offset + 20, true)
        });
    }
    return result;
}

export function packed(bytes) {
    if (bytes.length < 64 || bytes[0] !== 77 || bytes[1] !== 90) {return false;}
    try {
        const entries = sections(bytes);
        return entries.some(entry => entry.name === "UPX0") && entries.some(entry => entry.name === "UPX1");
    } catch {return false;}
}

export function rebuild(original, headers, image) {
    const input = sections(original);
    const entries = sections(headers, true);
    const first = input.find(entry => entry.name === "UPX0");
    let marker = -1;
    for (let offset = 64; offset + 32 < Math.min(original.length, 65536); offset++) {
        if (original[offset] === 85 && original[offset + 1] === 80 && original[offset + 2] === 88 && original[offset + 3] === 33) {marker = offset; break;}
    }
    if (marker < 0 || !first) {throw new Error("The UPX header could not be read.");}
    const filter = original[marker + 28];
    const tag = original[marker + 29];
    if (![0, 36, 37, 38].includes(filter)) {throw new Error("This UPX filter is not supported yet: " + filter);}
    if (filter) {
        const view = new DataView(image.buffer, image.byteOffset, image.byteLength);
        for (let offset = 0; offset < image.length - 5; offset++) {
            const call = image[offset] === 232 && filter !== 37;
            const jump = image[offset] === 233 && filter !== 36;
            if ((call || jump) && image[offset + 1] === tag) {
                const target = view.getUint32(offset + 1, false) & 16777215;
                view.setUint32(offset + 1, target - offset - 1, true);
                offset += 4;
            }
        }
    }
    const overlay = Math.max(...input.map(entry => entry.offset + entry.size));
    const end = Math.max(1024, ...entries.map(entry => entry.offset + entry.size));
    if (overlay > original.length || end + original.length - overlay > limit || headers.length + 256 > 1024) {throw new Error("The unpacked executable is too large or invalid.");}
    const output = new Uint8Array(end + original.length - overlay);
    output.set(original.subarray(0, 256));
    new DataView(output.buffer).setUint32(60, 256, true);
    output.set(headers, 256);
    for (const entry of entries) {
        if (!entry.size) {continue;}
        const offset = entry.address - first.address;
        if (entry.offset < headers.length + 256 || offset < 0 || offset + entry.size > image.length) {throw new Error("Invalid unpacked executable section.");}
        output.set(image.subarray(offset, offset + entry.size), entry.offset);
    }
    output.set(original.subarray(overlay), end);
    return output;
}

/*//////////////////////////////////////////////////////////////////////*/

export async function unpackexe(bytes) {
    const response = await fetch(new URL("../vendor/upx/bootstrap.gz", import.meta.url));
    if (!response.ok) {throw new Error("Could not load executable decompression.");}
    const source = await new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).text();
    const url = URL.createObjectURL(new Blob([source], {type: "text/javascript"}));
    let create;
    try {create = (await import(url)).default;}
    finally {URL.revokeObjectURL(url);}
    const messages = [];
    const runner = await create({
        noInitialRun: true, noExitRuntime: true,
        locateFile: () => new URL("../vendor/upx/runtime.wasm", import.meta.url).href,
        print: () => {}, printErr: text => {if (messages.length < 20) {messages.push(text);}}
    });
    runner.FS.writeFile("/input", bytes);
    if (runner.callMain(["/input", "/output"]) !== 0) {throw new Error("Could not unpack this executable.\n" + messages.join("\n"));}
    try {return rebuild(bytes, runner.FS.readFile("/headers"), runner.FS.readFile("/image"));}
    catch (error) {throw new Error("Could not restore the GameMaker executable: " + error.message);}
}
