(() => {
    const page = document.querySelector(".frontpage");
    let tint;

    function cleartint() {
        if (!tint) return;
        const layer = tint;
        tint = null;
        const fade = layer.animate([{opacity: getComputedStyle(layer).opacity}, {opacity: 0}], {
            duration: 420, easing: "ease-out", fill: "forwards"
        });
        fade.finished.then(() => layer.remove(), () => layer.remove());
    }

    for (const badge of page.querySelectorAll(".bottom .button")) {
        const link = badge.closest("a");
        if (!link) continue;
        link.addEventListener("pointerenter", event => {
            if (event.pointerType === "touch") return;
            const url = badge.currentSrc || badge.getAttribute("src") || badge.dataset.src;
            if (!url) return;
            cleartint();
            tint = document.createElement("div");
            tint.className = "badgetint";
            tint.style.backgroundImage = `url(${JSON.stringify(url)})`;
            page.prepend(tint);
            tint.animate([{opacity: 0}, {opacity: .7}], {
                duration: 360, easing: "ease-out", fill: "forwards"
            });
        });
        link.addEventListener("pointerleave", cleartint);
    }

    /*//////////////////////////////////////////////////////////////////////*/

    const links = page.querySelectorAll("a[data-track]");
    const audiocontext = window.AudioContext || window.webkitAudioContext;
    if (!audiocontext || !links.length) return;

    const buffers = new Map();
    const fadein = .35;
    const fadeout = .28;
    const volume = .36;
    let context, lowpass, hovered, playing;

    function setup() {
        if (context) return;
        context = new audiocontext();
        lowpass = context.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 1600;
        lowpass.Q.value = .35;
        lowpass.connect(context.destination);
        context.addEventListener("statechange", start);
    }

    function load(track) {
        if (!buffers.has(track)) {
            const pending = fetch("/assets/audio/88x31/" + track).then(response => {
                if (!response.ok) throw Error("Track unavailable");
                return response.arrayBuffer();
            }).then(bytes => context.decodeAudioData(bytes)).catch(() => {
                buffers.delete(track);
                return null;
            });
            buffers.set(track, pending);
        }
        return buffers.get(track);
    }

    /*//////////////////////////////////////////////////////////////////////*/

    async function start() {
        const link = hovered;
        if (!link || context?.state !== "running" || playing || document.hidden) return;
        const buffer = await load(link.dataset.track);
        if (!buffer || hovered !== link || playing || document.hidden || context.state !== "running") return;

        const source = context.createBufferSource();
        const gain = context.createGain();
        const now = context.currentTime;
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        gain.connect(lowpass);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + fadein);
        source.addEventListener("ended", () => {
            source.disconnect();
            gain.disconnect();
        }, {once: true});
        source.start(now);
        playing = {source, gain, since: now};
    }

    function stop() {
        if (!playing) return;
        const {source, gain, since} = playing;
        const now = context.currentTime;
        const level = volume * Math.min(1, (now - since) / fadein);
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(level, now);
        gain.gain.linearRampToValueAtTime(0, now + fadeout);
        source.stop(now + fadeout);
        playing = null;
    }

    function unlock() {
        setup();
        if (context.state !== "running") context.resume().then(start).catch(() => {});
    }

    for (const link of links) {
        link.addEventListener("pointerenter", event => {
            if (event.pointerType === "touch") return;
            if (hovered !== link) stop();
            hovered = link;
            setup();
            if (navigator.userActivation?.hasBeenActive) unlock();
            start();
        });

        link.addEventListener("pointerleave", () => {
            if (hovered !== link) return;
            hovered = null;
            stop();
        });
    }

    document.addEventListener("click", unlock, {capture: true, once: true});
    document.addEventListener("keydown", unlock, {capture: true, once: true});
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
    });
})();
