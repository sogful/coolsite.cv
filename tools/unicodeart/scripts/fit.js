import {combinations} from "./atlas.js?v=6";
import {context, render, loss} from "./raster.js";

const measurements = new WeakMap();
const proposals = new WeakMap();
const spaces = "\u00a0\u2007\u2009\u200a";
const columns = 4;
const bands = 10;

function complexity(text) {
    if (!text) return 0;
    if (Array.from(text).every(char => spaces.includes(char))) return 0.02;
    const marks = (text.match(/\p{Mark}/gu) || []).length;
    return 1.2 + marks * 1.1;
}

export function spacing(ctx, width) {
    const options = ["", "\u00a0", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2009"];
    let best = "";
    let error = Math.abs(width);
    for (const base of options) {
        for (let count = 0; count < 5; count++) {
            const text = base + "\u200a".repeat(count);
            const difference = Math.abs(ctx.measureText(text).width - width) + text.length * 0.015;
            if (difference < error) {best = text; error = difference;}
        }
    }
    return best;
}

/*//////////////////////////////////////////////////////////////////////*/

export function field(target, width, height) {
    const signal = new Float32Array(target.length);
    const weights = new Float32Array(target.length).fill(1);
    const strays = new Float32Array(target.length);
    const seen = new Uint8Array(target.length);
    const parts = [];
    for (let start = 0; start < target.length; start++) {
        if (target[start] < 0.1 || seen[start]) continue;
        const queue = [start];
        seen[start] = 1;
        let mass = 0;
        for (let at = 0; at < queue.length; at++) {
            const pixel = queue[at];
            const x = pixel % width;
            const y = Math.floor(pixel / width);
            mass += target[pixel];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
                    const next = pixel + dy * width + dx;
                    if (seen[next] || target[next] < 0.1) continue;
                    seen[next] = 1;
                    queue.push(next);
                }
            }
        }
        parts.push({pixels: queue, mass});
    }
    const largest = Math.max(1, ...parts.map(part => part.mass));
    const distance = Float32Array.from(target, value => value > 0.1 ? 0 : width + height);
    for (let pass = 0; pass < 2; pass++) {
        const step = pass ? -1 : 1;
        const neighbors = [[-step, 0], [0, -step], [-step, -step], [step, -step]];
        for (let y = pass ? height - 1 : 0; y >= 0 && y < height; y += step) {
            for (let x = pass ? width - 1 : 0; x >= 0 && x < width; x += step) {
                const at = y * width + x;
                for (const [dx, dy] of neighbors) {
                    if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
                    distance[at] = Math.min(distance[at], distance[at + dy * width + dx] + (dx && dy ? Math.SQRT2 : 1));
                }
            }
        }
    }
    for (let index = 0; index < target.length; index++) {
        weights[index] = 1 + Math.min(12, distance[index] ** 2 * 0.6);
        strays[index] = Math.min(8, Math.max(0, distance[index] - 1) ** 2 * 0.75);
    }
    for (const part of parts) {
        const importance = Math.min(6, 1 + Math.sqrt(largest / part.mass) * 0.75);
        for (const pixel of part.pixels) weights[pixel] = importance;
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let value = Math.min(1, target[y * width + x] * 1.6);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
                    value = Math.max(value, target[(y + dy) * width + x + dx] * (dx && dy ? 0.15 : 0.3));
                }
            }
            signal[y * width + x] = value;
        }
    }
    const integral = new Float32Array((width + 1) * (height + 1));
    for (let y = 0; y < height; y++) {
        let sum = 0;
        for (let x = 0; x < width; x++) {
            sum += signal[y * width + x];
            integral[(y + 1) * (width + 1) + x + 1] = integral[y * (width + 1) + x + 1] + sum;
        }
    }
    return {target, signal, weights, strays, width, height, integral};
}

function sum(map, left, top, right, bottom) {
    left = Math.max(0, Math.min(map.width, left));
    right = Math.max(0, Math.min(map.width, right));
    top = Math.max(0, Math.min(map.height, top));
    bottom = Math.max(0, Math.min(map.height, bottom));
    const stride = map.width + 1;
    return map.integral[bottom * stride + right] - map.integral[bottom * stride + left] - map.integral[top * stride + right] + map.integral[top * stride + left];
}

