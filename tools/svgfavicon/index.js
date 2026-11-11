const endpoints = [
    "https://abs.twimg.com/emoji/v2/svg/",
    "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/"
];
let requestid = 0;
let timer;

function codepoint(emoji) {
    return Array.from(emoji)
        .map(char => char.codePointAt(0).toString(16))
        .filter(code => code !== "fe0f")
        .join("-");
}

function splitemoji(value) {
    const text = value.trim();
    if (!text) return [];
    if (!Intl.Segmenter) return [text];
    const segmenter = new Intl.Segmenter(undefined, {granularity: "grapheme"});
    return Array.from(segmenter.segment(text), part => part.segment)
        .filter(part => part.trim());
}

function trimsvg(source) {
    const documentxml = new DOMParser().parseFromString(source, "image/svg+xml");
    if (documentxml.querySelector("parsererror")) throw new Error("Twitter returned invalid SVG.");
    const root = documentxml.documentElement;
    root.querySelectorAll("title, desc, metadata, script, foreignObject").forEach(node => node.remove());
    ["width", "height", "id", "class", "style", "role", "focusable"].forEach(name => root.removeAttribute(name));
    [root, ...root.querySelectorAll("*")].forEach(element => {
        Array.from(element.attributes).forEach(attribute => {
            if (/^(aria-|data-)/.test(attribute.name)) element.removeAttribute(attribute.name);
        });
    });
    const walker = documentxml.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const empty = [];
    while (walker.nextNode()) {
        if (!walker.currentNode.nodeValue.trim()) empty.push(walker.currentNode);
    }
    empty.forEach(node => node.remove());
    return new XMLSerializer().serializeToString(root).replace(/>\s+</g, "><").trim();
}

function textsvg(text) {
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><text x="18" y="18" font-size="28" font-family="system-ui,Segoe UI Emoji,sans-serif" text-anchor="middle" dominant-baseline="central">${escaped}</text></svg>`;
}

async function fetchemoji(emoji) {
    const filename = codepoint(emoji) + ".svg";
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint + filename, {mode: "cors", cache: "force-cache"});
            if (response.ok) return {svg: trimsvg(await response.text()), fallback: false};
        } catch (error) {
        }
    }
    return {svg: textsvg(emoji), fallback: true};
}

function innersvg(svg) {
    const documentxml = new DOMParser().parseFromString(svg, "image/svg+xml");
    return documentxml.documentElement.innerHTML
        .replace(/\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "");
}

function compose(svgs) {
    if (svgs.length === 1) return svgs[0];
    const columns = Math.ceil(Math.sqrt(svgs.length));
    const rows = Math.ceil(svgs.length / columns);
    const scale = 1 / Math.max(columns, rows);
    const size = 36 * scale;
    const offsetx = (36 - columns * size) / 2;
    const offsety = (36 - rows * size) / 2;
    const content = svgs.map((svg, index) => {
        const x = offsetx + index % columns * size;
        const y = offsety + Math.floor(index / columns) * size;
        return `<g transform="translate(${x} ${y}) scale(${scale})">${innersvg(svg)}</g>`;
    }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">${content}</svg>`;
}

function dataurl(svg) {
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function setfavicon(url) {
    let link = document.querySelector(".dynamic-favicon");
    if (!link) {
        link = document.createElement("link");
        link.className = "dynamic-favicon";
        link.rel = "icon";
        link.type = "image/svg+xml";
        document.head.appendChild(link);
    }
    link.href = url;
}

function preview(svg) {
    const image = new Image(64, 64);
    image.src = dataurl(svg);
    image.alt = "generated favicon preview";
    image.className = "previewimage";
    const container = document.querySelector(".preview");
    container.replaceChildren(image);
}

async function updfavicon() {
    const current = ++requestid;
    const status = document.querySelector(".status");
    const emoji = splitemoji(document.querySelector(".emoji").value);
    if (!emoji.length) return;
    status.textContent = "loading twemojis..";
    try {
        const result = await Promise.all(emoji.map(fetchemoji));
        const svg = compose(result.map(item => item.svg));
        if (current !== requestid) return;
        const url = dataurl(svg);
        preview(svg);
        setfavicon(url);
        document.querySelector(".output").textContent =
            `<link rel="icon" type="image/svg+xml" href="${url}">`;
        status.textContent = result.some(item => item.fallback) ?
            "created, unavailable glyphs use your system font" : "created";
    } catch (error) {
        if (current !== requestid) return;
        status.textContent = error.message;
    }
}

document.querySelector(".favicon-form").addEventListener("submit", function(e){
    e.preventDefault();
    updfavicon();
});
document.querySelector(".emoji").addEventListener("input", function(){
    clearTimeout(timer);
    timer = setTimeout(updfavicon, 250);
});
document.addEventListener("DOMContentLoaded", updfavicon);
