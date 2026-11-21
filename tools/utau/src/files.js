const encoder = new TextEncoder();

/*//////////////////////////////////////////////////////////////////////*/

export function decode(bytes) {
    try {return new TextDecoder("utf-8", {fatal: true}).decode(bytes).replace(/^\ufeff/, "");}
    catch {return new TextDecoder("shift-jis").decode(bytes).replace(/^\ufeff/, "");}
}

export function path(value) {
    const text = String(value).replaceAll("\\", "/").replace(/^(\.\/)+/, "");
    if (!text || text.startsWith("/") || /^[a-z]:/i.test(text) || text.includes("\0") || text.split("/").includes("..")) {
        throw new Error("The archive contains an invalid file path.");
    }
    return text.replace(/\/+/g, "/").replace(/\/$/, "");
}

export function stem(value) {return value.split(/[\\/]/).pop().replace(/\.[^.]+$/, "");}

export function filename(value) {
    const clean = String(value).replace(/[<>:"/\\|?*\x00-\x1f]/g, "").trim();
    const extension = clean.match(/\.(ustx|wav|zip)$/i)?.[0] || "";
    return (clean.slice(0, extension ? -extension.length : undefined).slice(0, 100 - extension.length) || "voice") + extension;
}

export function find(entries, name) {
    if (entries.has(name)) {return name;}
    const lower = name.normalize("NFC").toLowerCase();
    return [...entries.keys()].find(key => key.normalize("NFC").toLowerCase() === lower);
}

export async function entries(files, progress = () => {}, signal) {
    if (!files.length) {throw new Error("Choose a voicebank archive or folder.");}
    if (files.length === 1 && /\.(zip|7z)$/i.test(files[0].name) && !files[0].webkitRelativePath) {
        const file = files[0];
        if (file.size > 512 * 1024 * 1024) {throw new Error("Choose an archive smaller than 512 MB.");}
        const worker = new Worker(new URL("archiveworker.js", import.meta.url), {type: "module"});
        try {
            const bytes = await file.arrayBuffer();
            return await new Promise((resolve, reject) => {
                const abort = () => {worker.terminate(); reject(new DOMException("Cancelled", "AbortError"));};
                if (signal?.aborted) {abort(); return;}
                signal?.addEventListener("abort", abort, {once: true});
                const finish = () => signal?.removeEventListener("abort", abort);
                worker.onerror = event => {finish(); reject(new Error(event.message || "Could not read the archive."));};
                worker.onmessage = event => {
                    if (event.data.progress) {progress(event.data.progress); return;}
                    finish();
                    if (event.data.error) {reject(new Error(event.data.error));}
                    else {resolve(new Map(event.data.files));}
                };
                worker.postMessage({bytes, name: file.name}, [bytes]);
            });
        } finally {worker.terminate();}
    }
    const result = new Map();
    let total = 0;
    for (const file of files) {
        if (signal?.aborted) {throw new DOMException("Cancelled", "AbortError");}
        total += file.size;
        if (total > 768 * 1024 * 1024 || result.size >= 16000) {throw new Error("This voicebank is too large for the browser.");}
        const name = path(file.webkitRelativePath || file.name);
        if (result.has(name)) {throw new Error("The folder contains duplicate file paths.");}
        result.set(name, new Uint8Array(await file.arrayBuffer()));
        if (result.size % 25 === 0) {progress("Reading files " + result.size + "/" + files.length);}
    }
    return result;
}

/*//////////////////////////////////////////////////////////////////////*/

const table = Uint32Array.from({length: 256}, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;}
    return value >>> 0;
});

export function crc(bytes) {
    let value = 0xffffffff;
    for (const byte of bytes) {value = table[(value ^ byte) & 255] ^ value >>> 8;}
    return (value ^ 0xffffffff) >>> 0;
}

export async function zip(files) {
    const body = [];
    const central = [];
    let offset = 0;
    for (const [name, content] of files) {
        const bytes = typeof content === "string" ? encoder.encode(content) : content;
        const label = encoder.encode(path(name));
        const header = new Uint8Array(30 + label.length);
        const view = new DataView(header.buffer);
        const checksum = crc(bytes);
        view.setUint32(0, 0x04034b50, true);
        view.setUint16(4, 20, true);
        view.setUint16(6, 0x800, true);
        view.setUint32(14, checksum, true);
        view.setUint32(18, bytes.length, true);
        view.setUint32(22, bytes.length, true);
        view.setUint16(26, label.length, true);
        header.set(label, 30);
        const record = new Uint8Array(46 + label.length);
        const index = new DataView(record.buffer);
        index.setUint32(0, 0x02014b50, true);
        index.setUint16(4, 20, true);
        index.setUint16(6, 20, true);
        index.setUint16(8, 0x800, true);
        index.setUint32(16, checksum, true);
        index.setUint32(20, bytes.length, true);
        index.setUint32(24, bytes.length, true);
        index.setUint16(28, label.length, true);
        index.setUint32(42, offset, true);
        record.set(label, 46);
        body.push(header, bytes);
        central.push(record);
        offset += header.length + bytes.length;
        if (central.length % 32 === 0) {await new Promise(resolve => setTimeout(resolve, 0));}
    }
    const ending = new Uint8Array(22);
    const view = new DataView(ending.buffer);
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(8, central.length, true);
    view.setUint16(10, central.length, true);
    view.setUint32(12, central.reduce((sum, item) => sum + item.length, 0), true);
    view.setUint32(16, offset, true);
    return new Blob([...body, ...central, ending], {type: "application/zip"});
}
