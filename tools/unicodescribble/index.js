import {feature,configuration} from "./js/matching/features.js";
import {load,fingerprint} from "./js/indexing/resources.js";
import {read,write,remove,clearparts,persistent} from "./js/indexing/storage.js";

const dpad = document.querySelector(".pad");
const dctx = dpad.getContext("2d", {willReadFrequently: true});
const W = dpad.width, H = dpad.height;

const seen = document.querySelector(".seen");
const sctx = seen.getContext("2d");
const statusel = document.querySelector(".status");
const resultsel = document.querySelector(".results");
const rebuildbtn = document.querySelector(".rebuildbtn");

const GRID = 24, FIT = 22, DIM = GRID * GRID;

/*//////////////////////////////////////////////////////////////////////*/

const FONTS = [
    {fam: "GoNotoScribble", url: "/assets/fonts/gonoto.woff2"},
    {fam: "Symbols2Scribble", url: "/assets/fonts/symbols2.woff2"},
    {fam: "MathScribble", url: "/assets/fonts/math.woff2"},
    {fam: "MusicScribble", url: "/assets/fonts/music.woff2"},
    {fam: "UnifontScribble", url: "/assets/fonts/unifont.woff2"},
    {fam: "UnifontUpperScribble", url: "/assets/fonts/unifontupper.woff2"},
];
const cpSURL = "/assets/static/scribble/scribble-cps.bin";
const EMOJIURL = "/assets/static/scribble/scribble-emoji.bin";
const NAMESURL = "/assets/static/scribble/scribble-names.txt.gz";
const IDXVER = 8;
const IDXKEY = "scribble-v" + IDXVER;
const QSCALE = 300;

const fallback = 
'"Segoe UI Symbol","Segoe UI","Roboto","Helvetica Neue","Arial","Liberation Sans","Ubuntu","Cantarell","Noto Sans",system-ui,sans-serif';
const renderfont = FONTS.map(f => '"' + f.fam + '"').join(",") + "," + fallback;
const renderfontnouni = FONTS.filter(f => f.fam.indexOf("Unifont") < 0)
    .map(f => '"' + f.fam + '"').join(",") + "," + fallback;

const emojifont =
'"Segoe UI Emoji","Apple Color Emoji",' +
'"Noto Color Emoji","Twemoji Mozilla",' +
'"UnifontScribble","UnifontUpperScribble",sans-serif';
const emojifontnouni =
'"Segoe UI Emoji","Apple Color Emoji",' +
'"Noto Color Emoji","Twemoji Mozilla",sans-serif';

// emoji codepoint set
let EMOJILIST = [];
let EMOJISET = new Set();
let glyphnames = null;

function status(t) {statusel.textContent = t}

/*//////////////////////////////////////////////////////////////////////*/

let glyphcep = null; let emojicep = null;
let emojifeat = null; let emojicolor = null; let emojiuni = null;
let ready = false; let indexing = false;

async function fetchnames() {
    try {
        const resp = await fetch(NAMESURL);
        const stream = resp.body.pipeThrough(new DecompressionStream("gzip"));
        const text = await new Response(stream).text();
        const m = new Map();
        for (const line of text.split("\n")) {
            const tab = line.indexOf("\t");
            if (tab > 0) m.set(parseInt(line.slice(0, tab), 16), line.slice(tab + 1));
        }
        glyphnames = m;
    } catch (e) {
        glyphnames = new Map();
    }
}

/*//////////////////////////////////////////////////////////////////////*/

let resources = null;
let signature = "";
let indexworker = null;
const fonts = [renderfont,renderfontnouni,emojifont,emojifontnouni];

function validcache(value) {
    return value?.v === IDXVER && value.signature === signature && value.dim === DIM && value.cps instanceof Int32Array && value.feats instanceof Int8Array && value.feats.length === value.cps.length * DIM && value.unifont?.length === value.cps.length && value.emojicep instanceof Int32Array && value.emojifeat?.length === value.emojicep.length * DIM && value.emojicolor?.length === value.emojicep.length * 3 && value.emojiunifont?.length === value.emojicep.length;
}

function activate(value,cached,saved = true) {
    glyphcep = value.cps;
    emojicep = value.emojicep;
    emojifeat = value.emojifeat;
    emojicolor = value.emojicolor;
    emojiuni = value.emojiunifont;
    indexing = false;
    rebuildbtn.disabled = false;
    document.body.dataset.cache = cached ? "loaded" : saved ? "saved" : "memory";
    document.body.dataset.resumed = String(value.resumed || 0);
    status(glyphcep.length + " symbols + " + emojicep.length + " emoji ready" + (saved ? "" : ". couldn't save the index."));
    armworker(value.feats,glyphcep.length,value.unifont);
    persistent().then(value => {document.body.dataset.persistent = String(value);});
}

