import {load,dump,JSON_SCHEMA as schema} from "../vendor/yaml.mjs";
import {decode,stem,entries} from "./files.js";
import {midi,xmlproject} from "./scores.js";

/*//////////////////////////////////////////////////////////////////////*/

export const silence = new Set(["", "r", "rest", "pau", "sil", "sp", "br", "bre", "breath", "cl", "asp", "ap", "spn", "[br]", "[r]", "-"]);

export function blank(name, bpm = 120) {
    return {name, ustx_version: "0.6", resolution: 480, bpm, beat_per_bar: 4, beat_unit: 4, tempos: [{position: 0, bpm}], time_signatures: [{bar_position: 0, beat_per_bar: 4, beat_unit: 4}], tracks: [], voice_parts: [], wave_parts: [], expressions: {}};
}

export function note(position, duration, tone, lyric = "a") {
    return {position: Math.round(position), duration: Math.max(1, Math.round(duration)), tone: Math.round(tone), lyric, pitch: {data: [{x: -1, y: 0, shape: "io"}, {x: 1, y: 0, shape: "io"}], snap_first: true}, vibrato: {length: 0, period: 175, depth: 25, in: 10, out: 10, shift: 0, drift: 0}};
}

export function addtrack(song, name, notes, position = 0, curves = []) {
    const index = song.tracks.length;
    song.tracks.push({track_name: name, volume: 0, pan: 0});
    song.voice_parts.push({name, track_no: index, position, notes, curves});
}

function numbers(text) {return String(text || "").split(",").map(value => Number(value) || 0);}

