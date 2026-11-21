function blurphoto(source, width, height, radius) {
  if (!radius) return source;
  const kernel = Array.from({length: 2 * radius + 1}, (_, index) =>
    Math.exp(-((index - radius) ** 2) / (2 * (radius / 2.2) ** 2)));
  const total = kernel.reduce((a, b) => a + b);
  for (let i = 0; i < kernel.length; i++) kernel[i] /= total;
  const horizontal = new Float32Array(source.length);
  const output = new Float32Array(source.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = (y * width + x) * 3;
      for (let k = -radius; k <= radius; k++) {
        const sample = (y * width + Math.min(width - 1, Math.max(0, x + k))) * 3;
        const weight = kernel[k + radius];
        for (let c = 0; c < 3; c++) horizontal[pixel + c] += source[sample + c] * weight;
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = (y * width + x) * 3;
      for (let k = -radius; k <= radius; k++) {
        const sample = (Math.min(height - 1, Math.max(0, y + k)) * width + x) * 3;
        const weight = kernel[k + radius];
        for (let c = 0; c < 3; c++) output[pixel + c] += horizontal[sample + c] * weight;
      }
    }
  }
  return output;
}

function painttangent(luma, width, height, x, y, radius) {
  function at(px, py) {
    const column = Math.min(width - 1, Math.max(0, Math.floor(px)));
    const row = Math.min(height - 1, Math.max(0, Math.floor(py)));
    return luma[row * width + column];
  }
  let xx = 0, xy = 0, yy = 0;
  for (let dy = -radius; dy <= radius; dy += radius) {
    for (let dx = -radius; dx <= radius; dx += radius) {
      const gx = at(x + dx + radius, y + dy) - at(x + dx - radius, y + dy);
      const gy = at(x + dx, y + dy + radius) - at(x + dx, y + dy - radius);
      xx += gx * gx;
      xy += gx * gy;
      yy += gy * gy;
    }
  }
  return 0.5 * Math.atan2(2 * xy, xx - yy) + Math.PI / 2;
}

/*//////////////////////////////////////////////////////////////////////*/

