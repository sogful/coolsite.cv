export function sampler(image) {
    const stride = image.width + 1;
    const integral = new Float64Array(stride * (image.height + 1));
    for (let y = 0; y < image.height; y++) {
        let sum = 0;
        for (let x = 0; x < image.width; x++) {
            sum += image.data[(y * image.width + x) * 4 + 3] / 255;
            integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + sum;
        }
    }
    function area(x, y) {
        x = Math.max(0, Math.min(image.width, x));
        y = Math.max(0, Math.min(image.height, y));
        const left = Math.min(image.width - 1, Math.floor(x));
        const top = Math.min(image.height - 1, Math.floor(y));
        const dx = x - left;
        const dy = y - top;
        const at = top * stride + left;
        return integral[at] * (1 - dx) * (1 - dy) + integral[at + 1] * dx * (1 - dy) + integral[at + stride] * (1 - dx) * dy + integral[at + stride + 1] * dx * dy;
    }
    return function sample(width, height, left, top, scale, offset, horizontal = scale) {
        const result = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const a = left + (x - 5) / horizontal;
                const b = top + (y - offset) / scale;
                const c = a + 1 / horizontal;
                const d = b + 1 / scale;
                result[y * width + x] = Math.min(1, Math.max(0, (area(c, d) - area(a, d) - area(c, b) + area(a, b)) * scale * horizontal));
            }
        }
        return result;
    };
}
