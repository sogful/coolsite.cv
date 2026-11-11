import initgifski, {encode as encodegifski} from "./gifski_wasm.js";
import {inspectgif} from "./gifformat.js";
import {encodepalette} from "./paletteencoder.js?v=20261107";

let ready = null;
self.addEventListener("message", async event=>{
    try {
        const input = event.data;
        const frames = new Uint8Array(input.frames);
        if (!Number.isInteger(input.count) || input.count < 1 || frames.length !== input.count * input.width * input.height * 4) throw new Error("the encoder received incomplete video frames");
        const started = performance.now();
        let result;
        if (input.budget) result = encodepalette(frames, input);
        else {
            if (!ready) ready = initgifski();
            await ready;
            result = {gif: encodeframes(frames, input, 100)};
        }
        const parsed = inspectgif(result.gif);
        const size = 32 + parsed.frames.reduce((total, frame)=>total + frame.control.length + frame.descriptor.length + frame.palette.length + frame.data.length, 0);
        const transfer = [result.gif.buffer];
        if (input.budget) transfer.push(frames.buffer);
        self.postMessage({type: "encoded", start: input.start, count: input.count, colors: result.colors, averagecolors: result.averagecolors, bytes: size, frames: input.budget ? frames.buffer : null, gif: result.gif.buffer, elapsed: performance.now() - started, upgrade: input.upgrade || false}, transfer);
    } catch (error) {
        self.postMessage({error: error.message || String(error)});
    }
});

self.postMessage({type: "ready"});

/*//////////////////////////////////////////////////////////////////////*/

function encodeframes(frames, input, quality) {
    return encodegifski(frames, input.count, input.width, input.height, input.fps, undefined, quality, 0, undefined, undefined);
}
