import {GIFEncoder as gifencoder, quantize, applyPalette as applypalette} from "./vendor/gifenc.js";

export function encodepalette(frames, input) {
    const framebytes = input.width * input.height * 4;
    const encoder = gifencoder();
    let colors = input.colors || 64;
    let used = 0;
    let totalcolors = 0;
    for (let index = 0; index < input.count; index += 1) {
        const pixels = frames.slice(index * framebytes, (index + 1) * framebytes);
        const budget = Math.floor((input.budget - used - 64) / (input.count - index));
        const result = fitpalette(pixels, input, colors, budget);
        const frame = input.start + index;
        const delay = (Math.round((frame + 1) * 100 / input.fps) - Math.round(frame * 100 / input.fps)) * 10;
        encoder.writeFrame(result.indices, input.width, input.height, {palette: result.palette, delay, repeat: -1, dispose: 1});
        used += result.size;
        colors = result.colors;
        totalcolors += result.palette.length;
    }
    encoder.finish();
    const gif = encoder.bytes();
    if (!gif.length) throw new Error("the encoder returned an empty GIF");
    return {gif, colors, averagecolors: totalcolors / input.count};
}

/*//////////////////////////////////////////////////////////////////////*/

function fitpalette(pixels, input, colors, budget) {
    let low = 2;
    let high = 256;
    let best = null;
    let candidate = Math.max(low, Math.min(high, colors));
    for (let attempt = 0; attempt < 9; attempt += 1) {
        const palette = quantize(pixels, candidate, {format: "rgb444"});
        const indices = applypalette(pixels, palette, "rgb444");
        const probe = gifencoder();
        probe.writeFrame(indices, input.width, input.height, {palette, delay: 40, repeat: -1, dispose: 1});
        probe.finish();
        const size = probe.bytesView().length + 4;
        if (size <= budget) {
            if (!best || candidate > best.colors) best = {palette, indices, size, colors: candidate};
            if (size >= budget * 0.95 || candidate === 256) return best;
            low = candidate + 1;
        } else high = candidate - 1;
        if (low > high) break;
        if (attempt === 0) candidate = Math.max(low, Math.min(high, Math.round(candidate * Math.pow(budget / size, 2))));
        else candidate = Math.floor((low + high) / 2);
        if (best && attempt >= 2) return best;
    }
    if (best) return best;
    const smoothing = (input.smoothing || 1) * 2;
    if (smoothing <= 16) {
        soften(pixels, input.width, input.height, smoothing);
        return fitpalette(pixels, {...input, smoothing}, 64, budget);
    }
    throw new Error("the size limit is too small for this duration, resolution, and fps");
}

function soften(pixels, width, height, size) {
    for (let top = 0; top < height; top += size) {
        for (let left = 0; left < width; left += size) {
            const right = Math.min(width, left + size);
            const bottom = Math.min(height, top + size);
            const color = [0, 0, 0];
            const count = (right - left) * (bottom - top);
            for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) {
                const offset = (y * width + x) * 4;
                for (let channel = 0; channel < 3; channel += 1) color[channel] += pixels[offset + channel];
            }
            for (let channel = 0; channel < 3; channel += 1) color[channel] = Math.round(color[channel] / count);
            for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) {
                const offset = (y * width + x) * 4;
                for (let channel = 0; channel < 3; channel += 1) pixels[offset + channel] = color[channel];
            }
        }
    }
}
