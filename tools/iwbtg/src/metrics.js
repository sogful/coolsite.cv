/*//////////////////////////////////////////////////////////////////////*/

export function metrics(read) {
    const player = document.querySelector(".player");
    const stage = document.querySelector(".stage");
    const display = document.createElement("div");
    const text = document.createElement("span");
    display.className = "metrics";
    text.className = "metrictext";
    display.append(text);
    player.append(display);
    let previous = "";
    let stopped = false;

    function update() {
        if (stopped) {return;}
        const value = read() || {};
        const fps = Number.isFinite(value.fps) ? Math.max(0, Math.round(value.fps)) : "--";
        const label = "fps " + fps + "   cheat " + (value.cheating ? "on" : "off");
        if (label !== previous) {text.textContent = label; previous = label;}
        const box = stage.getBoundingClientRect();
        const width = value.width || box.width;
        const height = value.height || box.height;
        const scale = Math.min(box.width / width, box.height / height);
        display.style.left = Math.round((box.width - width * scale) / 2 + 16 * scale) + "px";
        display.style.top = Math.round((box.height - height * scale) / 2 + 4 * scale) + "px";
    }

    const timer = setInterval(update, 500);
    window.addEventListener("resize", update);
    update();
    return {
        dispose() {
            stopped = true;
            clearInterval(timer);
            window.removeEventListener("resize", update);
            display.remove();
        }
    };
}