function progress(value) {
    document.body.dataset.processed = String(value.done);
    document.body.dataset.resumed = String(value.resumed);
    status("indexing " + value.kind + " " + value.done + "/" + value.total);
}

async function generate() {
    const settings = {signature,fonts};
    const output = await new Promise((resolve,reject) => {
        indexworker = new Worker(new URL("./js/indexing/worker.js",import.meta.url),{type:"module"});
        indexworker.onmessage = event => {
            const value = event.data;
            if (value.type === "progress") {progress(value); return;}
            indexworker.terminate();indexworker = null;
            if (value.type === "result") resolve(value.result);
            else if (value.type === "unsupported") resolve(null);
            else reject(Error(value.message));
        };
        indexworker.onerror = event => {indexworker?.terminate();indexworker = null;reject(Error(event.message || "indexing failed"));};
        indexworker.postMessage({data:resources,settings});
    });
    if (output) return output;
    const {build} = await import("./js/indexing/build.js");
    return build(resources,{...settings,progress,canvas:(width,height) => {const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;return canvas;},yield:() => new Promise(resolve => setTimeout(resolve,0))});
}

async function buildindex(force = false) {
    const build = async () => {
        const existing = force ? null : await read(IDXKEY);
        if (validcache(existing)) {activate(existing,true);return;}
        indexing = true;ready = false;rebuildbtn.disabled = true;
        const started = performance.now();
        const result = {...await generate(),v:IDXVER,dim:DIM,signature};
        let saved = true;
        try {
            await write(IDXKEY,result);
        } catch {saved = false;}
        if (saved) {try {await clearparts();} catch {}}
        document.body.dataset.buildtime = String(performance.now() - started);
        activate(result,false,saved);
    };
    if (navigator.locks) await navigator.locks.request("scribble-index",build);
    else await build();
}

async function init() {
    const started = performance.now();
    status("loading fonts");
    fetchnames().then(() => {if (ready) dirty = true;});
    try {
        resources = await load(FONTS,cpSURL,EMOJIURL);
        EMOJILIST = Array.from(resources.emoji);EMOJISET = new Set(EMOJILIST);
        resultsel.style.fontFamily = renderfont;
        signature = await fingerprint(resources,{version:IDXVER,configuration,fonts});
        document.body.dataset.signature = signature;
        await buildindex();
        document.body.dataset.startup = String(performance.now() - started);
    } catch (error) {
        indexing = false;rebuildbtn.disabled = false;
        status("couldn't prepare the index: " + error.message);
        document.body.dataset.cache = "error";
    }
}

rebuildbtn.addEventListener("click",async () => {
    if (indexing) return;
    try {
        await remove(IDXKEY);await clearparts(signature);
        if (!resources) {await init();return;}
        await buildindex(true);
    } catch (error) {indexing=false;rebuildbtn.disabled=false;status("rebuild failed: " + error.message);}
});
window.addEventListener("pagehide",event => {
    if (event.persisted) return;
    indexworker?.terminate();worker?.terminate();
});

/*//////////////////////////////////////////////////////////////////////*/

let worker = null;
let matchpending = false, matchqueued = false;

function armworker(featArr, count, uniArr) {
    if (!worker) {
        worker = new Worker(new URL("./js/matching/worker.js",import.meta.url),{type:"module"});
        worker.onmessage = onworkermsg;
    }
    worker.postMessage({type: "index", feat: featArr, dim: DIM, n: count,
        uni: uniArr}, [featArr.buffer]);
    ready = true;
    dirty = true;
}

function onworkermsg(e) {
    if (e.data.type !== "result") return;
    matchpending = false;
    if (ready && !emojimode) {
        renderresults(e.data.items.map(it =>
            ({cp: glyphcep[it.idx], score: it.score / QSCALE})), false);
    }
    if (matchqueued) {matchqueued = false; requestmatch()}
}

let lastmatchtime = 0;
function requestmatch() {
    if (!ready || indexing) return;
    if (!emojimode && matchpending) { matchqueued = true; return; }
    if (emojimode && performance.now() - lastmatchtime < 55) {dirty = true; return}
    lastmatchtime = performance.now();
    const img = dctx.getImageData(0, 0, W, H);
    const r = feature(img.data, W, 0, 0, W, H, true);
    drawseen(r);
    if (!r) {renderresults([], emojimode); return}
    const vecs = buildvecs(r);
    if (emojimode) {renderresults(emojimatch(vecs), true); return}
    if (!worker) return; matchpending = true;
    worker.postMessage({type: "match", vecs: vecs, nouni: nounifont});
}

