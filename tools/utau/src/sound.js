/*//////////////////////////////////////////////////////////////////////*/

export function wav(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const word = offset => String.fromCharCode(...bytes.subarray(offset, offset + 4));
    if (word(0) !== "RIFF" || word(8) !== "WAVE") {throw new Error("A voicebank sample is not a PCM WAV file.");}
    let format, content;
    for (let cursor = 12; cursor + 8 <= bytes.length;) {
        const size = view.getUint32(cursor + 4, true);
        const start = cursor + 8;
        if (start + size > bytes.length) {throw new Error("A WAV sample is incomplete.");}
        if (word(cursor) === "fmt ") {
            let code = view.getUint16(start, true);
            if (code === 65534 && size >= 40) {code = view.getUint16(start + 24, true);}
            format = {code, channels: view.getUint16(start + 2, true), rate: view.getUint32(start + 4, true), block: view.getUint16(start + 12, true), bits: view.getUint16(start + 14, true)};
        }
        if (word(cursor) === "data") {content = {start, size};}
        cursor = start + size + (size & 1);
    }
    if (!format || !content || ![1, 3].includes(format.code) || !(format.code === 3 ? [32, 64] : [8, 16, 24, 32]).includes(format.bits) || format.channels < 1 || format.channels > 32 || format.rate < 8000 || !format.block) {throw new Error("Use uncompressed PCM or float WAV voicebank samples.");}
    const samples = new Float32Array(Math.floor(content.size / format.block));
    const step = format.bits / 8;
    for (let index = 0; index < samples.length; index++) {
        let value = 0;
        for (let channel = 0; channel < format.channels; channel++) {
            const offset = content.start + index * format.block + channel * step;
            if (format.code === 3) {value += format.bits === 64 ? view.getFloat64(offset, true) : view.getFloat32(offset, true);}
            else if (format.bits === 8) {value += (view.getUint8(offset) - 128) / 128;}
            else if (format.bits === 16) {value += view.getInt16(offset, true) / 32768;}
            else if (format.bits === 24) {let number = bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16; if (number & 0x800000) {number -= 0x1000000;} value += number / 8388608;}
            else {value += view.getInt32(offset, true) / 2147483648;}
        }
        samples[index] = Number.isFinite(value) ? value / format.channels : 0;
    }
    return {samples, rate: format.rate};
}

function localpitch(samples, rate, center) {
    const stride = Math.max(1, Math.round(rate / 11025));
    const local = rate / stride;
    const size = 512;
    const section = new Float32Array(size);
    let mean = 0;
    for (let index = 0; index < size; index++) {section[index] = samples[Math.max(0, Math.min(samples.length - 1, center + (index - size / 2) * stride))] || 0; mean += section[index];}
    mean /= size;
    let energy = 0;
    for (let index = 0; index < size; index++) {section[index] -= mean; energy += section[index] ** 2;}
    if (energy / size < 0.000004) {return 0;}
    const first = Math.max(4, Math.floor(local / 1400));
    const last = Math.min(size / 2, Math.ceil(local / 65));
    const scores = new Float32Array(last + 1);
    let best = 0;
    for (let lag = first; lag <= last; lag++) {
        let dot = 0, left = 0, right = 0;
        for (let index = 0; index < size - lag; index++) {const a = section[index], b = section[index + lag]; dot += a * b; left += a * a; right += b * b;}
        scores[lag] = dot / Math.max(0.000000001, Math.sqrt(left * right));
        best = Math.max(best, scores[lag]);
    }
    if (best < 0.55) {return 0;}
    for (let lag = first + 1; lag < last; lag++) {
        if (scores[lag] >= scores[lag - 1] && scores[lag] > scores[lag + 1] && scores[lag] > Math.max(0.55, best * 0.94)) {
            const denominator = scores[lag - 1] - 2 * scores[lag] + scores[lag + 1];
            const delta = denominator ? 0.5 * (scores[lag - 1] - scores[lag + 1]) / denominator : 0;
            return local / (lag + delta);
        }
    }
    return 0;
}

function linear(samples, position) {
    const left = Math.floor(position);
    if (left < 0 || left + 1 >= samples.length) {return 0;}
    const blend = position - left;
    return samples[left] * (1 - blend) + samples[left + 1] * blend;
}

export function analyze(bytes, frq) {
    const decoded = wav(bytes);
    const samples = decoded.samples;
    const rate = decoded.rate;
    let frequencies, hop, average;
    if (frq?.length >= 40 && String.fromCharCode(...frq.subarray(0, 8)) === "FREQ0003") {
        const view = new DataView(frq.buffer, frq.byteOffset, frq.byteLength);
        hop = view.getInt32(8, true);
        average = view.getFloat64(12, true);
        const count = view.getInt32(36, true);
        if (hop > 0 && count > 0 && count < 1000000 && frq.length >= 40 + count * 16) {
            frequencies = Float32Array.from({length: count}, (_, index) => {
                const value = view.getFloat64(40 + index * 16, true);
                return value >= 50 && value <= 2000 ? value : 0;
            });
        }
    }
    if (!frequencies) {
        hop = Math.round(rate * 0.015);
        frequencies = Float32Array.from({length: Math.ceil(samples.length / hop)}, (_, index) => localpitch(samples, rate, index * hop));
    }
    const positive = [...frequencies].filter(value => value > 60 && value < 1600).sort((left, right) => left - right);
    average = positive[Math.floor(positive.length / 2)] || (average > 60 && average < 1600 ? average : 220);
    const frequency = position => {
        const point = Math.max(0, Math.min(frequencies.length - 1, position / hop));
        const left = Math.floor(point), right = Math.min(frequencies.length - 1, left + 1);
        if (frequencies[left] < 50 || frequencies[right] < 50) {return 0;}
        return frequencies[left] + (frequencies[right] - frequencies[left]) * (point - left);
    };
    const marks = [];
    let current = 0;
    while (current < samples.length - 2) {
        const period = rate / (frequency(current) || average);
        const predicted = current + period;
        let peak = Math.round(predicted), value = -Infinity;
        const radius = Math.max(1, Math.floor(period * 0.2));
        for (let index = Math.max(Math.round(current + period * 0.65), peak - radius); index < Math.min(samples.length - 1, predicted + radius); index++) {
            if (samples[index] > value) {value = samples[index]; peak = index;}
        }
        if (peak <= current) {peak = Math.round(current + period);}
        marks.push(peak);
        current = peak;
    }
    return {samples, rate, frequencies, hop, average, frequency, marks};
}

