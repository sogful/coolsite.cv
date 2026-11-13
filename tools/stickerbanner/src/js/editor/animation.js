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
        if (stopped) return;
        stopped = true;
        cancelAnimationFrame(request);
        document.removeEventListener("visibilitychange",visibility);
        for (const entry of entries) {entry.decoder.close(); entry.canvas.remove(); entry.image.style.visibility = "";}
    }

    async function render(entry, index) {
        if (stopped || entry.busy || entry.index === index) return;
        entry.busy = true;
        try {
            const result = await entry.decoder.decode({frameIndex:index,completeFramesOnly:true});
            try {
                if (stopped) return;
                if (entry.canvas.width !== result.image.displayWidth) entry.canvas.width = result.image.displayWidth;
                if (entry.canvas.height !== result.image.displayHeight) entry.canvas.height = result.image.displayHeight;
                entry.context.globalCompositeOperation = "copy";
                entry.context.drawImage(result.image,0,0);
                entry.index = index;
                entry.canvas.dataset.frame = String(index);
            } finally {result.image.close();}
        } finally {entry.busy = false;}
    }

    function tick() {
        request = 0;
        if (stopped || paused || document.hidden) return;
        const elapsed = offset + performance.now() - started;
        for (const entry of entries) {
            const position = elapsed % entry.duration;
            let left = 0;
            let right = entry.ends.length - 1;
            while (left < right) {
                const middle = left + right >> 1;
                if (entry.ends[middle] > position) right = middle;
                else left = middle + 1;
            }
            const index = left;
            render(entry,index).catch(close);
        }
        request = requestAnimationFrame(tick);
    }

    function visibility() {
        if (document.hidden) {cancelAnimationFrame(request); request = 0;}
        else if (!stopped && !paused && !request) request = requestAnimationFrame(tick);
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
            const context = canvas.getContext("2d");
            const entry = {decoder,canvas,context,image,ends,duration,index:-1,busy:false};
            entries.push(entry);
            await decoder.tracks.ready;
            await render(entry,0);
        }
        for (const entry of entries) {entry.image.after(entry.canvas); entry.image.style.visibility = "hidden";}
        started = performance.now();
        document.addEventListener("visibilitychange",visibility);
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
