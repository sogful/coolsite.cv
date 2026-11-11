import {profiles, loadfonts, encode, count} from "./profiles.js";
import {editor} from "./editor.js";

const results = {};
const texts = {};
const app = document.querySelector(".app");
const error = document.querySelector(".error");
const loading = document.querySelector(".loading");
let worker = null;
let timer = null;
let fontready = false;
let busy = false;
let started = 0;
let serial = 0;
let dirty = false;
let revision = 0;
let pad;

/*//////////////////////////////////////////////////////////////////////*/

function stop(dispose = false) {
    clearTimeout(timer);
    if (busy) worker?.postMessage({type: "cancel"});
    serial++;
    if (dispose) {worker?.terminate(); worker = null;}
    busy = false;
    loading.hidden = true;
    app.dataset.state = fontready ? "ready" : "loading";
}

function changed(populated, drawing = false) {
    stop();
    revision++;
    dirty = populated;
    error.hidden = true;
    if (!populated) {
        for (const key of Object.keys(results)) delete results[key];
        document.querySelectorAll(".arttext").forEach(node => node.replaceChildren());
        document.querySelectorAll(".copy").forEach(node => {node.disabled = true;});
        document.querySelectorAll(".resultstatus").forEach(node => {node.textContent = "";});

    }
    if (populated && fontready && !drawing && !document.hidden) timer = setTimeout(run, 500);
}

function update() {
    const source = document.querySelector(".textmode").value;
    for (const site of Object.keys(profiles)) {
        const result = results[source === "separate" ? site : source];
        if (!result) continue;
        const article = document.querySelector(`[data-site="${site}"]`);
        const preview = article.querySelector(".arttext");
        texts[site] = result.text;
        preview.textContent = result.text;
        const length = count(encode(result.text, site), site);
        const limit = site === "twitter" ? 280 : site === "discord" ? 2000 : 10000;
        const note = site === "twitter" ? "weighted" : "chars";
        article.querySelector(".resultstatus").textContent = `${length}/${limit} ${note}${length > limit ? " - over limit" : ""}`;
        article.querySelector(".copy").disabled = false;
    }
}

function run() {
    if (!fontready || !pad.populated()) return;
    stop();
    started = performance.now();
    busy = true;
    loading.hidden = false;
    error.hidden = true;
    app.dataset.state = "matching";
    worker ||= new Worker(new URL("matcher.js?v=4", import.meta.url), {type: "module"});
    worker.onmessage = event => {
        const data = event.data;
        if (data.id !== serial) return;
        if (data.type === "result") {
            results[data.site] = {...data, revision};
            update();
        }
        if (data.type === "done") {
            app.dataset.duration = String(performance.now() - started);
            dirty = false;
            busy = false;
            stop();
        }
        if (data.type === "error") fail(data.message);
    };
    worker.onerror = event => {fail(event.message || "Matcher failed.");};
    const source = document.querySelector(".textmode").value;
    const sites = source === "separate" ? Object.keys(profiles) : [source];
    worker.postMessage({id: serial, sites, image: pad.image(), width: pad.canvas.width / 4, lines: Number(document.querySelector(".linecount").value), maxmarks: Number(document.querySelector(".markcount").value), trim: document.querySelector(".trim").checked});
}

function fail(message) {
    stop();
    error.textContent = message;
    error.hidden = false;
    app.dataset.state = "error";
}

/*//////////////////////////////////////////////////////////////////////*/

pad = editor(changed);
document.querySelector(".markcount").addEventListener("change", () => {changed(pad.populated());});
document.querySelector(".trim").addEventListener("change", () => {changed(pad.populated());});
document.querySelector(".textmode").addEventListener("change", () => {
    update();
    const source = document.querySelector(".textmode").value;
    const sites = source === "separate" ? Object.keys(profiles) : [source];
    if (pad.populated() && sites.some(site => results[site]?.revision !== revision)) run();
});
document.querySelectorAll(".copy").forEach(button => button.addEventListener("click", async () => {
    const site = button.closest(".result").dataset.site;
    try {
        await navigator.clipboard.writeText(encode(texts[site], site));
        button.textContent = "copied";
        setTimeout(() => {button.textContent = "copy";}, 1500);
    } catch {
        error.textContent = "Could not copy. Select the preview text and press Ctrl+C.";
        error.hidden = false;
    }
}));
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {stop(); return;}
    if (dirty && fontready && pad.populated()) timer = setTimeout(run, 500);
});
window.addEventListener("pagehide", () => {stop(true);});

loadfonts(document.fonts).then(() => {
    fontready = true;
    changed(pad.populated());
}).catch(error => {fail(error.message);});
