import {convertvideo} from "/assets/static/js/gifski/conversion.js";

const videofile = document.querySelector("#videofile");
const filesize = document.querySelector("#filesize");
const convert = document.querySelector("#convert");
const stopbutton = document.querySelector("#stop");
const status = document.querySelector("#status");
const preview = document.querySelector("#preview");
const videostage = document.querySelector("#videostage");
const trimeditor = document.querySelector("#trimeditor");
const trimcontrols = document.querySelector("#trimcontrols");
const output = document.querySelector("#output");
const progresspanel = document.querySelector("#progresspanel");
const progresstitle = document.querySelector("#progresstitle");
const progresspercent = document.querySelector("#progresspercent");
const progressbar = document.querySelector("#progressbar");
const progressdetails = document.querySelector("#progressdetails");
const estimate = document.querySelector("#estimate");
const warning = document.querySelector("#warning");
const startinput = document.querySelector("#start");
const endinput = document.querySelector("#end");
const durationinput = document.querySelector("#duration");
const starttimeinput = document.querySelector("#starttime");
const endtimeinput = document.querySelector("#endtime");
const fulldurationinput = document.querySelector("#fullduration");
const trimstartinput = document.querySelector("#trimstart");
const trimendinput = document.querySelector("#trimend");
const trimselected = document.querySelector("#trimselected");
const trimleft = document.querySelector("#trimleft");
const trimright = document.querySelector("#trimright");
const trimplayhead = document.querySelector("#trimplayhead");
const fpsinput = document.querySelector("#fps");
const autofpsinput = document.querySelector("#autofps");
const loopinput = document.querySelector("#loop");
const limitinput = document.querySelector("#limit");
const autolimitinput = document.querySelector("#autolimit");
const automaticmemorybudget = 1024 * 1024 * 1024;
const outputedges = [256, 320, 426, 640, 854, 960, 1280, 1920, 2560, 3840, 5120];
const cropratios = ["source", "free", "1:1", "4:5", "5:4", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "16:10", "18:9", "19.5:9", "21:9", "32:9", "69:9"];

let fileurl = null;
let sourcevideo = null;
let outputurl = null;
let currentconversion = null;
const disabledcontrols = new Map();
let running = false;
let progressstage = "preparing conversion";
let conversionstarted = 0;
let cropstate = null;
let selectededge = "640";

/*//////////////////////////////////////////////////////////////////////*/

videofile.value = "";
window.addEventListener("pageshow", event=>{
    if (!event.persisted) videofile.value = "";
});

videofile.addEventListener("change", ()=>{
    const file = videofile.files[0];
    filesize.textContent = file ? ` (${formatbytes(file.size)})` : "";
    if (fileurl) URL.revokeObjectURL(fileurl);
    fileurl = file ? URL.createObjectURL(file) : null;
    cropstate = null;
    selectededge = "640";
    if (outputurl) URL.revokeObjectURL(outputurl);
    outputurl = null;
    output.replaceChildren();
    output.hidden = true;
    progresspanel.hidden = true;
    sourcevideo = null;
    showvideo();
    updateestimate();
});

[autofpsinput].forEach(input=>{
    input.addEventListener("change", ()=>{
        syncautomaticinputs();
        updateestimate();
    });
});

fulldurationinput.addEventListener("change", ()=>{
    syncfullrange();
    updateestimate();
});

starttimeinput.addEventListener("change", ()=>syncmanualrange("start"));
endtimeinput.addEventListener("change", ()=>syncmanualrange("end"));
[starttimeinput, endtimeinput].forEach(input=>{
    input.addEventListener("keydown", event=>{
        if (event.key !== "Enter") return;
        event.preventDefault();
        input.blur();
    });
});
trimstartinput.addEventListener("input", ()=>syncsliderrange("start"));
trimendinput.addEventListener("input", ()=>syncsliderrange("end"));
trimleft.addEventListener("click", ()=>playtrimedge("start"));
trimright.addEventListener("click", ()=>playtrimedge("end"));

[fpsinput, limitinput, autolimitinput].forEach(input=>{
    input.addEventListener("input", updateestimate);
    input.addEventListener("change", updateestimate);
});