const ROTVARIANTS = [-0.366, -0.244, -0.122, 0.122, 0.244, 0.366];
let scratch = null;
function buildvecs(base) {
    if (!accurate) return [base.vec];
    if (!scratch) {
        scratch = document.createElement("canvas");
        scratch.width = W; scratch.height = H;
    }
    const sx = scratch.getContext("2d", {willReadFrequently: true});
    const vecs = [base.vec];
    for (let k = 0; k < ROTVARIANTS.length; k++) {
        sx.clearRect(0, 0, W, H);
        sx.save();
        sx.translate(W / 2, H / 2);
        sx.rotate(ROTVARIANTS[k]);
        sx.translate(-W / 2, -H / 2);
        sx.drawImage(dpad, 0, 0);
        sx.restore();
        const f = feature(sx.getImageData(0, 0, W, H).data, W, 0, 0, W, H, true);
        if (f) vecs.push(f.vec);
    }
    return vecs;
}

function emojimatch(vecs) {
    const pc = hexrgb(pencolor);
    const n = emojicep.length, top = [];
    let worst = -1e9;
    for (let g = 0; g < n; g++) {
        if (nounifont && emojiuni && emojiuni[g]) continue;
        const base = g * DIM;
        let dot = -1e9;
        for (let k = 0; k < vecs.length; k++) {      // best over all variants
            const v = vecs[k];
            let d = 0;
            for (let i = 0; i < DIM; i++) d += v[i] * emojifeat[base + i];
            if (d > dot) dot = d;
        }
        const shape = dot / QSCALE;
        const dr = pc[0] - emojicolor[g * 3];
        const dg = pc[1] - emojicolor[g * 3 + 1];
        const db = pc[2] - emojicolor[g * 3 + 2];
        const csim = 1 - Math.sqrt(dr * dr + dg * dg + db * db) / 441.7;
        const score = shape * (0.55 + 0.45 * csim);
        if (top.length < 50) {
            top.push({cp: emojicep[g], score: score});
            if (top.length === 50) {
                top.sort((a, b) => a.score - b.score);
                worst = top[0].score;
            }
        } else if (score > worst) {
            top[0] = {cp: emojicep[g], score: score};
            top.sort((a, b) => a.score - b.score);
            worst = top[0].score;
        }
    }
    top.sort((a, b) => b.score - a.score);
    return top;
}

function hexrgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function glyphcanvas(cp, emoji) {
    const SZ = 52, BACK = 124;
    const out = document.createElement("canvas");
    out.className = "ch";
    out.width = BACK; out.height = BACK;
    out.style.width = SZ + "px"; out.style.height = SZ + "px";
    const o = out.getContext("2d");
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.font = "84px " + (emoji ? emojifont : renderfont);
    o.fillStyle = "#111";
    o.fillText(String.fromCodePoint(cp) + (emoji ? "️" : ""),
        BACK / 2, BACK / 2);
    return out;
}

/*//////////////////////////////////////////////////////////////////////*/

function renderresults(top, emoji) {
    resultsel.innerHTML = "";
    top.forEach(t => {
        const ch = String.fromCodePoint(t.cp);
        const card = document.createElement("div");
        card.className = "res";
        card.title = "click to copy";

        const cp = document.createElement("span");
        cp.className = "cp";
        cp.textContent = "U+" + t.cp.toString(16).toUpperCase().padStart(4, "0");
        const sc = document.createElement("span");
        sc.className = "sc";
        sc.textContent = Math.round(Math.max(0, t.score) * 100) + "%";

        card.append(glyphcanvas(t.cp, emoji));
        const name = glyphnames && glyphnames.get(t.cp);
        if (name) {
            const nm = document.createElement("span");
            nm.className = "nm";
            nm.textContent = name.toLowerCase();
            card.append(nm);
        }
        card.append(cp, sc);
        card.addEventListener("click", () => copychar(ch, card, cp));
        resultsel.appendChild(card);
    });
}

function copychar(ch, card, cp) {
    navigator.clipboard.writeText(ch)
}

function drawseen(r) {
    sctx.fillStyle = "#fff";
    sctx.fillRect(0, 0, seen.width, seen.height);
    if (!r) return;
    const oc = document.createElement("canvas");
    oc.width = GRID; oc.height = GRID;
    const octx = oc.getContext("2d");
    const im = octx.createImageData(GRID, GRID);
    for (let i = 0; i < DIM; i++) {
        const val = 255 - Math.min(255, r.grid[i]);
        im.data[i * 4] = val; im.data[i * 4 + 1] = val;
        im.data[i * 4 + 2] = val; im.data[i * 4 + 3] = 255;
    }
    octx.putImageData(im, 0, 0);
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(oc, 0, 0, seen.width, seen.height);
}

