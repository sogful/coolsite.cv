const legacymaximumscale = 2;
const legacyshapeids = new Set([50, 51, 211, 236, 495, 497, 694]);
let legacyactive = false;
let legacyartwidth = 720;

function legacysquaresizes(keys, width, height) {
  const sizes = new Uint16Array(keys.length);
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const i = y * width + x, key = keys[i];
      if (!key) continue;
      const joins = x + 1 < width && y + 1 < height
        && keys[i + 1] === key && keys[i + width] === key && keys[i + width + 1] === key;
      sizes[i] = joins ? 1 + Math.min(sizes[i + 1], sizes[i + width], sizes[i + width + 1]) : 1;
    }
  }
  return sizes;
}

function legacysquareassets(width, blocks) {
  const pitch = legacyartwidth / width;
  const maximum = Math.floor(legacymaximumscale * Math.max(...blocks.map(block => block.naturalwidth)) / pitch + 1e-8);
  const assets = [null];
  for (let side = 1; side <= maximum; side += 1) {
    const asset = blocks.find(block => {
      const ticks = 100 * pitch * side / block.naturalwidth;
      return ticks >= 1 - 1e-8 && ticks <= 100 * legacymaximumscale + 1e-8
        && Math.abs(ticks - Math.round(ticks)) < 1e-8;
    });
    assets.push(asset);
  }
  while (assets.length > 1 && !assets.at(-1)) assets.pop();
  return assets;
}

function legacysquaregroups(keys, width, height, sizes, assets, limit) {
  const largest = [0];
  for (let side = 1; side < assets.length; side += 1) largest.push(assets[side] ? side : largest[side - 1]);
  const maximum = assets.length - 1;
  const covered = new Uint16Array(width);
  const groups = new Map();
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (!sizes[i] || covered[x] > y) continue;
      let side = Math.min(maximum, sizes[i]);
      for (let col = 1; col < side; col += 1) {
        if (covered[x + col] > y) side = col;
      }
      side = largest[side];
      if (!side || ++count > limit) return null;
      const key = keys[i];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({key, asset: assets[side], x, y, width: side, height: side});
      covered.fill(y + side, x, x + side);
      x += side - 1;
    }
  }
  return groups;
}

/*//////////////////////////////////////////////////////////////////////*/

function legacyopaquecover(color, assets, previous) {
  const {key, left, right, top, bottom} = color;
  const width = right - left, height = bottom - top;
  let side = Math.min(width, height, assets.length - 1);
  while (side > 0 && !assets[side]) side -= 1;
  if (!side || Math.ceil(width / side) * Math.ceil(height / side) >= previous.length) return previous;
  const rectangles = [];
  for (let y = top; y < bottom; y += side) {
    for (let x = left; x < right; x += side) {
      rectangles.push({key, asset: assets[side], x: Math.min(x, right - side),
        y: Math.min(y, bottom - side), width: side, height: side});
    }
  }
  return rectangles;
}

function legacydisjointcover(color, assets, previous, budget) {
  const {key, left, right, top, bottom} = color;
  const width = right - left, height = bottom - top;
  const columns = Math.min(width, height), rows = Math.max(width, height);
  const maximum = Math.min(columns, assets.length - 1);
  if (columns > 10 || color.count > 256 || maximum < 2 || previous.length <= Math.ceil(color.count / maximum ** 2)) {
    return previous;
  }
  const skyline = new Uint16Array(columns);
  const seen = new Map();
  const trial = [];
  let best = previous;
  function search(area) {
    if (budget.nodes <= 0 || trial.length + Math.ceil(area / maximum ** 2) >= best.length) return;
    budget.nodes -= 1;
    if (!area) {
      best = trial.slice();
      return;
    }
    const profile = skyline.join(",");
    if ((seen.get(profile) ?? Infinity) <= trial.length) return;
    seen.set(profile, trial.length);
    let x = 0;
    for (let i = 1; i < columns; i += 1) if (skyline[i] < skyline[x]) x = i;
    const y = skyline[x];
    let side = 1;
    while (side < maximum && x + side < columns && y + side < rows && skyline[x + side] === y) side += 1;
    for (; side >= 1; side -= 1) {
      const asset = assets[side];
      if (!asset) continue;
      skyline.fill(y + side, x, x + side);
      trial.push({key, asset, x: left + (width <= height ? x : y),
        y: top + (width <= height ? y : x), width: side, height: side});
      search(area - side ** 2);
      trial.pop();
      skyline.fill(y, x, x + side);
    }
  }
  search(color.count);
  return best;
}

