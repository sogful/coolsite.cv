import {controls} from "./controls.js";
import {savehost} from "./storage.js";
import {warning} from "./interface.js";
import {metrics} from "./metrics.js";

/*//////////////////////////////////////////////////////////////////////*/

export async function playstudio(game, status, restart) {
    const player = document.querySelector(".player");
    const canvas = document.querySelector(".gamecanvas");
    const report = document.querySelector(".diagnostics");
    const savelabel = document.querySelector(".savestatus");
    const messages = [];
    const previous = new Map();
    const save = savehost(game.id, game.files, text => {savelabel.textContent = text;});
    const frame = document.createElement("iframe");
    frame.className = "studioframe";
    frame.title = game.name;
    frame.allow = "autoplay";
    const loaded = new Promise((resolve, reject) => {
        frame.onload = resolve;
        frame.onerror = () => reject(new Error("Could not load the Studio player."));
    });
    frame.src = new URL("../runtime/studio.html", import.meta.url).href;
    canvas.hidden = true;
    document.querySelector(".stage").append(frame);
    const controller = new AbortController();
    const options = {signal: controller.signal};
    const held = new Set();
    let input;
    let runner;
    let monitor;
    let disposed = false;
    let pendingfullscreen = false;

    async function setfullscreen(enabled) {
        pendingfullscreen = enabled;
        if (!enabled) {
            if (document.fullscreenElement === player) {await document.exitFullscreen().catch(() => {});}
            return;
        }
        if (document.fullscreenElement === player || !player.requestFullscreen) {pendingfullscreen = false; return;}
        if (!navigator.userActivation?.isActive) {return;}
        pendingfullscreen = false;
        await player.requestFullscreen().catch(() => {});
    }

    function error(text) {
        const label = document.querySelector(".playerstatus");
        label.textContent = "game stopped: " + text;
        label.hidden = false;
        status(label.textContent);
    }

    function saves(files) {
        const present = new Set();
        for (const [path, bytes] of files) {
            present.add(path);
            const existing = previous.get(path);
            if (!existing || existing.length !== bytes.length || !existing.every((value, index) => value === bytes[index])) {
                save.writeFile(path, bytes);
                previous.set(path, bytes.slice());
            }
        }
        for (const path of previous.keys()) {
            if (!present.has(path)) {save.removeFile(path); previous.delete(path);}
        }
    }

    try {
        await Promise.race([loaded, new Promise((resolve, reject) => setTimeout(() => reject(new Error("The Studio player did not load.")), 15000))]);
        runner = frame.contentWindow.runner;
        if (!runner) {throw new Error("The Studio player could not initialize.");}
        const size = await runner.start(game, JSON.parse(save.backup()), {
            saves, error,
            fullscreen: () => document.fullscreenElement === player,
            setfullscreen,
            log(text) {
                if (messages.length < 100) {messages.push(text.slice(0, 2000));}
                report.textContent = messages.join("\n");
                if (/warn|(?:audio|sound|music).*(?:missing|not found|failed|error)|(?:missing|failed|error).*(?:audio|sound|music)/i.test(text)) {warning(text);}
            }
        });
        document.querySelector(".gamename").textContent = game.name;
        savelabel.textContent = "";
        input = controls(canvas, state => {
            const next = new Set(state.keysHeld);
            for (const code of next) {if (!held.has(code)) {runner.key(code, true);}}
            for (const code of held) {if (!next.has(code)) {runner.key(code, false);}}
            held.clear();
            for (const code of next) {held.add(code);}
        });
        const touchquery = matchMedia("(any-pointer: coarse)");
        function touchlayout() {
            player.classList.toggle("touchdevice", touchquery.matches || navigator.maxTouchPoints > 0);
            input.clear();
        }
        touchlayout();
        touchquery.addEventListener("change", touchlayout, options);
        window.addEventListener("resize", touchlayout, options);
        for (const type of ["keydown", "keyup"]) {
            frame.contentWindow.addEventListener(type, event => {
                event.preventDefault();
                input.key(event.keyCode, type === "keydown");
                runner.resume();
                if (pendingfullscreen && event.isTrusted) {void setfullscreen(true);}
            }, options);
        }
        frame.contentWindow.addEventListener("blur", () => input.clear(), options);
        frame.contentWindow.addEventListener("pointermove", () => player.dispatchEvent(new Event("pointermove", {bubbles: true})), options);
        const settings = document.querySelector(".settings");
        const panel = document.querySelector(".gameoptions");
        panel.hidden = true;
        settings.setAttribute("aria-expanded", "false");
        settings.addEventListener("click", () => {
            input.clear();
            panel.hidden = !panel.hidden;
            settings.setAttribute("aria-expanded", String(!panel.hidden));
        }, options);
        document.querySelector(".restart").addEventListener("click", () => {void restart?.();}, options);
        const fullscreen = document.querySelector(".fullscreen");
        fullscreen.hidden = !player.requestFullscreen;
        fullscreen.addEventListener("click", () => {void player.requestFullscreen?.().catch(error);}, options);
        window.addEventListener("keydown", event => {
            if (pendingfullscreen && event.isTrusted) {void setfullscreen(true);}
        }, options);
        for (const type of ["pointerdown", "keydown"]) {player.addEventListener(type, event => {
            runner.resume();
            if (pendingfullscreen && event.isTrusted) {void setfullscreen(true);}
        }, options);}
        status("running - experimental compatibility");
        monitor = metrics(() => runner.stats());
        return {
            save,
            snapshot: () => ({engine: "studio", width: size.width, height: size.height}),
            async dispose() {
                if (disposed) {return;}
                disposed = true;
                controller.abort();
                monitor.dispose();
                input.dispose();
                await runner.stop();
                frame.remove();
                canvas.hidden = false;
                if (document.fullscreenElement === player) {await document.exitFullscreen().catch(() => {});}
            }
        };
    } catch (failure) {
        controller.abort();
        monitor?.dispose();
        input?.dispose();
        if (runner) {await runner.stop().catch(() => {});}
        frame.remove();
        canvas.hidden = false;
        throw failure;
    }
}
