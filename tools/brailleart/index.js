const DOTBIT = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80],
];

const pad = document.querySelector(".pad");
const ctx = pad.getContext("2d");
const out = document.querySelector(".out");
const sizehint = document.querySelector(".sizehint");
const countseg = document.querySelector(".countseg");

let cols = 40, rows = 16;
let gw = cols * 2, gh = rows * 4;
let grid = new Uint8Array(gw * gh);
let pitch = 10;
const dpr = Math.min(2, window.devicePixelRatio || 1);

let tool = "pen", mode = 1, filled = false, brush = 1, showgrid = true;
let blankpad = true, invertview = false;
let srcimg = null;

function px(x, y) {return grid[y * gw + x]}
function setpx(x, y, v) {
    if (x < 0 || y < 0 || x >= gw || y >= gh) return;
    grid[y * gw + x] = v ? 1 : 0;
}

/*//////////////////////////////////////////////////////////////////////*/

const undobtn = document.querySelector(".undobtn");
const redobtn = document.querySelector(".redobtn");
let undos = [], redos = [];
const HISTMAX = 60;

function snapshot() {
    return {gw: gw, gh: gh, cols: cols, rows: rows, data: grid.slice()};
}
function pushhistory() {
    undos.push(snapshot());
    if (undos.length > HISTMAX) undos.shift();
    redos = [];
    refreshhist();
}
function restore(s) {
    cols = s.cols; rows = s.rows; gw = s.gw; gh = s.gh;
    grid = s.data.slice();
    document.querySelector(".cols").value = cols;
    document.querySelector(".rows").value = rows;
    resizecanvas();
}
function refreshhist() {
    undobtn.disabled = undos.length === 0;
    redobtn.disabled = redos.length === 0;
}
undobtn.addEventListener("click", () => {
    if (!undos.length) return;
    redos.push(snapshot());
    restore(undos.pop());
    refreshhist(); changed();
});
redobtn.addEventListener("click", () => {
    if (!redos.length) return;
    undos.push(snapshot());
    restore(redos.pop());
    refreshhist(); changed();
});

/*//////////////////////////////////////////////////////////////////////*/

const padwrap = document.querySelector(".padwrap");

function resizecanvas() {
    gw = cols * 2; gh = rows * 4;
    const availw = Math.max(40, padwrap.clientWidth - 2);
    const availh = Math.max(40, padwrap.clientHeight - 2);
    pitch = Math.max(2, Math.min(16,
        Math.floor(Math.min(availw / gw, availh / gh))));
    pad.width = gw * pitch * dpr;
    pad.height = gh * pitch * dpr;
    pad.style.width = (gw * pitch) + "px";
    pad.style.height = (gh * pitch) + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizehint.textContent =
        gw + " x " + gh + " dots  ->  " + cols + " x " + rows + " chars";
    dirty = true;
}
let resizetimer = null;
window.addEventListener("resize", () => {
    clearTimeout(resizetimer);
    resizetimer = setTimeout(resizecanvas, 80);
});
function render(g) {
    const W = gw * pitch, H = gh * pitch;
    const oncol = invertview ? "#f1f1f1" : "#1a1a1a";
    const offcol = invertview ? "#3a3a40" : "#dcdce0";
    const linecol = invertview ? "#2c2c31" : "#eef0f2";
    ctx.clearRect(0, 0, W, H);
    if (showgrid) {
        ctx.strokeStyle = linecol; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
            const xx = Math.round(c * 2 * pitch) + 0.5;
            ctx.moveTo(xx, 0); ctx.lineTo(xx, H);
        }
        for (let r = 0; r <= rows; r++) {
            const yy = Math.round(r * 4 * pitch) + 0.5;
            ctx.moveTo(0, yy); ctx.lineTo(W, yy);
        }
        ctx.stroke();
    }

    const onr = Math.max(1.6, pitch * 0.36);
    const offr = Math.max(0.7, pitch * 0.13);
    for (let y = 0; y < gh; y++) {
        const cy = (y + 0.5) * pitch;
        for (let x = 0; x < gw; x++) {
            const cx = (x + 0.5) * pitch;
            if (g[y * gw + x]) {
                ctx.fillStyle = oncol;
                ctx.beginPath(); ctx.arc(cx, cy, onr, 0, 6.2832); ctx.fill();
            } else if (showgrid) {
                ctx.fillStyle = offcol;
                ctx.beginPath(); ctx.arc(cx, cy, offr, 0, 6.2832); ctx.fill();
            }
        }
    }
}

