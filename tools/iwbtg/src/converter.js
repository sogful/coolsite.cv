import {packed, unpackexe} from "./upx.js";
import {archivepayload, openarchive} from "./archive.js";
import {unzipSync} from "../vendor/zip.js";

/*//////////////////////////////////////////////////////////////////////*/

const limit = 128 * 1024 * 1024;
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
    if (bytes.length > limit) {throw new Error("Choose a file smaller than 128 MB.");}
    if (/\.(gmk|gm81)$/i.test(name)) {return new Map([[normalize(name), bytes]]);}
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
    if (depth < 2 && ![...entriesmap.keys()].some(path => /\.(exe|win|gmk|gm81)$/i.test(path))) {
        const nested = [...entriesmap].filter(([path]) => /\.(zip|rar|7z|cab)$/i.test(path));
        if (nested.length === 1) {return unpack(nested[0][1], nested[0][0], depth + 1);}
    }
    return entriesmap;
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
        if (merged.size > 4096 || [...merged.values()].reduce((total, bytes) => total + bytes.length, 0) > limit * 4) {throw new Error("The expanded game package is too large.");}
        files = merged;
        const executables = [...extracted.keys()].filter(name => /\.exe$/i.test(name));
        if (!executables.length) {throw new Error("No game executable was found in the embedded archive.");}
        if (executables.length === 1) {await convert(executables[0]);}
        else {self.postMessage({type: "inventory", executables});}
        return;
    }
    if (/\.(gmk|gm81)$/i.test(path)) {throw new Error("GameMaker project files are not supported yet. Choose a compiled EXE.");}
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
    const bytes = files.get(path);
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(value => value.toString(16).padStart(2, "0")).join("");
    if (packed(bytes)) {
        self.postMessage({type: "progress", text: "unpacking executable..."});
        files.set(path, await unpackexe(bytes));
    }
    const entry = path.slice(parent.length);
    const converted = [...files].filter(([name]) => name.startsWith(parent) && name.slice(parent.length) !== "manifest.json").map(([name, data]) => [name.slice(parent.length), data]);
    converted.push(["manifest.json", new TextEncoder().encode(JSON.stringify({format_version: 1, engine_family: "opengmk", source_hash: hash, entry}))]);
    self.postMessage({type: "ready", files: converted, name: entry.replace(/\.(exe|gmk|gm81)$/i, "")}, [...new Set(converted.map(([, data]) => data.buffer))]);
}

self.onmessage = async event => {
    try {
        if (event.data.type === "open") {
            files = await unpack(new Uint8Array(event.data.bytes), event.data.name);
            if (files.has("manifest.json") && (files.has("logic.lowered.json") || /"engine_family"\s*:\s*"(opengmk|studio)"/.test(new TextDecoder().decode(files.get("manifest.json"))))) {
                const entries = [...files];
                self.postMessage({type: "ready", files: entries, name: event.data.name.replace(/\.zip$/i, "")}, [...new Set(entries.map(([, bytes]) => bytes.buffer))]);
                return;
            }
            let executables = [...files.keys()].filter(path => /\.(exe|gmk|gm81)$/i.test(path) && !path.startsWith("__MACOSX/") && !path.split("/").pop().startsWith("._"));
            if (executables.some(path => /\.exe$/i.test(path))) {executables = executables.filter(path => /\.exe$/i.test(path));}
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