/*//////////////////////////////////////////////////////////////////////*/

let mode = "draw";
const pen = 16;                          // fixed pen width
let drawing = false, lastx = 0, lasty = 0;
let dirty = false;
let emojimode = false, pencolor = "#111111", accurate = false, nounifont = false;

function locate(e) {
    const rc = dpad.getBoundingClientRect();
    return [(e.clientX - rc.left) * (W / rc.width),
            (e.clientY - rc.top) * (H / rc.height)];
}
function setop() {
    dctx.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
}
function dab(x, y) {
    setop(); dctx.fillStyle = pencolor;
    dctx.beginPath(); dctx.arc(x, y, pen / 2, 0, Math.PI * 2);
    dctx.fill();
}
function segment(x0, y0, x1, y1) {
    setop(); 
    dctx.strokeStyle = pencolor; dctx.lineWidth = pen;
    dctx.lineCap = "round"; dctx.lineJoin = "round";
    dctx.beginPath(); dctx.moveTo(x0, y0); dctx.lineTo(x1, y1);
    dctx.stroke();
}

dpad.addEventListener("pointerdown", e => {
    dpad.setPointerCapture(e.pointerId);
    drawing = true; [lastx, lasty] = locate(e);
    dab(lastx, lasty); dirty = true;
});
dpad.addEventListener("pointermove", e => {
    if (!drawing) return; const [x, y] = locate(e);
    segment(lastx, lasty, x, y);
    lastx = x; lasty = y; dirty = true;
});
window.addEventListener("pointerup", () => {
    if (!drawing) return;
    drawing = false; dirty = true;
});

document.querySelectorAll(".tools button[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        document.querySelectorAll(".tools button[data-mode]")
        .forEach(b => b.classList.toggle("active", b === btn));
    });
});
document.querySelector(".clearbtn").addEventListener("click", () => {
    dctx.clearRect(0, 0, W, H);
    dirty = true;
});
document.querySelector(".cropbtn").addEventListener("click", () => {
    const d = dctx.getImageData(0, 0, W, H).data;
    let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1;
    for (let y = 0; y < H; y++) {
        let base = y * W * 4 + 3;
        for (let x = 0; x < W; x++) {
            if (d[base + x * 4] > 16) {
                if (x < minx) minx = x;
                if (x > maxx) maxx = x;
                if (y < miny) miny = y;
                if (y > maxy) maxy = y;
            }
        }
    }
    if (maxx < 0) return;
    const bw = maxx - minx + 1, bh = maxy - miny + 1;
    const margin = W * (1 - FIT / GRID) / 2;
    const s = Math.min((W - margin * 2) / bw, (H - margin * 2) / bh);
    const oc = document.createElement("canvas");
    oc.width = bw; oc.height = bh;
    oc.getContext("2d").drawImage(dpad, minx, miny, bw, bh, 0, 0, bw, bh);
    dctx.clearRect(0, 0, W, H);
    dctx.globalCompositeOperation = "source-over";
    dctx.drawImage(oc, (W - bw * s) / 2, (H - bh * s) / 2, bw * s, bh * s);
    dirty = true;
});

const penclr = document.querySelector(".penclr");
const clrwrap = document.querySelector(".clrwrap");
document.querySelectorAll(".tools button[data-set]").forEach(btn => {
    btn.addEventListener("click", () => {
        emojimode = btn.dataset.set === "emoji";
        document.querySelectorAll(".tools button[data-set]")
            .forEach(b => b.classList.toggle("active", b === btn));
        clrwrap.style.display = emojimode ? "" : "none";
        pencolor = emojimode ? penclr.value : "#111111";
        dirty = true;
    });
});
penclr.addEventListener("input", () => {
    if (emojimode) { pencolor = penclr.value; dirty = true; }
});
document.querySelector(".accurate").addEventListener("change", e => {
    accurate = e.target.checked;
    dirty = true;
});
document.querySelector(".nounifont").addEventListener("change", e => {
    nounifont = e.target.checked;
    dirty = true;
});

/*//////////////////////////////////////////////////////////////////////*/

function loop() {
    if (dirty) {dirty = false; requestmatch()}
    requestAnimationFrame(loop);
}

resultsel.style.fontFamily = renderfont;
renderresults([]); requestAnimationFrame(loop);
init();