/*//////////////////////////////////////////////////////////////////////*/

function tobraille() {
    const empty = blankpad ? "⠀" : " ";
    const lines = [];
    for (let r = 0; r < rows; r++) {
        const cells = [];
        let lastfilled = -1;
        for (let c = 0; c < cols; c++) {
            let bits = 0;
            for (let cy = 0; cy < 4; cy++) {
                for (let cx = 0; cx < 2; cx++) {
                    const gx = c * 2 + cx, gy = r * 4 + cy;
                    if (grid[gy * gw + gx]) bits |= DOTBIT[cy][cx];
                }
            }
            cells.push(bits);
            if (bits) lastfilled = c;
        }
        let line = "";
        for (let c = 0; c <= lastfilled; c++)
            line += cells[c] ? String.fromCharCode(0x2800 + cells[c]) : empty;
        lines.push(line);
    }
    return lines.join("\n");
}

const LIMITS = [
    {n: 280, col: "#d8a72b"}, // twitter
    {n: 300, col: "#d97a2b"}, // bsky
    {n: 500, col: "#d0454b"}, // mastodon and threads
];

function updateoutput() {
    const txt = tobraille();
    out.value = txt;
    const total = txt.length;
    let col = "#999";
    for (const l of LIMITS) if (total > l.n) col = l.col;
    countseg.style.color = col;
    countseg.textContent = total + " chars, " + rows + " lines";
}

let dirty = false, outdirty = false;
function changed() {dirty = true; outdirty = true}
function dirtyonly() {dirty = true}

function loop() {
    if (dirty) {dirty = false; render(grid)}
    if (outdirty) {outdirty = false; updateoutput()}
    requestAnimationFrame(loop);
}

/*//////////////////////////////////////////////////////////////////////*/

function stamp(g, x, y, v, rad) {
    if (rad <= 0) {
        if (x >= 0 && y >= 0 && x < gw && y < gh) g[y * gw + x] = v;
        return;
    }
    for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
            if (dx * dx + dy * dy > rad * rad + 0.5) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < gw && ny < gh) g[ny * gw + nx] = v;
        }
    }
}

function lineto(g, x0, y0, x1, y1, v, rad) {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
        stamp(g, x0, y0, v, rad);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {err -= dy; x0 += sx}
        if (e2 < dx) {err += dx; y0 += sy}
    }
}

function rectshape(g, x0, y0, x1, y1, v, fill) {
    const ax = Math.min(x0, x1), bx = Math.max(x0, x1);
    const ay = Math.min(y0, y1), by = Math.max(y0, y1);
    if (fill) {
        for (let y = ay; y <= by; y++)
            for (let x = ax; x <= bx; x++) stamp(g, x, y, v, 0);
    } else {
        for (let x = ax; x <= bx; x++) {stamp(g, x, ay, v, 0); stamp(g, x, by, v, 0)}
        for (let y = ay; y <= by; y++) {stamp(g, ax, y, v, 0); stamp(g, bx, y, v, 0)}
    }
}

function ellipseshape(g, x0, y0, x1, y1, v, fill) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
    if (rx < 0.5 || ry < 0.5) {stamp(g, Math.round(cx), Math.round(cy), v, 0); return}
    if (fill) {
        const ay = Math.round(cy - ry), by = Math.round(cy + ry);
        for (let y = ay; y <= by; y++) {
            const t = (y - cy) / ry;
            if (Math.abs(t) > 1) continue;
            const w = rx * Math.sqrt(1 - t * t);
            const ax = Math.round(cx - w), bx = Math.round(cx + w);
            for (let x = ax; x <= bx; x++) stamp(g, x, y, v, 0);
        }
    } else {
        const steps = Math.max(24, Math.round((rx + ry) * 3));
        let prevx = null, prevy = null;
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * 6.2832;
            const x = Math.round(cx + rx * Math.cos(a));
            const y = Math.round(cy + ry * Math.sin(a));
            if (prevx !== null) lineto(g, prevx, prevy, x, y, v, 0);
            prevx = x; prevy = y;
        }
    }
}

function floodfill(g, x, y, v) {
    if (x < 0 || y < 0 || x >= gw || y >= gh) return;
    const target = g[y * gw + x];
    if (target === v) return;
    const stack = [[x, y]];
    while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= gw || cy >= gh) continue;
        if (g[cy * gw + cx] !== target) continue;
        g[cy * gw + cx] = v;
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
}

/*//////////////////////////////////////////////////////////////////////*/

