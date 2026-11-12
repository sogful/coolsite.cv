export const configuration = {side:24,fitted:22,dimensions:576,quantization:300};
const neighbors = Array.from({length:configuration.dimensions},(_,index) => {
    const x = index % configuration.side;
    const y = Math.floor(index / configuration.side);
    const points = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nextx = x + dx;
            const nexty = y + dy;
            if (nextx >= 0 && nexty >= 0 && nextx < configuration.side && nexty < configuration.side) points.push(nexty * configuration.side + nextx);
        }
    }
    return points;
});
let integral = new Int32Array(0);

/*//////////////////////////////////////////////////////////////////////*/

export function feature(data,stride,rx,ry,rw,rh,whole = false) {
    let minx = rw, miny = rh, maxx = -1, maxy = -1;
    for (let y = 0; y < rh; y++) {
        const base = ((ry + y) * stride + rx) * 4 + 3;
        for (let x = 0; x < rw; x++) {
            if (data[base + x * 4] <= 16) continue;
            if (x < minx) minx = x;
            if (x > maxx) maxx = x;
            if (y < miny) miny = y;
            if (y > maxy) maxy = y;
        }
    }
    if (maxx < 0) return null;
    minx += rx; maxx += rx; miny += ry; maxy += ry;
    if (whole) {minx = rx; miny = ry; maxx = rx + rw - 1; maxy = ry + rh - 1;}
    const width = maxx - minx + 1;
    const height = maxy - miny + 1;
    const pitch = width + 1;
    const length = pitch * (height + 1);
    if (integral.length < length) integral = new Int32Array(length);
    integral.fill(0,0,pitch);
    for (let y = 0; y < height; y++) {
        let sum = 0;
        const row = (y + 1) * pitch;
        const base = ((miny + y) * stride + minx) * 4 + 3;
        integral[row] = 0;
        for (let x = 0; x < width; x++) {
            sum += data[base + x * 4];
            integral[row + x + 1] = integral[row - pitch + x + 1] + sum;
        }
    }
    const scale = Math.max(width,height) / configuration.fitted;
    const offx = (configuration.side - width / scale) / 2;
    const offy = (configuration.side - height / scale) / 2;
    const grid = new Float32Array(configuration.dimensions);
    for (let y = 0; y < configuration.side; y++) {
        const starty = miny + (y - offy) * scale;
        const top = Math.max(miny,Math.floor(starty)) - miny;
        const bottom = Math.min(maxy + 1,Math.ceil(starty + scale)) - miny;
        for (let x = 0; x < configuration.side; x++) {
            const startx = minx + (x - offx) * scale;
            const left = Math.max(minx,Math.floor(startx)) - minx;
            const right = Math.min(maxx + 1,Math.ceil(startx + scale)) - minx;
            let sum = 0;
            if (right > left && bottom > top) sum = integral[bottom * pitch + right] - integral[top * pitch + right] - integral[bottom * pitch + left] + integral[top * pitch + left];
            const value = sum / (scale * scale);
            grid[y * configuration.side + x] = value > 255 ? 255 : value;
        }
    }
    const blurred = blur(blur(grid));
    let mean = 0;
    for (let index = 0; index < configuration.dimensions; index++) mean += blurred[index];
    mean /= configuration.dimensions;
    const vec = new Float32Array(configuration.dimensions);
    let norm = 0;
    for (let index = 0; index < configuration.dimensions; index++) {
        const value = blurred[index] - mean;
        vec[index] = value;
        norm += value * value;
    }
    if (norm < 1e-6) return null;
    norm = Math.sqrt(norm);
    for (let index = 0; index < configuration.dimensions; index++) vec[index] /= norm;
    return {vec,grid:blurred};
}

function blur(grid) {
    const output = new Float32Array(configuration.dimensions);
    for (let index = 0; index < output.length; index++) {
        const near = neighbors[index];
        let sum = 0;
        for (let point = 0; point < near.length; point++) sum += grid[near[point]];
        output[index] = sum / near.length;
    }
    return output;
}

export function hashfeat(vec) {
    let hash = 2166136261;
    for (let index = 0; index < configuration.dimensions; index += 7) hash = Math.imul(hash ^ (((vec[index] * 120) + 128) | 0),16777619) >>> 0;
    return hash;
}

export function quantise(vec,output = new Int8Array(configuration.dimensions),offset = 0) {
    for (let index = 0; index < configuration.dimensions; index++) {
        const value = Math.round(vec[index] * configuration.quantization);
        output[offset + index] = value > 127 ? 127 : value < -127 ? -127 : value;
    }
    return output;
}