function nearest(values, value) {
    let low = 0, high = values.length - 1;
    while (high - low > 1) {const middle = low + high >> 1; if (values[middle] < value) {low = middle;} else {high = middle;}}
    return Math.abs(values[low] - value) < Math.abs(values[high] - value) ? values[low] : values[high];
}

const windowing = Float32Array.from({length: 4097}, (_, index) => 0.5 + 0.5 * Math.cos(index / 4096 * Math.PI));

export function synthesize(source, group, rate) {
    const row = group.row;
    const begins = Math.max(0, row.offset / 1000 * source.rate);
    const ends = Math.min(source.samples.length - 2, row.cutoff < 0 ? begins - row.cutoff / 1000 * source.rate : source.samples.length - row.cutoff / 1000 * source.rate);
    if (ends <= begins + 8) {throw new Error("Invalid sample timing for " + row.alias);}
    const period = source.rate / source.average;
    const fixed = Math.max(0, Math.min(row.consonant / 1000 * source.rate, ends - begins - Math.min(4 * period, (ends - begins) * 0.45)));
    let vowelend = ends;
    for (let position = ends - 1; position > begins + fixed + period * 2 && position > ends - source.rate * 0.07; position -= source.hop / 2) {
        if (source.frequency(position) > 50) {vowelend = Math.min(ends, position + period); break;}
    }
    const count = Math.ceil((group.end - group.begins) * rate);
    const output = new Float32Array(count);
    const weights = new Float32Array(count);
    const fixedtime = fixed / source.rate;
    const duration = count / rate;
    const tail = Math.min((ends - vowelend) / source.rate, duration * 0.15);
    let center = 0;
    while (center < count) {
        const time = center / rate;
        let position;
        if (time < fixedtime) {position = begins + time * source.rate;}
        else if (tail > 0 && time > duration - tail) {position = vowelend + (time - duration + tail) / tail * (ends - vowelend);}
        else {position = begins + fixed + Math.max(0, Math.min(1, (time - fixedtime) / Math.max(0.001, duration - tail - fixedtime))) * (vowelend - begins - fixed);}
        const frame = Math.max(0, Math.min(group.pitches.length - 1, time / 0.005));
        const left = Math.floor(frame), right = Math.min(group.pitches.length - 1, left + 1);
        const cents = group.pitches[left] + (group.pitches[right] - group.pitches[left]) * (frame - left);
        const frequency = Math.max(8, Math.min(rate * 0.45, 440 * 2 ** ((cents - 6900) / 1200)));
        const voiced = source.frequency(position);
        const step = voiced ? rate / frequency : rate * 0.006;
        const half = voiced ? Math.max(rate / voiced * 1.05, step * 1.05) : rate * 0.012;
        const mark = voiced && source.marks.length ? nearest(source.marks, position) : position;
        const first = Math.max(0, Math.ceil(center - half));
        const last = Math.min(count - 1, Math.floor(center + half));
        for (let index = first; index <= last; index++) {
            const delta = index - center;
            const weight = windowing[Math.min(4096, Math.round(Math.abs(delta) / half * 4096))];
            const value = linear(source.samples, mark + delta * source.rate / rate);
            output[index] += value * weight;
            weights[index] += weight;
        }
        center += Math.max(1, step);
    }
    let energy = 0, voicedcount = 0;
    for (let index = 0; index < count; index++) {
        output[index] /= Math.max(0.01, weights[index]);
        if (index > Math.max(fixedtime, (group.start - group.begins)) * rate) {energy += output[index] ** 2; voicedcount++;}
    }
    const rms = Math.sqrt(energy / Math.max(1, voicedcount));
    if (rms < 0.0001) {throw new Error("The selected region of " + row.alias + " is silent.");}
    const gain = Math.min(8, 0.15 / rms);
    const attack = Math.max(1, Math.min(rate * 0.01, count / 4));
    const release = Math.max(1, Math.min(rate * 0.015, count / 4));
    for (let index = 0; index < count; index++) {
        const frame = Math.min(group.gains.length - 1, Math.floor(index / rate / 0.005));
        output[index] *= gain * group.gains[frame] * Math.min(1, index / attack, (count - 1 - index) / release);
    }
    return output;
}

export function waveblob(samples, rate = 44100) {
    const bytes = new Uint8Array(44 + samples.length * 2);
    const view = new DataView(bytes.buffer);
    const label = (offset, value) => {for (let index = 0; index < value.length; index++) {bytes[offset + index] = value.charCodeAt(index);}};
    label(0, "RIFF"); view.setUint32(4, bytes.length - 8, true); label(8, "WAVEfmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    label(36, "data"); view.setUint32(40, samples.length * 2, true);
    for (let index = 0; index < samples.length; index++) {view.setInt16(44 + index * 2, Math.round(Math.max(-1, Math.min(1, samples[index])) * 32767), true);}
    return new Blob([bytes], {type: "audio/wav"});
}
