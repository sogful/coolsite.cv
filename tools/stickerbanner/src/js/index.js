import {convertvideo} from "../../../../assets/static/js/gifski/conversion.js?v=20261108";
import {geometry, positions as gridpositions, tilecrop as layoutcrop} from "./editor/geometry.js";
import {launcher, setuprequest} from "./login/launcher.js?v=20261109d";
import {createtransport, readrequest, verification} from "./tiktok/transport.js?v=20261109d";
import {tiktok} from "./tiktok/tiktok.js?v=20261109d";
import {publishbanner} from "./tiktok/publisher.js?v=20261109d";
import {createwizard} from "./login/wizard.js?v=20261109g";
import {savesession, loadsession, forgetsession} from "./login/session.js?v=20261109d";
import {plans, nextplan} from "./editor/automatic.js?v=20261109d";
import {createplayback} from "./editor/playback.js?v=20261109d";
import {createworkspace} from "./editor/workspace.js?v=20261109d";
import qrcode from "../../../../assets/static/js/qrcode/index.js";

const form = document.querySelector(".settings");
const source = document.querySelector(".source");
const status = document.querySelector(".status");
const progress = document.querySelector(".progress");
const preview = document.querySelector(".preview");
const grid = document.querySelector(".grid");
const stop = document.querySelector(".stop");
const download = document.querySelector(".download");
const publish = document.querySelector(".publish");
const accountlabel = document.querySelector(".account");
const publishstatus = document.querySelector(".publishstatus");
const flow = createwizard();
const sessionstatus = document.querySelector(".sessionstatus");
let positions = gridpositions(2);
const urls = [];
let video = null;
let controller = null;
let archive = null;
let account = "";
let publishing = false;
let revision = 0;
let browserclient = null;
let browsertransport = null;
let authentication = null;
let loginsetup = "";
let loginexpires = 0;
let logindeadline = 0;
let logintimer = null;
let pendingverification = null;
let restoring = false;
let deferredclipboard = true;
let sessionrevision = 0;
let sessionqueue = Promise.resolve();
const profilewidth = document.querySelector(".profilewidth");
const banner = document.querySelector(".banner");
if (matchMedia("(pointer:coarse), (max-width:600px)").matches) profilewidth.value = Math.max(240,Math.min(1600,document.documentElement.clientWidth));
const workspace = createworkspace(flow);
const player = createplayback(drawpreview,reset);
reset();
document.addEventListener("bannertheme",() => {if (!archive) drawpreview();});

/*//////////////////////////////////////////////////////////////////////*/

source.addEventListener("change", async ()=>{
    const current = ++revision;
    reset();
    player.pause();
    video = null;
    preview.hidden = true;
    grid.hidden = false;
    const file = source.files[0];
    if (!file) return;
    status.textContent = "reading video";
    try {
        const parser = globalThis.MP4Box.createFile();
        let track = null;
        parser.onReady = information=>{track = information.videoTracks[0];};
        parser.onError = ()=>{throw Error("choose a supported mp4 video");};
        const bytes = await file.arrayBuffer();
        bytes.fileStart = 0;
        parser.appendBuffer(bytes);
        parser.flush();
        if (current !== revision) return;
        if (!track) throw Error("choose a supported mp4 video");
        const duration = track.duration / track.timescale;
        video = {videoWidth: track.video.width, videoHeight: track.video.height, duration, frame: null};
        const fps = track.nb_samples * track.timescale / track.duration;
        video.fps = fps;
        document.querySelector(".start").value = 0;
        document.querySelector(".end").value = Math.floor(duration * 1000) / 1000;
        document.querySelector(".metadata").textContent = `${video.videoWidth}x${video.videoHeight}, ${duration.toFixed(2)} seconds, ${Math.round(fps)} fps`;
        status.textContent = "";
        video.frame = player.media;
        await player.load(file,fps);
        if (current !== revision) return;
        document.querySelector(".end").value = Math.min(duration,player.media.duration);
        player.refresh();
        for (const tile of grid.children) tile.classList.remove("tileplaceholder");
        drawpreview();
    } catch (error) {if (current === revision) status.textContent = error.message.toLowerCase();}
});

for (const input of document.querySelectorAll(".start,.end,.fit,.rowcount,.profilewidth")) input.addEventListener("change", async ()=>{
    reset();
    workspace.fit();
    if (input.matches(".start")) player.media.currentTime = Number(input.value);
    player.refresh();
    drawpreview();
});
stop.addEventListener("click", ()=>controller?.abort());

