function contourfeatures(pixels, width) {
  const size = pixels.length / 4;
  const ink = new Float32Array(size), magnitude = new Float32Array(size);
  const direction = new Float32Array(size * 8);
  for (let pixel = 0; pixel < size; pixel += 1) {
    const at = pixel * 4;
    ink[pixel] = Math.max(0, pixels[at + 3] - 2 * Math.max(pixels[at], pixels[at + 1], pixels[at + 2]));
    const x = pixel % width;
    if (x === 0 || x + 1 === width || pixel < width || pixel >= size - width) continue;
    let energy = 0;
    for (let axis = 0; axis < 2; axis += 1) {
      const step = axis ? 4 * width : 4, side = axis ? 4 : 4 * width;
      const a = at - step, b = at + step;
      const gradient = channel => (2 * (pixels[b + channel] - pixels[a + channel])
        + pixels[b + side + channel] - pixels[a + side + channel]
        + pixels[b - side + channel] - pixels[a - side + channel]) / 4;
      const alpha = gradient(3);
      for (let c = 0; c < 4; c += 1) {
        const value = c === 3 ? alpha : gradient(c) - alpha / 2;
        direction[pixel * 8 + axis * 4 + c] = value;
        energy += value * value;
      }
    }
    magnitude[pixel] = Math.sqrt(energy);
    if (energy > 0) {
      for (let k = pixel * 8; k < pixel * 8 + 8; k += 1) direction[k] /= magnitude[pixel];
    }
  }
  return {ink, magnitude, direction};
}

/*//////////////////////////////////////////////////////////////////////*/

function contourplanerror(source, rendered, width) {
  const size = source.length / 4, height = size / width;
  const expected = contourfeatures(source, width), actual = contourfeatures(rendered, width);
  const detectedink = new Float32Array(size), detectededge = new Float32Array(size);
  let ink = 0, drawnink = 0, edges = 0, matchedink = 0, matchededge = 0;
  let color = 0, clear = 0, leakage = 0;
  for (let pixel = 0; pixel < size; pixel += 1) {
    const at = pixel * 4, x = pixel % width, y = Math.floor(pixel / width);
    const alpha = rendered[at + 3] - source[at + 3];
    for (let c = 0; c < 3; c += 1) {
      const delta = rendered[at + c] - source[at + c];
      color += Math.abs(delta) + Math.abs(delta - alpha);
    }
    if (source[at + 3] <= 3) {
      clear += 1;
      leakage += Math.max(0, alpha);
    }
    ink += expected.ink[pixel];
    drawnink += actual.ink[pixel];
    edges += expected.magnitude[pixel] + actual.magnitude[pixel];
    if (!expected.magnitude[pixel] && !expected.ink[pixel]) continue;
    let bestink = 0, bestedge = 0;
    for (let dy = -Math.min(1, y); dy <= Math.min(1, height - 1 - y); dy += 1) {
      for (let dx = -Math.min(1, x); dx <= Math.min(1, width - 1 - x); dx += 1) {
        const other = pixel + dx + dy * width;
        const weight = 1 / (1 + (dx * dx + dy * dy) / 2);
        const overlap = weight * Math.min(expected.ink[pixel], actual.ink[other]);
        bestink = Math.max(bestink, overlap);
        detectedink[other] = Math.max(detectedink[other], overlap);
        if (!expected.magnitude[pixel] || !actual.magnitude[other]) continue;
        let cosine = 0;
        for (let k = 0; k < 8; k += 1) cosine += expected.direction[pixel * 8 + k] * actual.direction[other * 8 + k];
        const aligned = weight * cosine * Math.min(expected.magnitude[pixel], actual.magnitude[other]);
        bestedge = Math.max(bestedge, aligned);
        detectededge[other] = Math.max(detectededge[other], aligned);
      }
    }
    matchedink += bestink;
    matchededge += bestedge;
  }
  let falseink = drawnink;
  for (let i = 0; i < size; i += 1) {
    falseink -= detectedink[i];
    matchededge += detectededge[i];
  }
  const inkloss = (ink - matchedink + falseink) / Math.max(ink + drawnink, size * 2.55);
  const edgeloss = Math.max(0, edges - matchededge) / Math.max(1, edges);
  const score = color / (size * 6) + 30 * (inkloss + edgeloss) + leakage / size;
  return {score, clear, leakage, ink, falseink};
}

/*//////////////////////////////////////////////////////////////////////*/

function prefercontourplan(candidate, original) {
  if (!candidate?.length) return false;
  if (!original?.length) return true;
  const scale = Math.min(1, 480 / Math.max(sourceimage.naturalWidth, sourceimage.naturalHeight));
  const width = Math.max(1, Math.round(sourceimage.naturalWidth * scale));
  const height = Math.max(1, Math.round(sourceimage.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.drawImage(sourceimage, 0, 0, width, height);
  const source = transparentpremultiply(context.getImageData(0, 0, width, height).data);
  const sampling = width * height > 30000 ? 2 : 3;
  canvas.width = width * sampling;
  canvas.height = height * sampling;
  const measure = objects => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    previewrenderer.renderpreview(context, objects, canvas.width / target.width, canvas.height / target.height,
      spriteatlasimages, spriteatlasdimensions);
    const samples = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const rendered = new Float32Array(source.length);
    for (let y = 0; y < canvas.height; y += 1) {
      const row = 4 * width * Math.floor(y / sampling);
      for (let x = 0; x < canvas.width; x += 1) {
        const at = 4 * (y * canvas.width + x), dest = row + 4 * Math.floor(x / sampling);
        const alpha = samples[at + 3] / (sampling * sampling);
        for (let c = 0; c < 3; c += 1) rendered[dest + c] += samples[at + c] * alpha / 255;
        rendered[dest + 3] += alpha;
      }
    }
    return contourplanerror(source, rendered, width);
  };
  const before = measure(original), after = measure(candidate);
  if (after.leakage > before.leakage + 255 * Math.max(2, before.clear * 0.004)) return false;
  if (after.falseink > Math.max(before.falseink + 510, before.ink * 0.65 + 510)) return false;
  const tolerance = before.score * 0.005;
  if (Math.abs(after.score - before.score) > tolerance) return after.score < before.score;
  return candidate.length + opacitycost(candidate) < original.length + opacitycost(original);
}
