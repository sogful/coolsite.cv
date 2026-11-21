import {path,crc} from "./files.js";

/*//////////////////////////////////////////////////////////////////////*/

async function unzip(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let ending = bytes.length - 22;
    while (ending >= Math.max(0, bytes.length - 65557) && view.getUint32(ending, true) !== 0x06054b50) {ending--;}
    if (ending < 0 || view.getUint32(ending, true) !== 0x06054b50) {throw new Error("This ZIP is incomplete.");}
    const count = view.getUint16(ending + 10, true);
    let cursor = view.getUint32(ending + 16, true);
    if (count === 65535 || cursor === 0xffffffff) {throw new Error("Extract ZIP64 archives to a folder before importing.");}
    if (count > 16000) {throw new Error("This archive contains too many files.");}
    const result = new Map();
    let total = 0;
    for (let number = 0; number < count; number++) {
        if (view.getUint32(cursor, true) !== 0x02014b50) {throw new Error("The ZIP file directory is invalid.");}
        const flags = view.getUint16(cursor + 8, true);
        const method = view.getUint16(cursor + 10, true);
        const checksum = view.getUint32(cursor + 16, true);
        const packed = view.getUint32(cursor + 20, true);
        const size = view.getUint32(cursor + 24, true);
        const length = view.getUint16(cursor + 28, true);
        const extra = view.getUint16(cursor + 30, true);
        const comment = view.getUint16(cursor + 32, true);
        const offset = view.getUint32(cursor + 42, true);
        const raw = bytes.subarray(cursor + 46, cursor + 46 + length);
        let name = new TextDecoder(flags & 0x800 ? "utf-8" : "shift-jis").decode(raw);
        for (let position = cursor + 46 + length; position + 4 <= cursor + 46 + length + extra;) {
            const type = view.getUint16(position, true);
            const amount = view.getUint16(position + 2, true);
            if (type === 0x7075 && amount > 5 && bytes[position + 4] === 1 && view.getUint32(position + 5, true) === crc(raw)) {
                name = new TextDecoder().decode(bytes.subarray(position + 9, position + 4 + amount));
            }
            position += amount + 4;
        }
        cursor += 46 + length + extra + comment;
        if (name.endsWith("/")) {continue;}
        name = path(name);
        if (flags & 1) {throw new Error("Extract password-protected archives before importing.");}
        total += size;
        if (size > 256 * 1024 * 1024 || total > 768 * 1024 * 1024) {throw new Error("The expanded voicebank is too large.");}
        if (view.getUint32(offset, true) !== 0x04034b50) {throw new Error("A ZIP entry is invalid.");}
        const start = offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true);
        if (start + packed > bytes.length) {throw new Error("The ZIP file is incomplete.");}
        let data = bytes.slice(start, start + packed);
        if (method === 8) {
            const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
            data = new Uint8Array(await new Response(stream).arrayBuffer());
        } else if (method !== 0) {throw new Error("Use a folder or 7z file for this ZIP compression method.");}
        if (data.length !== size || crc(data) !== checksum) {throw new Error("A ZIP entry is damaged: " + name);}
        if (result.has(name)) {throw new Error("The ZIP contains duplicate file names.");}
        result.set(name, data);
        if (number % 20 === 0) {self.postMessage({progress: "Extracting " + (number + 1) + "/" + count});}
    }
    return result;
}

async function seven(bytes) {
    const response = await fetch(new URL("../vendor/archive/bootstrap.gz", import.meta.url));
    if (!response.ok) {throw new Error("Could not load 7z support.");}
    const text = await new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).text();
    const url = URL.createObjectURL(new Blob([text], {type: "text/javascript"}));
    let create;
    try {create = (await import(url)).default;} finally {URL.revokeObjectURL(url);}
    const lines = [];
    const module = await create({locateFile: () => new URL("../vendor/archive/runtime.wasm", import.meta.url).href, print: line => lines.push(line), printErr: line => lines.push(line), noExitRuntime: true});
    module.FS.writeFile("/input", bytes);
    if (module.callMain(["l", "-slt", "-ba", "/input"]) !== 0) {throw new Error("Could not read this 7z archive.");}
    let total = 0;
    for (const block of lines.join("\n").split(/\n\s*\n/)) {
        const name = block.match(/^Path = (.+)$/m)?.[1];
        if (!name) {continue;}
        path(name);
        total += Number(block.match(/^Size = (\d+)/m)?.[1] || 0);
        if (total > 768 * 1024 * 1024) {throw new Error("The expanded voicebank is too large.");}
        if (/^Encrypted = \+/m.test(block)) {throw new Error("Extract password-protected archives before importing.");}
    }
    self.postMessage({progress: "Extracting 7z archive"});
    if (module.callMain(["x", "-y", "-o/output", "/input"]) !== 0) {throw new Error("Could not extract this 7z archive.");}
    const result = new Map();
    function visit(directory, prefix = "") {
        for (const name of module.FS.readdir(directory)) {
            if (name === "." || name === "..") {continue;}
            const full = directory + "/" + name;
            const relative = path(prefix + name);
            const info = module.FS.lstat(full);
            if (module.FS.isDir(info.mode)) {visit(full, relative + "/"); continue;}
            if (!module.FS.isFile(info.mode)) {throw new Error("This archive contains an unsupported file type.");}
            if (result.size >= 16000 || info.size > 256 * 1024 * 1024) {throw new Error("This archive contains too much data.");}
            result.set(relative, module.FS.readFile(full));
        }
    }
    visit("/output");
    return result;
}

self.onmessage = async event => {
    try {
        const bytes = new Uint8Array(event.data.bytes);
        const files = /\.zip$/i.test(event.data.name) ? await unzip(bytes) : await seven(bytes);
        self.postMessage({files: [...files]}, [...files.values()].map(value => value.buffer));
    } catch (error) {self.postMessage({error: error.message});}
};
