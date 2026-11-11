import {Font, woff2} from "/assets/static/js/fonteditor.min.js";

const statuselement = document.querySelector(".status");
const errorelement = document.querySelector(".err");
const outelement = document.querySelector(".output");
const fontpreview = document.querySelector(".preview");
const sizeelement = document.querySelector(".origsize");

let woff2ready = null;
function ensurewoff2() {
    if (!woff2ready) {
        woff2ready = woff2.init("/assets/static/woff2.wasm");
    }
    return woff2ready;
}

// unicode ranges!
const presets = {
    basiclatin: rangechars(0x0020, 0x007E),
    latin1: rangechars(0x00A0, 0x00FF),
    latinext: rangechars(0x0100, 0x024F),
    cyrillic: rangechars(0x0400, 0x04FF),
    greek: rangechars(0x0370, 0x03FF),
    hebrew: rangechars(0x0590, 0x05FF),
    arabic: rangechars(0x0600, 0x06FF),
    hiragana: rangechars(0x3040, 0x309F),
    katakana: rangechars(0x30A0, 0x30FF),
    digits: "0123456789",
    punct: rangechars(0x2000, 0x206F),
    symbols: rangechars(0x2100, 0x214F),
    currency: rangechars(0x20A0, 0x20CF),
    arrows: rangechars(0x2190, 0x21FF),
    math: rangechars(0x2200, 0x22FF),
    box: rangechars(0x2500, 0x257F),
};

/*//////////////////////////////////////////////////////////////////////*/

function rangechars(a, b) {
    let s = "";
    for (let i = a; i <= b; i++) s += String.fromCodePoint(i);
    return s;
}
function uniquecodepoints(text) {
    const set = new Set();
    for (const ch of text) {
        const cep = ch.codePointAt(0);
        if (cep != null) set.add(cep);
    }
    return Array.from(set).sort((a, b) => a - b);
}
function detecttype(name) {
    const ext = (name || "").toLowerCase().split(".").pop();
    if (ext === "woff2") return "woff2";
    if (ext === "woff") return "woff";
    return "ttf";
}
function humanbytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(2) + " MB";
}

/*//////////////////////////////////////////////////////////////////////*/

document.querySelector(".presets").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-preset]");
    const key = btn.dataset.preset;
    const ta = document.querySelector(".glyphtext");
    if (key === "clear") {ta.value = ""; return}

    const add = presets[key];
    const existing = new Set(ta.value);
    let extra = "";

    for (const ch of add) if (!existing.has(ch)) extra += ch;
    ta.value = (ta.value + extra);
});

let fontbuffer = null;
let fontname = "";
document.querySelector(".fontfile").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) {fontbuffer = null; sizeelement.textContent = ""; return}
    fontname = f.name;
    fontbuffer = await f.arrayBuffer();
    sizeelement.textContent = `(${humanbytes(fontbuffer.byteLength)} original)`;
});

function quantizecontours(font, factor) {
    if (factor <= 1) return;
    const head = font.data.head;
    if (head && head.unitsPerEm) {
        head.unitsPerEm = Math.max(16, Math.round(head.unitsPerEm / factor));
    }
    const scale = (v) => Math.round(v / factor);
    const glyf = font.data.glyf;
    if (glyf && Array.isArray(glyf)) {
        for (const g of glyf) {
            if (g.contours) {
                for (const contour of g.contours) {
                    for (const pt of contour) {
                        if (typeof pt.x === "number") pt.x = scale(pt.x);
                        if (typeof pt.y === "number") pt.y = scale(pt.y);
                    }
                }
            }
            if (typeof g.xMin === "number") g.xMin = scale(g.xMin);
            if (typeof g.xMax === "number") g.xMax = scale(g.xMax);
            if (typeof g.yMin === "number") g.yMin = scale(g.yMin);
            if (typeof g.yMax === "number") g.yMax = scale(g.yMax);
            if (typeof g.advanceWidth === "number") g.advanceWidth = scale(g.advanceWidth);
            if (typeof g.leftSideBearing === "number") g.leftSideBearing = scale(g.leftSideBearing);
        }
    }
    for (const k of ["xMin","xMax","yMin","yMax"]) {
        if (head && typeof head[k] === "number") head[k] = scale(head[k]);
    }
    const hhea = font.data.hhea;
    if (hhea) {
        for (const k of ["ascent","descent","lineGap","advanceWidthMax","minLeftSideBearing","minRightSideBearing","xMaxExtent"]) {
            if (typeof hhea[k] === "number") hhea[k] = scale(hhea[k]);
        }
    }
    const os2 = font.data["OS/2"];
    if (os2) {
        for (const k of ["sTypoAscender","sTypoDescender","sTypoLineGap","usWinAscent","usWinDescent","sxHeight","sCapHeight"]) {
            if (typeof os2[k] === "number") os2[k] = scale(os2[k]);
        }
    }
}

/*//////////////////////////////////////////////////////////////////////*/

