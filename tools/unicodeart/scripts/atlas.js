import {profiles} from "./profiles.js";
import {context, alpha} from "./raster.js";
import {fontcheck} from "./support.js";

const atlases = new Map();
const variants = new Map();
const drawings = new Map();
const fingerprints = new Map();
const database = new Promise(resolve => {
    const request = indexedDB.open("unicodeartmasks", 1);
    request.onupgradeneeded = () => {request.result.createObjectStore("masks");};
    request.onsuccess = () => {resolve(request.result);};
    request.onerror = () => {resolve(null);};
    request.onblocked = () => {resolve(null);};
});
const characters = fetch(new URL("characters.json", import.meta.url)).then(response => {
    if (!response.ok) throw new Error("Could not load characters.");
    return response.json();
});
const presets = fetch(new URL("../masks/manifest.json?v=5", import.meta.url)).then(response => response.ok ? response.json() : null).catch(() => null);

/*//////////////////////////////////////////////////////////////////////*/

async function stored(key, value = null) {
    try {
        const db = await database;
        if (!db) return null;
        return await new Promise(resolve => {
            const transaction = db.transaction("masks", value ? "readwrite" : "readonly");
            const store = transaction.objectStore("masks");
            const request = value ? store.put(value, key) : store.get(key);
            transaction.oncomplete = () => {resolve(value || request.result || null);};
            transaction.onerror = () => {resolve(null);};
            transaction.onabort = () => {resolve(null);};
        });
    } catch {return null;}
}

async function candidates(withmarks) {
    const {bases} = await characters;
    const pool = Array.from(bases);
    if (withmarks) {
        const shapes = "_.,:;'\"|/\\()[]{}-+<>oOxvV^=uUwWcrn∩∪∧∨⌒⎛⎞⎝⎠⎟⎜⎡⎤⎣⎦⎢⎥‿⁀﹏ᐠᐟᐢᐡᐤ";
        const accents = "\u0302\u0305\u0307\u0308\u030c\u0311\u0323\u0324\u032e\u0330\u0332\u0336\u035c\u0361";
        for (const base of shapes) for (const mark of accents) pool.push(base + mark);
    }
    return pool;
}

export async function fingerprint(site, withmarks, pause = async () => {}) {
    if (!fingerprints.has(site)) {
        const profile = profiles[site];
        const pool = await candidates(true);
        const height = profile.height + 16;
        const ctx = context(48 * 16, height * 4, profile);
        const cells = Math.ceil(pool.length / 64) * 64;
        const raster = new Uint8Array(cells * 48 * height + cells * 4);
        const advances = new Float32Array(cells);
        for (let offset = 0; offset < pool.length; offset += 64) {
            await pause();
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            for (let index = 0; index < 64 && offset + index < pool.length; index++) {
                const char = pool[offset + index];
                advances[offset + index] = ctx.measureText(char).width;
                ctx.save();
                ctx.beginPath();
                ctx.rect(index % 16 * 48, Math.floor(index / 16) * height, 48, height);
                ctx.clip();
                ctx.fillText(char, index % 16 * 48 + 4, Math.floor(index / 16) * height + 8 + profile.baseline);
                ctx.restore();
            }
            const pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
            const start = offset * 48 * height;
            for (let index = 0; index < pixels.length / 4; index++) raster[start + index] = pixels[index * 4 + 3];
        }
        raster.set(new Uint8Array(advances.buffer), cells * 48 * height);
        const digest = await crypto.subtle.digest("SHA-256", raster);
        const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
        fingerprints.set(site, hash);
    }
    return "v5:" + site + ":" + withmarks + ":" + fingerprints.get(site);
}

async function preset(site, withmarks, key) {
    try {
        const manifest = await presets;
        const entry = manifest?.[site];
        if (!entry || entry.fingerprint !== key.replace(":false:", ":true:")) return null;
        const response = await fetch(new URL("../masks/" + entry.file, import.meta.url));
        if (!response.ok) return null;
        const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
        const buffer = await new Response(stream).arrayBuffer();
        const length = new DataView(buffer).getUint32(0, true);
        const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, length)));
        if (header.fingerprint !== entry.fingerprint) return null;
        const bytes = new Uint8Array(buffer, 4 + length);
        const glyphs = [];
        for (const [char, advance, group, bits, mass, offset, count] of header.glyphs) {
            if (!withmarks && Array.from(char).length > 1) continue;
            const points = new Float32Array(count * 3);
            for (let index = 0; index < points.length; index += 3) {
                points[index] = bytes[offset + index] - 4;
                points[index + 1] = bytes[offset + index + 1];
                points[index + 2] = bytes[offset + index + 2] / 255;
            }
            glyphs.push({char, advance, group, bits, mass, points});
        }
        return glyphs;
    } catch {return null;}
}