form.addEventListener("submit", async event=>{
    event.preventDefault();
    if (controller || publishing) return;
    reset();
    if (!video?.videoWidth || !source.files[0]) {status.textContent = "choose a video first"; return;}
    const start = Number(document.querySelector(".start").value);
    const end = Number(document.querySelector(".end").value);
    const rows = Number(document.querySelector(".rowcount").value);
    const count = rows * 3;
    if (!(end > start && end <= video.duration + 0.001 && (end - start) * video.fps >= 2)) {
        status.textContent = "choose a range inside the video with at least two frames";
        return;
    }
    player.pause();
    controller = new AbortController();
    setbusy(true);
    progress.hidden = false;
    grid.classList.add("processing");
    try {
        let tiles = null;
        let chosen = null;
        const candidates = plans(end - start,video.fps,rows);
        for (let pass = 0; pass < candidates.length;) {
            const plan = candidates[pass];
            let following = pass + 1;
            const attempt = [];
            let fits = true;
            for (let index = count - 1; index >= 0; index -= 1) {
                const order = count - index;
                for (const [position,tile] of [...grid.children].entries()) {
                    tile.classList.toggle("current",position === index);
                    tile.dataset.order = String(order);
                }
                const timeout = new AbortController();
                let timer = setTimeout(() => timeout.abort(),120000);
                let activity = "";
                const file = await convertvideo(source.files[0],{...plan,start,duration:end - start,crop:tilecrop(index)},(value,stage) => {
                    status.textContent = `${order}/${count}: ${stage.toLowerCase()} ${value}%${pass ? ` (fit ${pass + 1}/${candidates.length})` : ""}`;
                    const current = stage + ":" + value;
                    if (activity !== current) {
                        activity = current;
                        clearTimeout(timer);
                        timer = setTimeout(() => timeout.abort(),120000);
                    }
                    progress.value = ((order - 1) * 100 + value) / count;
                },AbortSignal.any([controller.signal,timeout.signal])).catch(error => {
                    if (timeout.signal.aborted && !controller.signal.aborted) throw Error("the encoder stopped responding. try a shorter trim range.");
                    throw error;
                }).finally(() => clearTimeout(timer));
                if (file.size > plan.limit) {fits = false; following = nextplan(candidates,pass,file.size); break;}
                attempt.push({file,index,name:`${String(order).padStart(2,"0")}-${positions[index]}.gif`});
            }
            if (fits) {tiles = attempt; chosen = plan; break;}
            pass = following;
            status.textContent = "fitting the banner";
        }
        if (!tiles) throw Error("this range is too complex. drag the trim handles closer together and try again.");
        const zip = new globalThis.JSZip();
        const manifest = {
            version:2,columns:3,rows,width:chosen.width,height:chosen.width,fps:chosen.fps,
            duration:end - start,frames:Math.max(2,Math.round((end - start) * chosen.fps)),limit:chosen.limit,
            layout:{profile:geometry(profilewidth.value,rows).profile,padding:16,gap:8,radius:4},files:[]
        };
        for (const tile of tiles) {
            const bytes = await tile.file.arrayBuffer();
            const hash = await crypto.subtle.digest("SHA-256",bytes);
            const sha = Array.from(new Uint8Array(hash),value => value.toString(16).padStart(2,"0")).join("");
            manifest.files.push({name:tile.name,position:positions[tile.index],bytes:tile.file.size,sha256:sha});
            zip.file(tile.name,bytes);
        }
        zip.file("manifest.json",JSON.stringify(manifest,null,2));
        archive = await zip.generateAsync({type:"blob",compression:"STORE"});
        if (controller.signal.aborted) throw Error("stopped");
        grid.replaceChildren();
        grid.hidden = false;
        for (const {file,index,name} of tiles.reverse()) {
            const figure = document.createElement("figure");
            figure.className = "tile";
            const image = document.createElement("img");
            image.className = "tileimage";
            image.src = objecturl(file);
            image.alt = positions[index];
            figure.append(image);
            grid.append(figure);
        }
        preview.hidden = true;
        await player.show(tiles.map(tile => tile.file));
        if (controller.signal.aborted) throw Error("stopped");
        download.href = objecturl(archive);
        download.download = "sticker-banner.zip";
        download.hidden = false;
        progress.value = 100;
        status.textContent = `${count} stickers ready. ${chosen.width}px, ${Math.round(chosen.fps)} fps.`;
    } catch (error) {
        reset();
        status.textContent = controller.signal.aborted ? "stopped" : error.message.toLowerCase();
    } finally {controller = null; grid.classList.remove("processing"); for (const tile of grid.children) tile.classList.remove("current"); setbusy(false);}
});

