import {joingifs, inspectgif} from "./gifformat.js";

export function convertvideo(file, settings, onprogress, signal) {
    return new Promise((resolve, reject)=>{
        const decoder = new Worker(new URL("./decoderworker.js", import.meta.url));
        const pool = Array.from({length: Math.min(2, Math.max(1, (navigator.hardwareConcurrency || 2) - 1))}, ()=>({worker: new Worker(new URL("./gifskiworker.js", import.meta.url), {type: "module"}), busy: false}));
        const workers = [decoder, ...pool.map(item=>item.worker)];
        const queue = [];
        const parts = new Map();
        const cached = [];
        const framecount = Math.max(2, Math.round(settings.duration * settings.fps));
        const target = settings.autolimit ? Math.floor(settings.limit * 0.975) : 0;
        let decoded = false;
        let completed = 0;
        let colors = 64;
        let ended = false;
        const finish = (error, output)=>{
            if (ended) return;
            ended = true;
            signal?.removeEventListener("abort", cancel);
            for (const worker of workers) worker.terminate();
            cached.length = 0;
            if (error) reject(error);
            else resolve(output);
        };
        const cancel = ()=>finish(new Error("stopped"));
        if (signal?.aborted) return cancel();
        signal?.addEventListener("abort", cancel, {once: true});
        const next = ()=>{
            if (ended) return;
            for (const item of pool) {
                if (item.busy || !queue.length) continue;
                const batch = queue.shift();
                item.busy = true;
                const budget = target ? Math.floor(target * batch.count / framecount) : 0;
                item.worker.postMessage({...batch, width: settings.width, height: settings.height, fps: settings.fps, colors, budget}, [batch.frames]);
            }
            if (!decoded || completed !== framecount || pool.some(item=>item.busy)) return;
            try {
                const ordered = [...parts.entries()].sort((first, second)=>first[0] - second[0]).map(item=>item[1]);
                const output = joingifs(ordered, settings);
                if (settings.autolimit && output.size > settings.limit) throw new Error("the GIF exceeds the selected size limit");
                if (target && output.size < settings.limit * 0.947 && cached.length) {
                    const batch = cached.shift();
                    const budget = batch.bytes + Math.floor((target - output.size) * 0.95);
                    const item = pool[0];
                    item.busy = true;
                    onprogress(98, "improving GIF quality", `${completed}/${framecount} frames - ${settings.width}x${settings.height} - ${settings.fps}fps`);
                    item.worker.postMessage({...batch, width: settings.width, height: settings.height, fps: settings.fps, budget, upgrade: true}, [batch.frames]);
                    return;
                }
                onprogress(99, "checking GIF", `${completed}/${framecount} frames`);
                finish(null, output);
            } catch (error) {finish(error);}
        };
        decoder.addEventListener("message", event=>{
            if (ended) return;
            const reply = event.data;
            if (reply.error) return finish(new Error(reply.error));
            if (reply.type === "frames") {
                queue.push(reply);
                if (!completed) onprogress(0, "encoding GIF", `0/${framecount} frames`);
            }
            if (reply.type === "decoded") decoded = true;
            next();
        });
        for (const item of pool) item.worker.addEventListener("message", event=>{
            if (ended) return;
            const reply = event.data;
            if (reply.error) return finish(new Error(reply.error));
            try {
                inspectgif(reply.gif);
                if (!reply.upgrade || reply.gif.byteLength > parts.get(reply.start).byteLength) parts.set(reply.start, new Uint8Array(reply.gif));
                if (!reply.upgrade) {
                    completed += reply.count;
                    if (reply.frames && reply.averagecolors < 200) {
                        cached.push({frames: reply.frames, start: reply.start, count: reply.count, colors: reply.colors, averagecolors: reply.averagecolors, bytes: reply.bytes});
                        cached.sort((first, second)=>first.averagecolors - second.averagecolors);
                        if (cached.length > 3) cached.pop();
                    }
                }
                colors = reply.colors || colors;
                item.busy = false;
                onprogress(Math.min(98, Math.round(completed / framecount * 98)), "encoding GIF", `${completed}/${framecount} frames - ${settings.width}x${settings.height} - ${settings.fps}fps`);
                if (!reply.upgrade) decoder.postMessage({type: "acknowledge"});
                next();
            } catch (error) {finish(error);}
        });
        for (const worker of workers) {
            worker.addEventListener("error", event=>finish(new Error(event.message || "video conversion failed")));
            worker.addEventListener("messageerror", ()=>finish(new Error("video frame transfer failed")));
        }
        onprogress(0, "reading video", `${framecount} frames - ${settings.width}x${settings.height} - ${settings.fps}fps`);
        decoder.postMessage({file, settings});
    });
}
