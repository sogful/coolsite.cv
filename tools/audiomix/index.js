const sourcefile = document.querySelector(".sourcefile");
const targetfile = document.querySelector(".targetfile");
const sourcedrop = document.querySelector(".sourcedrop");
const targetdrop = document.querySelector(".targetdrop");
const sourcemeta = document.querySelector(".sourcemeta");
const targetmeta = document.querySelector(".targetmeta");
const sourcewave = document.querySelector(".sourcewave");
const targetwave = document.querySelector(".targetwave");
const sourceplayer = document.querySelector(".sourceplayer");
const targetplayer = document.querySelector(".targetplayer");
const sourcefilename = document.querySelector(".sourcefilename");
const targetfilename = document.querySelector(".targetfilename");
const sourcedetail = document.querySelector(".sourcedetail");
const targetdetail = document.querySelector(".targetdetail");

const clearsource = document.querySelector(".clearsource");
const cleartarget = document.querySelector(".cleartarget");

const framelength = document.querySelector(".framelength");
const overlap = document.querySelector(".overlap");
const frequencyfocus = document.querySelector(".frequencyfocus");
const repeatavoid = document.querySelector(".repeatavoid");
const smoothness = document.querySelector(".smoothness");
const quality = document.querySelector(".quality");
const matchloudness = document.querySelector(".matchloudness");
const framereadout = document.querySelector(".framereadout");
const overlapreadout = document.querySelector(".overlapreadout");
const focusreadout = document.querySelector(".focusreadout");
const repeatsreadout = document.querySelector(".repeatsreadout");
const smoothreadout = document.querySelector(".smoothreadout");
const mixbutton = document.querySelector(".mixbutton");
const cancelbutton = document.querySelector(".cancelbutton");
const statusline = document.querySelector(".status");
const progress = document.querySelector(".progress");

const result = document.querySelector(".result");
const resultwave = document.querySelector(".resultwave");
const resultplayer = document.querySelector(".resultplayer");

const downloadbutton = document.querySelector(".downloadbutton");

let sourceaudio = null;
let targetaudio = null;
let sourceurl = null;
let targeturl = null;
let resulturl = null;
let resultsamples = null;
let cancelrequested = false;
let generating = false;

let audioctx = null;

/*//////////////////////////////////////////////////////////////////////*/

function formatduration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
}

function setstatus(message) {
    const visible = generating && Boolean(message);
    statusline.textContent = visible ? message : "";
    sethidden(statusline, !visible);
}

function sethidden(element, value) {
    element.hidden = value;
    element.classList.toggle("hidden", value);
}

function clearresult() {
    sethidden(result, true);
    resultplayer.removeAttribute("src");
    resultplayer.load();
    downloadbutton.removeAttribute("href");
    if (resulturl) URL.revokeObjectURL(resulturl);
    resulturl = null;
    resultsamples = null;
}

function synccontrols() {
    mixbutton.disabled = !sourceaudio || !targetaudio || progress.hidden === false;
}

function makewave(canvas, samples) {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * scale));
    const height = Math.max(1, Math.floor(rect.height * scale));
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "#000000";
    context.lineWidth = Math.max(1, scale);
    context.beginPath();
    const bins = Math.floor(width / Math.max(2, scale * 2));
    const middle = height / 2;
    const stride = Math.max(1, Math.floor(samples.length / bins));
    for (let bin = 0; bin < bins; bin += 1) {
        const start = bin * stride;
        const end = Math.min(samples.length, start + stride);
        let peak = 0;
        for (let index = start; index < end; index += 1) {
            peak = Math.max(peak, Math.abs(samples[index]));
        }
        const x = bin * width / bins;
        const extent = Math.max(1, peak * middle * 0.9);
        context.moveTo(x, middle - extent);
        context.lineTo(x, middle + extent);
    }
    context.stroke();
}

function downmix(buffer) {
    const length = buffer.length;
    const channels = buffer.numberOfChannels;
    const samples = new Float32Array(length);
    for (let channel = 0; channel < channels; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let index = 0; index < length; index += 1) {
            samples[index] += data[index] / channels;
        }
    }
    return samples;
}