function legacypixelrectangles(pixels, width, height, limit, asset, alternative) {
  const palette = pixelartpalette(pixels, width, height, limit);
  if (!palette) return null;
  const {keys, colors, alphaobjects} = palette;
  const sizes = legacysquaresizes(keys, width, height);
  const defaults = legacysquareassets(width, [asset]);
  const room = limit - alphaobjects;
  const baseline = legacysquaregroups(keys, width, height, sizes, defaults, room);
  const assets = alternative ? legacysquareassets(width, [asset, alternative]) : defaults;
  const expanded = assets.length > defaults.length ? legacysquaregroups(keys, width, height, sizes, assets, room) : null;
  if (!baseline && !expanded) return null;
  const rectangles = [];
  const budget = {nodes: 60000};
  for (const color of colors.values()) {
    const regular = baseline?.get(color.key), alternate = expanded?.get(color.key);
    let chosen = !regular || alternate && alternate.length < regular.length ? alternate : regular;
    if (color.count === (color.right - color.left) * (color.bottom - color.top)) {
      chosen = color.alpha === 255 ? legacyopaquecover(color, assets, chosen)
        : legacydisjointcover(color, assets, chosen, budget);
    }
    for (const rect of chosen) rectangles.push(rect);
  }
  return {rectangles, count: rectangles.length + alphaobjects};
}

/*//////////////////////////////////////////////////////////////////////*/

function legacygrid(width, height, limit) {
  const aspect = width / height;
  const area = Math.min(9500, Math.max(2000, limit * 14));
  const columns = Math.max(1, Math.round(Math.sqrt(area * aspect)));
  const rows = Math.max(1, Math.round(Math.sqrt(area / aspect)));
  if (columns < 3 || rows < 3) return targetsize(width, height, limit, false);
  return {width: columns, height: rows};
}

function legacysample(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.imageSmoothingEnabled = samplerselect.value === "average";
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}

function legacystamps(assets, pixelscale, width, height) {
  const cache = new Map();
  const longest = Math.min(Math.max(width, height), Math.min(width, height) * 1.5);
  const sizes = [1, 1.4, 2, 2.8, 4, 5.6, 8, 11.2, 16, 22.4, 32, 44.8, 64, 90, 128, 180];
  return assets.map(asset => {
    const dimension = Math.max(asset.naturalwidth, asset.naturalheight);
    const cap = Math.min(longest, legacymaximumscale * dimension / pixelscale);
    const lengths = [...sizes.filter(length => length < cap * .98), cap];
    return {asset, lengths, stamp(length, angle) {
      const key = asset.id + "/" + length + "/" + angle;
      if (cache.has(key)) return cache.get(key);
      const scale = Math.max(.01, Math.min(legacymaximumscale, Math.round(length * pixelscale / dimension * 100) / 100));
      const size = scale / pixelscale;
      const shape = {asset, angle, x: .5, y: .5, width: size * asset.naturalwidth, height: size * asset.naturalheight};
      preparecandidate(shape);
      const rx = Math.ceil((Math.abs(shape.matrix00) * shape.width + Math.abs(shape.matrix01) * shape.height) / 2);
      const ry = Math.ceil((Math.abs(shape.matrix10) * shape.width + Math.abs(shape.matrix11) * shape.height) / 2);
      const xs = [], ys = [], alphas = [];
      for (let y = -ry; y <= ry; y += 1) {
        for (let x = -rx; x <= rx; x += 1) {
          const alpha = sampleasset(shape, x + .5, y + .5)[3] / 255;
          if (alpha > 1 / 255) {
            xs.push(x);
            ys.push(y);
            alphas.push(alpha);
          }
        }
      }
      const stamp = {shape, rx, ry, xs: Int16Array.from(xs), ys: Int16Array.from(ys), alpha: Float32Array.from(alphas)};
      cache.set(key, stamp);
      return stamp;
    }};
  });
}

