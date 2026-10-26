import initgifski, {encode as encodegifski} from "./gifski_wasm.js";

let ready = null;

self.addEventListener("message", async event=>{
    try {
        const input = event.data;
        if (!ready) ready = initgifski();
        await ready;
        const started = performance.now();
        if (input.mode === "sample") {
            const gif = encodeframes(new Uint8Array(input.frames), input, 0, input.framecount);
            const elapsed = performance.now() - started;
            self.postMessage({type: "sample", elapsed, framecount: input.framecount});
            return;
        }
        const frames = new Uint8Array(input.frames);
        const chunkframes = Math.min(120, Math.max(24, Math.round(input.fps * 4)));
        for (let start = 0; start < input.framecount; start += chunkframes) {
            const framecount = Math.min(chunkframes, input.framecount - start);
            const gif = encodeframes(frames, input, start, framecount);
            const completed = start + framecount;
            self.postMessage({type: "chunk", completed, framecount: input.framecount, gif: gif.buffer}, [gif.buffer]);
        }
        self.postMessage({type: "complete", elapsed: performance.now() - started});
    } catch (error) {
        self.postMessage({error: error.message || String(error)});
    }
});

function encodeframes(frames, input, start, framecount){
    const framebytes = input.width * input.height * 4;
    const firstbyte = start * framebytes;
    const lastbyte = firstbyte + framecount * framebytes;
    return encodegifski(
        frames.subarray(firstbyte, lastbyte),
        framecount,
        input.width,
        input.height,
        input.fps,
        undefined,
        input.quality,
        input.loop ? undefined : 0,
        undefined,
        undefined,
    );
}