function hash(values, width) {
    let signature = 2166136261;
    for (let index = 0; index < values.length; index++) signature = Math.imul(signature ^ Math.round(values[index] * 31), 16777619);
    return width + ":" + (signature >>> 0);
}

function glyph(char, advance, values, height) {
    const group = Math.min(32, Math.max(1, Math.round(advance)));
    const points = [];
    let mass = 0;
    let bits = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < 48; x++) {
            const value = values[y * 48 + x];
            if (value < 0.02) continue;
            points.push(x - 4, y, value);
            mass += value;
            if (value < 0.12) continue;
            const column = Math.max(0, Math.min(3, Math.floor(x / (group + 8) * 4)));
            const row = Math.min(5, Math.floor(y / height * 6));
            bits |= 1 << (row * 4 + column);
        }
    }
    if (!points.length && !/^[\u00a0\u2007\u2009\u200a\u2800]$/.test(char)) return null;
    return {char, advance, group, bits, mass, points: new Float32Array(points)};
}

function grouped(glyphs) {
    const groups = Array.from({length: 33}, () => []);
    for (const item of glyphs) groups[item.group].push(item);
    return {glyphs, groups};
}

/*//////////////////////////////////////////////////////////////////////*/

export async function atlas(site, withmarks, pause) {
    const key = site + ":" + withmarks;
    let state = atlases.get(key);
    if (state?.ready) return state.ready;
    const profile = profiles[site];
    const height = profile.height + 16;
    if (!state) {
        const cachekey = await fingerprint(site, withmarks);
        const cached = await stored(cachekey) || await preset(site, withmarks, cachekey);
        await pause();
        if (cached) {
            const ready = grouped(cached);
            atlases.set(key, {ready});
            stored(cachekey, cached);
            return ready;
        }
        const pool = await candidates(withmarks);
        const missing = new Set();
        const ctx = context(48, height, profile);
        for (const char of ["\ufffd", "\u0378", "\u0380", "\udbff\udfff"]) {
            ctx.clearRect(0, 0, 48, height);
            ctx.fillText(char, 4, 8 + profile.baseline);
            missing.add(hash(alpha(ctx), ""));
        }
        state = {pool, cachekey, missing, seen: new Set(), supported: new Set(), glyphs: [], offset: 0};
        atlases.set(key, state);
    }
    const sheet = context(48 * 16, height * 4, profile);
    while (state.offset < state.pool.length) {
        await pause();
        sheet.clearRect(0, 0, sheet.canvas.width, sheet.canvas.height);
        const batch = state.pool.slice(state.offset, state.offset + 64);
        const advances = [];
        for (let index = 0; index < batch.length; index++) {
            const char = batch[index];
            const advance = sheet.measureText(char).width;
            advances.push(advance);
            if (advance >= 0.8 && advance <= 32 && !"@#".includes(char)) {
                const left = index % 16 * 48;
                const top = Math.floor(index / 16) * height;
                sheet.save();
                sheet.beginPath();
                sheet.rect(left, top, 48, height);
                sheet.clip();
                sheet.fillText(char, left + 4, top + 8 + profile.baseline);
                sheet.restore();
            }
        }
        const raster = sheet.getImageData(0, 0, sheet.canvas.width, sheet.canvas.height).data;
        for (let index = 0; index < batch.length; index++) {
            const char = batch[index];
            const advance = advances[index];
            if (advance < 0.8 || advance > 32 || "@#".includes(char)) continue;
            if (char.length > 1 && !state.supported.has(Array.from(char)[0])) continue;
            const values = new Float32Array(48 * height);
            const left = index % 16 * 48;
            const top = Math.floor(index / 16) * height;
            let colored = false;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < 48; x++) {
                    const pixel = ((top + y) * sheet.canvas.width + left + x) * 4;
                    if (raster[pixel + 3] > 50 && raster[pixel] + raster[pixel + 1] + raster[pixel + 2] > 20) colored = true;
                    values[y * 48 + x] = raster[pixel + 3] / 255;
                }
            }
            if (colored || state.missing.has(hash(values, ""))) continue;
            if (char.length === 1) state.supported.add(char);
            const signature = hash(values, Math.round(advance * 2));
            if (state.seen.has(signature)) continue;
            state.seen.add(signature);
            const item = glyph(char, advance, values, height);
            if (item) state.glyphs.push(item);
        }
        state.offset += batch.length;
    }
    state.ready = grouped(state.glyphs);
    stored(state.cachekey, state.glyphs);
    return state.ready;
}

