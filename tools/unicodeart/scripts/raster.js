export function context(width, height, profile) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", {willReadFrequently: true});
    ctx.font = `${profile.weight} ${profile.size}px ${profile.family}`;
    ctx.textBaseline = "alphabetic";
    ctx.fontKerning = "normal";
    ctx.fillStyle = "#000000";
    return ctx;
}

export function alpha(ctx) {
    const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
    const values = new Float32Array(data.length / 4);
    for (let index = 0; index < values.length; index++) values[index] = data[index * 4 + 3] / 255;
    return values;
}

export function render(ctx, rows, profile) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    rows.forEach((row, index) => ctx.fillText(row.join(""), 0, 8 + profile.baseline + index * profile.height));
    return alpha(ctx);
}

export function loss(values, target, weights = null) {
    let error = 0;
    for (let index = 0; index < target.length; index++) error += (values[index] - target[index]) ** 2 * (weights ? weights[index] : 1);
    return error;
}
