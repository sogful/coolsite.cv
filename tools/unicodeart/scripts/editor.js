export function editor(change) {
    const canvas = document.querySelector(".drawing");
    const ctx = canvas.getContext("2d", {willReadFrequently: true});
    const history = [];
    let mode = "draw";
    let pointer = null;
    let previous = null;
    let keyboard = {x: 20, y: 50};
    let populated = false;

    function remember() {
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (history.length > 30) history.shift();
        document.querySelector(".undo").disabled = false;
    }

    function notify() {
        populated = ctx.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
        document.querySelector(".drawprompt").hidden = populated;
        change(populated);
    }

    function position(event) {
        const box = canvas.getBoundingClientRect();
        return {x: (event.clientX - box.left) * canvas.width / box.width, y: (event.clientY - box.top) * canvas.height / box.height};
    }

    function stroke(start, end) {
        ctx.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";
        ctx.lineWidth = mode === "erase" ? 20 : 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        if (start.x === end.x && start.y === end.y) {
            ctx.beginPath();
            ctx.arc(end.x, end.y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
    }

    canvas.addEventListener("pointerdown", event => {
        if (pointer !== null || event.button !== 0) return;
        remember();
        pointer = event.pointerId;
        canvas.setPointerCapture(pointer);
        previous = position(event);
        stroke(previous, previous);
        document.querySelector(".drawprompt").hidden = true;
        change(true, true);
        event.preventDefault();
    });
    canvas.addEventListener("pointermove", event => {
        if (event.pointerId !== pointer) return;
        for (const point of event.getCoalescedEvents?.() || [event]) {
            const next = position(point);
            stroke(previous, next);
            previous = next;
        }
    });
    function finish(event) {
        if (event.pointerId !== pointer) return;
        pointer = null;
        previous = null;
        notify();
    }
    canvas.addEventListener("pointerup", finish);
    canvas.addEventListener("pointercancel", finish);
    canvas.addEventListener("lostpointercapture", finish);
    canvas.addEventListener("keydown", event => {
        const movements = {ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4]};
        const move = movements[event.key];
        if (!move) return;
        event.preventDefault();
        const next = {x: Math.max(0, Math.min(canvas.width, keyboard.x + move[0])), y: Math.max(0, Math.min(canvas.height, keyboard.y + move[1]))};
        if (event.shiftKey) {remember(); stroke(keyboard, next); notify();}
        keyboard = next;
    });
    document.querySelectorAll(".tool").forEach(button => button.addEventListener("click", () => {
        mode = button.dataset.tool;
        document.querySelectorAll(".tool").forEach(node => {
            const selected = node === button;
            node.classList.toggle("selected", selected);
            node.setAttribute("aria-pressed", String(selected));
        });
    }));
    document.querySelector(".undo").addEventListener("click", () => {
        const previous = history.pop();
        if (!previous) return;
        if (canvas.width !== previous.width || canvas.height !== previous.height) {
            document.querySelector(".artwidth").value = previous.width / 4;
            document.querySelector(".linecount").value = (previous.height / 4 - 16) / 20;
            resize();
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(previous, 0, 0);
        document.querySelector(".undo").disabled = !history.length;
        notify();
    });
    document.querySelector(".clear").addEventListener("click", () => {
        remember();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.querySelector(".example").value = "";
        notify();
    });

    /*//////////////////////////////////////////////////////////////////////*/

    function resize() {
        const backup = document.createElement("canvas");
        backup.width = canvas.width;
        backup.height = canvas.height;
        backup.getContext("2d").drawImage(canvas, 0, 0);
        const width = Number(document.querySelector(".artwidth").value);
        const lines = Number(document.querySelector(".linecount").value);
        canvas.width = width * 4;
        canvas.height = (lines * 20 + 16) * 4;
        ctx.drawImage(backup, 0, 0, canvas.width, canvas.height);
        document.querySelector(".drawwrap").style.width = width * 4 + "px";
        document.querySelector(".widthvalue").value = width + " px";
        const guides = document.querySelector(".guides");
        guides.replaceChildren();
        for (let line = 1; line < lines; line++) {
            const guide = document.createElement("div");
            guide.className = "guideline";
            guide.style.top = (8 + line * 20) / (lines * 20 + 16) * 100 + "%";
            guides.append(guide);
        }
        notify();
    }
    document.querySelector(".linecount").addEventListener("change", event => {
        event.target.value = Math.max(1, Math.min(8, Math.round(Number(event.target.value) || 1)));
        remember();
        resize();
    });
    document.querySelector(".artwidth").addEventListener("change", () => {remember(); resize();});
    document.querySelector(".artwidth").addEventListener("input", event => {document.querySelector(".widthvalue").value = event.target.value + " px";});

    document.querySelector(".example").addEventListener("change", event => {
        if (!event.target.value) return;
        remember();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        const scale = Math.min(canvas.width / 240, canvas.height / 36);
        ctx.scale(scale, scale);
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#000000";
        ctx.beginPath();
        if (event.target.value === "cat") {
            ctx.moveTo(-22, 10); ctx.lineTo(-21, -12); ctx.lineTo(-10, -5);
            ctx.quadraticCurveTo(0, -9, 10, -5);
            ctx.lineTo(21, -12); ctx.lineTo(22, 10);
            ctx.quadraticCurveTo(0, 19, -22, 10);
            ctx.moveTo(-11, 0); ctx.lineTo(-9, 0);
            ctx.moveTo(9, 0); ctx.lineTo(11, 0);
            ctx.moveTo(-3, 5); ctx.lineTo(0, 7); ctx.lineTo(3, 5);
            ctx.moveTo(-18, 5); ctx.lineTo(-30, 3);
            ctx.moveTo(18, 5); ctx.lineTo(30, 3);
        } else if (event.target.value === "wave") {
            ctx.moveTo(-75, 0);
            for (let x = -75; x <= 75; x++) ctx.lineTo(x, Math.sin(x / 8) * 10);
        } else if (event.target.value === "heart") {
            ctx.moveTo(0, 12);
            ctx.bezierCurveTo(-30, -3, -12, -23, 0, -8);
            ctx.bezierCurveTo(12, -23, 30, -3, 0, 12);
        } else if (event.target.value === "flower") {
            for (let index = 0; index < 5; index++) {
                const angle = index * Math.PI * 2 / 5 - Math.PI / 2;
                const x = Math.cos(angle) * 6;
                const y = Math.sin(angle) * 6 - 4;
                ctx.moveTo(x + 4, y);
                ctx.arc(x, y, 4, 0, Math.PI * 2);
            }
            ctx.moveTo(3, -4); ctx.arc(0, -4, 3, 0, Math.PI * 2);
            ctx.moveTo(0, 4); ctx.lineTo(0, 15);
            ctx.moveTo(0, 12); ctx.quadraticCurveTo(-10, 3, -11, 8);
            ctx.quadraticCurveTo(-7, 15, 0, 12);
        } else {
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.moveTo(-5, -4); ctx.lineTo(-5, -2);
            ctx.moveTo(5, -4); ctx.lineTo(5, -2);
            ctx.moveTo(-6, 4); ctx.quadraticCurveTo(0, 11, 6, 4);
        }
        ctx.stroke();
        ctx.restore();
        notify();
    });

    document.querySelector(".imagefile").addEventListener("change", async event => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const image = await createImageBitmap(file, {resizeWidth: Math.min(2048, canvas.width), resizeQuality: "high"});
            remember();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
            const width = image.width * scale;
            const height = image.height * scale;
            ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
            image.close();
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let light = 0;
            let samples = 0;
            let transparent = 0;
            let area = 0;
            const left = Math.ceil((canvas.width - width) / 2);
            const top = Math.ceil((canvas.height - height) / 2);
            for (let y = top; y < top + Math.floor(height); y++) {
                for (let x = left; x < left + Math.floor(width); x++) {
                    area++;
                    if (data.data[(y * canvas.width + x) * 4 + 3] < 250) transparent++;
                }
            }
            for (let index = 0; index < data.data.length; index += 4) {
                if (data.data[index + 3] < 250) continue;
                light += data.data[index] + data.data[index + 1] + data.data[index + 2];
                samples++;
            }
            const invert = light / Math.max(1, samples * 3) > 128;
            for (let index = 0; index < data.data.length; index += 4) {
                const luminance = data.data[index] * 0.2126 + data.data[index + 1] * 0.7152 + data.data[index + 2] * 0.0722;
                if (transparent / Math.max(1, area) < 0.05) data.data[index + 3] *= (invert ? 255 - luminance : luminance) / 255;
                data.data[index] = 0;
                data.data[index + 1] = 0;
                data.data[index + 2] = 0;
            }
            ctx.putImageData(data, 0, 0);
            notify();
        } catch {
            const error = document.querySelector(".error");
            error.textContent = "Could not open this image.";
            error.hidden = false;
        }
        event.target.value = "";
    });
    resize();
    return {canvas, image: () => ctx.getImageData(0, 0, canvas.width, canvas.height), populated: () => populated};
}
