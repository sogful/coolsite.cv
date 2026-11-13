import {play} from "./player.js";
import {library, getgame, remember, download} from "./storage.js";
import {zipSync} from "../vendor/zip.js";

/*//////////////////////////////////////////////////////////////////////*/

let worker;
let timeout;
let active;
let current;
let busy = false;
let generation = 0;
const status = text => {document.querySelector(".status").textContent = text;};
const fileinput = document.querySelector(".gamefile");
const selection = document.querySelector(".selection");
const cancelbutton = document.querySelector(".cancel");
const decoder = new TextDecoder();

function cancel() {
    worker?.terminate();
    worker = null;
    clearTimeout(timeout);
    busy = false;
    cancelbutton.hidden = true;
    selection.hidden = true;
    fileinput.disabled = false;
}

async function showlibrary() {
    try {
        const games = await library();
        const list = document.querySelector(".games");
        list.replaceChildren();
        for (const game of games) {
            const row = document.createElement("div");
            row.className = "savedgame";
            const button = document.createElement("button");
            button.textContent = game.name;
            button.addEventListener("click", () => {
                if (busy) {return;}
                cancel();
                void launch(game).catch(error => status(error.message));
            });
            row.append(button);
            list.append(row);
        }
        document.querySelector(".library").hidden = !games.length;
    } catch (error) {status("browser storage unavailable: " + error.message);}
}

function hidescreen() {
    const player = document.querySelector(".player");
    player.hidden = true;
    player.setAttribute("aria-busy", "false");
    document.body.classList.remove("playing");
    document.querySelector(".gameoptions").hidden = true;
    document.querySelector(".playerstatus").hidden = true;
    document.querySelector(".pausedlabel").hidden = true;
}

async function closegame() {
    generation++;
    const running = active;
    active = null;
    current = null;
    hidescreen();
    status("game closed");
    if (running) {await running.dispose();}
}

async function launch(game) {
    if (busy) {return;}
    busy = true;
    const serial = ++generation;
    const player = document.querySelector(".player");
    const message = document.querySelector(".playerstatus");
    status("loading game...");
    player.hidden = false;
    player.setAttribute("aria-busy", "true");
    document.body.classList.add("playing");
    document.querySelector(".gameoptions").hidden = true;
    document.querySelector(".pausedlabel").hidden = true;
    message.textContent = "loading game...";
    message.hidden = false;
    try {
        if (active) {await active.dispose(); active = null;}
        const canvas = document.querySelector(".gamecanvas");
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        if (!game.files) {game = await getgame(game.id);}
        if (serial !== generation) {return;}
        if (!game) {throw new Error("This game is no longer stored in the browser.");}
        const running = await play(game, text => {if (serial === generation) {status(text);}});
        if (serial !== generation) {await running.dispose(); return;}
        active = running;
        current = game;
        player.setAttribute("aria-busy", "false");
        message.hidden = true;
    } catch (error) {
        if (serial === generation) {hidescreen(); throw error;}
    } finally {busy = false;}
}

function begin(path) {
    selection.hidden = true;
    status("converting GameMaker data...");
    worker.postMessage({type: "convert", path});
    timeout = setTimeout(() => {cancel(); status("conversion timed out after two minutes. try a smaller game.");}, 120000);
}

/*//////////////////////////////////////////////////////////////////////*/

fileinput.addEventListener("change", async () => {
    const file = fileinput.files[0];
    if (!file || busy) {return;}
    cancel();
    if (file.size > 128 * 1024 * 1024) {status("choose a file smaller than 128 MB."); return;}
    if (!/\.(zip|exe)$/i.test(file.name)) {status("choose a zip or exe file."); return;}
    busy = true;
    fileinput.disabled = true;
    cancelbutton.hidden = false;
    status("reading game files...");
    worker = new Worker(new URL("./converter.js", import.meta.url), {type: "module"});
    worker.onerror = event => {cancel(); status("conversion failed: " + event.message);};
    worker.onmessage = async event => {
        const message = event.data;
        if (message.type === "progress") {status(message.text);}
        if (message.type === "error") {cancel(); status(message.text);}
        if (message.type === "inventory") {
            clearTimeout(timeout);
            const select = document.querySelector(".executables");
            select.replaceChildren();
            for (const path of message.executables) {
                const option = document.createElement("option");
                option.value = path;
                option.textContent = path;
                select.append(option);
            }
            if (message.executables.length === 1) {begin(message.executables[0]);}
            else {selection.hidden = false; status("choose the game executable");}
        }
        if (message.type === "ready") {
            cancel();
            try {
                const manifest = JSON.parse(decoder.decode(message.files.find(([path]) => path === "manifest.json")?.[1]));
                if (!/^[a-f\d]{64}$/.test(manifest.source_hash)) {throw new Error("Invalid converted game identifier.");}
                const game = {id: manifest.source_hash, name: message.name, files: message.files};
                await launch(game);
                try {await remember(game); await showlibrary();}
                catch (error) {status("game loaded. could not store the game package: " + error.message);}
            } catch (error) {status("could not load game: " + error.message);}
        }
    };
    timeout = setTimeout(() => {cancel(); status("reading the game timed out.");}, 30000);
    try {
        const bytes = await file.arrayBuffer();
        worker?.postMessage({type: "open", name: file.name, bytes}, [bytes]);
    } catch (error) {cancel(); status(error.message);}
});

