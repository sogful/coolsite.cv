import {instantiateWasmRuntimeBridge as instantiate, createWebAudioHost as createaudio, WasmRuntimeSession as runtimesession, renderWasmFrame as renderframe, ResourceCache as resourcecache} from "../vendor/runtime.js";
import {controls} from "./controls.js";
import {nativeactions} from "./compatibility.js";
import {savehost} from "./storage.js";
import {warning} from "./interface.js";

/*//////////////////////////////////////////////////////////////////////*/

export async function play(game, status, restart) {
    const files = new Map(game.files);
    const decoder = new TextDecoder();
    function json(path) {
        const bytes = files.get(path);
        if (!bytes) {throw new Error("Missing converted file: " + path);}
        return JSON.parse(decoder.decode(bytes));
    }
    const manifest = json("manifest.json");
    if (manifest.engine_family === "studio") {
        const {playstudio} = await import("./studio.js");
        return playstudio(game, status, restart);
    }
    if (manifest.engine_family === "opengmk") {
        const {playopengmk} = await import("./opengmk.js");
        return playopengmk(game, status, restart);
    }
    const pkg = {
        manifest, rooms: json("rooms.json"), objects: json("objects.json"), scripts: json("scripts.ir.json"),
        rawLogic: json("logic.raw.json"), loweredLogic: json("logic.lowered.json"),
        analysis: json("analysis.json"), resources: json(manifest.resource_index_path)
    };
    nativeactions(pkg);
    const canvas = document.querySelector(".gamecanvas");
    const player = document.querySelector(".player");
    const savelabel = document.querySelector(".savestatus");
    const save = savehost(game.id, game.files, text => {savelabel.textContent = text;});
    const urls = new Map();
    const cache = new resourcecache();
    const original = cache.getImage.bind(cache);
    const cached = cache.getCachedImage.bind(cache);
    function resource(path) {
        const name = path.replace(/^\/+/, "");
        if (!urls.has(name)) {
            const bytes = files.get(name);
            if (!bytes) {throw new Error("Missing game resource: " + name);}
            urls.set(name, URL.createObjectURL(new Blob([bytes])));
        }
        return urls.get(name);
    }
    cache.getImage = path => original(resource(path));
    cache.getCachedImage = path => cached(resource(path));
    const context = new AudioContext();
    const audio = createaudio({audioContext: context, fetch: async path => {
        const bytes = files.get(String(path).replace(/^\/+/, ""));
        if (!bytes) {warning("Missing audio: " + path);}
        return new Response(bytes || null, {status: bytes ? 200 : 404});
    }});
    audio.configurePackage(pkg, "");
    let bridge;
    try {bridge = await instantiate(new URL("../vendor/runtime.wasm", import.meta.url), {}, {audioHost: audio, fileHost: save});}
    catch (error) {await context.close(); throw error;}
    let snapshot;
    try {snapshot = await bridge.boot(pkg);}
    catch (error) {await context.close(); throw error;}
    const session = new runtimesession(bridge);
    const input = controls(canvas, state => session.setInputState(state));
    const controller = new AbortController();
    const options = {signal: controller.signal};
    const touchquery = matchMedia("(any-pointer: coarse)");
    const report = document.querySelector(".diagnostics");
    const dialog = document.querySelector(".prompt");
    const warnings = new Set([...(manifest.warnings || []), ...(pkg.analysis.unsupported_features || [])]);
    let stopped = false;
    let halted = false;
    let previous = 0;
    let elapsed = 0;
    let timer = 0;
    let pending = false;
    document.querySelector(".gamename").textContent = game.name;
    savelabel.textContent = "";
    function touchlayout() {
        player.classList.toggle("touchdevice", touchquery.matches || navigator.maxTouchPoints > 0);
        input.clear();
    }
    touchlayout();
    touchquery.addEventListener("change", touchlayout, options);
    window.addEventListener("resize", touchlayout, options);

    function reportstate() {
        for (const line of snapshot.diagnostics || []) {if (warnings.size < 200) {warnings.add(line);}}
        report.textContent = "GameMaker 8 / 8.1\nCompatibility: experimental\nRooms: " + manifest.room_count + "\n" + [...warnings].join("\n");
    }

    function fatal(error) {
        halted = true;
        const message = document.querySelector(".playerstatus");
        message.textContent = "game stopped: " + (error.message || error);
        message.hidden = false;
        input.clear();
        audio.stopAllSounds();
        status("game stopped: " + (error.message || error));
        warnings.add(error.message || String(error));
        reportstate();
    }

    async function draw() {
        await renderframe(canvas, await bridge.frame(), pkg.resources, "", cache);
        reportstate();
    }

    function prompt() {
        if (!snapshot.pendingDialog || dialog.open) {return;}
        input.clear();
        document.querySelector(".prompttext").textContent = snapshot.pendingDialog.text;
        const buttons = document.querySelector(".promptbuttons");
        buttons.replaceChildren();
        const answers = snapshot.pendingDialog.kind === "question" ? [["yes", "yes"], ["no", "no"]] : [["ok", "accepted"]];
        for (const [label, value] of answers) {
            const button = document.createElement("button");
            button.textContent = label;
            button.value = value;
            buttons.append(button);
        }
        dialog.showModal();
    }

    async function tick(now) {
        if (stopped) {return;}
        const delta = previous ? Math.min(250, now - previous) : 0;
        previous = now;
        if (!halted && !document.hidden && !pending && !dialog.open) {
            pending = true;
            try {
                elapsed += delta;
                let steps = 0;
                let frame;
                while (elapsed >= 1000 / Math.max(1, Math.min(240, snapshot.roomSpeed || 50)) && steps < 8) {
                    const duration = 1000 / Math.max(1, Math.min(240, snapshot.roomSpeed || 50));
                    const result = await session.stepOnce();
                    snapshot = result.snapshot;
                    frame = result.frame;
                    elapsed -= duration;
                    steps++;
                    if (snapshot.pendingDialog) {break;}
                }
                if (frame) {await renderframe(canvas, frame, pkg.resources, "", cache);}
                if (steps === 8) {elapsed = 0;}
                if (snapshot.tick % 60 === 0) {reportstate();}
                prompt();
            } catch (error) {fatal(error);}
            finally {pending = false;}
        } else {elapsed = 0;}
        if (!stopped) {timer = requestAnimationFrame(tick);}
    }

    document.querySelector(".restart").addEventListener("click", async () => {
        halted = true;
        input.clear();
        audio.stopAllSounds();
        try {snapshot = await bridge.reset(); await draw(); halted = false; document.querySelector(".playerstatus").hidden = true; status("running - experimental compatibility");}
        catch (error) {fatal(error);}
    }, options);
    const settings = document.querySelector(".settings");
    const panel = document.querySelector(".gameoptions");
    panel.hidden = true;
    settings.setAttribute("aria-expanded", "false");
    settings.addEventListener("click", () => {
        input.clear();
        panel.hidden = !panel.hidden;
        settings.setAttribute("aria-expanded", String(!panel.hidden));
    }, options);
    const fullscreen = document.querySelector(".fullscreen");
    fullscreen.hidden = !player.requestFullscreen;
    fullscreen.addEventListener("click", () => {
        player.requestFullscreen?.().catch(error => status(error.message));
    }, options);
    dialog.addEventListener("cancel", event => event.preventDefault(), options);
    dialog.addEventListener("close", async () => {
        if (stopped) {return;}
        pending = true;
        try {
            const event = snapshot.pendingDialog?.site.match(/:event:9:(\d+):/);
            snapshot = await bridge.dialogResponse(dialog.returnValue || "accepted");
            const result = event ? await bridge.step({left: false, right: false, jump: false, restart: false, keysHeld: [Number(event[1])], keysPressed: [Number(event[1])], keysReleased: []}) : await session.stepOnce();
            snapshot = result.snapshot;
            await renderframe(canvas, result.frame, pkg.resources, "", cache);
        } catch (error) {fatal(error);}
        finally {pending = false; previous = 0;}
    }, options);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {void context.suspend();}
        else if (!halted) {void context.resume();}
        previous = 0;
    }, options);
    for (const type of ["pointerdown", "keydown"]) {
        player.addEventListener(type, () => {if (!halted) {void context.resume();}}, options);
    }
    try {await draw();}
    catch (error) {input.dispose(); controller.abort(); audio.stopAllSounds(); await context.close(); for (const url of urls.values()) {URL.revokeObjectURL(url);} throw error;}
    status("running - experimental compatibility");
    timer = requestAnimationFrame(tick);
    return {
        save,
        snapshot: () => snapshot,
        async dispose() {
            stopped = true;
            cancelAnimationFrame(timer);
            controller.abort();
            input.dispose();
            if (dialog.open) {dialog.close();}
            if (document.fullscreenElement === player) {await document.exitFullscreen().catch(() => {});}
            audio.stopAllSounds();
            await context.close();
            for (const url of urls.values()) {URL.revokeObjectURL(url);}
        }
    };
}
