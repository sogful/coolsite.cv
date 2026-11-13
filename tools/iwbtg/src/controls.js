/*//////////////////////////////////////////////////////////////////////*/

export function controls(canvas, update) {
    const keyboard = new Set();
    const pointers = new Map();
    let disposed = false;
    const controller = new AbortController();
    const options = {signal: controller.signal};
    const keys = new Map([
        ["ArrowLeft", 37], ["ArrowRight", 39], ["ArrowUp", 38], ["ArrowDown", 40],
        ["ShiftLeft", 16], ["ShiftRight", 16], ["ControlLeft", 17], ["ControlRight", 17],
        ["Enter", 13], ["Space", 32], ["Escape", 27], ["Backspace", 8], ["Tab", 9]
    ]);
    const gamekeys = new Set([8, 13, 16, 17, 27, 32, 37, 38, 39, 40, 82, 90, 88, 67]);

    function publish() {
        const held = [...new Set([...keyboard, ...pointers.values()])];
        update({left: held.includes(37), right: held.includes(39), jump: held.includes(16), restart: false, keysHeld: held});
        for (const button of document.querySelectorAll("[data-key]")) {
            button.classList.toggle("held", held.includes(Number(button.dataset.key)));
        }
    }

    function clear() {keyboard.clear(); pointers.clear(); publish();}
    window.addEventListener("keydown", event => {
        if (event.target instanceof Element && event.target.closest("input, select, textarea, dialog, .toolbar button, summary, a")) {return;}
        if (!gamekeys.has(event.keyCode) && !/^(Key|Digit)/.test(event.code)) {return;}
        const key = keys.get(event.code) ?? event.keyCode;
        keyboard.add(key);
        event.preventDefault();
        publish();
    }, options);
    window.addEventListener("keyup", event => {
        keyboard.delete(keys.get(event.code) ?? event.keyCode);
        publish();
    }, options);
    window.addEventListener("blur", clear, options);
    document.addEventListener("visibilitychange", () => {if (document.hidden) {clear();}}, options);
    canvas.addEventListener("pointerdown", () => canvas.focus({preventScroll: true}), options);
    for (const button of document.querySelectorAll("[data-key]")) {
        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            button.setPointerCapture(event.pointerId);
            pointers.set(event.pointerId, Number(button.dataset.key));
            publish();
        }, options);
        for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
            button.addEventListener(type, event => {pointers.delete(event.pointerId); publish();}, options);
        }
        button.addEventListener("contextmenu", event => event.preventDefault(), options);
    }
    return {clear, dispose() {if (!disposed) {clear(); controller.abort(); disposed = true;}}};
}