function strip(font, opts) {
    const data = font.data;
    if (opts.kerning) {delete data.kern}
    if (opts.layout) {delete data.GSUB; delete data.GPOS; delete data.GDEF}
    if (opts.meta) {delete data.DSIG; delete data.meta; delete data.LTSH; delete data.VDMX; delete data.hdmx; delete data.PCLT}
    if (opts.hinting) {
        delete data.fpgm; delete data.prep; delete data.cvt; delete data.gasp;
        if (data.glyf && Array.isArray(data.glyf)) {
            for (const g of data.glyf) {if (g.instructions) g.instructions = []}
        }
    }
    if (opts.names && data.name) {
        const keep = ["fontFamily","fontSubFamily","fullName","postScriptName","version","uniqueSubFamily"];
        const filtered = {};
        for (const k of keep) if (data.name[k]) filtered[k] = data.name[k];
        data.name = filtered;
    }
}

document.querySelector(".compressform").addEventListener("submit", async (e) => {
    e.preventDefault();
    errorelement.textContent = "";
    outelement.textContent = "";
    fontpreview.innerHTML = "";
    const runbtn = document.querySelector(".runbtn");

    if (!fontbuffer) {errorelement.textContent = "pick a font file first"; return}
    const text = document.querySelector(".glyphtext").value;
    const codepoints = uniquecodepoints(text);
    if (codepoints.length === 0) {errorelement.textContent = "no glyphs specified - paste some text"; return}

    const intype = detecttype(fontname);
    const outtype = document.querySelector(".format").value;
    const simplify = parseInt(document.querySelector(".simplify").value) || 1;
    const opts = {
        hinting: document.querySelector(".opt-hinting").checked,
        kerning: document.querySelector(".opt-kerning").checked,
        layout: document.querySelector(".opt-layout").checked,
        names: document.querySelector(".opt-names").checked,
        meta: document.querySelector(".opt-meta").checked,
    };

    runbtn.disabled = true;
    statuselement.textContent = "loading..";
    try {
        if (intype === "woff2" || outtype === "woff2") await ensurewoff2();
        statuselement.textContent = "parsing..";
        const font = Font.create(fontbuffer, {
            type: intype, subset: codepoints,
            hinting: !opts.hinting,
            compound2simple: false,
        });

        statuselement.textContent = "stripping..";
        strip(font, opts); quantizecontours(font, simplify);

        statuselement.textContent = "writing..";
        const outbuf = font.write({type: outtype, hinting: !opts.hinting, deflate: null});

        const u8 = outbuf instanceof ArrayBuffer ? new Uint8Array(outbuf) : new Uint8Array(outbuf.buffer || outbuf);
        const blob = new Blob([u8], {type: "font/" + outtype});
        const url = URL.createObjectURL(blob);

        const ratio = ((u8.byteLength / fontbuffer.byteLength) * 100).toFixed(1);
        outelement.innerHTML = "";
        const sizeline = document.createElement("div");
        sizeline.textContent = `${humanbytes(fontbuffer.byteLength)} -> ${humanbytes(u8.byteLength)}  (${ratio}% of original, ${codepoints.length} glyphs kept)`;
        outelement.appendChild(sizeline);
        const dl = document.createElement("a");
        const basename = (fontname.replace(/\.[^.]+$/, "") || "subset") + ".min." + outtype;
        dl.href = url; dl.download = basename;
        dl.textContent = "download " + basename;
        dl.style.display = "inline-block"; dl.style.marginTop = "0.4em";
        outelement.appendChild(dl);

        statuselement.textContent = "rendering preview..";
        await renderpreview(blob, codepoints, outtype);
        statuselement.textContent = "done!";
    } catch (err) {
        console.error(err);
        errorelement.textContent = "error: " + (err && err.message ? err.message : String(err));
        statuselement.textContent = "";
    } finally {runbtn.disabled = false}
});

/*//////////////////////////////////////////////////////////////////////*/

let lastfontface = null;
async function renderpreview(blob, codepoints, outtype) {
    if (lastfontface) {
        try {document.fonts.delete(lastfontface)} catch {}
        lastfontface = null;
    }
    const url = URL.createObjectURL(blob);
    const fmt = outtype === "woff2" ? "woff2" : outtype === "woff" ? "woff" : outtype === "otf" ? "opentype" : "truetype";
    const face = new FontFace("PreviewFont", `url(${url}) format("${fmt}")`);
    try {
        await face.load();
        document.fonts.add(face);
        lastfontface = face;
    } catch (e) {
        fontpreview.innerHTML = `<div class="hint">preview unavailable (browser couldn't load the output): ${e.message}</div>`;
        return;
    }
    fontpreview.innerHTML = "";
    const cap = 800;
    const shown = codepoints.slice(0, cap);
    for (const cep of shown) {
        const div = document.createElement("div");
        div.className = "glyph";

        const ch = document.createElement("span");
        ch.className = "ch";

        ch.textContent = String.fromCodePoint(cep);
        const lbl = document.createElement("span");
        lbl.className = "cep";

        lbl.textContent = "U+" + cep.toString(16).toUpperCase().padStart(4, "0");
        div.appendChild(ch); div.appendChild(lbl);
        fontpreview.appendChild(div);
    }
    if (codepoints.length > cap) {
        const more = document.createElement("div");
        more.className = "hint";
        more.textContent = `+ ${codepoints.length - cap} more glyphs not shown`;
        fontpreview.appendChild(more);
    }
}
