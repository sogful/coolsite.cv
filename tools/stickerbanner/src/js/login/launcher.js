import {skin} from "./helpers.js";
import {loginrequest} from "./bookmarklet.js";
import {verifyrequest} from "./verification.js";

export function setuprequest(mode, data) {
    const request = mode === "verify" ? verifyrequest : loginrequest;
    const script = "return (" + request.toString() + ")(data," + skin.toString() + ");";
    const bytes = new TextEncoder().encode(JSON.stringify({version:3,mode,data,script}));
    return "sticker banner setup\n" + btoa(Array.from(bytes,value => String.fromCharCode(value)).join(""));
}

export function launcher() {
    return "javascript:" + encodeURIComponent("void (" + launchrequest.toString() + ")()");
}

/*//////////////////////////////////////////////////////////////////////*/

export function launchrequest() {
    if (location.origin !== "https://www.tiktok.com") {alert("open www.tiktok.com, then run this bookmark again."); return;}
    document.querySelector(".stickersetuppanel")?.remove();
    const panel = document.createElement("dialog");
    panel.className = "stickersetuppanel";
    const scale = Math.max(1,1 / (visualViewport?.scale || 1));
    panel.style.cssText = `
        position:fixed; inset:0;
        margin:auto; box-sizing:border-box;
        border:0; border-radius:8px;
        padding:24px; background:#ffffff;
        color:#161823; max-height:85vh;
        overflow:auto; font:16px TikTokFont,Arial,sans-serif;
    `;
    panel.style.width = Math.min(480,(visualViewport?.width || innerWidth) / scale - 32) + "px";
    panel.style.zoom = scale;
    panel.innerHTML = `
        <h2 style="margin:0 0 16px">connect your tiktok</h2>
        <p>paste the setup from your clipboard, then press continue.</p>
        <input type="text" autocomplete="off" autocapitalize="off" aria-label="login setup" style="box-sizing:border-box; width:100%;
            padding:12px; font:inherit;
            -webkit-text-security:disc">
        <p class="stickererror" role="status"></p>
        <button style="width:100%; padding:12px;
            border:0; border-radius:4px;
            font:inherit; background:#fe2c55;
            color:#ffffff">continue</button>
        <button style="width:100%; padding:12px;
            border:0; margin-top:12px;
            font:inherit">close</button>
    `;
    const buttons = panel.querySelectorAll("button");
    buttons[1].onclick = () => panel.remove();
    buttons[0].onclick = async () => {
        try {
            const text = panel.querySelector("input").value.trim().replace(/^sticker banner setup\s*/,"");
            if (!text || text.length > 100000) throw Error("paste fresh setup from the sticker banner tool");
            const setup = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(text),value => value.charCodeAt(0))));
            if (setup.version !== 3 || !["login","verify"].includes(setup.mode) || typeof setup.script !== "string") throw Error("copy fresh setup from the sticker banner tool");
            panel.querySelector("input").blur();
            await new Function("data",setup.script)(setup.data);
            panel.remove();
        } catch (error) {panel.querySelector(".stickererror").textContent = error.message.toLowerCase();}
    };
    for (const name of ["keydown","keypress","keyup"]) panel.addEventListener(name,event => event.stopPropagation());
    document.body.append(panel);
    panel.showModal();
}
