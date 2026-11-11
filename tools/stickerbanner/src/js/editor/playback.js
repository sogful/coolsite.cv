import {createanimation} from "./animation.js?v=20261109d";

export function createplayback(draw, changed) {
    const media = document.createElement("video");
    const start = document.querySelector(".start");
    const end = document.querySelector(".end");
    const track = document.querySelector(".trimtrack");
    const left = document.querySelector(".trimleft");
    const right = document.querySelector(".trimright");
    const bar = document.querySelector(".trimbar");
    const grid = document.querySelector(".grid");
    const banner = document.querySelector(".banner");
    media.className = "sourcevideo";
    media.muted = true;
    media.defaultMuted = true;
    media.playsInline = true;
    media.preload = "auto";
    media.setAttribute("playsinline","");
    document.body.append(media);
    let url = "";
    let request = 0;
    let fps = 30;
    let dragging = null;
    let frozen = false;
    let last = -1;
    let animation = null;

    function time(value) {
        const minutes = Math.floor(value / 60);
        return minutes + ":" + (value - minutes * 60).toFixed(2).padStart(5,"0");
    }

    function refresh() {
        if (!Number.isFinite(media.duration) || !media.duration) return;
        track.style.setProperty("--start",Number(start.value) / media.duration * 100 + "%");
        track.style.setProperty("--end",Number(end.value) / media.duration * 100 + "%");
        track.style.setProperty("--position",media.currentTime / media.duration * 100 + "%");
        document.querySelector(".trimstart").textContent = time(Number(start.value));
        document.querySelector(".trimend").textContent = time(Number(end.value));
        document.querySelector(".trimlength").textContent = (Number(end.value) - Number(start.value)).toFixed(2) + " s";
        for (const [handle,input] of [[left,start],[right,end]]) {
            handle.setAttribute("aria-valuemax",String(media.duration));
            handle.setAttribute("aria-valuenow",input.value);
            handle.setAttribute("aria-valuetext",time(Number(input.value)));
        }
    }

    function tick() {
        if (!media.paused && !dragging) {
            if (media.ended || media.currentTime >= Number(end.value) - 0.001 || media.currentTime < Number(start.value)) media.currentTime = Number(start.value);
            const frame = Math.floor(media.currentTime * fps);
            if (frame !== last) {last = frame; draw();}
        }
        refresh();
        request = requestAnimationFrame(tick);
    }

    function unfreeze() {
        frozen = false;
        for (const canvas of grid.querySelectorAll(".tilefreeze")) canvas.remove();
        for (const image of grid.querySelectorAll(".tileimage")) image.style.visibility = "";
    }

    function toggle() {
        const images = [...grid.querySelectorAll(".tileimage")];
        if (animation) frozen = animation.toggle();
        else if (images.length) {
            if (frozen) unfreeze();
            else {
                frozen = true;
                for (const image of images) {
                    if (!image.complete || !image.naturalWidth) continue;
                    const canvas = document.createElement("canvas");
                    canvas.className = "tilefreeze";
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                    canvas.getContext("2d").drawImage(image,0,0);
                    image.after(canvas);
                    image.style.visibility = "hidden";
                }
            }
        } else if (media.src) {
            if (media.paused) {media.currentTime = Math.max(Number(start.value),Math.min(Number(end.value) - 0.001,media.currentTime)); media.play().catch(() => {});}
            else media.pause();
        }
        grid.setAttribute("aria-label",frozen || media.paused ? "sticker preview paused. click to play" : "sticker preview playing. click to pause");
    }

    function move(value) {
        const minimum = Math.min(2 / fps,media.duration);
        const input = dragging === left ? start : end;
        value = dragging === left ? Math.min(Number(end.value) - minimum,Math.max(0,value)) : Math.max(Number(start.value) + minimum,Math.min(media.duration,value));
        input.value = value.toFixed(6);
        media.currentTime = Math.min(media.duration - 0.001,value);
        refresh();
    }

    track.addEventListener("pointerdown",event => {
        if (!media.src || left.disabled) return;
        event.preventDefault();
        media.pause();
        changed();
        if (event.target.closest(".trimhandle")) {
            dragging = event.target.closest(".trimhandle");
            track.setPointerCapture(event.pointerId);
        }
        const bounds = track.getBoundingClientRect();
        const value = Math.max(0,Math.min(1,(event.clientX - bounds.left) / bounds.width)) * media.duration;
        if (dragging) move(value);
        else media.currentTime = Math.max(Number(start.value),Math.min(Number(end.value),value));
    });
    track.addEventListener("pointermove",event => {
        if (!dragging) return;
        const bounds = track.getBoundingClientRect();
        move((event.clientX - bounds.left) / bounds.width * media.duration);
    });
    for (const name of ["pointerup","pointercancel","lostpointercapture"]) track.addEventListener(name,() => {dragging = null;});
    for (const handle of [left,right]) handle.addEventListener("keydown",event => {
        if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key) || handle.disabled) return;
        event.preventDefault();
        changed();
        media.pause();
        dragging = handle;
        const value = Number((handle === left ? start : end).value);
        move(event.key === "Home" ? 0 : event.key === "End" ? media.duration : value + (event.key === "ArrowRight" ? 1 : -1) * media.duration / Math.max(1,track.clientWidth));
        dragging = null;
    });
    banner.addEventListener("click",event => {if (!event.target.closest(".rowhandle")) toggle();});
    grid.tabIndex = 0;
    grid.setAttribute("role","button");
    grid.addEventListener("keydown",event => {
        if (![" ","Enter"].includes(event.key)) return;
        event.preventDefault();
        toggle();
    });
    media.addEventListener("seeked",() => {draw(); refresh();});
    media.addEventListener("ended",() => {if (!dragging) {media.currentTime = Number(start.value); media.play().catch(() => {});}});
    request = requestAnimationFrame(tick);
    addEventListener("pagehide",() => {cancelAnimationFrame(request); media.pause(); animation?.close(); if (url) URL.revokeObjectURL(url);});

    return {
        media,
        refresh,
        pause() {media.pause();},
        reset() {animation?.close(); animation = null; unfreeze();},
        async show(files) {animation?.close(); animation = await createanimation(files,grid);},
        async load(file, cadence) {
            media.pause();
            if (url) URL.revokeObjectURL(url);
            fps = cadence;
            last = -1;
            unfreeze();
            bar.hidden = false;
            await new Promise((resolve,reject) => {
                const timer = setTimeout(() => finish(Error("video preview timed out")),20000);
                function finish(error) {
                    clearTimeout(timer);
                    media.removeEventListener("loadeddata",ready);
                    media.removeEventListener("error",failed);
                    if (error) reject(error); else resolve();
                }
                function ready() {finish();}
                function failed() {finish(Error("this browser cannot play the video"));}
                media.addEventListener("loadeddata",ready,{once:true});
                media.addEventListener("error",failed,{once:true});
                url = URL.createObjectURL(file);
                media.src = url;
                media.load();
            });
            refresh();
            draw();
            await media.play().catch(() => {});
        }
    };
}