function resample(samples, fromrate, torate) {
    if (fromrate === torate) return samples;
    const length = Math.max(1, Math.round(samples.length * torate / fromrate));
    const converted = new Float32Array(length);
    const ratio = fromrate / torate;
    for (let index = 0; index < length; index += 1) {
        const position = index * ratio;
        const first = Math.floor(position);
        const second = Math.min(samples.length - 1, first + 1);
        const fraction = position - first;
        converted[index] = samples[first] * (1 - fraction) + samples[second] * fraction;
    }
    return converted;
}

async function loadaudio(file, kind) {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(wav|mp3|m4a|aac|ogg|opus|flac|weba|aif|aiff)$/i.test(file.name)) {
        setstatus("choose an audio file supported by this browser!");
        return;
    }
    setstatus(`reading ${file.name}..`);
    try {
        if (!audioctx) audioctx = new AudioContext();
        if (audioctx.state === "suspended") await audioctx.resume();
        const buffer = await audioctx.decodeAudioData(await file.arrayBuffer());
        const mono = downmix(buffer);
        const audio = {file, buffer, mono};
        if (kind === "source") {
            if (sourceurl) URL.revokeObjectURL(sourceurl);
            sourceaudio = audio;
            sourceurl = URL.createObjectURL(file);
            sourceplayer.src = sourceurl;
            sourcefilename.textContent = file.name;
            sourcedetail.textContent = `${formatduration(buffer.duration)}, ${buffer.sampleRate.toLocaleString()} Hz, ${buffer.numberOfChannels} ch`;
            sethidden(sourcemeta, false);
            sethidden(sourcedrop, true);
            makewave(sourcewave, mono);
        } else {
            if (targeturl) URL.revokeObjectURL(targeturl);
            targetaudio = audio;
            targeturl = URL.createObjectURL(file);
            targetplayer.src = targeturl;
            targetfilename.textContent = file.name;
            targetdetail.textContent = `${formatduration(buffer.duration)}, ${buffer.sampleRate.toLocaleString()} Hz, ${buffer.numberOfChannels} ch`;
            sethidden(targetmeta, false);
            sethidden(targetdrop, true);
            makewave(targetwave, mono);
        }
        clearresult();
        setstatus(sourceaudio && targetaudio ? "files ready!" : "also choose the other file");
        synccontrols();
    } catch (error) {
        setstatus(`could not decode ${file.name} :(`);
    }
}

function cleartrack(kind) {
    if (kind === "source") {
        sourceaudio = null;
        if (sourceurl) URL.revokeObjectURL(sourceurl);
        sourceurl = null;
        sourceplayer.removeAttribute("src");
        sourceplayer.load();
        sourcefile.value = "";
        sethidden(sourcemeta, true);
        sethidden(sourcedrop, false);
    } else {
        targetaudio = null;
        if (targeturl) URL.revokeObjectURL(targeturl);
        targeturl = null;
        targetplayer.removeAttribute("src");
        targetplayer.load();
        targetfile.value = "";
        sethidden(targetmeta, true);
        sethidden(targetdrop, false);
    }
    clearresult();
    setstatus("choose two audio files to begin!");
    synccontrols();
}

function wiredrop(zone, input, kind) {
    input.addEventListener("change", () => loadaudio(input.files[0], kind));
    zone.addEventListener("dragover", event => {
        event.preventDefault();
        zone.classList.add("over");
    });
    zone.addEventListener("dragleave", event => {
        if (!zone.contains(event.relatedTarget)) zone.classList.remove("over");
    });
    zone.addEventListener("drop", event => {
        event.preventDefault();
        zone.classList.remove("over");
        loadaudio(event.dataTransfer.files[0], kind);
    });
}

wiredrop(sourcedrop, sourcefile, "source");
wiredrop(targetdrop, targetfile, "target");
clearsource.addEventListener("click", () => cleartrack("source"));
cleartarget.addEventListener("click", () => cleartrack("target"));

/*//////////////////////////////////////////////////////////////////////*/

