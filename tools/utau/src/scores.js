import {blank,note,addtrack} from "./projects.js";
import {decode} from "./files.js";

/*//////////////////////////////////////////////////////////////////////*/

export function midi(bytes, name) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const resolution = view.getUint16(12);
    if (resolution & 0x8000 || !resolution) {throw new Error("Use a MIDI file with beat-based timing.");}
    const song = blank(name);
    const scale = 480 / resolution;
    const tempos = [];
    const meters = [];
    let cursor = 8 + view.getUint32(4);
    const variable = () => {
        let result = 0;
        for (let count = 0; count < 4; count++) {
            const byte = bytes[cursor++];
            result = result * 128 + (byte & 127);
            if (byte < 128) {return result;}
        }
        throw new Error("The MIDI file contains an invalid event length.");
    };
    while (cursor + 8 <= bytes.length) {
        const tag = String.fromCharCode(...bytes.subarray(cursor, cursor + 4));
        const end = cursor + 8 + view.getUint32(cursor + 4);
        cursor += 8;
        if (end > bytes.length) {throw new Error("This MIDI file is incomplete.");}
        if (tag !== "MTrk") {cursor = end; continue;}
        const active = new Map();
        const channels = new Map();
        const bends = new Map();
        const ranges = new Map();
        const parameters = new Map();
        let position = 0, running = 0, title = "voice", lyric = "a";
        while (cursor < end) {
            position += variable();
            let status = bytes[cursor++];
            if (status < 128) {cursor--; status = running;} else if (status < 240) {running = status;}
            if (!status) {throw new Error("The MIDI file has an invalid running status.");}
            if (status === 255) {
                const type = bytes[cursor++];
                const length = variable();
                const data = bytes.subarray(cursor, cursor + length);
                if (type === 81 && length === 3) {tempos.push({position: position * scale, bpm: 60000000 / (data[0] * 65536 + data[1] * 256 + data[2])});}
                if (type === 3) {title = decode(data);}
                if (type === 5) {lyric = decode(data);}
                if (type === 88 && length >= 2) {meters.push({position: position * scale, numerator: data[0], denominator: 2 ** data[1]});}
                cursor += length;
            } else if (status === 240 || status === 247) {const length = variable(); cursor += length;}
            else {
                const kind = status >> 4;
                const channel = status & 15;
                const first = bytes[cursor++];
                const second = kind === 12 || kind === 13 ? 0 : bytes[cursor++];
                const key = channel + ":" + first;
                if (kind === 9 && second > 0 && channel !== 9) {active.set(key, {position, lyric}); lyric = "a";}
                else if (kind === 8 || kind === 9 && second === 0) {
                    const start = active.get(key);
                    if (start && position > start.position) {
                        if (!channels.has(channel)) {channels.set(channel, []);}
                        channels.get(channel).push(note(start.position * scale, (position - start.position) * scale, first, start.lyric));
                        active.delete(key);
                    }
                } else if (kind === 14) {
                    if (!bends.has(channel)) {bends.set(channel, []);}
                    bends.get(channel).push([position * scale, ((second << 7 | first) - 8192) / 8192 * (ranges.get(channel) ?? 2) * 100]);
                } else if (kind === 11) {
                    const parameter = parameters.get(channel) || [127, 127];
                    if (first === 101) {parameter[0] = second;}
                    if (first === 100) {parameter[1] = second;}
                    parameters.set(channel, parameter);
                    if (first === 6 && parameter[0] === 0 && parameter[1] === 0) {ranges.set(channel, second);}
                }
            }
        }
        for (const [channel, notes] of channels) {
            const points = bends.get(channel) || [];
            addtrack(song, title + (channels.size > 1 ? " " + (channel + 1) : ""), notes.sort((left, right) => left.position - right.position), 0, points.length ? [{abbr: "pitd", xs: points.map(point => point[0]), ys: points.map(point => point[1])}] : []);
        }
    }
    if (tempos.length) {song.tempos = tempos; song.bpm = tempos[0].bpm;}
    if (meters.length) {
        meters.sort((left, right) => left.position - right.position);
        let measure = 0, position = 0, length = 1920;
        song.time_signatures = meters.map(meter => {
            measure += (meter.position - position) / length;
            position = meter.position;
            length = meter.numerator * 1920 / meter.denominator;
            return {bar_position: Math.round(measure), beat_per_bar: meter.numerator, beat_unit: meter.denominator};
        });
    }
    return song;
}

const children = (element, name) => [...element.children].filter(child => child.localName === name);
const child = (element, name) => children(element, name)[0];
const text = (element, name, fallback = "") => child(element, name)?.textContent || fallback;
const value = (element, names, fallback = 0) => {
    for (const name of names) {const found = text(element, name); if (found !== "") {return Number(found);}}
    return fallback;
};

