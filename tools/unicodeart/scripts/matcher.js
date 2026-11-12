import {profiles, loadfonts} from "./profiles.js?v=20261112b";
import {drawing} from "./atlas.js?v=7";
import {context, render, loss} from "./raster.js";
import {field, search, refine, spacing} from "./fit.js?v=5";
import {sampler} from "./sampling.js";
import {components, recognize} from "./recognition.js?v=20261112b";

const ready = loadfonts(self.fonts);
let serial = 0;
let pending = null;
let running = false;

/*//////////////////////////////////////////////////////////////////////*/

async function solve(request) {
    const {image, lines, maxmarks, trim, id} = request;
    const generation = request.serial;
    let deadline = performance.now() + 8;
    async function pause() {
        if (generation !== serial) throw new Error("cancelled");
        if (performance.now() < deadline) return;
        await new Promise(resolve => setTimeout(resolve, 4));
        deadline = performance.now() + 8;
        if (generation !== serial) throw new Error("cancelled");
    }
    await ready;
    await pause();
    const sample = sampler(image);
    let left = image.width;
    let right = 0;
    let top = image.height;
    let bottom = 0;
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (image.data[(y * image.width + x) * 4 + 3] < 20) continue;
            left = Math.min(left, x);
            right = Math.max(right, x + 1);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y + 1);
        }
    }
    if (left >= right || top >= bottom) return;
    const inkleft = left;
    const inkright = right;
    if (!trim) {left = 0; right = image.width;}
    const parts = lines === 1 ? components(image) : [];
    const recognized = await recognize(parts, pause);
    for (const [site, profile] of Object.entries(profiles)) {
        if (request.sites && !request.sites.includes(site)) continue;
        const started = performance.now();
        self.postMessage({type: "progress", id, message: `measuring ${profile.name} glyphs...`});
        const glyphs = await drawing(site, maxmarks, pause);
        const measured = performance.now();
        const height = lines * profile.height + 16;
        let bounds = {top: 8 + profile.baseline - Math.ceil(profile.size * 0.95), height: (lines - 1) * profile.height + Math.ceil(profile.size * 1.15)};
        const measure = context(1, 1, profile);
        let whole = null;
        let horizontal = 0.25;
        if (recognized) {
            whole = recognized.map(match => match.char).join("");
            const metrics = measure.measureText(whole);
            bounds = {top: 8 + profile.baseline - metrics.actualBoundingBoxAscent, height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent};
            horizontal = metrics.width / (inkright - inkleft);
            whole = spacing(measure, 5 + (inkleft - left) * horizontal) + whole;
        }
        const available = bounds.height;
        const scale = recognized ? available / (bottom - top) : Math.min(available / (bottom - top),(request.width - 10) / (right - left));
        if (!recognized) horizontal = scale;
        let width = Math.ceil((right - left) * horizontal + 10);
        let ctx = context(width, height, profile);
        let target = sample(width, height, left, top, scale, bounds.top, horizontal);
        let map = null;
        let text = whole;
        const rows = [];
        if (!text) {
            map = field(target, width, height);
            for (let row = 0; row < lines; row++) rows.push(await search(glyphs, map, row, profile, pause));
        }
        const searched = performance.now();
        text ||= await refine(ctx, rows, profile, map, glyphs, site, maxmarks, pause);
        await pause();
        const required = Math.ceil(Math.max(...text.split("\n").map(row => ctx.measureText(row).actualBoundingBoxRight))) + 4;
        if (required > width) {
            const expanded = new Float32Array(required * height);
            for (let row = 0; row < height; row++) expanded.set(target.subarray(row * width, (row + 1) * width), row * required);
            width = required;
            target = expanded;
            ctx = context(width, height, profile);
        }
        if (/[\u2800-\u28ff]/u.test(text)) throw new Error("Invalid glyph in output.");
        const result = {type: "result", id, site, text, glyphs: glyphs.glyphs.length, width, height, recognized, timings: {atlas: measured - started, search: searched - measured, refine: performance.now() - searched}};
        if (request.inspect) {
            const values = render(ctx, text.split("\n").map(row => [row]), profile);
            Object.assign(result, {target, rendered: values, error: loss(values, target), ink: target.reduce((sum, value) => sum + value * value, 0)});
        }
        self.postMessage(result);
    }
    self.postMessage({type: "done", id});
}

async function pump() {
    if (running) return;
    running = true;
    while (pending) {
        const request = pending;
        pending = null;
        try {
            await solve(request);
        } catch (error) {
            if (error.message !== "cancelled") self.postMessage({type: "error", id: request.id, message: error.message});
        }
    }
    running = false;
}

self.onmessage = event => {
    serial++;
    if (event.data.type === "cancel") {pending = null; return;}
    pending = {...event.data, serial};
    pump();
};
