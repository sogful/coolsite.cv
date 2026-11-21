let runtime;
let running;
let timer;
let notify;
let failure;
const canvas = document.querySelector(".surface");

/*//////////////////////////////////////////////////////////////////////*/

function snapshot() {
    const files = [];
    function visit(directory, prefix = "") {
        for (const name of runtime.FS.readdir(directory)) {
            if (name === "." || name === "..") {continue;}
            const absolute = directory + "/" + name;
            if ((runtime.FS.stat(absolute).mode & 61440) === 16384) {visit(absolute, prefix + name + "/");}
            else {files.push([prefix + name, runtime.FS.readFile(absolute)]);}
        }
    }
    if (runtime) {visit("/saves");}
    return files;
}

function report() {
    try {notify?.saves(snapshot());}
    catch (error) {notify?.error(error.message);}
}

function write(path, bytes) {
    const parts = path.split("/");
    parts.pop();
    let directory = "";
    for (const part of parts) {
        if (!part) {continue;}
        directory += "/" + part;
        try {runtime.FS.mkdir(directory);} catch {}
    }
    try {runtime.FS.unlink(path);} catch {}
    runtime.FS.writeFile(path, bytes);
}

/*//////////////////////////////////////////////////////////////////////*/

async function start(game, backup, callbacks) {
    notify = callbacks;
    failure = null;
    if (!WebAssembly.promising || !WebAssembly.Suspending) {throw new Error("This browser does not support the Studio runtime yet.");}
    const response = await fetch(new URL("../vendor/studio/bootstrap.gz", import.meta.url));
    if (!response.ok) {throw new Error("Could not load the Studio runtime.");}
    const decoded = response.body.pipeThrough(new DecompressionStream("gzip"));
    const url = URL.createObjectURL(new Blob([await new Response(decoded).text()], {type: "text/javascript"}));
    let create;
    try {create = (await import(url)).default;}
    finally {URL.revokeObjectURL(url);}
    runtime = await create({
        canvas,
        getfullscreen: () => notify.fullscreen(),
        setfullscreen: enabled => notify.setfullscreen(enabled),
        locateFile: () => new URL("../vendor/studio/runtime.wasm", import.meta.url).href,
        print: line => notify.log(String(line)),
        printErr: line => notify.log(String(line)),
        onAbort: message => {failure = new Error(String(message)); notify.error(failure.message);}
    });
    runtime.specialHTMLTargets["#canvas"] = canvas;
    runtime.FS.mkdir("/game");
    runtime.FS.mkdir("/saves");
    const deleted = new Set(backup.deleted || []);
    for (const [name, bytes] of game.files) {
        if (name === "manifest.json" || /\.(exe|dll)$/i.test(name) || deleted.has(name.toLowerCase())) {continue;}
        write("/game/" + name, bytes);
    }
    for (const [name, value] of Object.entries(backup.files)) {
        write("/saves/" + name, Uint8Array.from(atob(value), character => character.charCodeAt(0)));
    }
    runtime.FS.chdir("/game");
    const args = ["/game/data.win", "--save-folder", "/saves", "--disable-log-colours", "--lazy-textures", "--lazy-audio"];
    const pointers = args.map(value => runtime.stringToNewUTF8(value));
    const table = runtime._malloc((pointers.length + 1) * 4);
    for (let index = 0; index < pointers.length; index++) {new DataView(runtime.HEAPU8.buffer).setUint32(table + index * 4, pointers[index], true);}
    new DataView(runtime.HEAPU8.buffer).setUint32(table + pointers.length * 4, 0, true);
    running = runtime.ccall("startRunner", "number", ["number", "number"], [pointers.length, table], {async: true});
    running.catch(error => {failure = error; notify.error(error.message || String(error));});
    timer = setInterval(report, 500);
    for (let count = 0; count < 200 && canvas.width === 1 && !failure; count++) {await new Promise(resolve => setTimeout(resolve, 50));}
    if (failure) {throw failure;}
    if (canvas.width === 1) {throw new Error("The Studio game did not start.");}
    await new Promise(resolve => setTimeout(resolve, 500));
    if (failure) {throw failure;}
    return {width: canvas.width, height: canvas.height};
}

function key(code, down) {
    if (runtime && !failure) {runtime[down ? "_onKeyDown" : "_onKeyUp"](code);}
}

function resume() {
    for (const device of window.miniaudio?.devices || []) {void device?.webaudio?.resume?.();}
}

function stats() {
    return {
        fps: runtime?._framerate?.() || 0,
        cheating: !!runtime?._cheating(),
        width: canvas.width,
        height: canvas.height
    };
}

async function stop() {
    clearInterval(timer);
    try {runtime?._requestRunnerExit();} catch {}
    await Promise.race([running?.catch(() => {}), new Promise(resolve => setTimeout(resolve, 1500))]);
    report();
    for (const device of window.miniaudio?.devices || []) {void device?.webaudio?.close?.();}
}

window.runner = {start, key, resume, stop, stats};