stopbutton.addEventListener("click", ()=>{
    running = false;
    currentconversion?.abort();
    setprogress(Number(progressbar.value), "conversion stopped", "no output was created.");
    status.textContent = "stopped";
    stopbutton.disabled = true;
});

/*//////////////////////////////////////////////////////////////////////*/

convert.addEventListener("click", async ()=>{
    if (running) return;
    if (!sourcevideo || !fileurl) {
        status.textContent = "pick a video first";
        return;
    }

    const settings = readsettings(sourcevideo);
    if (!settings) return;
    setrunning(true);
    output.replaceChildren();
    output.hidden = true;
    warning.textContent = "";
    conversionstarted = performance.now();
    setprogress(0, "preparing conversion", progresssettings(settings));

    try {
        sourcevideo.pause();
        currentconversion = new AbortController();
        const file = await convertvideo(videofile.files[0], settings, setprogress, currentconversion.signal);
        if (!running) return;
        showoutput(file, settings);
        if (!running) return;
        const resulttext = formatbytes(file.size);
        setprogress(100, "conversion complete!", `${resulttext} created in ${formattime(performance.now() - conversionstarted)}.`);
        status.textContent = "done";
    } catch (error) {
        if (running) {
            const message = friendlyerror(error, settings);
            const failedstage = progressstage;
            setprogress(Number(progressbar.value), "conversion failed", `failed while ${failedstage}.\n${message}`);
            showfailure(new Error(message), settings, failedstage);
            status.textContent = `failed while ${failedstage}`;
        }
    } finally {
        currentconversion = null;
        setrunning(false);
    }
});

/*//////////////////////////////////////////////////////////////////////*/

function showvideo(){
    videostage.replaceChildren();
    preview.hidden = !fileurl;
    trimeditor.hidden = true;
    if (!fileurl) return;
    const stage = document.createElement("div");
    stage.className = "adjustmentstage";
    const video = sourcevideo = document.createElement("video");
    video.className = "previewmedia";
    video.controls = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = fileurl;
    video.addEventListener("timeupdate", ()=>{
        restricttotrim(video);
        updateplayhead(video);
    });
    video.addEventListener("seeking", ()=>restricttotrim(video));
    video.addEventListener("seeked", ()=>updateplayhead(video));
    const controls = document.createElement("div");
    controls.className = "cropcontrols";
    const resolutionselect = document.createElement("select");
    const sizelabel = document.createElement("label");
    sizelabel.append("size ", resolutionselect);
    const aspectselect = document.createElement("select");
    const croplabel = document.createElement("label");
    croplabel.append("crop ", aspectselect);
    for (const ratio of cropratios) {
        const option = document.createElement("option");
        option.value = ratio;
        option.textContent = ratio === "source" ? "none" : ratio === "free" ? "free crop" : ratio;
        aspectselect.append(option);
    }
    controls.append(sizelabel, croplabel);
    const overlay = document.createElement("div");
    overlay.className = "cropoverlay";
    const cropbox = document.createElement("div");
    cropbox.className = "cropbox";
    overlay.append(cropbox);
    const surface = document.createElement("div");
    surface.className = "cropsurface";
    surface.append(video, overlay);
    stage.append(surface);
    videostage.append(controls, stage);
    video.addEventListener("loadedmetadata", ()=>{
        setuptrim(video);
        setupcrop(video, resolutionselect, aspectselect, cropbox);
    }, {once: true});
}

