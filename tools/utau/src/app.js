import {entries,filename,zip} from "./files.js";
import {readproject,serialize,silence} from "./projects.js";
import {banks} from "./voices.js";
import {adapt,automatic,plan} from "./music.js";
import {waveblob} from "./sound.js";

/*//////////////////////////////////////////////////////////////////////*/

const view = Object.fromEntries([
    "projectfile", "bankfile", "folderfile", "folderbutton", "projectinfo", "bankinfo", "bankchoice", "bankselect",
    "settings", "trackselect", "pitchmode", "custompitch", "transpose", "sfxoptions", "pattern", "soundchoice", "soundselect",
    "renderer", "strict", "mapping", "previewbutton", "renderbutton", "cancelbutton", "status", "progress", "result",
    "resulttitle", "waveform", "player", "wavdownload", "tracksbutton", "exports", "projectbutton", "bundlebutton"
].map(name => [name, document.querySelector("." + name)]));
const state = {
    project: null, banks: [], bank: null, adapted: null, busy: false, version: 0,
    projectbusy: false, bankbusy: false, projectversion: 0, bankversion: 0,
    controller: null, projectcontroller: null, bankcontroller: null,
    audio: null, tracks: [], urls: []
};

function status(text, error = false) {
    view.status.textContent = text;
    view.status.classList.toggle("error", error);
}

function outputclear() {
    view.player.pause();
    view.player.removeAttribute("src");
    view.player.load();
    for (const url of state.urls) {URL.revokeObjectURL(url);}
    state.urls = [];
    state.audio = null;
    state.tracks = [];
    view.result.hidden = true;
}

function controls() {
    const busy = state.busy || state.projectbusy || state.bankbusy;
    const ready = Boolean(state.adapted && state.bank && !busy);
    view.previewbutton.disabled = !ready;
    view.renderbutton.disabled = !ready;
    view.projectbutton.disabled = !ready;
    view.bundlebutton.disabled = !ready;
    view.cancelbutton.hidden = !busy;
    view.exports.hidden = !state.adapted;
    view.settings.hidden = !state.project || !state.bank;
    view.custompitch.hidden = view.pitchmode.value !== "custom";
    view.sfxoptions.hidden = !state.bank?.sfx;
    view.soundchoice.hidden = view.pattern.value !== "single";
    view.strict.closest("label").hidden = Boolean(state.bank?.sfx);
}

function stop() {
    state.version++;
    state.controller?.abort();
    state.controller = null;
    state.busy = false;
    view.progress.hidden = true;
    controls();
}

function workerjob(message, signal, progress) {
    const worker = new Worker(new URL("renderworker.js", import.meta.url), {type: "module"});
    return new Promise((resolve, reject) => {
        const abort = () => {worker.terminate(); reject(new DOMException("Cancelled", "AbortError"));};
        const finish = () => {signal?.removeEventListener("abort", abort); worker.terminate();};
        if (signal?.aborted) {abort(); return;}
        signal?.addEventListener("abort", abort, {once: true});
        worker.onerror = event => {finish(); reject(new Error(event.message || "Audio rendering failed."));};
        worker.onmessage = event => {
            if (event.data.progress !== undefined) {progress?.(event.data); return;}
            finish();
            if (event.data.error) {reject(new Error(event.data.error));} else {resolve(event.data);}
        };
        worker.postMessage(message);
    });
}

function usedfiles(bank, rows) {
    const names = new Set(rows.flatMap(row => [row.file, row.frq].filter(Boolean)));
    return [...names].map(name => [name, bank.files.get(name)]);
}

function settings() {
    const transpose = view.pitchmode.value === "auto" ? automatic(state.project, state.bank, view.trackselect.value) : view.pitchmode.value === "keep" ? 0 : Number(view.transpose.value);
    if (!Number.isInteger(transpose) || Math.abs(transpose) > 48) {throw new Error("Choose a whole-number transposition between -48 and 48.");}
    return {track: view.trackselect.value, transpose, pattern: view.pattern.value, sound: view.soundselect.value, renderer: view.renderer.value, strict: view.strict.checked};
}

