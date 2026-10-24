import initgifski, {encode as encodegifski} from "./gifski_wasm.js";

let ready = null;

self.addEventListener("message", async event=>{
    try {
        if (!ready) ready = initgifski();
        await ready;
        const input = event.data;
        const gif = encodegifski(
            new Uint8Array(input.frames),
            input.framecount,
            input.width,
            input.height,
            input.fps,
            undefined,
            input.quality,
            0,
            undefined,
            undefined,
        );
        self.postMessage({gif: gif.buffer}, [gif.buffer]);
    } catch (error) {
        self.postMessage({error: error.message || String(error)});
    }
});