function syncsettings() {
    framereadout.textContent = `${framelength.value} ms`;
    overlapreadout.textContent = `${overlap.value}%`;
    const focus = Number(frequencyfocus.value);
    focusreadout.textContent = focus === 0 ? "Neutral" : focus < 0 ? `${Math.abs(focus)}% low` : `${focus}% high`;
    repeatsreadout.textContent = Number(repeatavoid.value) === 0 ? "Off" : `${repeatavoid.value}%`;
    smoothreadout.textContent = Number(smoothness.value) === 0 ? "Off" : `${smoothness.value}%`;
}

[framelength, overlap, frequencyfocus, repeatavoid, smoothness].forEach(control => {
    control.addEventListener("input", syncsettings);
});

syncsettings();

function makewindow(length) {
    const windowdata = new Float32Array(length);
    for (let index = 0; index < length; index += 1) {
        windowdata[index] = 0.5 - 0.5 * Math.cos(2 * Math.PI * index / Math.max(1, length - 1));
    }
    return windowdata;
}

function makebands(spectrallength, width) {
    const points = [0];
    let position = 2;
    while (Math.floor(position) < spectrallength) {
        const point = Math.floor(position);
        if (point > points[points.length - 1]) points.push(point);
        position *= width;
    }
    const bands = [];
    for (let index = 0; index < points.length; index += 1) {
        bands.push([points[index], points[index + 1] || spectrallength]);
    }
    return bands;
}

function reversebits(value, bits) {
    let reversed = 0;
    for (let index = 0; index < bits; index += 1) {
        reversed = (reversed << 1) | (value & 1);
        value >>>= 1;
    }
    return reversed;
}

function makereversal(size) {
    let bits = 0;
    for (let value = size; value > 1; value >>>= 1) bits += 1;
    const reversal = new Uint32Array(size);
    for (let index = 0; index < size; index += 1) reversal[index] = reversebits(index, bits);
    return reversal;
}

function fft(real, imaginary, reversal) {
    const size = real.length;
    for (let index = 0; index < size; index += 1) {
        const reversed = reversal[index];
        if (reversed > index) {
            const realvalue = real[index];
            const imaginaryvalue = imaginary[index];
            real[index] = real[reversed];
            imaginary[index] = imaginary[reversed];
            real[reversed] = realvalue;
            imaginary[reversed] = imaginaryvalue;
        }
    }
    for (let span = 2; span <= size; span *= 2) {
        const half = span / 2;
        const angle = -2 * Math.PI / span;
        const stepreal = Math.cos(angle);
        const stepimaginary = Math.sin(angle);
        for (let start = 0; start < size; start += span) {
            let factorreal = 1;
            let factorimaginary = 0;
            for (let offset = 0; offset < half; offset += 1) {
                const even = start + offset;
                const odd = even + half;
                const oddreal = real[odd] * factorreal - imaginary[odd] * factorimaginary;
                const oddimaginary = real[odd] * factorimaginary + imaginary[odd] * factorreal;
                const evenreal = real[even];
                const evenimaginary = imaginary[even];
                real[even] = evenreal + oddreal;
                imaginary[even] = evenimaginary + oddimaginary;
                real[odd] = evenreal - oddreal;
                imaginary[odd] = evenimaginary - oddimaginary;
                const nextreal = factorreal * stepreal - factorimaginary * stepimaginary;
                factorimaginary = factorreal * stepimaginary + factorimaginary * stepreal;
                factorreal = nextreal;
            }
        }
    }
}

function nextpoweroftwo(value) {
    let size = 1;
    while (size < value) size *= 2;
    return size;
}