/*//////////////////////////////////////////////////////////////////////*/

function legacysurface(source, width, height, levels) {
  const frame = new Float32Array(source.length);
  const goal = new Float32Array(source.length);
  for (let i = 0; i < source.length; i += 4) {
    const alpha = source[i + 3] / 255;
    for (let c = 0; c < 3; c += 1) goal[i + c] = source[i + c] * alpha;
    goal[i + 3] = source[i + 3];
  }
  const cdf = new Float64Array(width * height);
  function focus() {
    let sum = 0;
    for (let i = 0; i < cdf.length; i += 1) {
      const p = 4 * i;
      const error = (goal[p] - frame[p]) ** 2 + (goal[p + 1] - frame[p + 1]) ** 2
        + (goal[p + 2] - frame[p + 2]) ** 2 + (goal[p + 3] - frame[p + 3]) ** 2 * 1.2;
      if (goal[p + 3] > 0) sum += Math.min(13500, error);
      cdf[i] = sum;
    }
    return sum;
  }
  function point(fraction) {
    const pick = fraction * cdf[cdf.length - 1];
    let left = 0, right = cdf.length - 1;
    while (left < right) {
      const middle = (left + right) >>> 1;
      if (cdf[middle] <= pick) left = middle + 1;
      else right = middle;
    }
    return left;
  }
  function score(stamp, x, y, opacity) {
    const {xs, ys, alpha} = stamp;
    let sr = 0, sg = 0, sb = 0, norm = 0, gain = 0;
    for (let i = 0; i < alpha.length; i += 1) {
      const col = x + xs[i], row = y + ys[i];
      if (col < 0 || col >= width || row < 0 || row >= height) continue;
      const p = (row * width + col) * 4;
      const a = alpha[i] * opacity / 255, keep = 1 - a;
      const r = goal[p] - keep * frame[p], g = goal[p + 1] - keep * frame[p + 1], b = goal[p + 2] - keep * frame[p + 2];
      const expected = goal[p + 3] - frame[p + 3];
      const added = a * (255 - frame[p + 3]);
      gain += (goal[p] - frame[p]) ** 2 - r * r + (goal[p + 1] - frame[p + 1]) ** 2 - g * g
        + (goal[p + 2] - frame[p + 2]) ** 2 - b * b + 1.2 * added * (2 * expected - added);
      sr += a * r;
      sg += a * g;
      sb += a * b;
      norm += a * a;
    }
    if (norm === 0) return null;
    const red = quantize(sr / norm, levels), green = quantize(sg / norm, levels), blue = quantize(sb / norm, levels);
    gain += 2 * (sr * red + sg * green + sb * blue) - norm * (red * red + green * green + blue * blue);
    return {stamp, x, y, opacity, red, green, blue, gain};
  }
  function paint({stamp, x, y, opacity, red, green, blue}) {
    const {xs, ys, alpha} = stamp;
    for (let i = 0; i < alpha.length; i += 1) {
      const col = x + xs[i], row = y + ys[i];
      if (col < 0 || col >= width || row < 0 || row >= height) continue;
      const p = (row * width + col) * 4;
      const a = alpha[i] * opacity / 255;
      frame[p] += a * (red - frame[p]);
      frame[p + 1] += a * (green - frame[p + 1]);
      frame[p + 2] += a * (blue - frame[p + 2]);
      frame[p + 3] += a * (255 - frame[p + 3]);
    }
  }
  return {focus, point, score, paint};
}

/*//////////////////////////////////////////////////////////////////////*/