function refresh(clear = true) {
    if (clear) {outputclear();}
    state.adapted = null;
    if (state.project && state.bank && !state.projectbusy && !state.bankbusy) {
        try {
            const options = settings();
            if (options.pattern === "paired" && !["open", "close"].every(alias => state.bank.rows.some(row => row.alias === alias))) {throw new Error("This bank needs open and close aliases for paired sounds.");}
            state.adapted = adapt(state.project, state.bank, options);
            const report = state.adapted.report;
            view.mapping.textContent = report.notes + (report.notes === 1 ? " note · " : " notes · ") + report.tracks.length + (report.tracks.length === 1 ? " track · pitch " : " tracks · pitch ") + (report.shift >= 0 ? "+" : "") + report.shift + " semitones";
            if (report.approximate.length) {view.mapping.textContent += " · " + report.approximate.length + " lyrics approximated (" + [...new Set(report.approximate)].slice(0, 5).join(", ") + ")";}
            status("");
        } catch (error) {view.mapping.textContent = ""; status(error.message, true);}
    }
    controls();
}

async function projectload(file) {
    if (!file) {return;}
    stop();
    outputclear();
    state.adapted = null;
    const version = ++state.projectversion;
    state.projectcontroller?.abort();
    state.projectcontroller = new AbortController();
    state.projectbusy = true;
    controls();
    try {
        status("Reading project");
        const project = await readproject(file, state.projectcontroller.signal);
        if (version !== state.projectversion) {return;}
        state.project = project;
        state.projectbusy = false;
        const count = project.voice_parts.reduce((sum, part) => sum + (part.notes || []).filter(note => !silence.has(String(note.lyric).toLowerCase())).length, 0);
        view.projectinfo.textContent = file.name + " · " + count + " notes";
        view.trackselect.replaceChildren(new Option("all vocal tracks", "all"));
        project.tracks.forEach((track, index) => {if (project.voice_parts.some(part => part.track_no === index && part.notes?.length)) {view.trackselect.add(new Option(track.track_name || "voice " + (index + 1), String(index)));}});
        refresh();
    } catch (error) {
        if (version === state.projectversion) {state.projectbusy = false; state.project = null; view.projectinfo.textContent = "choose or drop a project"; status(error.message, true); controls();}
    }
}

async function bankchoose(index, signal) {
    const bank = state.banks[index];
    view.soundselect.replaceChildren(...bank.short.map(name => new Option(name, name)));
    view.soundselect.value = bank.short.includes(bank.preferred) ? bank.preferred : bank.short[0];
    view.pattern.value = "auto";
    for (const option of view.pattern.options) {if (option.value === "paired") {option.disabled = !["open", "close"].every(alias => bank.rows.some(row => row.alias === alias));}}
    if (!bank.native) {
        status("Measuring voice range");
        const rows = bank.short.slice(0, 2).map(alias => bank.rows.find(row => row.alias === alias));
        const result = await workerjob({inspect: true, rows, files: usedfiles(bank, rows)}, signal);
        bank.native = result.native;
    }
    view.bankinfo.textContent = bank.name + " · " + new Set(bank.rows.map(row => row.alias)).size + " sounds" + (bank.missing ? " · " + bank.missing + " missing sample references" : "");
    return bank;
}

async function bankload(files) {
    if (!files.length) {return;}
    stop();
    outputclear();
    state.adapted = null;
    state.bank = null;
    state.banks = [];
    view.bankchoice.hidden = true;
    view.bankinfo.textContent = "reading voicebank";
    const version = ++state.bankversion;
    state.bankcontroller?.abort();
    state.bankcontroller = new AbortController();
    const signal = state.bankcontroller.signal;
    state.bankbusy = true;
    controls();
    try {
        status("Reading voicebank");
        const loaded = await entries(files, text => {if (version === state.bankversion) {status(text);}}, signal);
        if (version !== state.bankversion) {return;}
        state.banks = banks(loaded);
        view.bankselect.replaceChildren(...state.banks.map((bank, index) => new Option(bank.name, String(index))));
        view.bankchoice.hidden = state.banks.length < 2;
        const bank = await bankchoose(0, signal);
        if (version !== state.bankversion) {return;}
        state.bank = bank;
        state.bankbusy = false;
        refresh();
    } catch (error) {
        if (version === state.bankversion) {state.bankbusy = false; state.bank = null; view.bankinfo.textContent = "choose a voicebank"; status(error.name === "AbortError" ? "Cancelled" : error.message, error.name !== "AbortError"); controls();}
    }
}

