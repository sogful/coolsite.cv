import {classicversion, convertclassic} from "./classic/convert.js";
import {packed, unpackexe} from "./upx.js";
import {archivepayload, openarchive} from "./archive.js";
import {unzipSync} from "../vendor/zip.js";

/*//////////////////////////////////////////////////////////////////////*/

const limit = 256 * 1024 * 1024;
const totalmaximum = 512 * 1024 * 1024;
let files = new Map();
let nesting = 0;

function normalize(path) {
    const normalized = path.replaceAll("\\", "/");
    if (normalized.startsWith("/") || normalized.includes(":") || normalized.split("/").some(part => part === ".." || part === "." || part.includes("\0"))) {
        throw new Error("The zip contains an invalid file path.");
    }
    return normalized;
}

async function unpack(bytes, name, depth = 0) {
    if (bytes.length > limit) {throw new Error("Choose a file smaller than 256 MB.");}
    if (/\.(gmk|gm81|win|unx)$/i.test(name)) {return new Map([[normalize(name), bytes]]);}
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
        if (entries > 4096 || total > totalmaximum || entry.originalSize > limit) {
            throw new Error("The expanded zip is too large (512 MB total, 256 MB per file, 4096 entries).");
        }
        if (paths.has(path)) {throw new Error("The zip contains duplicate file paths.");}
        paths.add(path);
        return !entry.name.endsWith("/");
    }});
    const entriesmap = new Map(Object.entries(result).map(([path, data]) => [normalize(path), data]));
    if (depth < 2 && ![...entriesmap.keys()].some(path => /\.(exe|win|gmk|gm81)$/i.test(path))) {
        const nested = [...entriesmap].filter(([path]) => /\.(zip|rar|7z|cab)$/i.test(path));
        if (nested.length === 1) {return unpack(nested[0][1], nested[0][0], depth + 1);}
    }
    return entriesmap;
}

function studioname(bytes, path, parent) {
    const executables = [...files.keys()].filter(name => name.startsWith(parent) && !name.slice(parent.length).includes("/") && /\.exe$/i.test(name) && !/unins|setup|crashhandler/i.test(name));
    if (executables.length === 1) {return executables[0].slice(parent.length).replace(/\.exe$/i, "");}
    if (parent) {return parent.split("/").filter(Boolean).pop();}
    if (bytes.length >= 120 && new TextDecoder().decode(bytes.subarray(8, 12)) === "GEN8") {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const end = 16 + view.getUint32(12, true);
        for (const offset of [116, 56]) {
            if (offset + 4 > end) {continue;}
            const pointer = view.getUint32(offset, true);
            if (pointer < end || pointer >= bytes.length) {continue;}
            const tail = bytes.subarray(pointer, Math.min(pointer + 1024, bytes.length));
            const zero = tail.indexOf(0);
            if (zero <= 0) {continue;}
            const name = new TextDecoder().decode(tail.subarray(0, zero)).trim();
            if (name && !/[\u0000-\u001f\ufffd]/u.test(name)) {return name;}
        }
    }
    return path.split("/").pop().replace(/\.(exe|win|unx)$/i, "");
}