function locate(e) {
    const rc = pad.getBoundingClientRect();
    const x = Math.floor((e.clientX - rc.left) / rc.width * gw);
    const y = Math.floor((e.clientY - rc.top) / rc.height * gh);
    return [Math.max(0, Math.min(gw - 1, x)), Math.max(0, Math.min(gh - 1, y))];
}

let drawing = false, startx = 0, starty = 0, lastx = 0, lasty = 0;
const rad = () => brush - 1;

function applyshape(g, x0, y0, x1, y1) {
    const v = mode;
    if (tool === "rect") rectshape(g, x0, y0, x1, y1, v, filled);
    else if (tool === "ellipse") ellipseshape(g, x0, y0, x1, y1, v, filled);
    else if (tool === "line") lineto(g, x0, y0, x1, y1, v, rad());
}

pad.addEventListener("pointerdown", e => {
    pad.setPointerCapture(e.pointerId);
    const [x, y] = locate(e);
    pushhistory();
    drawing = true; startx = lastx = x; starty = lasty = y;

    if (tool === "pen") {stamp(grid, x, y, mode, rad()); changed()}
    else if (tool === "fill") {floodfill(grid, x, y, mode); changed(); drawing = false}
});

pad.addEventListener("pointermove", e => {
    if (!drawing) return;
    const [x, y] = locate(e);
    if (tool === "pen") {
        lineto(grid, lastx, lasty, x, y, mode, rad());
        lastx = x; lasty = y; changed();
    } else {
        const g = grid.slice();
        applyshape(g, startx, starty, x, y);
        lastx = x; lasty = y;
        render(g);
    }
});

window.addEventListener("pointerup", () => {
    if (!drawing) return;
    drawing = false;
    if (tool === "line" || tool === "rect" || tool === "ellipse") {
        applyshape(grid, startx, starty, lastx, lasty);
        changed();
    }
});

/*//////////////////////////////////////////////////////////////////////*/

document.querySelectorAll("button[data-tool]").forEach(b => {
    b.addEventListener("click", () => {
        tool = b.dataset.tool;
        document.querySelectorAll("button[data-tool]")
            .forEach(o => o.classList.toggle("active", o === b));
    });
});
document.querySelectorAll("button[data-mode]").forEach(b => {
    b.addEventListener("click", () => {
        mode = b.dataset.mode === "draw" ? 1 : 0;
        document.querySelectorAll("button[data-mode]")
            .forEach(o => o.classList.toggle("active", o === b));
    });
});
const brushseg = document.querySelector(".brushseg");
document.querySelector(".brush").addEventListener("input", e => {
    brush = +e.target.value; brushseg.textContent = brush;
});
document.querySelector(".filled").addEventListener("change", e => {filled = e.target.checked});
document.querySelector(".showgrid").addEventListener("change", e => {
    showgrid = e.target.checked; dirtyonly();
});
document.querySelector(".blankpad").addEventListener("change", e => {
    blankpad = e.target.checked; outdirty = true;
});

document.querySelector(".clearbtn").addEventListener("click", () => {
    pushhistory(); grid.fill(0); changed();
});
document.querySelector(".invertbtn").addEventListener("click", () => {
    pushhistory();
    for (let i = 0; i < grid.length; i++) grid[i] = grid[i] ? 0 : 1;
    changed();
});
document.querySelector(".fliphbtn").addEventListener("click", () => {
    pushhistory();
    const g = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++)
        for (let x = 0; x < gw; x++) g[y * gw + x] = grid[y * gw + (gw - 1 - x)];
    grid = g; changed();
});
document.querySelector(".flipvbtn").addEventListener("click", () => {
    pushhistory();
    const g = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++)
        for (let x = 0; x < gw; x++) g[y * gw + x] = grid[(gh - 1 - y) * gw + x];
    grid = g; changed();
});

document.querySelectorAll("button[data-nudge]").forEach(b => {
    b.addEventListener("click", () => {
        pushhistory();
        let dx = 0, dy = 0;
        const n = b.dataset.nudge;
        if (n === "l") dx = -1; else if (n === "r") dx = 1;
        else if (n === "u") dy = -1; else dy = 1;
        const g = new Uint8Array(gw * gh);
        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                const sx = x - dx, sy = y - dy;
                if (sx >= 0 && sy >= 0 && sx < gw && sy < gh)
                    g[y * gw + x] = grid[sy * gw + sx];
            }
        }
        grid = g; changed();
    });
});

