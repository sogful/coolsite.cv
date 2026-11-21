import {silence,timeline} from "./projects.js";
import {matching,sustain,vowel} from "./voices.js";

/*//////////////////////////////////////////////////////////////////////*/

export function interpolate(xs, ys, x, fallback = 0) {
    if (!xs?.length) {return fallback;}
    let low = 0, high = xs.length - 1;
    if (x <= xs[0]) {return ys[0];}
    if (x >= xs[high]) {return ys[high];}
    while (high - low > 1) {const middle = low + high >> 1; if (xs[middle] <= x) {low = middle;} else {high = middle;}}
    return ys[low] + (ys[high] - ys[low]) * (x - xs[low]) / Math.max(0.00001, xs[high] - xs[low]);
}

export function pitch(item, part, tick, clock) {
    const start = clock(part.position + item.position);
    const end = clock(part.position + item.position + item.duration);
    const moment = clock(part.position + tick);
    const milliseconds = (moment - start) * 1000;
    const points = item.pitch?.data || [];
    let deviation = 0;
    if (points.length) {
        let left = points[0], right = points.at(-1);
        for (let index = 1; index < points.length; index++) {if (points[index].x >= milliseconds) {left = points[index - 1]; right = points[index]; break;}}
        let blend = Math.max(0, Math.min(1, (milliseconds - left.x) / Math.max(0.0001, right.x - left.x)));
        if (left.shape === "io") {blend = (1 - Math.cos(blend * Math.PI)) / 2;}
        else if (left.shape === "i") {blend = 1 - Math.cos(blend * Math.PI / 2);}
        else if (left.shape === "o") {blend = Math.sin(blend * Math.PI / 2);}
        deviation = (left.y + (right.y - left.y) * blend) * 10;
    }
    const curve = part.curves?.find(value => value.abbr === "pitd");
    deviation += interpolate(curve?.xs, curve?.ys, tick);
    const vibrato = item.vibrato;
    if (vibrato?.length > 0 && end > start) {
        const begins = end - (end - start) * vibrato.length / 100;
        if (moment >= begins) {
            const phase = (moment - begins) / Math.max(0.001, end - begins);
            const fade = Math.min(1, phase / Math.max(0.001, vibrato.in / 100), (1 - phase) / Math.max(0.001, vibrato.out / 100));
            deviation += Math.sin((moment - begins) * 1000 / Math.max(30, vibrato.period || 175) * Math.PI * 2 + (vibrato.shift || 0) / 100 * Math.PI * 2) * (vibrato.depth || 0) * Math.max(0, fade);
        }
    }
    return item.tone * 100 + deviation;
}

export function automatic(song, bank, track = "all") {
    const tones = song.voice_parts.filter(part => track === "all" || part.track_no === Number(track)).flatMap(part => (part.notes || []).filter(item => !silence.has(String(item.lyric).toLowerCase())).map(item => item.tone)).sort((left, right) => left - right);
    if (!bank.sfx || !bank.native || !tones.length) {return 0;}
    const center = 69 + 12 * Math.log2(bank.native / 440);
    return Math.max(-36, Math.min(36, Math.round((center - tones[Math.floor(tones.length / 2)]) / 12) * 12));
}