/*//////////////////////////////////////////////////////////////////////*/

function tilecrop(index) {
    return layoutcrop(index,video.videoWidth,video.videoHeight,document.querySelector(".fit").value,profilewidth.value,Number(document.querySelector(".rowcount").value));
}

function drawpreview() {
    if (!video?.frame || video.frame.readyState < 2) return;
    preview.hidden = false;
    grid.hidden = false;
    const rows = Number(document.querySelector(".rowcount").value);
    const layout = geometry(profilewidth.value,rows);
    const unit = 3;
    const width = Math.round(layout.profile * unit);
    const height = Math.round((layout.tile * rows + 8 * (rows - 1) + 16) * unit);
    if (preview.width !== width) preview.width = width;
    if (preview.height !== height) preview.height = height;
    const context = preview.getContext("2d");
    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, preview.width, preview.height);
    for (let index = 0; index < positions.length; index += 1) {
        const crop = tilecrop(index);
        const scale = video.frame.videoWidth / video.videoWidth;
        const scaleheight = video.frame.videoHeight / video.videoHeight;
        const left = (16 + index % 3 * (layout.tile + 8)) * unit;
        const top = (8 + Math.floor(index / 3) * (layout.tile + 8)) * unit;
        const size = layout.tile * unit;
        context.save();
        context.beginPath();
        context.roundRect(left,top,size,size,4 * unit);
        context.clip();
        context.fillStyle = "#000000";
        context.fillRect(left,top,size,size);
        context.drawImage(video.frame,crop.x * scale,crop.y * scaleheight,crop.width * scale,crop.height * scaleheight,left,top,size,size);
        context.restore();
    }
}

function objecturl(blob) {
    const url = URL.createObjectURL(blob);
    urls.push(url);
    return url;
}

function reset() {
    archive = null;
    player.reset();
    progress.hidden = true;
    progress.value = 0;
    publish.disabled = true;
    document.querySelector(".publishbar").disabled = true;
    download.hidden = true;
    flow.refresh();
    preview.hidden = !video?.frame;
    positions = gridpositions(Number(document.querySelector(".rowcount").value));
    grid.replaceChildren();
    grid.hidden = false;
    for (const position of positions) {
        const tile = document.createElement("div");
        tile.className = video?.frame ? "tile" : "tile tileplaceholder";
        grid.append(tile);
    }
    workspace.fit();
    while (urls.length) URL.revokeObjectURL(urls.pop());
}

function setbusy(busy) {
    for (const input of document.querySelectorAll(".settings input,.settings select,.settings button,.fit,.trimhandle")) input.disabled = busy;
    stop.disabled = !busy;
    stop.hidden = !busy;
    document.querySelector(".generate").hidden = busy;
    document.querySelector(".rowhandle").disabled = busy;
    document.querySelector(".publishbar").disabled = busy || !archive;
    publish.disabled = busy || !archive || !account || publishing;
    flow.refresh();
}

publish.addEventListener("click", async ()=>{
    if (!archive || !account || !browserclient || publishing || controller) return;
    const origin = document.querySelector(".origin");
    if (!origin.reportValidity()) return;
    publishing = true;
    setbusy(true);
    stop.disabled = true;
    for (const button of document.querySelectorAll(".connect, .disconnect")) button.disabled = true;
    try {
        await publishbanner(browserclient,archive,origin.value,account,message => {publishstatus.textContent = message;});
        flow.notify("published");
    } catch (error) {publishstatus.textContent = error.message.toLowerCase(); flow.notify("error");}
    finally {publishing = false; setbusy(false); for (const button of document.querySelectorAll(".connect, .disconnect")) button.disabled = false;}
});

/*//////////////////////////////////////////////////////////////////////*/