function paintsurface(width, height, background, levels) {
  const pixels = width * height;
  const frame = new Float32Array(pixels * 3);
  const below = new Float32Array(frame.length);
  const transmission = new Float32Array(pixels);
  const rimcost = new Float32Array(pixels);
  const cumulative = new Float64Array(pixels);
  const gaussian = Float32Array.from({length: 1025}, (_, i) => 0.98 * Math.exp(-4.6 * i / 1024));
  for (let i = 0; i < pixels; i++) frame.set(background, 3 * i);
  let reference;

  function nextlayer() {
    below.set(frame);
    transmission.fill(1);
  }

  function focus(source) {
    if (source !== reference) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const left = 3 * (width * y + Math.max(0, x - 1)) + 1;
          const right = 3 * (width * y + Math.min(width - 1, x + 1)) + 1;
          const top = 3 * (width * Math.max(0, y - 1) + x) + 1;
          const bottom = 3 * (width * Math.min(height - 1, y + 1) + x) + 1;
          const green = Math.abs(source[left] - source[right]) + Math.abs(source[top] - source[bottom]);
          const chroma = Math.abs(source[left - 1] - source[right - 1]) + Math.abs(source[top - 1] - source[bottom - 1])
            + Math.abs(source[left + 1] - source[right + 1]) + Math.abs(source[top + 1] - source[bottom + 1]);
          const gradient = Math.max(green, chroma / 2);
          rimcost[y * width + x] = 1.6 / (1 + gradient / 12);
        }
      }
    }
    reference = source;
    let total = 0;
    for (let i = 0; i < pixels; i++) {
      const p = 3 * i;
      const error = (source[p] - frame[p]) ** 2 + (source[p + 1] - frame[p + 1]) ** 2
        + (source[p + 2] - frame[p + 2]) ** 2;
      total += 1 + Math.min(error, 1900);
      cumulative[i] = total;
    }
  }

  function point(fraction) {
    const pick = fraction * cumulative[pixels - 1];
    let left = 0, right = pixels - 1;
    while (left < right) {
      const middle = (left + right) >>> 1;
      if (cumulative[middle] < pick) left = middle + 1;
      else right = middle;
    }
    return left;
  }

  function stroke(shape, apply) {
    const {x, y, rx, ry, angle, soft, alpha} = shape;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const extentx = Math.hypot(rx * cos, ry * sin), extenty = Math.hypot(rx * sin, ry * cos);
    const left = Math.max(0, Math.floor(x - extentx)), right = Math.min(width - 1, Math.ceil(x + extentx));
    const top = Math.max(0, Math.floor(y - extenty)), bottom = Math.min(height - 1, Math.ceil(y + extenty));
    const xx = (cos / rx) ** 2 + (sin / ry) ** 2, yy = (sin / rx) ** 2 + (cos / ry) ** 2;
    const xy = 2 * cos * sin * (1 / rx ** 2 - 1 / ry ** 2);
    const step = rx * ry > 250 && !apply ? 2 : 1;
    const inner = Math.min(rx, ry);
    const backdrop = soft ? below : frame;
    let norm = 0, red = 0, green = 0, blue = 0, constant = 0;
    for (let row = top; row <= bottom; row += step) {
      const dy = row + 0.5 - y;
      for (let column = left; column <= right; column += step) {
        const dx = column + 0.5 - x, radius = xx * dx * dx + xy * dx * dy + yy * dy * dy;
        if (radius >= 1) continue;
        const i = row * width + column, p = i * 3;
        const mask = soft ? gaussian[Math.max(0, Math.floor(1024 * radius))] : Math.min(1, (1 - radius) * inner);
        const local = mask * alpha;
        const weight = soft ? local * transmission[i] : local;
        const r = backdrop[p], g = backdrop[p + 1], b = backdrop[p + 2];
        if (apply) {
          frame[p] += weight * (shape.red - r);
          frame[p + 1] += weight * (shape.green - g);
          frame[p + 2] += weight * (shape.blue - b);
          if (soft) {
            below[p] += local * (shape.red - r);
            below[p + 1] += local * (shape.green - g);
            below[p + 2] += local * (shape.blue - b);
          } else transmission[i] *= 1 - local;
        } else {
          const dr = reference[p] - frame[p], dg = reference[p + 1] - frame[p + 1], db = reference[p + 2] - frame[p + 2];
          const rim = soft ? 0 : Math.max(0, 1 - Math.abs((1 - radius) * inner - 1.4) / 2.6);
          const squared = weight * weight + rim * alpha * alpha * rimcost[i];
          red += weight * dr + squared * r;
          green += weight * dg + squared * g;
          blue += weight * db + squared * b;
          norm += squared;
          constant -= 2 * weight * (dr * r + dg * g + db * b) + squared * (r * r + g * g + b * b);
        }
      }
    }
    if (apply || !norm) return;
    shape.red = quantize(red / norm, levels);
    shape.green = quantize(green / norm, levels);
    shape.blue = quantize(blue / norm, levels);
    const dot = red * shape.red + green * shape.green + blue * shape.blue;
    const magnitude = shape.red ** 2 + shape.green ** 2 + shape.blue ** 2;
    shape.gain = step * step * (constant + 2 * dot - norm * magnitude);
  }
  return {nextlayer, focus, point, stroke};
}

/*//////////////////////////////////////////////////////////////////////*/