export function adapt(original, bank, options) {
    const song = structuredClone(original);
    const clock = timeline(original);
    const shift = options.transpose;
    const used = new Set();
    const report = {notes: 0, approximate: [], missing: [], aliases: new Set(), shift};
    const rows = new Map(bank.rows.map(row => [row.alias, row]));
    let alternate = 0;
    song.voice_parts.forEach((part, index) => {
        if (options.track !== "all" && part.track_no !== Number(options.track)) {return;}
        const source = original.voice_parts[index];
        part.curves = (part.curves || []).filter(curve => ["pitd", "dyn"].includes(curve.abbr));
        const notes = [];
        let previous = "-", end = -1, previousalias = bank.preferred, paired = false;
        for (const item of source.notes || []) {
            if (silence.has(String(item.lyric || "").toLowerCase())) {continue;}
            const tone = item.tone + shift;
            if (tone < 0 || tone > 127) {throw new Error("The transposition moves notes outside the MIDI range.");}
            const continuation = String(item.lyric).startsWith("+") && item.position === end;
            let selected;
            const direct = rows.get(String(item.lyric).replace(/^\?/, ""));
            const pair = bank.sfx && (options.pattern === "paired" || options.pattern === "auto" && rows.has("open") && rows.has("close"));
            if (continuation) {selected = {row: sustain(bank, previousalias), approximate: false};}
            else if (bank.sfx) {
                const alias = options.pattern === "single" ? options.sound : options.pattern === "alternate" ? bank.short[alternate++ % bank.short.length] : direct?.alias || bank.preferred;
                selected = {row: rows.get(alias) || rows.get(bank.preferred), approximate: false};
            } else {selected = matching(bank, item.lyric, tone, previous, !options.strict);}
            if (!selected?.row) {report.missing.push(String(item.lyric)); continue;}
            if (selected.approximate) {report.approximate.push(String(item.lyric));}
            const output = structuredClone(item);
            output.tone = tone;
            output.lyric = selected.row.alias;
            for (const key of ["phoneme_overrides", "phoneme_expressions", "phonemizer_expressions", "phonemes", "phonemizer"]) {delete output[key];}
            if (pair && !continuation && !direct && item.duration >= 35) {
                const split = Math.max(1, Math.round(item.duration * 0.65));
                output.lyric = "open";
                output.duration = split;
                const closing = structuredClone(output);
                closing.position += split;
                closing.duration = item.duration - split;
                closing.lyric = "close";
                notes.push(output, closing);
                report.aliases.add("open"); report.aliases.add("close");
                paired = true;
                previousalias = "open";
            } else {
                if (continuation) {output.lyric = "+";}
                notes.push(output);
                report.aliases.add(selected.row.alias);
                previousalias = selected.row.alias;
            }
            previous = vowel(selected.row.alias);
            end = item.position + item.duration;
            report.notes++;
        }
        if (paired) {
            const xs = [], ys = [];
            for (const item of source.notes || []) {
                if (silence.has(String(item.lyric || "").toLowerCase())) {continue;}
                for (let tick = item.position; tick < item.position + item.duration; tick += 5) {xs.push(tick); ys.push(Math.round(pitch(item, source, tick, clock) - item.tone * 100));}
            }
            part.curves = (part.curves || []).filter(curve => curve.abbr !== "pitd");
            part.curves.push({abbr: "pitd", xs, ys});
            for (const item of notes) {item.pitch = {data: [{x: -1, y: 0, shape: "l"}, {x: 1, y: 0, shape: "l"}], snap_first: true}; item.vibrato = {...item.vibrato, length: 0};}
        }
        part.notes = notes;
        if (notes.length) {used.add(part.track_no);}
    });
    if (report.missing.length) {throw new Error("No matching sound for: " + [...new Set(report.missing)].slice(0, 8).join(", ") + ". Change the lyrics or turn off exact matching.");}
    if (!report.notes) {throw new Error("No notes were selected.");}
    song.name = (original.name || "project") + " (" + bank.name + ")";
    song.output_dir = "export";
    song.cache_dir = "cache";
    song.expressions ||= {};
    for (const track of used) {
        const existing = song.tracks[track].renderer_settings?.resampler || "";
        const resampler = /doppeltler/i.test(existing) ? existing : "worldline";
        const renderer = options.renderer === "auto" ? bank.sfx ? "classic" : "worldline" : options.renderer;
        song.tracks[track] = {
            ...song.tracks[track], singer: bank.id, phonemizer: "OpenUtau.Core.DefaultPhonemizer",
            volume: Number(song.tracks[track].volume) < -60 ? 0 : Number(song.tracks[track].volume) || 0,
            mute: false, solo: false,
            renderer_settings: renderer === "classic" ? {renderer: "CLASSIC", resampler, wavtool: "convergence"} : {renderer: "WORLDLINE-R"}
        };
    }
    for (const track of song.tracks) {track.solo = false;}
    for (const [abbr, expression] of Object.entries(song.expressions)) {
        if (expression.is_flag && !["gen", "bre", "lpf", "form"].includes(abbr)) {expression.is_flag = false;}
        if (["gen", "bre", "lpf", "clr", "eng"].includes(abbr)) {expression.default_value = 0;}
    }
    for (const abbr of ["vol", "vel", "atk", "dec"]) {song.expressions[abbr] = {name: abbr, abbr, type: "Numerical", min: 0, max: 200, default_value: abbr === "dec" ? 0 : 100, is_flag: false, flag: ""};}
    song.expressions.form = {name: "formant filter", abbr: "form", type: "Options", min: 0, max: 1, default_value: bank.sfx ? 1 : 0, is_flag: true, options: ["", "N"]};
    song.expressions.pitd ||= {name: "pitch deviation", abbr: "pitd", type: "Curve", min: -9600, max: 9600, default_value: 0, is_flag: false, flag: ""};
    return {song, report: {...report, aliases: [...report.aliases], tracks: [...used]}};
}

