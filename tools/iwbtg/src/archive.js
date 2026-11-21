/*//////////////////////////////////////////////////////////////////////*/

async function load() {
    const response = await fetch(new URL("../vendor/archive/bootstrap.gz", import.meta.url));
    if (!response.ok) {throw new Error("Could not load archive support.");}
    const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
    const blob = new Blob([await new Response(stream).text()], {type: "text/javascript"});
    const url = URL.createObjectURL(blob);
    try {return (await import(url)).default;}
    finally {URL.revokeObjectURL(url);}
}

export function archivepayload(bytes) {
    if (bytes[0] !== 77 || bytes[1] !== 90) {return null;}
    const signatures = [[77,83,67,70], [55,122,188,175,39,28]];
    for (let offset = 64; offset < Math.min(bytes.length - 40, 4 * 1024 * 1024); offset++) {
        for (const signature of signatures) {
            if (!signature.every((value, index) => bytes[offset + index] === value)) {continue;}
            if (signature.length === 4) {
                const size = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset + 8, true);
                if (size < 36 || offset + size > bytes.length) {continue;}
                return bytes.slice(offset, offset + size);
            }
            return bytes.slice(offset);
        }
    }
    return null;
}

export async function openarchive(bytes, validate, factory) {
    const create = factory || await load();
    const lines = [];
    const decoder = await create({
        locateFile: () => new URL("../vendor/archive/runtime.wasm", import.meta.url).href,
        print: text => lines.push(text), printErr: text => lines.push(text),
        noExitRuntime: true
    });
    decoder.FS.writeFile("/input", bytes);
    const code = decoder.callMain(["l", "-slt", "-ba", "/input"]);
    if (code !== 0) {throw new Error("Could not read this archive.\n" + lines.slice(-4).join("\n"));}
    let count = 0;
    let total = 0;
    for (const block of lines.join("\n").split(/\n\s*\n/)) {
        const fields = {};
        for (let line of block.split("\n")) {
            const progress = line.indexOf("Path = ");
            if (progress >= 0) {line = line.slice(progress);}
            const split = line.indexOf(" = ");
            if (split >= 0) {fields[line.slice(0, split)] = line.slice(split + 3);}
        }
        if (!fields.Path) {continue;}
        validate(fields.Path);
        const size = Number(fields.Size || 0);
        total += size;
        count++;
        if (count > 4096 || size > 256 * 1024 * 1024 || total > 512 * 1024 * 1024) {throw new Error("The expanded archive is too large.");}
        if (fields.Encrypted === "+") {throw new Error("Extract password-protected archives before choosing the game.");}
    }
    if (!count) {throw new Error("No files were found in this archive.");}
    lines.length = 0;
    if (decoder.callMain(["x", "-y", "-o/output", "/input"]) !== 0) {throw new Error("Could not extract this archive.\n" + lines.slice(-4).join("\n"));}
    const result = new Map();
    const paths = new Set();
    let actual = 0;
    function visit(directory, prefix = "") {
        for (const name of decoder.FS.readdir(directory)) {
            if (name === "." || name === "..") {continue;}
            const absolute = directory + "/" + name;
            const relative = validate(prefix + name);
            const information = decoder.FS.lstat(absolute);
            if (decoder.FS.isDir(information.mode)) {visit(absolute, relative + "/"); continue;}
            if (!decoder.FS.isFile(information.mode)) {throw new Error("The archive contains an unsupported file type.");}
            const bytes = decoder.FS.readFile(absolute);
            actual += bytes.length;
            if (actual > 512 * 1024 * 1024 || result.size >= 4096 || paths.has(relative.toLowerCase())) {throw new Error("The archive contains too much data or duplicate paths.");}
            paths.add(relative.toLowerCase());
            result.set(relative, bytes);
        }
    }
    visit("/output");
    return result;
}