function setupcrop(video, resolutionselect, aspectselect, cropbox){
    const sourceratio = video.videoWidth / video.videoHeight;
    const refresh = ()=>{
        updatecropbox(cropbox);
        updateresolutions(resolutionselect, video);
        updateestimate();
    };
    resolutionselect.addEventListener("change", ()=>{
        selectededge = resolutionselect.value;
        updateestimate();
    });
    aspectselect.addEventListener("change", ()=>{
        const ratio = aspectselect.value;
        cropstate = ratio === "source" || ratio === "free" ? null : centeredcrop(ratio, sourceratio);
        refresh();
    });

    let dragstart = null;
    let priorcrop = null;
    video.addEventListener("pointerdown", event=>{
        const bounds = video.getBoundingClientRect();
        if (aspectselect.value === "source" || event.button !== 0
            || event.clientY > bounds.bottom - Math.min(44, bounds.height * .25) || event.target !== video) return;
        dragstart = cropcoordinate(event, bounds);
        priorcrop = cropstate;
        video.setPointerCapture(event.pointerId);
    });
    video.addEventListener("pointermove", event=>{
        if (!dragstart) return;
        const bounds = video.getBoundingClientRect();
        const ratio = aspectselect.value === "free" ? null : rationumber(aspectselect.value) / sourceratio;
        cropstate = cropfromdrag(dragstart, cropcoordinate(event, bounds), ratio);
        updatecropbox(cropbox);
        event.preventDefault();
    });
    const finishdrag = event=>{
        if (!dragstart) return;
        dragstart = null;
        if (event.type === "pointercancel" || !cropstate || cropstate.width < 2 || cropstate.height < 2) {
            cropstate = priorcrop;
        }
        refresh();
        if (video.hasPointerCapture(event.pointerId)) video.releasePointerCapture(event.pointerId);
    };
    video.addEventListener("pointerup", finishdrag);
    video.addEventListener("pointercancel", finishdrag);
    refresh();
}

function updateresolutions(select, video){
    const crop = sourcecrop(video);
    const longest = Math.max(crop?.width ?? video.videoWidth, crop?.height ?? video.videoHeight);
    const edges = outputedges.filter(edge=>edge < longest);
    select.replaceChildren();
    for (const edge of ["source", ...edges]) {
        const {width, height} = currentresolution(video, edge);
        const option = document.createElement("option");
        option.value = edge;
        option.textContent = `${width}x${height}${edge === "source" ? " (full size)" : ""}`;
        select.append(option);
    }
    select.value = edges.includes(Number(selectededge)) ? selectededge : "source";
}

function rationumber(ratio){
    const values = String(ratio).split(":").map(Number);
    return values.length === 2 && values[0] > 0 && values[1] > 0 ? values[0] / values[1] : 16 / 9;
}

function centeredcrop(ratio, sourceratio){
    const targetratio = typeof ratio === "number" ? ratio : rationumber(ratio);
    if (targetratio >= sourceratio) {
        const height = sourceratio / targetratio * 100;
        return {left: 0, top: (100 - height) / 2, width: 100, height};
    }
    const width = targetratio / sourceratio * 100;
    return {left: (100 - width) / 2, top: 0, width, height: 100};
}

function cropcoordinate(event, bounds){
    return {
        x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
        y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)),
    };
}

function cropfromdrag(start, end, ratio){
    let width = Math.abs(end.x - start.x);
    let height = Math.abs(end.y - start.y);
    if (ratio) {
        width = Math.min(width, height * ratio);
        height = width / ratio;
    }
    const left = end.x >= start.x ? start.x : start.x - width;
    const top = end.y >= start.y ? start.y : start.y - height;
    return {left, top, width, height};
}

function updatecropbox(cropbox){
    cropbox.classList.toggle("active", Boolean(cropstate));
    if (!cropstate) return;
    cropbox.style.left = `${cropstate.left}%`;
    cropbox.style.top = `${cropstate.top}%`;
    cropbox.style.width = `${cropstate.width}%`;
    cropbox.style.height = `${cropstate.height}%`;
}

function setuptrim(video){
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    trimstartinput.max = duration;
    trimendinput.max = duration;
    trimeditor.hidden = false;
    syncfullrange();
    updateplayhead(video);
    updateestimate();
}

function syncfullrange(){
    const video = videostage.querySelector("video");
    if (!video || !Number.isFinite(video.duration)) return;
    const duration = video.duration;
    if (fulldurationinput.checked) {
        startinput.value = "0";
        endinput.value = duration.toFixed(3);
    }
    const locked = fulldurationinput.checked;
    starttimeinput.disabled = locked;
    endtimeinput.disabled = locked;
    trimstartinput.disabled = locked;
    trimendinput.disabled = locked;
    trimleft.disabled = locked;
    trimright.disabled = locked;
    trimtimeline.classList.toggle("trimdisabled", locked);
    trimcontrols.classList.toggle("trimdisabled", locked);
    synctrimdisplay(duration);
    restricttotrim(video);
}