/*//////////////////////////////////////////////////////////////////////*/

export function plan(song, bank, selected = "all", preview = 0) {
    const clock = timeline(song);
    const tracks = new Map();
    const rows = new Map(bank.rows.map(row => [row.alias, row]));
    let length = 0;
    const rate = 44100;
    const starts = song.voice_parts.filter(part => selected === "all" || part.track_no === Number(selected)).flatMap(part => (part.notes || []).filter(item => !silence.has(String(item.lyric).toLowerCase())).map(item => clock(part.position + item.position)));
    const first = Math.min(...starts);
    const limit = preview ? first + preview : Infinity;
    for (const part of song.voice_parts) {
        if (selected !== "all" && part.track_no !== Number(selected)) {continue;}
        const track = song.tracks[part.track_no];
        const index = part.track_no;
        if (!tracks.has(index)) {tracks.set(index, {name: track.track_name || "voice " + (index + 1), groups: [], gain: 10 ** ((Number(track.volume) || 0) / 20)});}
        const notes = (part.notes || []).filter(item => !silence.has(String(item.lyric || "").toLowerCase())).sort((left, right) => left.position - right.position);
        for (let cursor = 0; cursor < notes.length; cursor++) {
            const item = notes[cursor];
            if (String(item.lyric).startsWith("+")) {continue;}
            const group = [item];
            while (cursor + 1 < notes.length && String(notes[cursor + 1].lyric).startsWith("+") && group.at(-1).position + group.at(-1).duration === notes[cursor + 1].position) {group.push(notes[++cursor]);}
            const row = rows.get(item.lyric);
            if (!row) {throw new Error("Missing voicebank alias: " + item.lyric);}
            const start = clock(part.position + item.position);
            let end = clock(part.position + group.at(-1).position + group.at(-1).duration);
            if (start >= limit) {continue;}
            end = Math.min(end, limit);
            const begins = start - Math.max(0, row.preutter) / 1000;
            const count = Math.ceil((end - begins) / 0.005) + 1;
            const pitches = new Float32Array(count);
            const gains = new Float32Array(count);
            const dynamics = part.curves?.find(curve => curve.abbr === "dyn");
            for (let frame = 0; frame < count; frame++) {
                const moment = Math.min(end - 0.00001, Math.max(start, begins + frame * 0.005));
                const current = group.find(value => clock(part.position + value.position + value.duration) > moment) || group.at(-1);
                const tick = clock.tick(moment) - part.position;
                pitches[frame] = pitch(current, part, tick, clock);
                gains[frame] = 10 ** (interpolate(dynamics?.xs, dynamics?.ys, tick) / 200);
            }
            tracks.get(index).groups.push({row, start, begins, end, pitches, gains});
            length = Math.max(length, end);
        }
    }
    const populated = [...tracks.values()].filter(track => track.groups.length);
    if (!populated.length) {throw new Error("There are no notes in this preview range.");}
    const offset = preview ? Math.max(0, first - 0.05) : 0;
    if (offset) {for (const track of populated) {for (const group of track.groups) {group.start -= offset; group.begins -= offset; group.end -= offset;}} length -= offset;}
    const frames = Math.ceil((length + 0.15) * rate);
    if (length > 900 || frames * (populated.length + 1) * 4 > 512 * 1024 * 1024) {throw new Error("Render fewer tracks or a shorter project at a time.");}
    return {rate, frames, tracks: populated};
}
