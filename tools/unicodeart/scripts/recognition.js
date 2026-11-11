import {profiles} from "./profiles.js";
import {context, alpha} from "./raster.js";

const templates = [];
const size = 28;

function skeleton(input) {
    const pixels = input.slice();
    let changed = true;
    while (changed) {
        changed = false;
        for (let pass = 0; pass < 2; pass++) {
            const remove = [];
            for (let y = 1; y < size - 1; y++) {
                for (let x = 1; x < size - 1; x++) {
                    const at = y * size + x;
                    if (!pixels[at]) continue;
                    const ring = [-size, -size + 1, 1, size + 1, size, size - 1, -1, -size - 1].map(offset => pixels[at + offset]);
                    const count = ring.reduce((sum, value) => sum + value, 0);
                    const transitions = ring.reduce((sum, value, index) => sum + (!value && ring[(index + 1) % 8] ? 1 : 0), 0);
                    if (count < 2 || count > 6 || transitions !== 1) continue;
                    if (!pass && (ring[0] * ring[2] * ring[4] || ring[2] * ring[4] * ring[6])) continue;
                    if (pass && (ring[0] * ring[2] * ring[6] || ring[0] * ring[4] * ring[6])) continue;
                    remove.push(at);
                }
            }
            for (const at of remove) pixels[at] = 0;
            changed ||= remove.length > 0;
        }
    }
    const points = [];
    for (let index = 0; index < pixels.length; index++) if (pixels[index]) points.push([index % size, Math.floor(index / size)]);
    return points;
}

function normalized(points) {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const [x, y] of points) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    const width = right - left + 1;
    const height = bottom - top + 1;
    const source = new Uint8Array(width * height);
    for (const [x, y] of points) source[(y - top) * width + x - left] = 1;
    const bitmap = new Uint8Array(size * size);
    for (let y = 2; y < size - 2; y++) {
        for (let x = 2; x < size - 2; x++) {
            const px = left + Math.min(width - 1, Math.floor((x - 2) / (size - 4) * width));
            const py = top + Math.min(height - 1, Math.floor((y - 2) / (size - 4) * height));
            bitmap[y * size + x] = source[(py - top) * width + px - left];
        }
    }
    const seen = new Uint8Array(bitmap.length);
    let holes = 0;
    for (let at = 0; at < bitmap.length; at++) {
        if (bitmap[at] || seen[at]) continue;
        const queue = [at];
        let border = false;
        seen[at] = 1;
        for (let index = 0; index < queue.length; index++) {
            const pixel = queue[index];
            const x = pixel % size;
            const y = Math.floor(pixel / size);
            if (!x || !y || x === size - 1 || y === size - 1) border = true;
            for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                if (x + dx < 0 || x + dx >= size || y + dy < 0 || y + dy >= size) continue;
                const next = pixel + dy * size + dx;
                if (seen[next] || bitmap[next]) continue;
                seen[next] = 1;
                queue.push(next);
            }
        }
        if (!border && queue.length >= 4) holes++;
    }
    return {points: skeleton(bitmap), holes, left, right, top, bottom, width, height};
}

function distance(first, second) {
    let sum = 0;
    for (const [x, y] of first) {
        let nearest = size * size;
        for (const [px, py] of second) nearest = Math.min(nearest, (x - px) ** 2 + (y - py) ** 2);
        sum += Math.min(25, nearest);
    }
    return sum / Math.max(1, first.length);
}

/*//////////////////////////////////////////////////////////////////////*/

export function components(image) {
    const seen = new Uint8Array(image.width * image.height);
    const result = [];
    for (let at = 0; at < seen.length; at++) {
        if (seen[at] || image.data[at * 4 + 3] < 48) continue;
        const queue = [at];
        const points = [];
        seen[at] = 1;
        for (let index = 0; index < queue.length; index++) {
            const pixel = queue[index];
            const x = pixel % image.width;
            const y = Math.floor(pixel / image.width);
            points.push([x, y]);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (x + dx < 0 || x + dx >= image.width || y + dy < 0 || y + dy >= image.height) continue;
                    const next = pixel + dy * image.width + dx;
                    if (seen[next] || image.data[next * 4 + 3] < 48) continue;
                    seen[next] = 1;
                    queue.push(next);
                }
            }
        }
        if (points.length >= 8) result.push(normalized(points));
    }
    return result.sort((a, b) => a.left - b.left);
}

export async function recognize(parts, pause) {
    if (parts.length < 2 || parts.length > 32) return null;
    const height = Math.max(...parts.map(part => part.height));
    const baseline = Math.max(...parts.map(part => part.bottom));
    for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        if (part.height < height * 0.5 || baseline - part.bottom > height * 0.3 || part.width / part.height > 2.7) return null;
        if (index && part.left < parts[index - 1].right) return null;
    }
    const candidates = templates;
    if (candidates.length < 216) {
        const profile = profiles.youtube;
        const ctx = context(96, 96, profile);
        let position = 0;
        for (const family of [profile.family, profiles.discord.family, profiles.twitter.family, "Arial", "Segoe Print", "Comic Sans MS"]) {
            ctx.font = `400 64px ${family}`;
            for (const char of "abcdefghijklmnopqrstuvwxyz0123456789") {
                if (position++ < candidates.length) continue;
                await pause();
                ctx.clearRect(0, 0, 96, 96);
                ctx.fillText(char, 8, 72);
                const values = alpha(ctx);
                const points = [];
                for (let index = 0; index < values.length; index++) if (values[index] >= 0.2) points.push([index % 96, Math.floor(index / 96)]);
                const normalizedglyph = normalized(points);
                candidates.push({...normalizedglyph, char});
            }
        }
    }
    const matches = [];
    for (const part of parts) {
        await pause();
        const variants = candidates.map(candidate => {
            const score = distance(part.points, candidate.points) + distance(candidate.points, part.points) + Math.abs(Math.log(part.width / part.height / (candidate.width / candidate.height))) * 0.3 + Math.abs(part.holes - candidate.holes) * 10;
            return {char: candidate.char, score};
        }).sort((a, b) => a.score - b.score);
        const choices = variants.filter((variant, index) => variants.findIndex(choice => choice.char === variant.char) === index);
        if (choices[0].score > 9) return null;
        matches.push({...choices[0], choices});
    }
    const letters = matches.filter(match => /[a-z]/.test(match.char)).length;
    if (letters > matches.length / 2) {
        for (let index = 0; index < matches.length; index++) {
            const letter = matches[index].choices.find(choice => /[a-z]/.test(choice.char));
            if (letter.score <= matches[index].score + 4) matches[index] = letter;
        }
    }
    return matches.map(match => ({char: match.char, score: match.score}));
}