async function makefeatures(samples, settings, label, tracker) {
    const hop = Math.max(1, Math.round(settings.rate * settings.frame / 1000));
    const samplecount = Math.ceil(hop / (1 - settings.overlap));
    const windowlength = Math.max(2, samplecount);
    const fftsize = nextpoweroftwo(windowlength);
    const reversal = makereversal(fftsize);
    const windowdata = makewindow(windowlength);
    const bands = makebands(fftsize / 2 - 1, 1.2);
    const frames = label === "carrier" ? Math.max(1, Math.floor((samples.length - windowlength) / hop) + 1) : Math.max(1, Math.ceil(samples.length / hop));
    const vectors = new Array(frames);
    const real = new Float32Array(fftsize);
    const imaginary = new Float32Array(fftsize);
    const batch = 8;
    for (let frameindex = 0; frameindex < frames; frameindex += 1) {
        if (cancelrequested) throw new Error("cancelled");
        real.fill(0);
        imaginary.fill(0);
        const start = frameindex * hop;
        let square = 0;
        for (let index = 0; index < windowlength; index += 1) {
            const sample = samples[start + index] || 0;
            const weighted = sample * windowdata[index];
            real[index] = weighted;
            square += weighted * weighted;
        }
        fft(real, imaginary, reversal);
        const vector = new Float32Array(bands.length);
        let norm = 0;
        for (let bandindex = 0; bandindex < bands.length; bandindex += 1) {
            const band = bands[bandindex];
            let total = 0;
            for (let bin = band[0]; bin < band[1]; bin += 1) {
                const frequencybin = bin + 1;
                total += Math.hypot(real[frequencybin], imaginary[frequencybin]);
            }
            const middle = (band[0] + band[1]) / 2 / (fftsize / 2);
            const tilt = settings.focus / 100;
            const spectralweight = 1 + tilt * (middle * 2 - 1) * 0.8;
            const value = total / (band[1] - band[0]) * spectralweight;
            vector[bandindex] = value;
            norm += value * value;
        }
        norm = Math.max(1e-8, Math.sqrt(norm));
        for (let bandindex = 0; bandindex < vector.length; bandindex += 1) vector[bandindex] /= norm;
        vectors[frameindex] = {vector, square, start};
        if ((frameindex + 1) % batch === 0 || frameindex + 1 === frames) {
            const portion = (frameindex + 1) / frames;
            tracker(label, portion);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    return {vectors, hop, windowdata, windowlength};
}

/*//////////////////////////////////////////////////////////////////////*/

function checkcancel() {
    if (cancelrequested) throw new Error("cancelled");
}

async function findmatches(carrier, target, settings) {
    const matches = new Uint32Array(target.vectors.length);
    const usage = new Uint32Array(carrier.vectors.length);
    const reuseweight = settings.reuse / 100 * 0.35;
    const smoothweight = settings.smooth / 100 * 0.2;
    let previous = -1;
    for (let frameindex = 0; frameindex < target.vectors.length; frameindex += 1) {
        checkcancel();
        const targetvector = target.vectors[frameindex].vector;
        let bestscore = -Infinity;
        let bestindex = 0;
        for (let carrierindex = 0; carrierindex < carrier.vectors.length; carrierindex += 1) {
            const carriervector = carrier.vectors[carrierindex].vector;
            let score = 0;
            for (let bandindex = 0; bandindex < targetvector.length; bandindex += 1) {
                score += targetvector[bandindex] * carriervector[bandindex];
            }
            if (reuseweight > 0) score -= reuseweight * Math.min(1, usage[carrierindex] / 4);
            if (smoothweight > 0 && previous >= 0) {
                score -= smoothweight * Math.abs(carrierindex - previous) / carrier.vectors.length;
            }
            if (score > bestscore) {
                bestscore = score;
                bestindex = carrierindex;
            }
        }
        matches[frameindex] = bestindex;
        usage[bestindex] += 1;
        previous = bestindex;
        if ((frameindex + 1) % 12 === 0 || frameindex + 1 === target.vectors.length) {
            updateprogress(50 + (frameindex + 1) / target.vectors.length * 30, `matching slices ${frameindex + 1}/${target.vectors.length}..`);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    return matches;
}

function updateprogress(value, message) {
    progress.value = Math.min(100, value);
    setstatus(message);
}

async function buildoutput(carrier, target, matches, loudness, sourcesamples, targetsamples) {
    const output = new Float32Array(targetsamples.length);
    for (let frameindex = 0; frameindex < matches.length; frameindex += 1) {
        const sourceframe = carrier.vectors[matches[frameindex]];
        const targetframe = target.vectors[frameindex];
        const gain = loudness && sourceframe.square > 1e-12 ? Math.sqrt(targetframe.square / sourceframe.square) : 1;
        for (let offset = 0; offset < target.windowlength; offset += 1) {
            const outputindex = targetframe.start + offset;
            if (outputindex >= output.length) break;
            const sourceindex = sourceframe.start + offset;
            const sample = sourceindex < sourcesamples.length ? sourcesamples[sourceindex] : 0;
            output[outputindex] += sample * target.windowdata[offset] * gain;
        }
        if ((frameindex + 1) % 16 === 0 || frameindex + 1 === matches.length) {
            updateprogress(80 + (frameindex + 1) / matches.length * 15, `building audio ${frameindex + 1} of ${matches.length}..`);
            await new Promise(resolve => setTimeout(resolve, 0));
            checkcancel();
        }
    }
    let peak = 0;
    for (let index = 0; index < output.length; index += 1) peak = Math.max(peak, Math.abs(output[index]));
    if (peak > 0.98) {
        const scale = 0.98 / peak;
        for (let index = 0; index < output.length; index += 1) output[index] *= scale;
    }
    return output;
}

function makewav(samples, samplerate) {
    const bytes = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(bytes);
    const write = (offset, value) => {
        for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
    };
    write(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, samplerate, true);
    view.setUint32(28, samplerate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (let index = 0; index < samples.length; index += 1) {
        const sample = Math.max(-1, Math.min(1, samples[index]));
        view.setInt16(44 + index * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
    }
    return new Blob([bytes], {type: "audio/wav"});
}

function cleanname(name) {
    return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "mix";
}

async function domix() {
    if (!sourceaudio || !targetaudio) return;
    cancelrequested = false;
    generating = true;
    mixbutton.disabled = true;

    sethidden(cancelbutton, false);
    sethidden(progress, false);
    progress.value = 0;
    setstatus("preparing..");
    clearresult();

    const sourcefiledata = sourceaudio;
    const targetfiledata = targetaudio;
    const rate = Number(quality.value);
    const loudness = matchloudness.checked;

    const settings = {
        rate,
        frame: Number(framelength.value),
        overlap: Number(overlap.value) / 100,
        focus: Number(frequencyfocus.value),
        reuse: Number(repeatavoid.value),
        smooth: Number(smoothness.value)
    };
    const tracker = (label, portion) => updateprogress(portion * 20 + (label === "carrier" ? 0 : 20), `analyzing ${label} ~ ${Math.round(portion * 100)}%`);
    try {
        const source = resample(sourcefiledata.mono, sourcefiledata.buffer.sampleRate, rate);
        const target = resample(targetfiledata.mono, targetfiledata.buffer.sampleRate, rate);
        const carrierdata = await makefeatures(source, settings, "carrier", tracker);
        const targetdata = await makefeatures(target, settings, "target", tracker);
        updateprogress(50, "comparing spectra..");
        const matches = await findmatches(carrierdata, targetdata, settings);
        checkcancel();
        const samples = await buildoutput(carrierdata, targetdata, matches, loudness, source, target);
        const wav = makewav(samples, rate);
        if (resulturl) URL.revokeObjectURL(resulturl);
        
        resulturl = URL.createObjectURL(wav);
        resultsamples = samples;
        
        resultplayer.src = resulturl;
        downloadbutton.href = resulturl;
        downloadbutton.download = `${cleanname(targetfiledata.file.name)}-mix.wav`;
        
        sethidden(result, false);
        makewave(resultwave, samples);
        updateprogress(100, "done!");

        result.scrollIntoView({behavior: "smooth", block: "nearest"});
    } catch (error) {
        setstatus(error.message === "cancelled" ? "cancelled" : "failed, but i don't know the reason as to why! awh");
    } finally {
        generating = false;

        setstatus("");
        sethidden(progress, true);
        sethidden(cancelbutton, true);
        synccontrols();
    }
}

mixbutton.addEventListener("click", () => {
    domix();
});

cancelbutton.addEventListener("click", () => {
    cancelrequested = true;
    setstatus("stopping..");
});

window.addEventListener("resize", () => {
    if (sourceaudio) makewave(sourcewave, sourceaudio.mono);
    if (targetaudio) makewave(targetwave, targetaudio.mono);
    if (!result.hidden && resultsamples) makewave(resultwave, resultsamples);
});