const helper = document.querySelector(".launcher");
helper.href = launcher();
helper.addEventListener("click",event => {
    event.preventDefault();
    publishstatus.textContent = "save the tiktok helper as a bookmark, then run it on tiktok";
});
document.querySelector(".copylauncher").addEventListener("click", async () => {
    try {await navigator.clipboard.writeText(helper.href); flow.notify("urlcopied");}
    catch {publishstatus.textContent = "clipboard unavailable. allow clipboard access, then press continue to try again."; flow.notify("error");}
});

/*//////////////////////////////////////////////////////////////////////*/

async function copylogin() {
    if (authentication || publishing) return;
    const button = document.querySelector(".copylogin");
    button.disabled = true;
    for (const item of document.querySelectorAll(".connect, .disconnect")) item.disabled = true;
    const content = (async () => {
        if (!browsertransport || !loginsetup) {
            loginsetup = "";
            loginexpires = 0;
            pendingverification = null;
            showlogintime();
            document.querySelector(".copyverify").hidden = true;
            browsertransport?.close();
            browsertransport = null;
            browserclient = null;
            account = "";
            accountlabel.textContent = "";
            document.querySelector(".disconnect").hidden = true;
            setbusy(Boolean(controller));
            publishstatus.textContent = "preparing tiktok login";
            const relay = new URLSearchParams(location.search).get("relay") || (await (await fetch(new URL("../relay.json",import.meta.url))).json()).url;
            if (!relay) throw Error("the browser relay is not configured");
            browsertransport = await createtransport(relay);
            await prepareqr();
        } else if (logindeadline - performance.now() < 10000) await prepareqr();
        return new Blob([loginsetup],{type:"text/plain"});
    })();
    content.catch(() => {});
    try {
        if (promisedclipboard()) await navigator.clipboard.write([new ClipboardItem({"text/plain":content})]);
        else {await content; await navigator.clipboard.writeText(loginsetup);}
        flow.notify("copied");
    } catch {
        let message = "clipboard unavailable. allow clipboard access, then press continue to try again.";
        try {await content; deferredclipboard = false;}
        catch (error) {message = error.message.toLowerCase();}
        publishstatus.textContent = message;
        flow.notify("error");
    } finally {
        button.disabled = false;
        for (const item of document.querySelectorAll(".connect, .disconnect")) item.disabled = false;
        flow.refresh();
    }
}

document.querySelector(".copylogin").addEventListener("click",copylogin);
document.querySelector(".copysetup").addEventListener("click",copylogin);

/*//////////////////////////////////////////////////////////////////////*/

document.querySelector(".connect").addEventListener("click", async () => {
    if (authentication || publishing) return;
    const field = document.querySelector(".loginrequest");
    let job;
    try {job = readrequest(field.value);}
    catch (error) {
        publishstatus.textContent = error.message.toLowerCase();
        flow.notify("error");
        return;
    }
    if (job.ticket) {
        let ticket;
        try {ticket = JSON.parse(pendingverification?.decision || "{}").passport_ticket;} catch {}
        if (!ticket || ticket !== job.ticket) {publishstatus.textContent = "paste the verified request from this login."; flow.notify("error"); return;}
        job.qr ||= pendingverification.job.qr;
    }
    if (!browsertransport || browsertransport.challenge !== new URL(job.url).searchParams.get("token")) {
        publishstatus.textContent = "this login is no longer available. prepare a new login.";
        flow.notify("expired");
        return;
    }
    let current;
    try {
        field.value = "";
        browserclient = null;
        account = "";
        setbusy(Boolean(controller));
        authentication = new AbortController();
        current = authentication;
        document.querySelector(".cancelauth").hidden = false;
        document.querySelector(".connect").disabled = true;
        document.querySelector(".disconnect").hidden = true;
        accountlabel.textContent = "connecting";
        current.signal.throwIfAborted();
        const approve = document.querySelector(".approve");
        approve.href = "snssdk1233://webview?hide_nav_bar=1&use_spark=1&url=" + encodeURIComponent(job.index);
        approve.hidden = false;
        document.querySelector(".loginqr").src = "data:image/png;base64," + job.qr;
        document.querySelector(".qrpanel").hidden = false;
        flow.notify("authstarted");
        await browsertransport.authenticate(job,current.signal,message => {publishstatus.textContent = message;});
        current.signal.throwIfAborted();
        const client = new tiktok(browsertransport,job.device);
        const user = await client.identity(job.account);
        await client.profile();
        browserclient = client;
        account = user.name;
        showaccount(user);
        accountlabel.textContent = "@" + account;
        loginsetup = "";
        loginexpires = 0;
        document.querySelector(".copylogin").textContent = "create tiktok login setup";
        publishstatus.textContent = "connected";
        document.querySelector(".disconnect").hidden = false;
        pendingverification = null;
        document.querySelector(".copyverify").hidden = true;
        showlogintime();
        watchsession();
        try {await persistlogin();} catch {sessionstatus.textContent = "login could not be saved. keep this page open.";}
        flow.notify("connected");
    } catch (error) {
        if (error instanceof verification) {
            pendingverification = {job,decision:error.decision};
            accountlabel.textContent = "verification required";
            document.querySelector(".copyverify").hidden = false;
            publishstatus.textContent = "";
            showlogintime();
            flow.notify("verification");
            return;
        }
        browsertransport?.close();
        browsertransport = null;
        browserclient = null;
        account = "";
        accountlabel.textContent = "";
        loginsetup = "";
        loginexpires = 0;
        document.querySelector(".copylogin").textContent = "create tiktok login setup";
        publishstatus.textContent = current?.signal.aborted ? "login cancelled" : error.message.toLowerCase();
        pendingverification = null;
        document.querySelector(".copyverify").hidden = true;
        showlogintime();
        flow.notify("loginfailed");
    } finally {
        authentication = null;
        document.querySelector(".connect").disabled = false;
        document.querySelector(".cancelauth").hidden = true;
        document.querySelector(".approve").hidden = true;
        document.querySelector(".qrpanel").hidden = true;
        document.querySelector(".loginqr").removeAttribute("src");
        setbusy(Boolean(controller));
    }
});