function ust(text, name) {
    const sections = [];
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (/^\[#.+\]$/.test(line)) {sections.push({name: line, values: {}});}
        else if (sections.length && line.includes("=")) {
            const split = line.indexOf("=");
            sections.at(-1).values[line.slice(0, split)] = line.slice(split + 1);
        }
    }
    const settings = sections.find(section => section.name === "[#SETTING]")?.values;
    if (!settings || !sections.some(section => section.name === "[#TRACKEND]")) {throw new Error("Choose a complete UST project, including its settings and end marker.");}
    const song = blank(settings.ProjectName || name, Number(settings.Tempo) || 120);
    const notes = [];
    const points = [];
    let position = 0;
    let previous = 0;
    for (const section of sections) {
        if (!/^\[#\d+\]$/.test(section.name)) {continue;}
        const values = section.values;
        const duration = Number(values.Duration || values.Length);
        if (values.Delta !== undefined && values.Duration !== undefined) {position = previous + Number(values.Delta);}
        if (values.Tempo) {song.tempos.push({position, bpm: Number(values.Tempo)});}
        const item = note(position, duration, Number(values.NoteNum), (values.Lyric || "R").replace(/^\?/, ""));
        if (values.PBS && values.PBS !== "null") {
            const first = values.PBS.split(/[;,]/);
            let offset = Number(first[0]) || 0;
            const widths = numbers(values.PBW);
            const heights = numbers(values.PBY);
            const shapes = String(values.PBM || "").split(",");
            item.pitch.data = [{x: offset, y: Number(first[1]) || 0, shape: "io"}];
            widths.forEach((width, index) => {
                item.pitch.data.at(-1).shape = {s: "l", r: "o", j: "i"}[shapes[index]] || "io";
                offset += width;
                item.pitch.data.push({x: offset, y: heights[index] || 0, shape: "io"});
            });
        } else if (values.PitchBend || values.Pitches) {
            numbers(values.PitchBend || values.Pitches).forEach((value, index) => points.push([position + (Number(values.PBStart) || 0) + index * 5, value]));
        }
        if (values.VBR) {
            item.vibrato = Object.fromEntries(["length", "period", "depth", "in", "out", "shift", "drift"].map((key, index) => [key, numbers(values.VBR)[index] || 0]));
        }
        if (!Number.isFinite(duration) || duration <= 0) {throw new Error("A UST note has an invalid duration.");}
        notes.push(item);
        previous = position;
        position += duration;
    }
    addtrack(song, settings.ProjectName || name, notes, 0, points.length ? [{abbr: "pitd", xs: points.map(point => point[0]), ys: points.map(point => point[1])}] : []);
    return song;
}

function ufdata(document, name) {
    const source = document.project;
    const song = blank(source.name || name);
    song.tempos = (source.tempos || []).map(tempo => ({position: tempo.tickPosition, bpm: tempo.bpm}));
    song.time_signatures = (source.timeSignatures || []).map(value => ({bar_position: value.measurePosition, beat_per_bar: value.numerator, beat_unit: value.denominator}));
    for (const track of source.tracks || []) {
        const notes = track.notes.map(item => note(item.tickOn, item.tickOff - item.tickOn, item.key, item.lyric || item.phoneme || "a"));
        const curves = [];
        if (track.pitch?.ticks?.length) {
            const points = [];
            track.pitch.ticks.forEach((tick, index) => {
                const value = track.pitch.values[index];
                const current = notes.find(item => item.position <= tick && item.position + item.duration > tick);
                if (value !== null && current) {points.push([tick, (track.pitch.isAbsolute ? value - current.tone : value) * 100]);}
            });
            if (points.length) {curves.push({abbr: "pitd", xs: points.map(point => point[0]), ys: points.map(point => point[1])});}
        }
        addtrack(song, track.name || "voice", notes, 0, curves);
    }
    return song;
}

function svp(document, name) {
    const blick = 705600000;
    const ticks = value => Number(value || 0) * 480 / blick;
    const song = blank(name);
    song.tempos = (document.time?.tempo || []).map(tempo => ({position: ticks(tempo.position), bpm: tempo.bpm}));
    song.time_signatures = (document.time?.meter || []).map(meter => ({bar_position: meter.index, beat_per_bar: meter.numerator, beat_unit: meter.denominator}));
    const library = new Map((document.library || []).map(group => [group.uuid, group]));
    for (const track of document.tracks || []) {
        const index = song.tracks.length;
        song.tracks.push({track_name: track.name || "voice", volume: 0, pan: 0});
        const groups = [{group: track.mainGroup, reference: track.mainRef || {}}];
        for (const reference of track.groups || []) {groups.push({group: library.get(reference.groupID), reference});}
        for (const {group, reference} of groups) {
            if (!group?.notes?.length) {continue;}
            const offset = ticks(reference.blickOffset);
            const notes = group.notes.map(item => note(ticks(item.onset), ticks(item.duration), item.pitch + Number(reference.pitchOffset || 0), item.lyrics || "a"));
            const points = group.parameters?.pitchDelta?.points || [];
            const xs = [], ys = [];
            for (let cursor = 0; cursor + 1 < points.length; cursor += 2) {xs.push(ticks(points[cursor])); ys.push(points[cursor + 1]);}
            song.voice_parts.push({name: group.name || track.name, track_no: index, position: offset, notes, curves: xs.length ? [{abbr: "pitd", xs, ys}] : []});
        }
    }
    return song;
}

function vpr(document, name) {
    const song = blank(name);
    const resolution = Number(document.masterTrack?.resolution || 480);
    const scale = 480 / resolution;
    song.tempos = (document.masterTrack?.tempo?.events || []).map(item => ({position: item.pos * scale, bpm: item.value / 100}));
    song.time_signatures = (document.masterTrack?.timeSig?.events || []).map(item => ({bar_position: item.bar, beat_per_bar: item.numer, beat_unit: item.denom}));
    for (const track of document.tracks || []) {
        const notes = [];
        const points = [];
        for (const part of track.parts || []) {
            for (const item of part.notes || []) {notes.push(note((part.pos + item.pos) * scale, item.duration * scale, item.number, item.lyric));}
            const bend = part.controllers?.find(value => value.name === "pitchBend")?.events || [];
            const ranges = part.controllers?.find(value => value.name === "pitchBendSens")?.events || [];
            for (const item of bend) {
                const range = ranges.filter(value => value.pos <= item.pos).at(-1)?.value ?? 2;
                points.push([(part.pos + item.pos) * scale, item.value / 8192 * range * 100]);
            }
        }
        points.sort((left, right) => left[0] - right[0]);
        if (notes.length) {addtrack(song, track.name || "voice", notes, 0, points.length ? [{abbr: "pitd", xs: points.map(point => point[0]), ys: points.map(point => point[1])}] : []);}
    }
    return song;
}

/*//////////////////////////////////////////////////////////////////////*/

export async function readproject(file, signal) {
    if (file.size > 64 * 1024 * 1024) {throw new Error("Choose a project smaller than 64 MB.");}
    const bytes = new Uint8Array(await file.arrayBuffer());
    const name = stem(file.name);
    let song;
    if (bytes[0] === 77 && bytes[1] === 84 && bytes[2] === 104 && bytes[3] === 100) {song = midi(bytes, name);}
    else if (/\.vpr$/i.test(file.name)) {
        const files = await entries([new File([bytes], "project.zip")], () => {}, signal);
        const found = [...files].find(([key]) => /sequence\.json$/i.test(key));
        if (!found) {throw new Error("This VPR does not contain a sequence.");}
        song = vpr(JSON.parse(decode(found[1])), name);
    } else {
        const text = decode(bytes).replace(/\0+$/, "").trim();
        if (text.startsWith("[#")) {song = ust(text, name);}
        else if (text.startsWith("<")) {song = xmlproject(text, name);}
        else {
            const document = load(text, {schema});
            if (document?.ustx_version !== undefined) {song = document;}
            else if (document?.project?.tracks) {song = ufdata(document, name);}
            else if (document?.tracks && document?.time && document?.version) {song = svp(document, name);}
            else {throw new Error("Unsupported project. Choose UST, USTX, SVP, VSQX, VPR, MIDI, MusicXML or UFData.");}
        }
    }
    song.name ||= name;
    song.resolution = Number(song.resolution) || 480;
    song.tempos ||= [{position: 0, bpm: Number(song.bpm) || 120}];
    if (!song.tempos.length) {song.tempos.push({position: 0, bpm: Number(song.bpm) || 120});}
    song.time_signatures = [...new Map((song.time_signatures?.length ? song.time_signatures : [{bar_position: 0, beat_per_bar: 4, beat_unit: 4}]).map(meter => [meter.bar_position, meter])).values()].sort((left, right) => left.bar_position - right.bar_position);
    song.bpm = Number(song.tempos[0].bpm);
    if (!Array.isArray(song.tracks) || !Array.isArray(song.voice_parts)) {throw new Error("The project has no vocal tracks.");}
    let count = 0;
    for (const part of song.voice_parts) {
        if (!song.tracks[part.track_no || 0]) {throw new Error("A vocal part points to a missing track.");}
        part.position = Number(part.position) || 0;
        for (const item of part.notes || []) {
            if (![item.position, item.duration, item.tone].every(Number.isFinite) || item.duration <= 0 || item.tone < 0 || item.tone > 127) {throw new Error("The project contains an invalid note.");}
            if (!silence.has(String(item.lyric || "").toLowerCase())) {count++;}
        }
    }
    if (!count) {throw new Error("The project has no sung notes.");}
    if (count > 30000) {throw new Error("Split projects with more than 30,000 notes into smaller files.");}
    if (song.tempos.some(tempo => !Number.isFinite(tempo.bpm) || tempo.bpm <= 0 || !Number.isFinite(tempo.position))) {throw new Error("The project contains an invalid tempo.");}
    return song;
}

export function serialize(song) {return dump(song, {noRefs: true, lineWidth: 120});}

export function timeline(song) {
    const changes = new Map([[0, song.bpm || 120]]);
    for (const tempo of song.tempos) {changes.set(tempo.position, tempo.bpm);}
    const ticks = [...changes.keys()].sort((left, right) => left - right);
    const seconds = [0];
    for (let index = 1; index < ticks.length; index++) {seconds.push(seconds.at(-1) + (ticks[index] - ticks[index - 1]) * 60 / changes.get(ticks[index - 1]) / song.resolution);}
    const clock = tick => {
        let index = ticks.findLastIndex(value => value <= tick);
        index = Math.max(0, index);
        return seconds[index] + (tick - ticks[index]) * 60 / changes.get(ticks[index]) / song.resolution;
    };
    clock.tick = moment => {
        let index = seconds.findLastIndex(value => value <= moment);
        index = Math.max(0, index);
        return ticks[index] + (moment - seconds[index]) * changes.get(ticks[index]) * song.resolution / 60;
    };
    return clock;
}
