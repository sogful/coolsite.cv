/*//////////////////////////////////////////////////////////////////////*/

const recent = new Map();

export function warning(text) {
    const message = String(text).trim();
    if (!message) {return;}
    const now = Date.now();
    if (now - (recent.get(message) || 0) < 4000) {return;}
    if (recent.size > 64) {recent.clear();}
    recent.set(message, now);
    const log = document.querySelector(".notices");
    const entry = document.createElement("p");
    entry.className = "notice";
    entry.textContent = message;
    while (log.children.length >= 6) {log.firstElementChild.remove();}
    log.append(entry);
    setTimeout(() => entry.classList.add("fading"), 4000);
    setTimeout(() => entry.remove(), 5000);
}

export function ignored(request) {
    if (request.input) {return null;}
    const ignore = request.buttons.find(button => /^ignore$/i.test(button.label.trim()));
    const abort = request.buttons.some(button => /^abort$/i.test(button.label.trim()));
    if (!ignore || !abort) {return null;}
    warning(request.text);
    return {button: ignore.value, value: ""};
}

export function setup() {
    const player = document.querySelector(".player");
    const panel = document.querySelector(".gameoptions");
    const dialog = document.querySelector(".prompt");
    const desktop = matchMedia("(hover: hover) and (pointer: fine)");
    let timer;
    function awake() {
        clearTimeout(timer);
        player.classList.remove("idle");
        if (player.hidden || !desktop.matches || player.classList.contains("touchdevice") || !panel.hidden || dialog.open) {return;}
        timer = setTimeout(() => player.classList.add("idle"), 2000);
    }
    window.addEventListener("pointermove", awake, {passive: true});
    player.addEventListener("focusin", awake);
    desktop.addEventListener("change", awake);
    new MutationObserver(awake).observe(player, {attributes: true, attributeFilter: ["hidden"]});
    new MutationObserver(awake).observe(panel, {attributes: true, attributeFilter: ["hidden"]});
    const credits = document.querySelector(".creditsdialog");
    document.querySelector(".creditsbutton").addEventListener("click", () => credits.showModal());
    for (const dialog of document.querySelectorAll(".prompt, .creditsdialog")) {
        const buttons = dialog.querySelector(".promptbuttons");
        function select(button, focus = false) {
            for (const item of buttons.querySelectorAll("button")) {item.classList.toggle("selected", item === button);}
            if (focus) {button?.focus({preventScroll: true});}
        }
        function refresh() {
            if (!dialog.open) {return;}
            const active = document.activeElement;
            const first = buttons.querySelector("[data-primary]") || buttons.querySelector("button");
            select(buttons.contains(active) && active.matches("button") ? active : first);
        }
        new MutationObserver(() => {awake(); refresh();}).observe(dialog, {attributes: true, attributeFilter: ["open"]});
        new MutationObserver(refresh).observe(buttons, {childList: true});
        buttons.addEventListener("focusin", event => {if (event.target.matches("button")) {select(event.target);}});
        dialog.addEventListener("keydown", event => {
            const editing = event.target.matches("input, textarea, select");
            const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
            if (editing && event.key !== "Enter") {return;}
            if (!arrows.includes(event.key) && event.key !== "Enter" && event.key !== "Shift") {return;}
            const entries = [...buttons.querySelectorAll("button:not(:disabled)")];
            if (!entries.length) {return;}
            event.preventDefault();
            event.stopImmediatePropagation();
            const current = Math.max(0, entries.findIndex(button => button.classList.contains("selected")));
            if (arrows.includes(event.key)) {
                const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
                select(entries[(current + direction + entries.length) % entries.length], true);
            } else if (!event.repeat) {entries[current].click();}
        }, true);
    }
    awake();
}