function syncmanualrange(changed){
    const video = videostage.querySelector("video");
    if (!video || !Number.isFinite(video.duration)) return;
    fulldurationinput.checked = false;
    const duration = video.duration;
    let start = timestampvalue(starttimeinput, numbervalue(startinput, 0, 0, duration), 0, duration);
    let end = timestampvalue(endtimeinput, numbervalue(endinput, duration, 0, duration), 0, duration);
    if (changed === "start" && start >= end) end = Math.min(duration, start + 0.001);
    if (changed === "end" && end <= start) start = Math.max(0, end - 0.001);
    startinput.value = start.toFixed(3);
    endinput.value = end.toFixed(3);
    synctrimdisplay(duration);
    restricttotrim(video);
    previewtrimhandle(video, changed);
    updateestimate();
}

function syncsliderrange(changed){
    const video = videostage.querySelector("video");
    if (!video || !Number.isFinite(video.duration)) return;
    fulldurationinput.checked = false;
    const duration = video.duration;
    let start = numbervalue(trimstartinput, 0, 0, duration);
    let end = numbervalue(trimendinput, duration, 0, duration);
    if (changed === "start" && start >= end) start = Math.max(0, end - 0.001);
    if (changed === "end" && end <= start) end = Math.min(duration, start + 0.001);
    startinput.value = start.toFixed(3);
    endinput.value = end.toFixed(3);
    synctrimdisplay(duration);
    restricttotrim(video);
    previewtrimhandle(video, changed);
    updateestimate();
}

function synctrimdisplay(duration){
    let start = numbervalue(startinput, 0, 0, duration);
    let end = numbervalue(endinput, duration, 0, duration);
    if (fulldurationinput.checked) {
        start = 0;
        end = duration;
    }
    if (end <= start) end = Math.min(duration, start + 0.001);
    startinput.value = start.toFixed(3);
    endinput.value = end.toFixed(3);
    trimstartinput.value = start;
    trimendinput.value = end;
    durationinput.value = Math.max(0.001, end - start).toFixed(3);
    const startpercent = duration ? start / duration * 100 : 0;
    const endpercent = duration ? end / duration * 100 : 100;
    trimleft.style.left = "0";
    trimleft.style.width = `${startpercent}%`;
    trimselected.style.left = `${startpercent}%`;
    trimselected.style.width = `${Math.max(0, endpercent - startpercent)}%`;
    trimright.style.left = `${endpercent}%`;
    trimright.style.right = "0";
    starttimeinput.value = formattimestamp(start);
    endtimeinput.value = formattimestamp(end);
}

function updateplayhead(video){
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const percent = duration ? Math.min(100, Math.max(0, video.currentTime / duration * 100)) : 0;
    trimplayhead.style.left = `${percent}%`;
}

function previewtrimhandle(video, changed){
    const start = numbervalue(startinput, 0, 0, video.duration);
    const end = numbervalue(endinput, video.duration, 0, video.duration);
    const time = changed === "start" ? start : Math.max(start, end - 1);
    video.currentTime = time;
    video.play().catch(()=>{});
}

function playtrimedge(changed) {
    const video = videostage.querySelector("video");
    if (!video || fulldurationinput.checked) return;
    previewtrimhandle(video, changed);
}

function restricttotrim(video){
    if (fulldurationinput.checked || !Number.isFinite(video.duration)) return;
    const start = numbervalue(startinput, 0, 0, video.duration);
    const end = numbervalue(endinput, video.duration, 0, video.duration);
    if (video.currentTime >= start && video.currentTime < end) return;
    if (Math.abs(video.currentTime - start) < 0.001) return;
    video.currentTime = start;
}

function syncautomaticinputs(){
    fpsinput.disabled = autofpsinput.checked;
}