document.querySelector(".trimbtn").addEventListener("click", () => {
    let minx = gw, miny = gh, maxx = -1, maxy = -1;
    for (let y = 0; y < gh; y++)
        for (let x = 0; x < gw; x++)
            if (grid[y * gw + x]) {
                if (x < minx) minx = x; if (x > maxx) maxx = x;
                if (y < miny) miny = y; if (y > maxy) maxy = y;
            }
    if (maxx < 0) return;
    pushhistory();
    const ax = Math.floor(minx / 2) * 2, ay = Math.floor(miny / 4) * 4;
    const ncols = Math.ceil((maxx + 1) / 2) - ax / 2;
    const nrows = Math.ceil((maxy + 1) / 4) - ay / 4;
    const ngw = ncols * 2, ngh = nrows * 4;
    const g = new Uint8Array(ngw * ngh);
    for (let y = 0; y < ngh; y++)
        for (let x = 0; x < ngw; x++) {
            const sx = ax + x, sy = ay + y;
            if (sx < gw && sy < gh) g[y * ngw + x] = grid[sy * gw + sx];
        }
    cols = ncols; rows = nrows; grid = g;
    document.querySelector(".cols").value = cols;
    document.querySelector(".rows").value = rows;
    resizecanvas(); changed();
});

/*//////////////////////////////////////////////////////////////////////*/

function applysize(ncols, nrows) {
    ncols = Math.max(1, Math.min(200, ncols | 0));
    nrows = Math.max(1, Math.min(200, nrows | 0));
    const ngw = ncols * 2, ngh = nrows * 4;
    const g = new Uint8Array(ngw * ngh);
    for (let y = 0; y < Math.min(gh, ngh); y++)
        for (let x = 0; x < Math.min(gw, ngw); x++)
            g[y * ngw + x] = grid[y * gw + x];
    cols = ncols; rows = nrows; grid = g;
    resizecanvas(); changed();
}
document.querySelector(".applysize").addEventListener("click", () => {
    pushhistory();
    applysize(+document.querySelector(".cols").value,
              +document.querySelector(".rows").value);
});

/*//////////////////////////////////////////////////////////////////////*/

// image import / dithering
const thr = document.querySelector(".thr"), thrseg = document.querySelector(".thrseg");
const bri = document.querySelector(".bri"), briseg = document.querySelector(".briseg");
const con = document.querySelector(".con"), conseg = document.querySelector(".conseg");

function lumarray() {
    const oc = document.createElement("canvas");
    oc.width = gw; oc.height = gh;
    const o = oc.getContext("2d", {willReadFrequently: true});
    o.fillStyle = "#fff"; o.fillRect(0, 0, gw, gh);
    o.imageSmoothingEnabled = true;

    const fit = document.querySelector(".fit").value;
    const iw = srcimg.naturalWidth, ih = srcimg.naturalHeight;
    let dw = gw, dh = gh, dx = 0, dy = 0;
    if (fit !== "stretch") {
        const s = fit === "contain"
            ? Math.min(gw / iw, gh / ih)
            : Math.max(gw / iw, gh / ih);
        dw = iw * s; dh = ih * s;
        dx = (gw - dw) / 2; dy = (gh - dh) / 2;
    }
    o.drawImage(srcimg, dx, dy, dw, dh);

    const data = o.getImageData(0, 0, gw, gh).data;
    const b = +bri.value, cval = +con.value;
    const factor = (259 * (cval * 2.55 + 255)) / (255 * (259 - cval * 2.55));
    const inv = document.querySelector(".imginv").checked;
    const lum = new Float32Array(gw * gh);
    for (let i = 0; i < gw * gh; i++) {
        const j = i * 4;
        let l = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
        l = factor * (l - 128) + 128 + b * 2.55;
        if (inv) l = 255 - l;
        lum[i] = l < 0 ? 0 : l > 255 ? 255 : l;
    }
    return lum;
}

const BAYER = [
    [0, 8, 2, 10], [12, 4, 14, 6],
    [3, 11, 1, 9], [15, 7, 13, 5],
];