function measured(glyph, height) {
    if (measurements.has(glyph)) return measurements.get(glyph);
    const features = new Float32Array(columns * bands);
    const raster = new Float32Array(48 * height);
    for (let index = 0; index < glyph.points.length; index += 3) {
        const x = glyph.points[index] + 4;
        const y = glyph.points[index + 1];
        const value = glyph.points[index + 2];
        raster[y * 48 + x] = value;
        const column = Math.min(columns - 1, Math.floor(x / (glyph.group + 8) * columns));
        const band = Math.min(bands - 1, Math.floor(y / height * bands));
        features[band * columns + column] += value;
    }
    const shifted = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < 48; x++) {
            const value = (raster[y * 48 + x] + (x ? raster[y * 48 + x - 1] : 0)) / 2;
            if (value >= 0.02) shifted.push(x - 4, y, value);
        }
    }
    const sparse = [];
    let energy = complexity(glyph.char);
    const area = (glyph.group + 8) / columns * height / bands;
    for (let index = 0; index < features.length; index++) {
        if (!features[index]) continue;
        sparse.push(index, features[index] / area);
        energy += features[index] ** 2 / area;
    }
    const result = {sparse, energy, phases: [glyph.points, new Float32Array(shifted)], penalty: complexity(glyph.char)};
    measurements.set(glyph, result);
    return result;
}

/*//////////////////////////////////////////////////////////////////////*/

function shortlist(atlas, map, left, top, height) {
    if (!proposals.has(atlas)) proposals.set(atlas, {groups: Array.from({length: atlas.groups.length}, () => new Map()), blanks: atlas.groups.map(group => group.filter(glyph => glyph.mass < 0.05)), empty: atlas.glyphs.filter(glyph => glyph.mass < 0.05)});
    const cache = proposals.get(atlas);
    if (sum(map, left - 4, top, left + 44, top + height) < 0.05) return cache.empty;
    const result = [];
    for (let group = 1; group < atlas.groups.length; group++) {
        if (!atlas.groups[group].length) continue;
        if (sum(map, left - 4, top, left + group + 4, top + height) < 0.05) {
            result.push(...cache.blanks[group]);
            continue;
        }
        const target = new Float32Array(columns * bands);
        for (let band = 0; band < bands; band++) {
            for (let column = 0; column < columns; column++) {
                const x = left - 4 + Math.ceil(column * (group + 8) / columns);
                const right = left - 4 + Math.ceil((column + 1) * (group + 8) / columns);
                const y = top + Math.ceil(band * height / bands);
                const bottom = top + Math.ceil((band + 1) * height / bands);
                target[band * columns + column] = sum(map, x, y, right, bottom);
            }
        }
        const codes = Uint32Array.from(target, value => Math.round(value * 256));
        let signature = 2166136261;
        for (const value of codes) signature = Math.imul(signature ^ value, 16777619);
        const cached = cache.groups[group].get(signature);
        if (cached && cached.codes.every((value, index) => value === codes[index])) {
            result.push(...cached.glyphs);
            continue;
        }
        const best = [];
        for (const glyph of atlas.groups[group]) {
            const data = measured(glyph, height);
            let score = data.energy;
            for (let index = 0; index < data.sparse.length; index += 2) score -= 2 * data.sparse[index + 1] * target[data.sparse[index]];
            if (best.length === 8 && score >= best[7].score) continue;
            let at = 0;
            while (at < best.length && best[at].score <= score) at++;
            best.splice(at, 0, {glyph, score});
            if (best.length > 8) best.pop();
        }
        const choices = best.map(entry => entry.glyph);
        cache.groups[group].set(signature, {codes, glyphs: choices});
        if (cache.groups[group].size > 256) cache.groups[group].delete(cache.groups[group].keys().next().value);
        result.push(...choices);
    }
    return result;
}

function delta(glyph, map, pen, top, height) {
    const data = measured(glyph, height);
    const phase = Math.round(pen * 2);
    const left = Math.floor(phase / 2);
    const points = data.phases[phase % 2];
    let score = data.penalty;
    for (let index = 0; index < points.length; index += 3) {
        const x = left + points[index];
        const y = top + points[index + 1];
        const value = points[index + 2];
        if (x < 0 || x >= map.width || y < 0 || y >= map.height) {score += value * value * 2; continue;}
        const pixel = y * map.width + x;
        const ownership = x >= Math.floor(pen) && x < Math.floor(pen + glyph.advance) ? 1 : 0;
        const difference = (value * value - 2 * value * map.signal[pixel]) * map.weights[pixel];
        score += (difference < 0 ? difference * ownership : difference) + value * map.strays[pixel];
    }
    return score;
}

