import {GIFEncoder as gifencoder, quantize, applyPalette as applypalette} from "./vendor/gifenc.js";

export function encodepalette(frames, input) {
    const framebytes = input.width * input.height * 4;
    const encoder = gifencoder({auto: false});
    encoder.writeHeader();
    encoder.stream.writeBytes([
        input.width & 255, input.width >> 8, input.height & 255, input.height >> 8, 112, 0, 0,
    ]);
    let colors = input.colors || 64;
    let used = 0;
    let totalcolors = 0;
    let quality = 256;
    for (let index = 0; index < input.count; index += 1) {
        const pixels = frames.slice(index * framebytes, (index + 1) * framebytes);
        const protectedpixels = input.sticker ? protectpixels(pixels) : null;
        const budget = Math.floor((input.budget - used - 64) / (input.count - index));
        const frame = input.start + index;
        const delay = (Math.round((frame + 1) * 100 / input.fps) - Math.round(frame * 100 / input.fps)) * 10;
        const result = fitpalette(pixels, input, colors, budget, protectedpixels, delay);
        encoder.stream.writeBytesView(result.frame);
        used += result.size;
        colors = result.colors;
        quality = Math.min(quality, colors);
        totalcolors += result.palettecount;
    }
    encoder.finish();
    const gif = encoder.bytes();
    if (!gif.length) throw new Error("the encoder returned an empty GIF");
    return {gif, colors, quality, averagecolors: totalcolors / input.count};
}

/*//////////////////////////////////////////////////////////////////////*/

function fitpalette(pixels, input, colors, budget, protectedpixels, delay, blocks = null) {
    const sample = blocks || pixels;
    let low = input.sticker ? 2 : (input.smoothing || 1) > 4 ? 8 : 16;
    let high = 256;
    let best = null;
    let candidate = Math.max(low, Math.min(high, colors));
    for (let attempt = 0; attempt < 9; attempt += 1) {
        const palette = quantize(sample, candidate, {format: "rgb444"});
        const anchors = protectedpixels && anchorpalette(palette, protectedpixels);
        const mapped = applypalette(sample, palette, "rgb444");
        const indices = blocks ? expandblocks(mapped, input.width, input.height, input.smoothing) : mapped;
        if (anchors) {
            for (let index = 0; index < indices.length; index += 1) {
                const anchor = protectedpixels.mask[index];
                if (anchor) indices[index] = anchors[anchor - 1];
            }
        }
        const probe = gifencoder({auto: false});
        const colordepth = Math.max(2, Math.ceil(Math.log2(palette.length)));
        probe.writeFrame(indices, input.width, input.height, {palette, delay, dispose: 1, colorDepth: colordepth});
        const frame = probe.bytesView();
        const size = frame.length + 18;
        if (size <= budget) {
            if (!best || candidate > best.colors) best = {frame, palettecount: palette.length, size, colors: candidate};
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
    if (smoothing <= (input.sticker ? 16 : 32)) {
        if (input.sticker) {
            soften(pixels, input.width, input.height, smoothing);
            return fitpalette(pixels, {...input, smoothing}, 64, budget, protectpixels(pixels), delay);
        }
        const smaller = sampleblocks(pixels, input.width, input.height, smoothing);
        return fitpalette(pixels, {...input, smoothing}, 48, budget, null, delay, smaller);
    }
    throw new Error("the size limit is too small for this duration, resolution, and fps");
}

function protectpixels(pixels) {
    const mask = new Uint8Array(pixels.length / 4);
    const present = [false, false];
    for (let offset = 0; offset < pixels.length; offset += 4) {
        const low = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
        const high = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
        const anchor = high <= 5 ? 1 : low >= 250 ? 2 : 0;
        mask[offset / 4] = anchor;
        if (anchor) present[anchor - 1] = true;
    }
    return {mask, present};
}

function anchorpalette(palette, protectedpixels) {
    const anchors = [-1, -1];
    for (let anchor = 0; anchor < 2; anchor += 1) {
        if (!protectedpixels.present[anchor]) continue;
        const value = anchor * 255;
        let best = -1;
        let distance = Infinity;
        for (let index = 0; index < palette.length; index += 1) {
            if (anchors.includes(index)) continue;
            const difference = palette[index].reduce((sum, channel)=>sum + (channel - value) ** 2, 0);
            if (difference < distance) {
                distance = difference;
                best = index;
            }
        }
        if (best < 0) best = palette.length;
        palette[best] = [value, value, value];
        anchors[anchor] = best;
    }
    return anchors;
}

/*//////////////////////////////////////////////////////////////////////*/

function sampleblocks(pixels, width, height, size) {
    const output = new Uint8Array(Math.ceil(width / size) * Math.ceil(height / size) * 4);
    let index = 0;
    for (let top = 0; top < height; top += size) {
        for (let left = 0; left < width; left += size) {
            const right = Math.min(width, left + size);
            const bottom = Math.min(height, top + size);
            let red = 0, green = 0, blue = 0;
            for (let y = top; y < bottom; y += 1) {
                let offset = (y * width + left) * 4;
                for (let x = left; x < right; x += 1, offset += 4) {
                    red += pixels[offset];
                    green += pixels[offset + 1];
                    blue += pixels[offset + 2];
                }
            }
            const count = (right - left) * (bottom - top);
            output[index++] = Math.round(red / count);
            output[index++] = Math.round(green / count);
            output[index++] = Math.round(blue / count);
            output[index++] = 255;
        }
    }
    return output;
}

function expandblocks(mapped, width, height, size) {
    const output = new Uint8Array(width * height);
    let index = 0;
    for (let top = 0; top < height; top += size) {
        const row = top * width;
        for (let left = 0; left < width; left += size) {
            output.fill(mapped[index++], row + left, row + Math.min(left + size, width));
        }
        for (let y = top + 1; y < Math.min(top + size, height); y += 1) {
            output.copyWithin(y * width, row, row + width);
        }
    }
    return output;
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