/*//////////////////////////////////////////////////////////////////////*/

function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename(name);
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function waveform(samples) {
    const canvas = view.waveform;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#444";
    for (let x = 0; x < canvas.width; x++) {
        const start = Math.floor(x / canvas.width * samples.length);
        const end = Math.max(start + 1, Math.floor((x + 1) / canvas.width * samples.length));
        let minimum = 0, maximum = 0;
        for (let index = start; index < end; index++) {minimum = Math.min(minimum, samples[index]); maximum = Math.max(maximum, samples[index]);}
        context.fillRect(x, canvas.height * (0.5 - maximum * 0.5), 1, Math.max(1, (maximum - minimum) * canvas.height * 0.5));
    }
}

async function render(preview) {
    if (!state.adapted || state.busy || state.projectbusy || state.bankbusy) {return;}
    outputclear();
    const version = ++state.version;
    state.controller = new AbortController();
    state.busy = true;
    controls();
    try {
        const planned = plan(state.adapted.song, state.bank, view.trackselect.value, preview ? 15 : 0);
        const rows = planned.tracks.flatMap(track => track.groups.map(group => group.row));
        view.progress.hidden = false;
        view.progress.value = 0;
        status("Rendering samples");
        const result = await workerjob({plan: planned, files: usedfiles(state.bank, rows)}, state.controller.signal, message => {
            if (version !== state.version) {return;}
            view.progress.value = message.progress;
            status("Rendering " + message.done + "/" + message.count + " sounds");
        });
        if (version !== state.version) {return;}
        state.audio = result;
        state.tracks = result.tracks;
        const blob = waveblob(result.mix, result.rate);
        const url = URL.createObjectURL(blob);
        state.urls.push(url);
        view.player.src = url;
        view.wavdownload.href = url;
        view.wavdownload.download = filename(state.adapted.song.name) + (preview ? " preview" : "") + ".wav";
        view.wavdownload.textContent = preview ? "download preview WAV" : "download WAV";
        view.resulttitle.textContent = preview ? "preview" : "audio";
        view.tracksbutton.hidden = result.tracks.length < 2;
        view.result.hidden = false;
        waveform(result.mix);
        status("Done · " + (result.mix.length / result.rate).toFixed(2) + " seconds");
    } catch (error) {if (version === state.version) {status(error.name === "AbortError" ? "Cancelled" : error.message, error.name !== "AbortError");}}
    finally {if (version === state.version) {state.busy = false; view.progress.hidden = true; controls();}}
}