export async function search(atlas, map, row, profile, pause) {
    const states = new Array(map.width * 2 + 1);
    states[0] = {score: 0, width: 0, text: ""};
    let previous = -1;
    let candidates = [];
    for (let slot = 0; slot < states.length; slot++) {
        const state = states[slot];
        if (!state) continue;
        const left = Math.floor(state.width);
        if (left !== previous) {
            await pause();
            candidates = shortlist(atlas, map, left, row * profile.height, profile.height + 16);
            previous = left;
        }
        for (const glyph of candidates) {
            const nextwidth = state.width + glyph.advance;
            const next = Math.round(nextwidth * 2);
            if (next >= states.length || next <= slot) continue;
            const score = state.score + delta(glyph, map, state.width, row * profile.height, profile.height + 16);
            if (states[next] && states[next].score <= score) continue;
            states[next] = {score, width: nextwidth, text: state.text + glyph.char};
        }
    }
    const endings = states.slice(-6).filter(Boolean);
    const best = endings.sort((a, b) => a.score - b.score)[0] || states.filter(Boolean).at(-1);
    const segmenter = new Intl.Segmenter("en", {granularity: "grapheme"});
    return Array.from(segmenter.segment(best.text.replace(/[\u00a0\u2007\u2009\u200a]+$/u, "")), part => part.segment);
}

/*//////////////////////////////////////////////////////////////////////*/

export async function refine(ctx, rows, profile, map, atlas, site, maxmarks, pause) {
    let additions = 0;
    for (let row = 0; row < rows.length; row++) {
        const top = row * profile.height;
        const height = profile.height + 16;
        const background = render(ctx, rows.map((value, index) => index === row ? [] : value), profile).slice(top * map.width, (top + height) * map.width);
        const signal = map.signal.slice(top * map.width, (top + height) * map.width);
        const weights = map.weights.slice(top * map.width, (top + height) * map.width);
        const strays = map.strays.slice(top * map.width, (top + height) * map.width);
        const line = context(map.width, height, profile);
        const penalty = () => rows[row].reduce((value, text) => value + complexity(text), 0);
        function raster() {
            const values = render(line, [rows[row]], profile);
            for (let index = 0; index < values.length; index++) values[index] = background[index] + values[index] * (1 - background[index]);
            return values;
        }
        function objective() {
            const values = raster();
            let score = loss(values, signal, weights) + penalty();
            for (let pixel = 0; pixel < values.length; pixel++) score += values[pixel] * strays[pixel];
            return score;
        }
        let current = objective();
        for (let index = 0; index < rows[row].length; index++) {
            await pause();
            const original = rows[row][index];
            const left = ctx.measureText(rows[row].slice(0, index).join("")).width;
            const choices = shortlist(atlas, map, Math.floor(left), row * profile.height, profile.height + 16).map(glyph => ({glyph, score: delta(glyph, map, left, row * profile.height, profile.height + 16)})).sort((a, b) => a.score - b.score);
            let best = original;
            async function choose(variants) {
                for (const variant of variants) {
                    if ((variant.match(/\p{Mark}/gu) || []).length > maxmarks) continue;
                    rows[row][index] = variant;
                    if (ctx.measureText(rows[row].join("")).width > ctx.canvas.width) continue;
                    const error = objective();
                    if (error + 0.01 < current) {current = error; best = variant;}
                }
                rows[row][index] = best;
                await pause();
            }
            const stripped = original.replace(/\p{Mark}/gu, "");
            const width = ctx.measureText(original).width;
            const blank = spacing(ctx, width);
            const marks = (original.match(/\p{Mark}/gu) || []).join("");
            const accents = marks ? ["\u00a0", "\u2009", "\u200a"].map(base => base + marks) : [];
            const blanks = Math.abs(ctx.measureText(blank).width - width) < 0.1 ? [blank] : [];
            await choose(new Set([original, "", stripped, ...blanks, ...accents, ...choices.slice(0, 3).map(choice => choice.glyph.char)]));
            if (!best || !maxmarks || additions >= 8) continue;
            if (spaces.includes(Array.from(best)[0]) && (best.match(/\p{Mark}/gu) || []).length >= Math.min(2, maxmarks)) continue;
            const values = raster();
            let missing = 0;
            const end = Math.min(map.width, Math.ceil(left + ctx.measureText(best).width + 1));
            for (let y = row * profile.height; y < Math.min(map.height, (row + 1) * profile.height + 16); y++) {
                for (let x = Math.max(0, Math.floor(left) - 1); x < end; x++) {
                    const pixel = y * map.width + x;
                    missing += Math.max(0, map.signal[pixel] - values[(y - top) * map.width + x] - 0.15) * map.weights[pixel];
                }
            }
            if (missing < 2) continue;
            for (let level = (best.match(/\p{Mark}/gu) || []).length; level < maxmarks; level++) {
                if (additions++ >= 8) break;
                const variants = (await combinations(site, best, pause)).map(glyph => ({glyph, score: delta(glyph, map, left, row * profile.height, profile.height + 16)})).sort((a, b) => a.score - b.score);
                const previous = best;
                await choose(variants.slice(0, 2).map(choice => choice.glyph.char));
                if (best === previous) break;
            }
        }
    }
    return rows.map(row => row.join("") || "\u00a0").join("\n");
}