async function photopaint(rgba, width, height, count, current, preview) {
  const base = library.find(asset => asset.id === 211);
  const ellipse = library.find(asset => asset.id === 497);
  const softbrush = library.find(asset => asset.id === 3958);
  if (!base || !ellipse || !softbrush || count < 8) return null;
  const levels = Number(colourslider.value);
  const opacity = [255, 128, 71];
  const alpha = opacity.map(byte => Math.floor(Math.fround(Number(exportedopacity(byte)) * 255)) / 255);
  const effort = rangevalue(effortslider) / 100;
  const trials = Math.round(18 + 76 * effort * effort);
  const adjustments = Math.round(4 + 30 * effort * effort);
  const pixels = width * height;
  const rgb = new Uint8Array(3 * pixels);
  const mean = [0, 0, 0];
  for (let i = 0; i < pixels; i++) {
    for (let c = 0; c < 3; c++) {
      const value = rgba[4 * i + c];
      rgb[3 * i + c] = value;
      mean[c] += value;
    }
  }
  const background = mean.map(channel => quantize(channel / pixels, levels));
  const output = [{asset: base, role: "underlay", x: width / 2, y: height / 2, width, height, angle: 0,
    red: background[0], green: background[1], blue: background[2]}];
  if (!current()) return null;
  if (rgb.every((value, index) => value === background[index % 3])) return output;
  const surface = paintsurface(width, height, background, levels);
  const luma = new Float32Array(pixels);
  const scale = Math.min(width, height) / 108;
  const softlimit = width * Math.min(softbrush.naturalwidth, softbrush.naturalheight) / 480;
  let seed = 34783;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const starts = [0, 0.05, 0.17, 0.43, 0.77];
  const radii = [38, 19, 12, 8, 5];
  const blurs = [10, 5, 2, 1, 0];
  const layers = [5, 5, 7, 9, 11];
  const capacity = count - output.length - 2;
  let stage = -1, reference, softend = 1, deadline = performance.now() + 12;
  for (let i = 0; i < capacity; i++) {
    if (!current()) return null;
    if (performance.now() >= deadline) {
      preview(output);
      await yieldfittask();
      deadline = performance.now() + 12;
      if (!current()) return null;
    }
    const change = stage < 4 && i >= Math.round(starts[stage + 1] * capacity);
    if (change) {
      stage++;
      reference = blurphoto(rgb, width, height, Math.round(blurs[stage] * scale));
      for (let j = 0; j < pixels; j++) {
        luma[j] = 0.299 * reference[3 * j] + 0.587 * reference[3 * j + 1] + 0.114 * reference[3 * j + 2];
      }
      if (stage === 0 || layers[stage] !== layers[stage - 1]) {
        surface.nextlayer();
        softend = output.length;
      }
    }
    if (change || i % 4 === 0) surface.focus(reference);
    let best = null;
    function test(shape) {
      const maximum = shape.soft ? softlimit : Math.max(width, height);
      shape.rx = Math.min(maximum, Math.max(0.8 * scale, shape.rx));
      shape.ry = Math.min(maximum, Math.max(0.6 * scale, shape.ry));
      shape.gain = 0;
      surface.stroke(shape, false);
      if (shape.gain > (best?.gain ?? 0.01)) best = shape;
    }
    for (let j = 0; j < trials; j++) {
      const index = surface.point(random());
      const x = index % width + random(), y = Math.floor(index / width) + random();
      const rx = scale * radii[stage] * Math.exp((random() - 0.5) * 2.8);
      const ry = rx * (0.11 + 0.89 * random() ** 1.4);
      const angle = random() < 0.73
        ? painttangent(luma, width, height, x, y, Math.max(1, rx / 4)) + (random() - 0.5) * 0.65
        : random() * Math.PI;
      const soft = i > capacity * 0.13 && random() < 0.4;
      const strength = Math.floor(random() * alpha.length);
      test({x, y, rx, ry, angle, soft, strength, alpha: alpha[strength]});
    }
    if (!best) continue;
    for (let j = 0; j < adjustments; j++) {
      const trial = {...best}, span = j < adjustments * 0.52 ? 0.6 : 0.28;
      trial.x += (random() - 0.5) * trial.rx * span;
      trial.y += (random() - 0.5) * trial.ry * span;
      trial.rx *= Math.exp((random() - 0.5) * span);
      trial.ry *= Math.exp((random() - 0.5) * span);
      trial.angle += (random() - 0.5) * span;
      if (random() < 0.24) {
        trial.strength = Math.floor(random() * alpha.length);
        trial.alpha = alpha[trial.strength];
      }
      test(trial);
    }
    surface.stroke(best, true);
    const object = {asset: best.soft ? softbrush : ellipse, macro: !best.soft, zlayer: layers[stage],
      x: best.x, y: best.y, width: 2 * best.rx, height: 2 * best.ry, angle: best.angle * 180 / Math.PI,
      red: best.red, green: best.green, blue: best.blue, opacity: opacity[best.strength] / 255};
    if (best.soft) output.splice(softend++, 0, object);
    else output.push(object);
  }
  return current() ? output : null;
}