document.querySelector(".copyverify").addEventListener("click", async () => {
    if (!pendingverification || authentication || publishing) return;
    try {
        const seed = {job:{...pendingverification.job,qr:""},decision:pendingverification.decision};
        await navigator.clipboard.writeText(setuprequest("verify",seed));
        flow.notify("verificationcopied");
    } catch {publishstatus.textContent = "clipboard unavailable. allow clipboard access, then press continue to try again."; flow.notify("error");}
});

document.querySelector(".cancelauth").addEventListener("click", () => authentication?.abort());
document.querySelector(".disconnect").addEventListener("click", async () => {
    try {await clearlogin();} catch {sessionstatus.textContent = "saved login could not be removed. clear this site's browser data.";}
    browsertransport?.close();
    browsertransport = null;
    browserclient = null;
    account = "";
    loginsetup = "";
    loginexpires = 0;
    pendingverification = null;
    document.querySelector(".copyverify").hidden = true;
    document.querySelector(".copylogin").textContent = "create tiktok login setup";
    accountlabel.textContent = "";
    document.querySelector(".disconnect").hidden = true;
    publishstatus.textContent = "disconnected";
    showlogintime();
    flow.notify("disconnected");
    setbusy(Boolean(controller));
});

/*//////////////////////////////////////////////////////////////////////*/

function showaccount(user) {
    const details = document.querySelector(".accountdetails");
    const lines = ["(id: " + (user.id || user.secuid) + ")"];
    if (user.id && user.secuid) lines.push("secondary id: " + user.secuid);
    if (user.nickname && user.nickname !== user.name) lines.push(user.nickname);
    details.textContent = lines.join("\n");
}

/*//////////////////////////////////////////////////////////////////////*/

function showlogintime() {
    const label = document.querySelector(".logintime");
    label.hidden = !loginexpires;
    if (!loginexpires) {
        clearInterval(logintimer);
        logintimer = null;
        return;
    }
    if (pendingverification) {
        label.textContent = "complete the verification on tiktok.";
        return;
    }
    const remaining = Math.max(0,Math.ceil((logindeadline - performance.now()) / 1000));
    label.textContent = remaining
        ? `qr time left: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2,"0")}`
        : "qr time elapsed. continue to check with tiktok, or go back to prepare a new login.";
}

/*//////////////////////////////////////////////////////////////////////*/

function promisedclipboard() {
    return deferredclipboard && typeof ClipboardItem === "function" && typeof navigator.clipboard?.write === "function";
}