async function fituniformshapes(source, width, height, limit, assets, current, preview) {
  const pixelscale = legacyartwidth / width;
  const brushes = legacystamps(assets, pixelscale, width, height);
  const surface = legacysurface(source, width, height, Number(colourslider.value));
  const random = randomseed();
  const objects = [];
  const opacities = new Set();
  const trials = Math.max(16, Math.round(16 + rangevalue(effortslider) * .56));
  const textured = fitselect.value !== "regions";
  let deadline = performance.now() + 14;
  while (objects.length + opacities.size < limit && current()) {
    if (surface.focus() < 0.25) break;
    const room = limit - objects.length - opacities.size;
    let best = null;
    for (let trial = 0; trial < trials; trial += 1) {
      const index = surface.point(random());
      const brush = brushes[trial % brushes.length];
      const length = brush.lengths[Math.floor(brush.lengths.length * random())];
      const angle = brush.asset.id === 211 || brush.asset.id === 495
        ? textured && trial % 3 === 0 ? Math.floor(random() * 6) * 15 : 0
        : Math.floor(random() * 24) * 15;
      const stamp = brush.stamp(length, angle);
      const opacity = source[index * 4 + 3];
      const alpha = opacity > 248 || trial % 3 === 0 ? 255 : Math.min(254, Math.max(1, Math.round(opacity / 8) * 8));
      if (alpha < 255 && room === 1 && !opacities.has(alpha)) continue;
      const jitter = trial % 2 ? length : 0;
      const x = Math.floor(index % width + (random() - .5) * jitter + .5);
      const y = Math.floor(Math.floor(index / width) + (random() - .5) * jitter + .5);
      const result = surface.score(stamp, x, y, alpha);
      if (result && result.gain > (best?.gain ?? 0.25)) best = result;
    }
    if (!best) break;
    const {stamp, x, y, opacity} = best;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const moved = surface.score(stamp, x + dx, y + dy, opacity);
      if (moved && moved.gain > best.gain) best = moved;
    }
    surface.paint(best);
    if (best.opacity < 255) opacities.add(best.opacity);
    objects.push({...best.stamp.shape, x: best.x + .5, y: best.y + .5, zlayer: 5,
      red: best.red, green: best.green, blue: best.blue, opacity: best.opacity / 255});
    if (performance.now() >= deadline) {
      preview(objects);
      await yieldfittask();
      deadline = performance.now() + 14;
    }
  }
  return objects;
}

async function fitlegacy(revision) {
  const assets = library.filter(asset => legacyshapeids.has(asset.id));
  const block = assets.find(asset => asset.id === 211);
  if (!block) throw new Error("2.1 decoration block unavailable.");
  const width = sourceimage.naturalWidth, height = sourceimage.naturalHeight;
  if (fitselect.value === "pixelart") {
    const scale = Math.max(.01, Math.min(legacymaximumscale,
      Math.floor(72000 / (Math.max(width, height) * block.naturalwidth)) / 100));
    legacyartwidth = scale * block.naturalwidth * width;
    const larger = assets.find(asset => asset.id === 495 && asset.naturalwidth === 40 && asset.naturalheight === 40);
    const fit = (pixels, columns, rows, limit) => legacypixelrectangles(pixels, columns, rows, limit, block, larger);
    legacyactive = await fitpixelart(revision, block, fit);
    return legacyactive;
  }
  const limit = objectlimit();
  legacyartwidth = Math.min(720, block.naturalwidth * legacymaximumscale * Math.sqrt(limit) * .85) * Math.min(1, width / height);
  target = legacygrid(width, height, limit);
  const source = legacysample(target.width, target.height);
  imageopaque = !source.some((value, index) => index % 4 === 3 && value < 255);
  plan = [];
  underlaycount = 0;
  searchcount = 1;
  startfitpreview();
  const current = () => revision === fitrevision;
  const objects = await fituniformshapes(source, target.width, target.height, limit, assets, current,
    partial => showfitprogress(revision, partial));
  if (!current()) return false;
  plan = objects;
  legacyactive = true;
  return true;
}