export function xmlproject(source, name) {
    const document = new DOMParser().parseFromString(source, "text/xml");
    if (document.querySelector("parsererror")) {throw new Error("The XML project could not be parsed.");}
    const root = document.documentElement;
    const song = blank(name);
    const all = name => [...document.getElementsByTagNameNS("*", name)];
    if (/^vsq[34]$/.test(root.localName)) {
        const master = all("masterTrack")[0];
        if (!master) {throw new Error("The VSQX master track is missing.");}
        const resolution = value(master, ["resolution"], 480);
        const scale = 480 / resolution;
        const premeasure = value(master, ["preMeasure"], 0);
        const meters = children(master, "timeSig").map(item => ({bar: value(item, ["posMes", "m"]), numerator: value(item, ["nume", "nu"], 4), denominator: value(item, ["denomi", "de"], 4)})).sort((left, right) => left.bar - right.bar);
        let prefix = 0;
        for (let measure = 0; measure < premeasure; measure++) {const meter = meters.filter(item => item.bar <= measure).at(-1) || {numerator: 4, denominator: 4}; prefix += meter.numerator * 1920 / meter.denominator;}
        song.time_signatures = meters.map(meter => ({bar_position: Math.max(0, meter.bar - premeasure), beat_per_bar: meter.numerator, beat_unit: meter.denominator}));
        song.tempos = children(master, "tempo").map(item => ({position: Math.max(0, value(item, ["posTick", "t"]) * scale - prefix), bpm: value(item, ["bpm", "v"], 12000) / 100}));
        for (const track of all("vsTrack")) {
            const notes = [];
            const points = [];
            for (const part of [...children(track, "musicalPart"), ...children(track, "vsPart")]) {
                const start = value(part, ["posTick", "t"]) * scale - prefix;
                for (const item of children(part, "note")) {
                    notes.push(note(Math.max(0, start + value(item, ["posTick", "t"]) * scale), value(item, ["durTick", "dur"]) * scale, value(item, ["noteNum", "n"]), text(item, "lyric", text(item, "y", "a"))));
                }
                const controls = [...children(part, "mCtrl"), ...children(part, "cc")].map(item => {
                    const setting = child(item, "attr") || child(item, "v");
                    return {position: value(item, ["posTick", "t"]) * scale, name: setting?.getAttribute("id"), value: Number(setting?.textContent) || 0};
                }).sort((left, right) => left.position - right.position);
                for (const item of controls.filter(value => ["PIT", "P"].includes(value.name))) {
                    const range = controls.filter(value => ["PBS", "S"].includes(value.name) && value.position <= item.position).at(-1)?.value ?? 2;
                    points.push([Math.max(0, start + item.position), item.value / 8192 * range * 100]);
                }
            }
            points.sort((left, right) => left[0] - right[0]);
            if (notes.length) {addtrack(song, text(track, "trackName", text(track, "name", "voice")), notes, 0, points.length ? [{abbr: "pitd", xs: points.map(point => point[0]), ys: points.map(point => point[1])}] : []);}
        }
    } else if (root.localName === "score-partwise") {
        for (const part of children(root, "part")) {
            let cursor = 0, divisions = 1, previous = 0, measurecount = 0;
            const notes = [];
            for (const measure of children(part, "measure")) {
                for (const item of measure.children) {
                    if (item.localName === "attributes") {
                        divisions = value(item, ["divisions"], divisions);
                        const meter = child(item, "time");
                        if (meter) {song.time_signatures.push({bar_position: measurecount, beat_per_bar: value(meter, ["beats"], 4), beat_unit: value(meter, ["beat-type"], 4)});}
                    }
                    if (item.localName === "direction") {
                        const sound = [...item.getElementsByTagName("sound")].find(element => element.hasAttribute("tempo"));
                        if (sound) {song.tempos.push({position: cursor, bpm: Number(sound.getAttribute("tempo"))});}
                    }
                    if (item.localName === "backup") {cursor -= value(item, ["duration"]) * 480 / divisions;}
                    if (item.localName === "forward") {cursor += value(item, ["duration"]) * 480 / divisions;}
                    if (item.localName !== "note") {continue;}
                    const duration = value(item, ["duration"]) * 480 / divisions;
                    const start = child(item, "chord") ? previous : cursor;
                    const pitch = child(item, "pitch");
                    if (pitch && duration > 0) {
                        const tone = (value(pitch, ["octave"], 4) + 1) * 12 + ({C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[text(pitch, "step")] || 0) + value(pitch, ["alter"]);
                        const lyric = child(item, "lyric");
                        const tie = children(item, "tie").some(value => value.getAttribute("type") === "stop");
                        const previousnote = notes.findLast(value => value.tone === tone && value.position + value.duration === start);
                        if (tie && previousnote) {previousnote.duration += duration;}
                        else {notes.push(note(start, duration, tone, lyric ? text(lyric, "text", "a") : "a"));}
                    }
                    if (!child(item, "chord")) {previous = cursor; cursor += duration;}
                }
                measurecount++;
            }
            if (notes.length) {addtrack(song, part.getAttribute("id") || "voice", notes);}
        }
    } else {throw new Error("Choose a VSQX or uncompressed MusicXML score.");}
    return song;
}
