importScripts("./vendor/mp4box.min.js");

let pending = 0;
let resume = null;
self.addEventListener("message", event=>{
    if (event.data.type === "acknowledge") {
        pending -= 1;
        if (resume) {
            const resolve = resume;
            resume = null;
            resolve();
        }
        return;
    }
    decodevideo(event.data).catch(error=>self.postMessage({error: error.message || String(error)}));
});

/*//////////////////////////////////////////////////////////////////////*/

async function decodevideo({file, settings}) {
    if (typeof VideoDecoder !== "function") throw new Error("this browser cannot decode video for background conversion");
    const bytes = await file.arrayBuffer();
    bytes.fileStart = 0;
    const parser = MP4Box.createFile();
    let information = null;
    parser.onReady = value=>{information = value;};
    parser.onError = message=>{throw new Error(`the video could not be read: ${message}`);};
    parser.appendBuffer(bytes);
    parser.flush();
    const track = information?.videoTracks[0];
    if (!track) throw new Error("the selected file has no supported MP4 video track");
    const entry = parser.getTrackById(track.id).mdia.minf.stbl.stsd.entries[0];
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    const configuration = {codec: track.codec, codedWidth: track.video.width, codedHeight: track.video.height};
    if (box) {
        const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
        box.write(stream);
        configuration.description = new Uint8Array(stream.buffer, 8);
    }
    const supported = await VideoDecoder.isConfigSupported(configuration);
    if (!supported.supported) throw new Error("this browser cannot decode the selected video codec");
    const samples = parser.getTrackSamplesInfo(track.id);
    const scale = track.timescale;
    let first = 0;
    let last = samples.length;
    for (let index = 0; index < samples.length; index += 1) {
        if (samples[index].is_sync && samples[index].cts / scale <= settings.start) first = index;
        if (samples[index].dts / scale > settings.start + settings.duration + 1) {
            last = index;
            break;
        }
    }
    const canvas = new OffscreenCanvas(settings.width, settings.height);
    const context = canvas.getContext("2d", {alpha: false, willReadFrequently: true});
    const framebytes = settings.width * settings.height * 4;
    const framecount = Math.max(2, Math.round(settings.duration * settings.fps));
    const batchsize = Math.max(12, Math.round(settings.fps * 2));
    let batch = new Uint8Array(Math.min(batchsize, framecount) * framebytes);
    let count = 0;
    let batchstart = 0;
    let previous = null;
    let failure = null;
    const signatures = new Set();
    const emit = ()=>{
        pending += 1;
        self.postMessage({type: "frames", start: batchstart, count: count - batchstart, total: framecount, frames: batch.buffer}, [batch.buffer]);
        batchstart = count;
        batch = count < framecount ? new Uint8Array(Math.min(batchsize, framecount - count) * framebytes) : null;
    };
    const capture = frame=>{
        const crop = settings.crop || {x: 0, y: 0, width: frame.displayWidth, height: frame.displayHeight};
        context.fillStyle = "#000000";
        context.fillRect(0, 0, settings.width, settings.height);
        context.drawImage(frame, crop.x, crop.y, crop.width, crop.height, 0, 0, settings.width, settings.height);
        const pixels = context.getImageData(0, 0, settings.width, settings.height).data;
        let signature = 2166136261;
        for (let offset = 0; offset < pixels.length; offset += 256) signature = Math.imul(signature ^ (pixels[offset] << 16 | pixels[offset + 1] << 8 | pixels[offset + 2]), 16777619);
        if (signatures.size < 32) signatures.add(signature);
        batch.set(pixels, (count - batchstart) * framebytes);
        count += 1;
        if (count - batchstart === batchsize || count === framecount) emit();
    };
    const decoder = new VideoDecoder({
        output(frame) {
            try {
                if (previous) {
                    while (count < framecount && (settings.start + count / settings.fps) * 1000000 < frame.timestamp - 1) capture(previous);
                    previous.close();
                }
                previous = frame;
            } catch (error) {
                frame.close();
                failure = error;
                self.postMessage({error: error.message || String(error)});
            }
        },
        error(error) {
            failure = error;
            self.postMessage({error: error.message || String(error)});
        },
    });
    decoder.configure(configuration);
    try {
        for (let index = first; index < last && count < framecount; index += 1) {
            if (failure) throw failure;
            while (pending >= 2) await new Promise(resolve=>{resume = resolve;});
            const sample = samples[index];
            decoder.decode(new EncodedVideoChunk({
                type: sample.is_sync ? "key" : "delta",
                timestamp: Math.round(sample.cts / scale * 1000000),
                duration: Math.round(sample.duration / scale * 1000000),
                data: new Uint8Array(bytes, sample.offset, sample.size),
            }));
            if (index % 32 === 0) await new Promise(resolve=>{
                if (decoder.decodeQueueSize < 16) return resolve();
                const dequeue = ()=>{
                    if (decoder.decodeQueueSize >= 16) return;
                    decoder.removeEventListener("dequeue", dequeue);
                    resolve();
                };
                decoder.addEventListener("dequeue", dequeue);
            });
        }
        await decoder.flush();
        if (failure) throw failure;
        if (previous) {
            const end = previous.timestamp + (previous.duration || 1000000 / settings.fps);
            while (count < framecount && (settings.start + count / settings.fps) * 1000000 < end) capture(previous);
        }
        if (count !== framecount) throw new Error(`the video decoder returned ${count} of ${framecount} requested frames`);
        if (framecount > settings.fps * 2 && signatures.size < 2) throw new Error("the video decoder returned only one repeated image. No GIF was saved.");
        self.postMessage({type: "decoded", count, distinct: signatures.size});
    } finally {
        if (previous) previous.close();
        if (decoder.state !== "closed") decoder.close();
    }
}