function convertimage() {
    if (!srcimg) return;
    const lum = lumarray();
    const method = document.querySelector(".dither").value;
    const t = +thr.value;
    const g = new Uint8Array(gw * gh);

    if (method === "threshold") {
        for (let i = 0; i < g.length; i++) g[i] = lum[i] < t ? 1 : 0;
    } else if (method === "bayer") {
        for (let y = 0; y < gh; y++)
            for (let x = 0; x < gw; x++) {
                const m = (BAYER[y & 3][x & 3] + 0.5) / 16 * 255;
                const cut = t - 128 + m;
                g[y * gw + x] = lum[y * gw + x] < cut ? 1 : 0;
            }
    } else {
        const buf = lum.slice();
        const atk = method === "atkinson";
        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                const i = y * gw + x;
                const old = buf[i];
                const on = old < t;
                g[i] = on ? 1 : 0;
                const newv = on ? 0 : 255;
                const err = old - newv;
                if (atk) {
                    const e = err / 8;
                    spread(buf, x + 1, y, e); spread(buf, x + 2, y, e);
                    spread(buf, x - 1, y + 1, e); spread(buf, x, y + 1, e);
                    spread(buf, x + 1, y + 1, e); spread(buf, x, y + 2, e);
                } else {
                    spread(buf, x + 1, y, err * 7 / 16);
                    spread(buf, x - 1, y + 1, err * 3 / 16);
                    spread(buf, x, y + 1, err * 5 / 16);
                    spread(buf, x + 1, y + 1, err * 1 / 16);
                }
            }
        }
    }
    grid = g; changed();
}
function spread(buf, x, y, e) {
    if (x < 0 || y < 0 || x >= gw || y >= gh) return;
    buf[y * gw + x] += e;
}

function loadfromcontrols() {
    if (!srcimg) return;
    pushhistory();
    if (document.querySelector(".autosize").checked) {
        const iw = srcimg.naturalWidth, ih = srcimg.naturalHeight;
        const targetdots = cols * 2;
        const ratio = ih / iw;
        let nrows = Math.max(1, Math.round(targetdots * ratio / 4));
        nrows = Math.min(200, nrows);
        applysizesilent(cols, nrows);
    }
    convertimage();
}
function applysizesilent(ncols, nrows) {
    const ngw = ncols * 2, ngh = nrows * 4;
    cols = ncols; rows = nrows; gw = ngw; gh = ngh;
    grid = new Uint8Array(ngw * ngh);
    document.querySelector(".cols").value = cols;
    document.querySelector(".rows").value = rows;
    resizecanvas();
}

document.querySelector(".imgfile").addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {srcimg = img; loadfromcontrols()};
    img.src = URL.createObjectURL(f);
});

[thr, bri, con].forEach(el => el.addEventListener("input", () => {
    thrseg.textContent = thr.value; briseg.textContent = bri.value;
    conseg.textContent = con.value;
    if (srcimg) convertimage();
}));
document.querySelector(".dither").addEventListener("change", () => {if (srcimg) convertimage()});
document.querySelector(".fit").addEventListener("change", () => {if (srcimg) convertimage()});
document.querySelector(".imginv").addEventListener("change", e => {
    invertview = e.target.checked;
    document.body.classList.toggle("inverted", invertview);
    dirtyonly();
    if (srcimg) convertimage();
});

/*//////////////////////////////////////////////////////////////////////*/


const copybtn = document.querySelector(".copybtn");
copybtn.addEventListener("click", () => {
    navigator.clipboard.writeText(out.value).then(() => {
        copybtn.classList.add("copied"); copybtn.textContent = "copied";
        setTimeout(() => {
            copybtn.classList.remove("copied"); copybtn.textContent = "copy";
        }, 1100);
    });
});
document.querySelector(".dlbtn").addEventListener("click", () => {
    const blob = new Blob([out.value], {type: "text/plain;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "braille-art.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

out.addEventListener("input", () => {
    const lines = out.value.replace(/\r/g, "").split("\n");
    const nrows = Math.max(1, lines.length);
    let ncols = 1;
    for (const ln of lines) ncols = Math.max(ncols, [...ln].length);
    pushhistory();
    cols = Math.min(200, ncols); rows = Math.min(200, nrows);
    gw = cols * 2; gh = rows * 4;
    grid = new Uint8Array(gw * gh);
    for (let r = 0; r < rows && r < lines.length; r++) {
        const chs = [...lines[r]];
        for (let c = 0; c < cols && c < chs.length; c++) {
            const code = chs[c].codePointAt(0);
            if (code < 0x2800 || code > 0x28ff) continue;
            const bits = code - 0x2800;
            for (let cy = 0; cy < 4; cy++)
                for (let cx = 0; cx < 2; cx++)
                    if (bits & DOTBIT[cy][cx])
                        grid[(r * 4 + cy) * gw + (c * 2 + cx)] = 1;
        }
    }
    document.querySelector(".cols").value = cols;
    document.querySelector(".rows").value = rows;
    resizecanvas(); dirtyonly();
});

/*//////////////////////////////////////////////////////////////////////*/

resizecanvas();
updateoutput();
requestAnimationFrame(loop);
