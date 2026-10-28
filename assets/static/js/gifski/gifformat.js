export function inspectgif(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const word = position=>bytes[position] | bytes[position + 1] << 8;
    if (bytes.length < 14 || !/^GIF8[79]a$/.test(String.fromCharCode(...bytes.subarray(0, 6)))) throw new Error("the encoder returned an empty or invalid GIF");
    const width = word(6);
    const height = word(8);
    let position = 13;
    const palette = bytes[10] & 128 ? bytes.slice(position, position += 3 * (1 << ((bytes[10] & 7) + 1))) : null;
    const frames = [];
    const loops = [];
    let control = new Uint8Array([33, 249, 4, 4, 4, 0, 0, 0]);
    const skipblocks = ()=>{
        while (position < bytes.length) {
            const size = bytes[position++];
            if (!size) return;
            position += size;
            if (position > bytes.length) throw new Error("the GIF contains an incomplete image");
        }
        throw new Error("the GIF contains an incomplete image");
    };
    while (position < bytes.length) {
        const marker = bytes[position++];
        if (marker === 59) return {width, height, frames, loops};
        if (marker === 33) {
            const label = bytes[position++];
            if (label === 249) {
                if (bytes[position] !== 4 || position + 6 > bytes.length) throw new Error("the GIF has invalid frame timing");
                control = bytes.slice(position - 2, position + 6);
                position += 6;
            } else {
                if (label === 255) {
                    const length = bytes[position++];
                    const name = String.fromCharCode(...bytes.subarray(position, position + length));
                    position += length;
                    if (name === "NETSCAPE2.0" && bytes[position] === 3) loops.push(word(position + 2));
                }
                skipblocks();
            }
            continue;
        }
        if (marker !== 44 || position + 9 >= bytes.length) throw new Error("the GIF contains an invalid image");
        const descriptor = bytes.slice(position - 1, position + 9);
        position += 9;
        if (word(position - 9) + word(position - 5) > width || word(position - 7) + word(position - 3) > height) throw new Error("the GIF image exceeds its dimensions");
        const flags = descriptor[9];
        const localpalette = flags & 128 ? bytes.slice(position, position += 3 * (1 << ((flags & 7) + 1))) : palette;
        if (!localpalette?.length) throw new Error("the GIF has no color palette");
        descriptor[9] = flags | 128;
        if (!(flags & 128)) descriptor[9] = descriptor[9] & 248 | bytes[10] & 7;
        const datastart = position++;
        skipblocks();
        frames.push({control, descriptor, palette: localpalette, data: bytes.subarray(datastart, position), delay: control[4] | control[5] << 8});
        control = new Uint8Array([33, 249, 4, 4, 4, 0, 0, 0]);
    }
    throw new Error("the GIF is incomplete");
}

/*//////////////////////////////////////////////////////////////////////*/

export function joingifs(parts, settings) {
    const parsed = parts.map(inspectgif);
    const frames = parsed.flatMap(part=>part.frames);
    if (parsed.some(part=>part.width !== settings.width || part.height !== settings.height) || frames.length < 2) throw new Error("the encoder did not produce a complete animation");
    const duration = Math.round(settings.duration * 100);
    const actual = frames.reduce((total, frame)=>total + frame.delay, 0);
    const correction = duration - actual;
    if (Math.abs(correction) > parts.length + 2) throw new Error("the exported GIF has incorrect timing");
    const final = frames.at(-1);
    const delay = final.delay + correction;
    if (delay < 2 || delay > 65535) throw new Error("the exported GIF has invalid final frame timing");
    final.control = final.control.slice();
    final.control[4] = delay & 255;
    final.control[5] = delay >> 8;
    const header = new Uint8Array([71, 73, 70, 56, 57, 97, settings.width & 255, settings.width >> 8, settings.height & 255, settings.height >> 8, 112, 0, 0]);
    const output = [header];
    if (settings.loop) output.push(new Uint8Array([33, 255, 11, 78, 69, 84, 83, 67, 65, 80, 69, 50, 46, 48, 3, 1, 0, 0, 0]));
    for (const frame of frames) output.push(frame.control, frame.descriptor, frame.palette, frame.data);
    output.push(new Uint8Array([59]));
    return new File(output, "out.gif", {type: "image/gif"});
}