view.projectfile.addEventListener("change", () => projectload(view.projectfile.files[0]));
view.bankfile.addEventListener("change", () => bankload([...view.bankfile.files]));
view.folderfile.addEventListener("change", () => bankload([...view.folderfile.files]));
view.folderbutton.addEventListener("click", () => view.folderfile.click());
view.bankselect.addEventListener("change", async () => {
    stop(); outputclear();
    state.bankcontroller?.abort();
    state.bankcontroller = new AbortController(); state.bankbusy = true; controls();
    const version = ++state.bankversion;
    try {const bank = await bankchoose(Number(view.bankselect.value), state.bankcontroller.signal); if (version === state.bankversion) {state.bank = bank; state.bankbusy = false; refresh();}}
    catch (error) {if (version === state.bankversion) {state.bankbusy = false; status(error.message, true); controls();}}
});
for (const name of ["trackselect", "pitchmode", "transpose", "pattern", "soundselect", "renderer", "strict"]) {view[name].addEventListener("change", () => {stop(); refresh();});}
view.previewbutton.addEventListener("click", () => render(true));
view.renderbutton.addEventListener("click", () => render(false));
view.cancelbutton.addEventListener("click", () => {
    const projectbusy = state.projectbusy, bankbusy = state.bankbusy;
    stop();
    state.projectversion++; state.bankversion++;
    state.projectcontroller?.abort(); state.bankcontroller?.abort();
    state.projectbusy = false; state.bankbusy = false;
    if (projectbusy) {view.projectfile.value = "";}
    if (bankbusy) {view.bankfile.value = ""; view.folderfile.value = ""; if (!state.bank) {view.bankinfo.textContent = "choose a voicebank";}}
    refresh(false); status("Cancelled");
});
view.projectbutton.addEventListener("click", () => {if (state.adapted) {download(new Blob([serialize(state.adapted.song)], {type: "text/yaml"}), state.adapted.song.name + ".ustx");}});
view.bundlebutton.addEventListener("click", async () => {
    if (!state.adapted) {return;}
    const bank = state.bank, song = state.adapted.song, version = state.version;
    try {
        view.bundlebutton.disabled = true;
        status("Packing project and voicebank");
        const files = new Map([[filename(song.name) + ".ustx", serialize(song)]]);
        for (const [path, bytes] of bank.files) {
            if (bank.root && !path.startsWith(bank.root + "/")) {continue;}
            const relative = bank.root ? path.slice(bank.root.length + 1) : path;
            files.set("voicebanks/" + bank.id + "/" + relative, bytes);
        }
        files.set("readme.txt", "Open the USTX file in OpenUtau. Install the folder in voicebanks as a singer first.\n");
        download(await zip(files), song.name + ".zip");
        if (version === state.version) {status("Project and voicebank ZIP ready");}
    } catch (error) {status(error.message, true);} finally {controls();}
});
view.tracksbutton.addEventListener("click", async () => {
    const tracks = state.tracks, audio = state.audio, name = state.adapted?.song.name;
    if (!audio) {return;}
    try {
        const files = new Map();
        for (const [index, track] of tracks.entries()) {files.set(String(index + 1).padStart(2, "0") + " " + filename(track.name) + ".wav", new Uint8Array(await waveblob(track.samples, audio.rate).arrayBuffer()));}
        download(await zip(files), name + " tracks.zip");
    } catch (error) {status(error.message, true);}
});

/*//////////////////////////////////////////////////////////////////////*/

async function dropped(item, prefix = "") {
    if (item.isFile) {return [await new Promise((resolve, reject) => item.file(file => {Object.defineProperty(file, "webkitRelativePath", {value: prefix + file.name}); resolve(file);}, reject))];}
    const reader = item.createReader();
    const children = [];
    while (true) {const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject)); if (!batch.length) {break;} children.push(...batch);}
    const result = [];
    for (const child of children) {result.push(...await dropped(child, prefix + item.name + "/"));}
    return result;
}

for (const [selector, type] of [[".projectdrop", "project"], [".bankdrop", "bank"]]) {
    const zone = document.querySelector(selector);
    zone.addEventListener("dragover", event => {event.preventDefault(); zone.classList.add("dragging");});
    zone.addEventListener("dragleave", event => {if (!zone.contains(event.relatedTarget)) {zone.classList.remove("dragging");}});
    zone.addEventListener("drop", async event => {
        event.preventDefault(); zone.classList.remove("dragging");
        try {
            if (type === "project") {await projectload(event.dataTransfer.files[0]);}
            else {
                const items = [...event.dataTransfer.items].map(item => item.webkitGetAsEntry?.()).filter(Boolean);
                const files = [];
                if (items.some(item => item.isDirectory)) {for (const item of items) {files.push(...await dropped(item));}}
                else {files.push(...event.dataTransfer.files);}
                await bankload(files);
            }
        } catch (error) {status(error.message, true);}
    });
}

window.addEventListener("pagehide", () => {stop(); state.projectcontroller?.abort(); state.bankcontroller?.abort(); for (const url of state.urls) {URL.revokeObjectURL(url);}});
controls();
