import {skin,asksetup,notice} from "./helpers.js";
import {loginrequest} from "./bookmarklet.js";
import {verifyrequest} from "./verification.js";

export function setuprequest(mode, data) {
    const bytes = new TextEncoder().encode(JSON.stringify({version:2,mode,data}));
    return "sticker banner setup\n" + btoa(Array.from(bytes,value => String.fromCharCode(value)).join(""));
}

export function launcher() {
    const source = "(" + launchrequest.toString() + ")(" + loginrequest.toString() + "," + verifyrequest.toString() + "," + skin.toString() + "," + asksetup.toString() + "," + notice.toString() + ")";
    return "javascript:" + encodeURIComponent(source);
}

/*//////////////////////////////////////////////////////////////////////*/

export async function launchrequest(login, verify, skin, ask, notice) {
    if (location.origin !== "https://www.tiktok.com") {if (notice) notice(skin,"open www.tiktok.com, then run this bookmark again."); else alert("open www.tiktok.com, then run this bookmark again."); return;}
    const text = ask ? await ask(skin) : prompt("paste the setup copied from the sticker banner tool");
    if (text === null) return;
    try {
        const encoded = text.trim().replace(/^sticker banner setup\s*/,"");
        if (!encoded || encoded.length > 100000) throw Error("copy fresh setup data from the sticker banner tool");
        const setup = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded),value => value.charCodeAt(0))));
        if (setup?.version !== 2) throw Error("update the tiktok helper bookmark, then copy fresh setup data");
        if (setup.mode === "login") await login(setup.data,skin);
        else if (setup.mode === "verify") await verify(setup.data,skin);
        else throw Error("copy fresh setup data from the sticker banner tool");
    } catch (error) {if (notice) notice(skin,error.message.toLowerCase()); else alert(error.message.toLowerCase());}
}
