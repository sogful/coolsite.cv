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
        const glyphs = [...word].map(letter => font.glyphs[letter.codePointAt(0)] || font.glyphs[63]);
        const canvas = document.createElement("canvas");
        canvas.width = glyphs.reduce((width, glyph) => width + glyph[2], 0);
        canvas.height = font.height;
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        let offset = 0;
        for (const [x, y, width, height] of glyphs) {
            context.drawImage(atlas, x, y, width, height, offset, 0, width, height);
            offset += width;
        }
        const result = {url: canvas.toDataURL(), width: canvas.width * 2, height: canvas.height * 2};
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
