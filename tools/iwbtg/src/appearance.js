/*//////////////////////////////////////////////////////////////////////*/

async function start() {
    const response = await fetch(new URL("../assets/fonts/comic.json", import.meta.url));
    if (!response.ok) {return;}
    const font = await response.json();
    const atlas = new Image();
    atlas.src = new URL("../assets/fonts/comic.png", import.meta.url).href;
    await atlas.decode();
    const cache = new Map();
    function picture(word) {
        if (cache.has(word)) {return cache.get(word);}
        const missing = [...word].some(letter => !font.glyphs[letter.codePointAt(0)]);
        const glyphs = missing ? [] : [...word].map(letter => font.glyphs[letter.codePointAt(0)]);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = "13px sans-serif";
        canvas.width = missing ? Math.ceil(context.measureText(word).width) : glyphs.reduce((width, glyph) => width + glyph[2], 0);
        canvas.height = font.height;
        context.imageSmoothingEnabled = false;
        if (missing) {
            context.font = "13px sans-serif";
            context.fillStyle = "#fff";
            context.fillText(word, 0, font.baseline || 15);
        }
        let offset = 0;
        for (const [x, y, width, height] of glyphs) {
            context.drawImage(atlas, x, y, width, height, offset, 0, width, height);
            offset += width;
        }
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        if (missing) {
            for (let index = 3; index < pixels.data.length; index += 4) {pixels.data[index] = pixels.data[index] >= 128 ? 255 : 0;}
            context.putImageData(pixels, 0, 0);
        }
        let top = canvas.height;
        let bottom = 0;
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                if (pixels.data[(y * canvas.width + x) * 4 + 3]) {top = Math.min(top, y); bottom = Math.max(bottom, y + 1);}
            }
        }
        const cropped = document.createElement("canvas");
        cropped.width = canvas.width;
        cropped.height = Math.max(1, bottom - top);
        cropped.getContext("2d").drawImage(canvas, 0, top, canvas.width, cropped.height, 0, 0, canvas.width, cropped.height);
        const result = {url: cropped.toDataURL(), width: cropped.width * 2, height: cropped.height * 2, baseline: ((font.baseline || 10) - bottom) * 2};
        if (cache.size > 512) {cache.clear();}
        cache.set(word, result);
        return result;
    }
    function render(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.textContent.trim() || node.parentElement.closest(".pixeltext, script, style, input, textarea, select, pre, canvas, .studioframe")) {continue;}
            nodes.push(node);
        }
        for (const node of nodes) {
            const span = document.createElement("span");
            span.className = "pixeltext";
            const reader = document.createElement("span");
            reader.className = "pixelreader";
            reader.textContent = node.textContent;
            span.append(reader);
            for (const word of node.textContent.split(/(\s+)/)) {
                if (!word) {continue;}
                if (/^\s+$/.test(word)) {
                    const space = document.createElement("wbr");
                    const gap = document.createElement("span");
                    gap.className = "pixelspace";
                    gap.setAttribute("aria-hidden", "true");
                    span.append(space, gap);
                    continue;
                }
                const glyph = picture(word);
                const image = document.createElement("img");
                image.className = "pixelword";
                image.src = glyph.url;
                image.width = glyph.width;
                image.height = glyph.height;
                image.style.verticalAlign = glyph.baseline + "px";
                image.alt = "";
                image.draggable = false;
                span.append(image);
            }
            node.replaceWith(span);
        }
    }
    const observer = new MutationObserver(() => {
        observer.disconnect();
        render(document.querySelector(".toolmain"));
        observe();
    });
    function observe() {observer.observe(document.querySelector(".toolmain"), {childList: true, subtree: true, characterData: true});}
    render(document.querySelector(".toolmain"));
    observe();
}

void start().catch(error => console.warn("Could not load the pixel font.", error));