function updateestimate(){
    const video = sourcevideo;
    const duration = video && Number.isFinite(video.duration) ? selectedduration(video) : numbervalue(durationinput, 3, 0.001);
    const resolution = currentresolution(video);
    const settings = resolveautosettings({
        duration,
        fps: numbervalue(fpsinput, 24, 1, 50),
        width: resolution.width,
        height: resolution.height,
        limit: numbervalue(limitinput, 9, 0.1) * 1000000,
        autofps: autofpsinput.checked,
    });
    const framecount = Math.max(2, Math.round(settings.duration * settings.fps));
    const memory = estimateframememory(settings);
    estimate.textContent = `${framecount} frames at ${settings.width}x${settings.height}.`;
    warning.textContent = memory > automaticmemorybudget ? memorymessage(settings, memory) : "";
}

function readsettings(video){
    const start = numbervalue(startinput, 0, 0, video.duration);
    const end = fulldurationinput.checked ? video.duration : numbervalue(endinput, video.duration, 0, video.duration);
    const duration = end - start;
    if (!Number.isFinite(duration) || duration <= 0) {
        status.textContent = "the trim range has no video";
        return null;
    }
    const resolution = currentresolution(video);
    const settings = resolveautosettings({
        duration,
        fps: numbervalue(fpsinput, 24, 1, 50),
        width: resolution.width,
        height: resolution.height,
        limit: numbervalue(limitinput, 9, 0.1) * 1000000,
        autofps: autofpsinput.checked,
    });
    const memory = estimateframememory(settings);
    if (memory > automaticmemorybudget) {
        const message = memorymessage(settings, memory);
        warning.textContent = message;
        return null;
    }
    return {
        ...settings,
        start,
        duration,
        crop: sourcecrop(video),
        loop: loopinput.checked,
        autolimit: autolimitinput.checked,
    };
}

function resolveautosettings(settings){
    const automatic = [];
    let fps = settings.fps;
    if (settings.autofps) {
        fps = findautomaticfps(settings.width, settings.height, settings.duration);
        automatic.push(`${fps}fps`);
    }
    return {...settings, fps, automatic};
}

function findautomaticfps(width, height, duration){
    const allowedfps = [50, 48, 40, 36, 30, 24, 20, 18, 15, 12, 10, 8, 6, 5, 4, 3, 2, 1];
    const maximum = findmaximumfps(width, height, duration);
    return allowedfps.find(value=>value <= maximum) || 1;
}

function findmaximumfps(width, height, duration){
    return Math.max(1, Math.floor(automaticmemorybudget / (Math.min(2, Math.max(0.001, duration)) * width * height * 4 * 4)));
}

function currentresolution(video, edge = selectededge){
    if (!video?.videoWidth) return {width: 640, height: 360};
    const crop = sourcecrop(video);
    const width = crop?.width ?? video.videoWidth;
    const height = crop?.height ?? video.videoHeight;
    const scale = edge === "source" ? 1 : Math.min(1, Number(edge) / Math.max(width, height));
    return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))};
}

function sourcecrop(video){
    if (!cropstate) return null;
    return {
        x: cropstate.left / 100 * video.videoWidth,
        y: cropstate.top / 100 * video.videoHeight,
        width: cropstate.width / 100 * video.videoWidth,
        height: cropstate.height / 100 * video.videoHeight,
    };
}

function estimateframememory(settings){
    return Math.min(Math.max(2, Math.round(settings.duration * settings.fps)), Math.ceil(settings.fps * 2)) * settings.width * settings.height * 4 * 4;
}

function memorymessage(settings, memory){
    return `${settings.width}x${settings.height} at ${settings.fps}fps needs about ${formatbytes(memory)} before conversion. Choose a smaller resolution, lower fps, or a shorter range.`;
}

function selectedduration(video){
    if (fulldurationinput.checked) return video.duration;
    return Math.max(0.001, numbervalue(endinput, video.duration, 0, video.duration) - numbervalue(startinput, 0, 0, video.duration));
}

function numbervalue(input, fallback, minimum, maximum){
    let value = Number(input.value);
    if (!Number.isFinite(value)) value = fallback;
    if (minimum !== undefined) value = Math.max(minimum, value);
    if (maximum !== undefined) value = Math.min(maximum, value);
    return value;
}

