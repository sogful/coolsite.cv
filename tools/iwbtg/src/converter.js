import {WASI, File, Directory, OpenFile, ConsoleStdout, PreopenDirectory} from "../vendor/wasi.js";
import {archivepayload, openarchive} from "./archive.js";
import {unzipSync} from "../vendor/zip.js";

/*//////////////////////////////////////////////////////////////////////*/

const limit = 128 * 1024 * 1024;
let files = new Map();

function normalize(path) {
    const normalized = path.replaceAll("\\", "/");
    if (normalized.startsWith("/") || normalized.includes(":") || normalized.split("/").some(part => part === ".." || part === "." || part.includes("\0"))) {
        throw new Error("The zip contains an invalid file path.");
    }
    return normalized;
}

async function unpack(bytes, name, depth = 0) {
    if (bytes.length > limit) {throw new Error("Choose a file smaller than 128 MB.");}
    if (name.toLowerCase().endsWith(".exe")) {
        const embedded = archivepayload(bytes);
        return embedded ? openarchive(embedded, normalize) : new Map([[name, bytes]]);
    }
    if (/\.(rar|7z|cab)$/i.test(name)) {return openarchive(bytes, normalize);}
    let total = 0;
    let entries = 0;
    const paths = new Set();
    const result = unzipSync(bytes, {filter(entry) {
        entries++;
        total += entry.originalSize;
        const path = normalize(entry.name).toLowerCase();
        if (entries > 4096 || total > limit * 4 || entry.originalSize > limit) {
            throw new Error("The expanded zip is too large (512 MB total, 128 MB per file, 4096 entries).");
        }
        if (paths.has(path)) {throw new Error("The zip contains duplicate file paths.");}
        paths.add(path);
        return !entry.name.endsWith("/");
    }});
    const entriesmap = new Map(Object.entries(result).map(([path, data]) => [normalize(path), data]));
    if (depth < 2 && ![...entriesmap.keys()].some(path => /\.(exe|win)$/i.test(path))) {
        const nested = [...entriesmap].filter(([path]) => /\.(zip|rar|7z|cab)$/i.test(path));
        if (nested.length === 1) {return unpack(nested[0][1], nested[0][0], depth + 1);}
    }
    return entriesmap;
}

function mount(entries) {
    const root = new Directory(new Map());
    for (const [path, bytes] of entries) {
        const parts = path.split("/");
        const name = parts.pop();
        let directory = root;
        for (const part of parts) {
            if (!directory.contents.has(part)) {directory.contents.set(part, new Directory(new Map()));}
            directory = directory.contents.get(part);
            if (!(directory instanceof Directory)) {throw new Error("Conflicting zip file paths.");}
        }
        directory.contents.set(name, new File(bytes));
    }
    return root;
}

function flatten(directory, prefix = "") {
    const result = [];
    for (const [name, entry] of directory.contents) {
        const path = prefix + name;
        if (entry instanceof Directory) {result.push(...flatten(entry, path + "/"));}
        else {result.push([path, entry.data]);}
    }
    return result;
}

/*//////////////////////////////////////////////////////////////////////*/

async function convert(path) {
    const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
    const studio = [...files].find(([name, bytes]) => name.toLowerCase() === (parent + "data.win").toLowerCase() && new TextDecoder().decode(bytes.subarray(0, 4)) === "FORM");
    if (studio) {
        const bytes = studio[1];
        const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(value => value.toString(16).padStart(2, "0")).join("");
        const version = bytes[17];
        const supported = version >= 8 && version <= 17;
        if (!supported) {throw new Error("This Studio bytecode version is not supported: " + version);}
        const converted = [...files].filter(([name]) => name.startsWith(parent) && !/\.(exe|dll)$/i.test(name)).map(([name, data]) => [name.toLowerCase() === (parent + "data.win").toLowerCase() ? "data.win" : name.slice(parent.length), data]);
        converted.push(["manifest.json", new TextEncoder().encode(JSON.stringify({format_version: 1, engine_family: "studio", source_hash: hash, bytecode_version: version, compatibility: "partial"}))]);
        self.postMessage({type: "ready", files: converted, name: path.split("/").pop().replace(/\.exe$/i, "")}, [...new Set(converted.map(([, data]) => data.buffer))]);
        return;
    }
    self.postMessage({type: "progress", text: "converting GameMaker data..."});
    const input = mount(files);
    const output = new Directory(new Map());
    const errors = [];
    const wasi = new WASI(["converter", "/input/" + path], [], [
        new OpenFile(new File([])),
        ConsoleStdout.lineBuffered(() => {}),
        ConsoleStdout.lineBuffered(line => errors.push(line)),
        new PreopenDirectory("/", new Map([["input", input], ["output", output]]))
    ], {debug: false});
    const response = await fetch(new URL("../vendor/converter.wasm", import.meta.url));
    if (!response.ok) {throw new Error("Could not load the converter. Reload the page and try again.");}
    const module = await WebAssembly.compile(await response.arrayBuffer());
    const instance = await WebAssembly.instantiate(module, {wasi_snapshot_preview1: wasi.wasiImport});
    const code = wasi.start(instance);
    if (code !== 0 || !output.contents.has("manifest.json")) {
        throw new Error("Could not convert this executable. It may use an unsupported GameMaker version or packer.\n" + errors.join("\n").slice(-3000));
    }
    const converted = flatten(output);
    const existing = new Set(converted.map(([name]) => name.toLowerCase()));
    for (const [name, data] of files) {
        if (!name.startsWith(parent)) {continue;}
        const relative = name.slice(parent.length);
        if (/\.(exe|dll)$/i.test(relative) || existing.has(relative.toLowerCase())) {continue;}
        converted.push([relative, data]);
    }
    self.postMessage({type: "ready", files: converted, name: path.split("/").pop().replace(/\.exe$/i, "")}, [...new Set(converted.map(([, bytes]) => bytes.buffer))]);
}

self.onmessage = async event => {
    try {
        if (event.data.type === "open") {
            files = await unpack(new Uint8Array(event.data.bytes), event.data.name);
            if (files.has("manifest.json") && files.has("logic.lowered.json")) {
                const entries = [...files];
                self.postMessage({type: "ready", files: entries, name: event.data.name.replace(/\.zip$/i, "")}, [...new Set(entries.map(([, bytes]) => bytes.buffer))]);
                return;
            }
            const executables = [...files.keys()].filter(path => /\.exe$/i.test(path) && !path.startsWith("__MACOSX/") && !path.split("/").pop().startsWith("._"));
            if (!executables.length) {
                if ([...files.keys()].some(path => /\.(gmk|gm81|gm6|gmd|yyp|gmx)$/i.test(path))) {throw new Error("This archive contains a GameMaker project. Choose its compiled game instead.");}
                throw new Error("No game executable was found in this archive.");
            }
            self.postMessage({type: "inventory", executables});
        } else if (event.data.type === "convert") {await convert(event.data.path);}
    } catch (error) {
        self.postMessage({type: "error", text: error.message || String(error)});
    }
};

