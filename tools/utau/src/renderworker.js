import {analyze,synthesize} from "./sound.js";

/*//////////////////////////////////////////////////////////////////////*/

self.onmessage = event => {
    try {
        const files = new Map(event.data.files);
        const cache = new Map();
        const source = row => {
            if (!cache.has(row.file)) {
                const bytes = files.get(row.file);
                if (!bytes) {throw new Error("Missing sample: " + row.file);}
                cache.set(row.file, analyze(bytes, row.frq ? files.get(row.frq) : null));
            }
            return cache.get(row.file);
        };
        if (event.data.inspect) {
            const values = event.data.rows.map(row => source(row).average).sort((left, right) => left - right);
            self.postMessage({native: values[Math.floor(values.length / 2)] || 220});
            return;
        }
        const plan = event.data.plan;
        const tracks = [];
        const count = plan.tracks.reduce((sum, track) => sum + track.groups.length, 0);
        let done = 0;
        let updated = 0;
        for (const track of plan.tracks) {
            const samples = new Float32Array(plan.frames);
            for (const group of track.groups) {
                const rendered = synthesize(source(group.row), group, plan.rate);
                const offset = Math.round(group.begins * plan.rate);
                for (let index = Math.max(0, -offset); index < Math.min(rendered.length, samples.length - offset); index++) {samples[offset + index] += rendered[index] * track.gain;}
                done++;
                if (performance.now() - updated > 80 || done === count) {self.postMessage({progress: done / count, done, count}); updated = performance.now();}
            }
            tracks.push({name: track.name, samples});
        }
        const mix = new Float32Array(plan.frames);
        for (const track of tracks) {for (let index = 0; index < mix.length; index++) {mix[index] += track.samples[index];}}
        let peak = 0;
        for (const value of mix) {peak = Math.max(peak, Math.abs(value));}
        for (const track of tracks) {for (const value of track.samples) {peak = Math.max(peak, Math.abs(value));}}
        if (peak < 0.0001) {throw new Error("The rendered project is silent.");}
        const gain = 0.8 / peak;
        for (let index = 0; index < mix.length; index++) {mix[index] *= gain;}
        for (const track of tracks) {for (let index = 0; index < track.samples.length; index++) {track.samples[index] *= gain;}}
        self.postMessage({mix, tracks, rate: plan.rate}, [mix.buffer, ...tracks.map(track => track.samples.buffer)]);
    } catch (error) {self.postMessage({error: error.message});}
};
