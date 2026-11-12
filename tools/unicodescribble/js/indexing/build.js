import {feature,hashfeat,quantise,configuration} from "../matching/features.js";
import {read,writeall} from "./storage.js";

const cell = 64;
const columns = 64;
const batchsize = 1024;
const checkpoint = 8192;

function different(first,second,stride,x,y) {
    for (let row = 0; row < cell; row++) {
        const base = ((y + row) * stride + x) * 4 + 3;
        for (let column = 0; column < cell; column++) if (first[base + column * 4] !== second[base + column * 4]) return 1;
    }
    return 0;
}

function color(data,stride,x,y) {
    let red = 0, green = 0, blue = 0, alpha = 0;
    for (let row = 0; row < cell; row++) {
        let at = ((y + row) * stride + x) * 4;
        for (let column = 0; column < cell; column++, at += 4) {
            const opacity = data[at + 3];
            if (opacity <= 24) continue;
            red += data[at] * opacity;
            green += data[at + 1] * opacity;
            blue += data[at + 2] * opacity;
            alpha += opacity;
        }
    }
    return alpha ? [Math.round(red / alpha),Math.round(green / alpha),Math.round(blue / alpha)] : [136,136,136];
}

function fill(context,batch,colored) {
    for (let index = 0; index < batch.length; index++) {
        context.fillText(String.fromCodePoint(batch[index]) + (colored ? "\ufe0f" : ""),(index % columns) * cell + cell / 2,Math.floor(index / columns) * cell + cell / 2);
    }
}

/*//////////////////////////////////////////////////////////////////////*/

async function rasterise(points,font,alternate,colored,settings) {
    const key = "part-" + settings.signature + "-" + (colored ? "emoji" : "symbol");
    const saved = await read(key);
    const parts = [];
    let next = 0;
    let hashes = new Set();
    if (saved && saved.next <= points.length) {
        const loaded = await Promise.all(Array.from({length:saved.parts},(_,index) => read(key + "-" + index)));
        if (loaded.every(Boolean)) {parts.push(...loaded); next = saved.next; hashes = new Set(saved.hashes);}
    }
    const resumed = next;
    const canvas = settings.canvas(columns * cell,cell);
    const context = canvas.getContext("2d",{willReadFrequently:true});
    let pending = 0;
    let writable = true;
    const codes = new Int32Array(checkpoint);
    const features = new Int8Array(checkpoint * configuration.dimensions);
    const flags = new Uint8Array(checkpoint);
    const colors = new Uint8Array(checkpoint * 3);
    async function save(processed) {
        const part = {cps:codes.slice(0,pending),feats:features.slice(0,pending * configuration.dimensions),flags:flags.slice(0,pending),colors:colors.slice(0,pending * 3)};
        const number = parts.length;
        parts.push(part);
        if (writable) {
            try {await writeall([[key + "-" + number,part],[key,{next:processed,parts:parts.length,hashes:Uint32Array.from(hashes)}]]);}
            catch {writable = false;}
        }
        pending = 0;
    }
    for (let start = next; start < points.length; start += batchsize) {
        const batch = points.subarray(start,Math.min(start + batchsize,points.length));
        canvas.height = Math.ceil(batch.length / columns) * cell;
        context.fillStyle = "#000000";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "46px " + font;
        fill(context,batch,colored);
        const image = context.getImageData(0,0,canvas.width,canvas.height);
        context.clearRect(0,0,canvas.width,canvas.height);
        context.font = "46px " + alternate;
        fill(context,batch,colored);
        const alternateimage = context.getImageData(0,0,canvas.width,canvas.height);
        for (let index = 0; index < batch.length; index++) {
            const x = (index % columns) * cell;
            const y = Math.floor(index / columns) * cell;
            const current = feature(image.data,canvas.width,x,y,cell,cell);
            if (!current) continue;
            if (!colored) {
                const hash = hashfeat(current.vec);
                if (hashes.has(hash)) continue;
                hashes.add(hash);
            }
            codes[pending] = batch[index];
            quantise(current.vec,features,pending * configuration.dimensions);
            flags[pending] = different(image.data,alternateimage.data,canvas.width,x,y);
            if (colored) colors.set(color(image.data,canvas.width,x,y),pending * 3);
            pending++;
        }
        const processed = Math.min(start + batchsize,points.length);
        settings.progress({kind:colored ? "emoji" : "symbols",done:processed,total:points.length,resumed});
        if (processed % checkpoint === 0 || processed === points.length) await save(processed);
        if (settings.yield) await settings.yield();
    }
    const count = parts.reduce((sum,part) => sum + part.cps.length,0);
    const output = {cps:new Int32Array(count),feats:new Int8Array(count * configuration.dimensions),flags:new Uint8Array(count),colors:new Uint8Array(colored ? count * 3 : 0),resumed};
    let offset = 0;
    for (const part of parts) {
        output.cps.set(part.cps,offset);
        output.feats.set(part.feats,offset * configuration.dimensions);
        output.flags.set(part.flags,offset);
        if (colored) output.colors.set(part.colors,offset * 3);
        offset += part.cps.length;
    }
    return output;
}

export async function build(data,settings) {
    const emoji = new Set(data.emoji);
    const symbols = await rasterise(data.cps.filter(point => !emoji.has(point)),settings.fonts[0],settings.fonts[1],false,settings);
    const colors = await rasterise(data.emoji,settings.fonts[2],settings.fonts[3],true,settings);
    return {cps:symbols.cps,feats:symbols.feats,unifont:symbols.flags,emojicep:colors.cps,emojifeat:colors.feats,emojicolor:colors.colors,emojiunifont:colors.flags,resumed:symbols.resumed + colors.resumed};
}