function timestampvalue(input, fallback, minimum, maximum) {
    const match = input.value.trim().match(/^(\d+):([0-5]?\d):([0-5]?\d):(\d{1,3})$/);
    if (!match) return fallback;
    let value = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4].padEnd(3, "0")) / 1000;
    if (!Number.isFinite(value)) value = fallback;
    if (minimum !== undefined) value = Math.max(minimum, value);
    if (maximum !== undefined) value = Math.min(maximum, value);
    return value;
}

function showoutput(file, settings){
    if (outputurl) URL.revokeObjectURL(outputurl);
    outputurl = URL.createObjectURL(file);
    preview.hidden = false;
    const image = document.createElement("img");
    image.className = "previewmedia gifpreview";
    image.src = outputurl;
    image.alt = "GIF preview";
    videostage.querySelector(".gifpreview")?.remove();
    const adjustments = [...videostage.children];
    for (const element of adjustments) element.hidden = true;
    trimeditor.hidden = true;
    videostage.append(image);
    const link = document.createElement("a");
    link.className = "btn";
    link.href = outputurl;
    link.download = "out.gif";
    link.textContent = "download GIF";
    const adjust = document.createElement("button");
    adjust.className = "btn";
    adjust.type = "button";
    adjust.textContent = "adjust video";
    adjust.addEventListener("click", ()=>{
        output.hidden = true;
        image.remove();
        for (const element of adjustments) element.hidden = false;
        trimeditor.hidden = false;
    });
    const detail = document.createElement("span");
    detail.className = "hint";
    detail.textContent = ` ${formatbytes(file.size)} - ${settings.width}x${settings.height} - ${settings.fps}fps`;
    output.replaceChildren(link, adjust, detail);
    output.hidden = false;
}

function showfailure(error, settings, failedstage){
    const heading = document.createElement("strong");
    heading.textContent = "conversion details";
    const detail = document.createElement("p");
    detail.className = "conversiondetails";
    detail.textContent = `stage: ${failedstage}\nerror: ${error.message || String(error)}\nsettings: ${settings.width}x${settings.height}, ${settings.fps}fps, ${settings.duration.toFixed(3)}s`;
    output.replaceChildren(heading, detail);
    output.hidden = false;
}

function friendlyerror(error, settings){
    const message = error.message || String(error);
    if (/unreachable/i.test(message)) return `the GIF encoder ran out of working memory. ${memorymessage(settings, estimateframememory(settings))}`;
    return message;
}

function setprogress(percent, title, detail){
    const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    progressstage = String(title || "processing").toLowerCase();
    progresspanel.hidden = false;
    progresstitle.textContent = title;
    progresspercent.textContent = `${value}%`;
    progressbar.value = value;
    progressdetails.textContent = detail || "";
    status.textContent = `${value}% - ${title}`;
}

function progresssettings(settings){
    const framecount = Math.max(2, Math.round(settings.duration * settings.fps));
    const automatic = settings.automatic.length ? ` Automatic values: ${settings.automatic.join(", ")}.` : "";
    return `${framecount} frames - ${settings.width}x${settings.height} - ${settings.fps}fps.${automatic}`;
}

function formattime(milliseconds){
    return `${(milliseconds / 1000).toFixed(milliseconds < 10000 ? 1 : 0)}s`;
}

function formattimestamp(seconds){
    const milliseconds = Math.max(0, Math.round(seconds * 1000));
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor(milliseconds % 3600000 / 60000);
    const whole = Math.floor(milliseconds % 60000 / 1000);
    const fraction = milliseconds % 1000;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(whole).padStart(2, "0")}:${String(fraction).padStart(3, "0")}`;
}

function setrunning(value){
    running = value;
    if (value) {
        for (const control of document.querySelectorAll("input, select, button")) {
            if (control === stopbutton) continue;
            disabledcontrols.set(control, control.disabled);
            control.disabled = true;
        }
    } else {
        for (const [control, disabled] of disabledcontrols) control.disabled = disabled;
        disabledcontrols.clear();
    }
    stopbutton.disabled = !value;
}

function formatbytes(bytes){
    return `${(bytes / 1000000).toFixed(1)}mb`;
}

syncautomaticinputs();
