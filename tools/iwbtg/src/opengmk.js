import {controls} from "./controls.js";
import {savehost} from "./storage.js";
import plugin from "../vendor/opengmk/host.js";

/*//////////////////////////////////////////////////////////////////////*/

const codes = new Map([[8, "Backspace"], [9, "Tab"], [13, "Enter"], [16, "ShiftLeft"], [17, "ControlLeft"], [18, "AltLeft"], [27, "Escape"], [32, "Space"], [37, "ArrowLeft"], [38, "ArrowUp"], [39, "ArrowRight"], [40, "ArrowDown"]]);
function keycode(value) {
    return codes.get(value) || (value >= 65 && value <= 90 ? "Key" + String.fromCharCode(value) : value >= 48 && value <= 57 ? "Digit" + String.fromCharCode(value) : value >= 112 && value <= 123 ? "F" + (value - 111) : "");
}

export async function playopengmk(game, status, restart) {
    if (!crossOriginIsolated || !globalThis.SharedArrayBuffer) {throw new Error("Reload this page to enable the GameMaker player. Use HTTPS or localhost.");}
    const canvas = document.querySelector(".gamecanvas");
    const player = document.querySelector(".player");
    const label = document.querySelector(".savestatus");
    const report = document.querySelector(".diagnostics");
    const dialog = document.querySelector(".prompt");
    const save = savehost(game.id, game.files, text => {label.textContent = text;});
    const controller = new AbortController();
    const options = {signal: controller.signal};
    const held = new Set();
    let runner;
    let input;
    let timer;
    let stopped = false;
    let answer;
    let paused = false;
    const pausebutton = document.querySelector(".pause");
    const pauseparent = pausebutton.parentElement;
    const pausenext = pausebutton.nextSibling;
    let width = 800;
    let height = 608;
    let failure;
    function error(code, detail) {
        failure = new Error(detail || code);
        report.textContent = code + "\n" + failure.message;
        const message = document.querySelector(".playerstatus");
        message.textContent = "game stopped: " + failure.message;
        message.hidden = false;
        status(message.textContent);
        input?.clear();
    }
    function show(request) {
        input?.clear();
        const text = request.text.replaceAll("\ufffd|\ufffd[\ufffdY\ufffd\ufffd", "ポーズ中").trim();
        document.querySelector(".prompttext").textContent = text;
        paused = !request.input && request.buttons.length === 1 && /pause|ポーズ|暂停|暫停|пауза/i.test(text);
        if (paused) {dialog.append(pausebutton);}
        const buttons = document.querySelector(".promptbuttons");
        buttons.replaceChildren();
        let field;
        if (request.input) {
            field = document.createElement("input");
            field.type = "text";
            field.value = request.input.initial || "";
            field.setAttribute("aria-label", request.text);
            if (request.input.kind === "integer") {field.inputMode = "numeric";}
            buttons.append(field);
        }
        for (const item of request.buttons) {
            const button = document.createElement("button");
            button.textContent = item.label;
            button.value = String(item.value);
            buttons.append(button);
        }
        return new Promise(resolve => {
            answer = () => {resolve({button: Number(dialog.returnValue), value: field?.value || ""}); answer = null;};
            dialog.returnValue = "-1";
            dialog.showModal();
        });
    }
    dialog.addEventListener("cancel", event => event.preventDefault(), options);
    function restorepause() {
        if (pausebutton.parentElement === dialog) {pauseparent.insertBefore(pausebutton, pausenext);}
        paused = false;
    }
    dialog.addEventListener("close", () => {
        restorepause();
        answer?.();
        canvas.focus({preventScroll: true});
    }, options);
    function resume(event) {
        if (!paused || !dialog.open) {return;}
        if (event.type === "keydown" && event.code !== "KeyP") {return;}
        event.preventDefault();
        event.stopImmediatePropagation();
        input?.clear();
        dialog.close(dialog.querySelector(".promptbuttons button").value);
    }
    pausebutton.addEventListener("pointerdown", resume, {...options, capture: true});
    pausebutton.addEventListener("click", resume, {...options, capture: true});
    window.addEventListener("keydown", resume, {...options, capture: true});
    function dispose() {
        if (stopped) {return;}
        stopped = true;
        cancelAnimationFrame(timer);
        input?.dispose();
        if (dialog.open) {dialog.close("-1");}
        restorepause();
        answer?.();
        controller.abort();
        runner?.dispose();
        if (document.fullscreenElement === player) {void document.exitFullscreen().catch(() => {});}
    }
    document.querySelector(".exitgame").addEventListener("click", dispose, options);
    try {
        runner = await plugin.create({
            game: game.id, launchArgs: [], settings: {},
            assets: {base: new URL("../vendor/opengmk/", import.meta.url).href},
            surface: {canvas: canvas.transferControlToOffscreen(), reportSize(w, h) {width = w; height = h;}},
            replica: save.replica,
            network: {ports: [], connect() {return null;}},
            window: {setTitle() {}, setFullscreen() {}, isFullscreen() {return document.fullscreenElement === player;}},
            dialogs: {show}, events: {onError: error}
        });
        if (stopped) {runner.dispose(); throw new Error("Game closed.");}
        const manifest = JSON.parse(new TextDecoder().decode(new Map(game.files).get("manifest.json")));
        const files = game.files.filter(([path]) => path !== "manifest.json").sort(([a], [b]) => Number(b === manifest.entry) - Number(a === manifest.entry));
        let deadline;
        try {
            await Promise.race([
                runner.start({files: files.map(([path, bytes]) => ({path, read: async () => bytes}))}),
                new Promise((resolve, reject) => {deadline = setTimeout(() => reject(new Error("Game startup timed out.")), 60000);})
            ]);
        } finally {clearTimeout(deadline);}
        if (failure) {throw failure;}
        input = controls(canvas, state => {
            const next = new Set(state.keysHeld);
            for (const value of next) {if (!held.has(value)) {runner.sendInput({kind: "key-down", code: keycode(value)});}}
            for (const value of held) {if (!next.has(value)) {runner.sendInput({kind: "key-up", code: keycode(value)});}}
            held.clear();
            for (const value of next) {held.add(value);}
        });
        const query = matchMedia("(any-pointer: coarse)");
        function layout() {player.classList.toggle("touchdevice", query.matches || navigator.maxTouchPoints > 0); input.clear();}
        layout();
        query.addEventListener("change", layout, options);
        window.addEventListener("resize", layout, options);
        window.addEventListener("blur", () => runner.sendInput({kind: "focus-lost"}), options);
        for (const type of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
            canvas.addEventListener(type, event => {
                const box = canvas.getBoundingClientRect();
                const scale = Math.min(box.width / width, box.height / height);
                const x = (event.clientX - box.left - (box.width - width * scale) / 2) / scale;
                const y = (event.clientY - box.top - (box.height - height * scale) / 2) / scale;
                if (type === "pointerdown") {canvas.setPointerCapture(event.pointerId);}
                runner.sendInput({kind: type === "pointermove" ? "pointer-move" : type === "pointerdown" ? "pointer-down" : "pointer-up", x, y, button: ["left", "middle", "right"][event.button] || "left"});
            }, options);
        }
        canvas.addEventListener("contextmenu", event => event.preventDefault(), options);
        canvas.addEventListener("wheel", event => {event.preventDefault(); runner.sendInput({kind: "wheel", delta: event.deltaY});}, {...options, passive: false});
        const settings = document.querySelector(".settings");
        const panel = document.querySelector(".gameoptions");
        panel.hidden = true;
        settings.setAttribute("aria-expanded", "false");
        settings.addEventListener("click", () => {input.clear(); panel.hidden = !panel.hidden; settings.setAttribute("aria-expanded", String(!panel.hidden));}, options);
        document.querySelector(".restart").addEventListener("click", () => {void restart?.();}, options);
        const fullscreen = document.querySelector(".fullscreen");
        fullscreen.hidden = !player.requestFullscreen;
        fullscreen.addEventListener("click", () => {void player.requestFullscreen?.().catch(failed => status(failed.message));}, options);
        document.querySelector(".gamename").textContent = game.name;
        label.textContent = "saves are kept separately for this game";
        report.textContent = "OpenGMK 0.2.3";
        function tick(now) {
            if (stopped || failure) {return;}
            if (!document.hidden) {Promise.resolve(runner.step(now)).then(running => {if (!running && !stopped && !failure) {status("game ended"); dispose();}}, failed => error("runtime", failed.message));}
            timer = requestAnimationFrame(tick);
        }
        timer = requestAnimationFrame(tick);
        status("running");
        return {save, snapshot: () => runner.stats(), dispose};
    } catch (failed) {dispose(); throw new Error(failed.detail || failed.message || String(failed));}
}