async function prepareqr() {
    const device = crypto.getRandomValues(new BigUint64Array(1))[0].toString();
    const query = new URLSearchParams({aid:"1459",account_sdk_source:"web",app_name:"tiktok_web",device_platform:"web_pc",did:device,next:"https://www.tiktok.com"});
    const started = performance.now();
    const response = await browsertransport.request("https://login-row.www.tiktok.com/passport/web/get_qrcode/?" + query,{session:true});
    const result = await response.json();
    if (result.message !== "success" || !result.data?.token) throw Error(result.data?.description || "tiktok did not prepare the login");
    const data = result.data;
    browsertransport.challenge = data.token;
    const index = new URL(data.qrcode_index_url);
    const next = new URL(index.searchParams.get("next_url"));
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(8)),value => "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[value % 36]).join("");
    next.searchParams.set("client_secret",secret);
    index.searchParams.set("next_url",next.href);
    index.searchParams.set("app_type","");
    data.qrcode_index_url = index.href;
    const code = qrcode(0,"M");
    code.addData(index.href);
    code.make();
    const count = code.getModuleCount();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = (count + 8) * 4;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0,0,canvas.width,canvas.height);
    context.fillStyle = "#000000";
    for (let row = 0; row < count; row += 1) for (let column = 0; column < count; column += 1) {
        if (code.isDark(row,column)) context.fillRect((column + 4) * 4,(row + 4) * 4,4,4);
    }
    data.qrcode = canvas.toDataURL("image/png").split(",")[1];
    const seed = {token:data.token,index:data.qrcode_index_url,qr:data.qrcode,expires:data.expire_time,device};
    loginexpires = seed.expires;
    const serverdate = Date.parse(response.headers.get("date"));
    const lifetime = loginexpires * 1000 - (Number.isFinite(serverdate) ? serverdate : Date.now());
    logindeadline = started + Math.max(0,lifetime);
    clearInterval(logintimer);
    logintimer = setInterval(showlogintime,1000);
    showlogintime();
    loginsetup = setuprequest("login",seed);
}

/*//////////////////////////////////////////////////////////////////////*/

function watchsession() {
    browsertransport.changed = () => {persistlogin().catch(() => {sessionstatus.textContent = "login could not be saved. keep this page open.";});};
}

function persistlogin() {
    if (!browsertransport || !browserclient || !account) return Promise.resolve();
    const revision = ++sessionrevision;
    const value = {version:1,relay:browsertransport.relay,device:browserclient.device,agent:browsertransport.agent,account,cookies:[...browsertransport.cookies],expires:[...browsertransport.expires]};
    sessionqueue = sessionqueue.catch(() => {}).then(async () => {
        if (revision !== sessionrevision) return;
        await savesession(value);
        sessionstatus.textContent = "";
    });
    return sessionqueue;
}

async function clearlogin() {
    sessionrevision += 1;
    if (browsertransport) browsertransport.changed = null;
    await sessionqueue.catch(() => {});
    await forgetsession();
    sessionstatus.textContent = "saved login removed.";
}

async function restorelogin() {
    if (restoring || authentication || publishing) return;
    restoring = true;
    flow.notify("restoring");
    let current;
    try {
        const saved = await loadsession();
        if (!saved) {flow.notify("nosession"); return;}
        current = await createtransport(saved.relay);
        current.agent = saved.agent;
        current.cookies = new Map(saved.cookies);
        current.expires = new Map(saved.expires || []);
        current.prune();
        if (!current.cookies.has("sessionid")) throw Error("the saved tiktok login expired. sign in again.");
        const client = new tiktok(current,saved.device);
        const user = await client.identity(saved.account);
        await client.profile();
        browsertransport?.close();
        browsertransport = current;
        browserclient = client;
        account = user.name;
        showaccount(user);
        accountlabel.textContent = "@" + account;
        document.querySelector(".disconnect").hidden = false;
        watchsession();
        try {await persistlogin();} catch {sessionstatus.textContent = "login could not be saved. keep this page open.";}
        flow.notify("restored");
    } catch (error) {
        current?.close();
        publishstatus.textContent = error.message.toLowerCase();
        flow.notify("restorefailed");
    } finally {restoring = false; setbusy(Boolean(controller));}
}

document.querySelector(".restorelogin").addEventListener("click",restorelogin);
document.querySelector(".forgetlogin").addEventListener("click", async () => {
    try {await clearlogin(); flow.notify("disconnected");}
    catch {sessionstatus.textContent = "browser storage is unavailable. clear this site's data to remove any saved login."; flow.notify("disconnected");}
});
restorelogin();