document.querySelector(".exitgame").addEventListener("click", () => {void closegame().catch(error => status(error.message));});

document.querySelector(".convert").addEventListener("click", () => begin(document.querySelector(".executables").value));
cancelbutton.addEventListener("click", () => {cancel(); status("conversion cancelled");});
document.querySelector(".exportsave").addEventListener("click", () => {
    if (!active) {return;}
    download(new Blob([active.save.backup()], {type: "application/json"}), current.name + " saves.json");
});
document.querySelector(".importsave").addEventListener("change", async event => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file || !active) {return;}
    if (file.size > 4 * 1024 * 1024) {status("the save backup is too large"); return;}
    try {
        active.save.restore(JSON.parse(await file.text()));
        await launch(current);
        status("saves imported - restart or load a save in the game");
    } catch (error) {status("could not import saves: " + error.message);}
});

/*//////////////////////////////////////////////////////////////////////*/

const assets = [
    "index.css", "src/app.js", "src/player.js", "src/storage.js", "src/controls.js",
    ...["left", "right", "pause", "reset", "settings", "shoot", "jump", "close"].map(name => "assets/controls/" + name + ".png")
];

document.querySelector(".exportgame").addEventListener("click", async event => {
    if (!current) {return;}
    const button = event.currentTarget;
    const game = current;
    button.disabled = true;
    status("preparing web version...");
    try {
        const output = {};
        const libraries = await (await fetch(new URL("../vendor/assets.json", import.meta.url))).json();
        for (const path of [...assets, ...libraries]) {
            const response = await fetch(new URL("../" + path, import.meta.url));
            if (!response.ok) {throw new Error("Could not load " + path);}
            output[path] = new Uint8Array(await response.arrayBuffer());
        }
        const response = await fetch(new URL("../index.html", import.meta.url));
        if (!response.ok) {throw new Error("Could not load the player page.");}
        let html = await response.text();
        html = html.replace('<body>', '<body data-package="webgame.zip">').replace('href="../base.css"', 'href="base.css"').replace('href="../favicon.svg"', 'href="favicon.svg"').replace('<a href="../">tools</a>', '');
        output["index.html"] = new TextEncoder().encode(html);
        const base = await fetch(new URL("../../base.css", import.meta.url));
        output["base.css"] = new Uint8Array(await base.arrayBuffer());
        const favicon = await fetch(new URL("../../favicon.svg", import.meta.url));
        output["favicon.svg"] = new Uint8Array(await favicon.arrayBuffer());
        output["webgame.zip"] = zipSync(Object.fromEntries(game.files), {level: 1});
        output["game.json"] = new TextEncoder().encode(JSON.stringify({id: game.id, name: game.name}));
        output["readme.txt"] = new TextEncoder().encode("serve this folder over http or https, then open index.html.\n");
        download(new Blob([zipSync(output, {level: 1})], {type: "application/zip"}), game.name + ".zip");
        status("web version downloaded");
    } catch (error) {status("could not export game: " + error.message);}
    finally {button.disabled = false;}
});

if (document.body.dataset.package) {
    document.querySelector(".upload").hidden = true;
    document.querySelector(".hint").hidden = true;
    document.querySelector(".exportgame").hidden = true;
    try {
        const {unzipSync: unzip} = await import("../vendor/zip.js");
        const response = await fetch("webgame.zip");
        const metadata = await (await fetch("game.json")).json();
        await launch({...metadata, files: Object.entries(unzip(new Uint8Array(await response.arrayBuffer())))});
    } catch (error) {status("could not load web game: " + error.message);}
} else {void showlibrary();}
