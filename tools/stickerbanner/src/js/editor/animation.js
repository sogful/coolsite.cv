import {inspectgif} from "../../../../../assets/static/js/gifski/gifformat.js?v=20261108";

export async function createanimation(files, grid) {
    if (typeof ImageDecoder !== "function" || !await ImageDecoder.isTypeSupported("image/gif")) return null;
    const entries = [];
    let stopped = false;
    let paused = false;
    let request = 0;
    let offset = 0;
    let started = performance.now();

    function close() {
        stopped = true;
        cancelAnimationFrame(request);
        for (const entry of entries) {entry.decoder.close(); entry.canvas.remove(); entry.image.style.visibility = "";}
    }

    async function render(entry, index) {
        if (stopped || entry.busy || entry.index === index) return;
        entry.busy = true;
        try {
            const result = await entry.decoder.decode({frameIndex:index,completeFramesOnly:true});
            try {
                if (stopped) return;
                entry.canvas.width = result.image.displayWidth;
                entry.canvas.height = result.image.displayHeight;
                entry.canvas.getContext("2d").drawImage(result.image,0,0);
                entry.index = index;
                entry.canvas.dataset.frame = String(index);
            } finally {result.image.close();}
        } finally {entry.busy = false;}
    }

    function tick() {
        if (stopped || paused) return;
        const elapsed = offset + performance.now() - started;
        for (const entry of entries) {
            const position = elapsed % entry.duration;
            let index = entry.ends.findIndex(end => end > position);
            if (index < 0) index = entry.ends.length - 1;
            render(entry,index).catch(close);
        }
        request = requestAnimationFrame(tick);
    }

    try {
        const images = [...grid.querySelectorAll(".tileimage")];
        for (const [index,file] of files.entries()) {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const parsed = inspectgif(bytes);
            let duration = 0;
            const ends = parsed.frames.map(frame => {
                const delay = frame.control.length ? (frame.control[4] | frame.control[5] << 8) * 10 : 100;
                duration += Math.max(20,delay);
                return duration;
            });
            const decoder = new ImageDecoder({data:bytes,type:"image/gif",preferAnimation:true});
            const canvas = document.createElement("canvas");
            canvas.className = "tileanimation";
            const image = images[index];
            const entry = {decoder,canvas,image,ends,duration,index:-1,busy:false};
            entries.push(entry);
            await decoder.tracks.ready;
            await render(entry,0);
        }
        for (const entry of entries) {entry.image.after(entry.canvas); entry.image.style.visibility = "hidden";}
        started = performance.now();
        request = requestAnimationFrame(tick);
    } catch {close(); return null;}
    return {
        close,
        toggle() {
            if (paused) {paused = false; started = performance.now(); request = requestAnimationFrame(tick);}
            else {offset += performance.now() - started; paused = true; cancelAnimationFrame(request);}
            return paused;
        }
    };
}