async function convert(path) {
    const embedded = archivepayload(files.get(path));
    if (embedded) {
        if (++nesting > 4) {throw new Error("Too many nested game packages.");}
        self.postMessage({type: "progress", text: "extracting game files..."});
        const extracted = await openarchive(embedded, normalize);
        const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
        const merged = new Map([...files].filter(([name]) => name.startsWith(parent) && name !== path).map(([name, bytes]) => [name.slice(parent.length), bytes]));
        for (const [name, bytes] of extracted) {
            for (const existing of merged.keys()) {if (existing.toLowerCase() === name.toLowerCase()) {merged.delete(existing);}}
            merged.set(name, bytes);
        }
        if (merged.size > 4096 || [...merged.values()].reduce((total, bytes) => total + bytes.length, 0) > totalmaximum) {throw new Error("The expanded game package is too large.");}
        files = merged;
        const executables = [...extracted.keys()].filter(name => /\.exe$/i.test(name));
        if (!executables.length) {throw new Error("No game executable was found in the embedded archive.");}
        if (executables.length === 1) {await convert(executables[0]);}
        else {self.postMessage({type: "inventory", executables});}
        return;
    }
    if (/\.(gmk|gm81)$/i.test(path)) {throw new Error("GameMaker project files are not supported yet. Choose a compiled EXE.");}
    const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
    const studio = [...files].find(([name, bytes]) => (name.toLowerCase() === path.toLowerCase() && /\.(win|unx)$/i.test(path) || name.toLowerCase() === (parent + "data.win").toLowerCase()) && new TextDecoder().decode(bytes.subarray(0, 4)) === "FORM");
    if (studio) {
        const bytes = studio[1];
        const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(value => value.toString(16).padStart(2, "0")).join("");
        const version = bytes[17];
        const supported = version >= 8 && version <= 17;
        if (!supported) {throw new Error("This Studio bytecode version is not supported: " + version);}
        const converted = [...files].filter(([name]) => name.startsWith(parent) && !/\.(exe|dll)$/i.test(name)).map(([name, data]) => [name === studio[0] ? "data.win" : name.slice(parent.length), data]);
        converted.push(["manifest.json", new TextEncoder().encode(JSON.stringify({format_version: 1, engine_family: "studio", source_hash: hash, bytecode_version: version, compatibility: "partial"}))]);
        self.postMessage({type: "ready", files: converted, name: studioname(bytes, path, parent)}, [...new Set(converted.map(([, data]) => data.buffer))]);
        return;
    }
    const bytes = files.get(path);
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(value => value.toString(16).padStart(2, "0")).join("");
    if (packed(bytes)) {
        self.postMessage({type: "progress", text: "unpacking executable..."});
        files.set(path, await unpackexe(bytes));
    }
    const classic = classicversion(files.get(path));
    if (classic) {
        self.postMessage({type: "progress", text: "converting GameMaker " + classic.version + " resources..."});
        const converted = await convertclassic(files.get(path), classic);
        files.set(path, converted.bytes);
        for (const [name, data] of converted.files) {
            const target = parent + normalize(name);
            if (![...files.keys()].some(existing => existing.toLowerCase() === target.toLowerCase())) {files.set(target, data);}
        }
        if (files.size > 4096 || [...files.values()].reduce((total, data) => total + data.length, 0) > totalmaximum) {throw new Error("The expanded game package is too large.");}
    }
    const entry = path.slice(parent.length);
    const converted = [...files].filter(([name]) => name.startsWith(parent) && name.slice(parent.length) !== "manifest.json").map(([name, data]) => [name.slice(parent.length), data]);
    converted.push(["manifest.json", new TextEncoder().encode(JSON.stringify({format_version: 1, engine_family: "opengmk", source_hash: hash, entry, source_version: classic?.version}))]);
    self.postMessage({type: "ready", files: converted, name: entry.replace(/\.(exe|gmk|gm81)$/i, "")}, [...new Set(converted.map(([, data]) => data.buffer))]);
}

self.onmessage = async event => {
    try {
        if (event.data.type === "open" || event.data.type === "folder") {
            if (event.data.type === "folder") {
                if (event.data.files.length > 4096) {throw new Error("The folder contains too many files.");}
                files = new Map();
                const paths = new Set();
                let total = 0;
                for (const entry of event.data.files) {
                    const file = entry.file || entry;
                    const name = normalize(entry.path || file.webkitRelativePath || file.name);
                    total += file.size;
                    if (file.size > limit || total > totalmaximum) {throw new Error("The folder is too large (512 MB total, 256 MB per file).");}
                    if (paths.has(name.toLowerCase())) {throw new Error("The folder contains duplicate file paths.");}
                    paths.add(name.toLowerCase());
                    files.set(name, new Uint8Array(await file.arrayBuffer()));
                }
            } else {files = await unpack(new Uint8Array(event.data.bytes), event.data.name);}
            if (files.has("manifest.json") && (files.has("logic.lowered.json") || /"engine_family"\s*:\s*"(opengmk|studio)"/.test(new TextDecoder().decode(files.get("manifest.json"))))) {
                const entries = [...files];
                self.postMessage({type: "ready", files: entries, name: event.data.name.replace(/\.zip$/i, "")}, [...new Set(entries.map(([, bytes]) => bytes.buffer))]);
                return;
            }
            let executables = [...files.keys()].filter(path => /\.(exe|gmk|gm81|win|unx)$/i.test(path) && !path.startsWith("__MACOSX/") && !path.split("/").pop().startsWith("._"));
            const datafiles = executables.filter(path => /\.(win|unx)$/i.test(path));
            if (datafiles.length) {executables = datafiles;}
            else if (executables.some(path => /\.exe$/i.test(path))) {executables = executables.filter(path => /\.exe$/i.test(path));}
            if (!executables.length) {
                if ([...files.keys()].some(path => /\.(gmk|gm81|gm6|gmd|yyp|gmx)$/i.test(path))) {throw new Error("This GameMaker project version is not supported yet.");}
                throw new Error("No supported game was found in this archive.");
            }
            self.postMessage({type: "inventory", executables});
        } else if (event.data.type === "convert") {await convert(event.data.path);}
    } catch (error) {
        self.postMessage({type: "error", text: error.message || String(error)});
    }
};