export async function combinations(site, base, pause) {
    const key = site + ":" + base;
    if (variants.has(key)) return variants.get(key);
    const {marks} = await characters;
    const profile = profiles[site];
    const ctx = context(48, profile.height + 16, profile);
    const supported = fontcheck(site);
    const result = [];
    for (const mark of marks) {
        const char = base + mark;
        if (!supported(char)) continue;
        const metrics = ctx.measureText(char);
        if (metrics.actualBoundingBoxLeft > 4 || metrics.actualBoundingBoxRight > 43 || metrics.actualBoundingBoxAscent >= 8 + profile.baseline || metrics.actualBoundingBoxDescent >= ctx.canvas.height - 8 - profile.baseline) continue;
        ctx.clearRect(0, 0, 48, ctx.canvas.height);
        ctx.fillText(char, 4, 8 + profile.baseline);
        const item = glyph(char, metrics.width, alpha(ctx), ctx.canvas.height);
        if (item) result.push(item);
    }
    await pause();
    variants.set(key, result);
    if (variants.size > 256) variants.delete(variants.keys().next().value);
    return result;
}

/*//////////////////////////////////////////////////////////////////////*/

export async function drawing(site, maxmarks, pause) {
    const limit = Math.min(2, maxmarks);
    const key = site + ":" + limit;
    if (drawings.get(key)?.ready) return drawings.get(key).ready;
    const source = await atlas(site, maxmarks > 0, pause);
    const profile = profiles[site];
    const height = profile.height + 16;
    const ctx = context(48, height, profile);
    const supported = fontcheck(site);
    let state = drawings.get(key);
    if (!state) {
        const glyphs = [];
        for (let index = 0; index < source.glyphs.length; index++) {
            if (index % 64 === 0) await pause();
            const item = source.glyphs[index];
            if (/[\u2800-\u28ff]/u.test(item.char) || Array.from(item.char).length > maxmarks + 1 || !supported(item.char)) continue;
            const metrics = ctx.measureText(item.char);
            if (metrics.actualBoundingBoxLeft <= 4 && metrics.actualBoundingBoxRight <= 43 && metrics.actualBoundingBoxAscent < 8 + profile.baseline && metrics.actualBoundingBoxDescent < height - 8 - profile.baseline) glyphs.push(item);
        }
        const pool = [];
        if (limit) {
            const {marks} = await characters;
            const pairs = "\u030d\u0305\u0332\u032e\u035c\u0361\u0331\u0338";
            for (const base of "\u00a0\u2009\u200a") {
                for (const mark of marks) pool.push(base + mark);
                if (limit > 1) for (const first of pairs) for (const second of pairs) pool.push(base + first + second);
            }
        }
        state = {glyphs, pool, offset: 0};
        drawings.set(key, state);
    }
    while (state.offset < state.pool.length) {
        await pause();
        const char = state.pool[state.offset++];
        if (!supported(char)) continue;
        const metrics = ctx.measureText(char);
        if (metrics.actualBoundingBoxLeft > 4 || metrics.actualBoundingBoxRight > 43 || metrics.actualBoundingBoxAscent >= 8 + profile.baseline || metrics.actualBoundingBoxDescent >= height - 8 - profile.baseline) continue;
        ctx.clearRect(0, 0, 48, height);
        ctx.fillText(char, 4, 8 + profile.baseline);
        const item = glyph(char, metrics.width, alpha(ctx), height);
        if (item && item.mass > 0.5) state.glyphs.push(item);
    }
    state.ready = grouped(state.glyphs);
    return state.ready;
}
