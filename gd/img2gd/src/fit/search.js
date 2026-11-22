function capturefit(score) {
  return {score, plan: plan.slice(), pixels: new Uint8ClampedArray(fittedpixels),
    target: {...target}, source: targetpixels, underlaycount, underlaymessage, offset: seedretryoffset,
    pool: fitpoolname};
}

function restorefit(best) {
  plan = best.plan;
  fittedpixels = best.pixels;
  target = best.target;
  targetpixels = best.source;
  underlaycount = best.underlaycount;
  underlaymessage = best.underlaymessage;
  seedretryoffset = best.offset;
  fitpoolname = best.pool || "full";
}

/*//////////////////////////////////////////////////////////////////////*/

async function runfitsearch(limit, trials, revision) {
  batchfitteractive = false;
  fitpixels = 0;
  fitretries = 0;
  fitcoverage = 1;
  fitpoolname = "full";
  searchcount = 1;
  regionfitactive = false;
  updatefields();
  preparetarget();
  startfitpreview();
  if (["auto", "regions"].includes(fitselect.value)) {
    const result = await fitcolorregions(limit, revision);
    if (result !== null) return result;
    preparetarget();
  }
  const broad = await photobase(limit, revision);
  if (revision !== fitrevision) return false;
  if (!await fitadaptive(limit, trials, revision)) return false;
  if (revision !== fitrevision) return false;
  const detailed = detailfit();
  const maxseedsearch = maximumfit() && limit > 0;
  let best = capturefit(detailed ? measurefittedpreview() : measuretargeterror());
  try {
    if (maxseedsearch) {
      const offsets = Number(seedsearchselect.value) >= 6 ? [1, 17, 64, 65, 81] : [1, 17];
      for (const [index, offset] of offsets.entries()) {
        if (revision !== fitrevision) return false;
        statuscopy.textContent = `Search ${index + 2} of ${offsets.length + 1}...`;
        preparetarget();
        if (!await fitadaptive(limit, trials, revision, offset)) return false;
        searchcount += 1;
        const score = measurefittedpreview();
        if (score < best.score) {
          seedretryoffset = offset;
          best = capturefit(score);
        }
      }
    } else if (!detailed && limit > 0 && plan.length < limit
      && plan.length < Math.max(8, limit * 0.05) && best.score > 8) {
      for (const offset of [1, 17]) {
        if (revision !== fitrevision) return false;
        preparetarget();
        if (!await fitadaptive(limit, trials, revision, offset)) return false;
        searchcount += 1;
        const score = measuretargeterror();
        if (score < best.score) {
          seedretryoffset = offset;
          best = capturefit(score);
        }
        if (best.score <= 8 || best.plan.length >= Math.max(8, limit * 0.05)) break;
      }
    }
    if (detailed && limit > 0) {
      const pools = maximumfit()
        ? [{pixels: 2000, native: false}, {pixels: 2000, native: true}, {pixels: 5200, native: true}]
        : [{pixels: 5200, native: true}];
      if (Number(coverageselect.value) === 2) pools.push({pixels: 5200, native: true, coverage: 2});
      if (texturepools.white.length) pools.push({pixels: 5200, native: true,
        coverage: Number(coverageselect.value) === 2 ? 2 : 1, pool: "white"});
      for (const [index, pool] of pools.entries()) {
        if (revision !== fitrevision) return false;
        statuscopy.textContent = `Pool ${index + 1} of ${pools.length}...`;
        fitpixels = pool.pixels;
        fitretries = 4;
        fitcoverage = pool.coverage || 1;
        fitpoolname = pool.pool || "full";
        batchfitteractive = pool.native;
        if (batchfitteractive && !batchfitter) batchfitter = createbatchfitter();
        preparetarget();
        if (!await fitadaptive(limit, Math.min(96, trials), revision)) return false;
        searchcount += 1;
        const score = measurefittedpreview();
        if (score < best.score) {
          seedretryoffset = 0;
          best = capturefit(score);
        }
      }
    }
    if (revision !== fitrevision) return false;
    restorefit(best);
    if (detailed && plan.length) {
      statuscopy.textContent = "Refining colors...";
      await refinelayercolors(revision);
      if (revision === fitrevision && imageopaque && plan.length >= 128) {
        statuscopy.textContent = "Refining contours...";
        if (await refinephotocontours(revision, 0.4) && revision === fitrevision) {
          await refinephotocontours(revision, 0.18);
        }
      }
      if (revision === fitrevision && imageopaque && plan.length >= 80) {
        statuscopy.textContent = "Smoothing...";
        await refinesmoothareas(revision);
      }
    }
    comparephotobase(broad, revision);
    return revision === fitrevision;
  } finally {
    if (revision === fitrevision) {
      batchfitteractive = false;
      fitpixels = 0;
      fitretries = 0;
      fitcoverage = 1;
      batchfitter?.clear();
    }
  }
}

/*//////////////////////////////////////////////////////////////////////*/

function contourfield(source, width, height) {
  const count = width * height;
  const luma = new Float32Array(count);
  const gx = new Float32Array(count), gy = new Float32Array(count);
  const weight = new Float32Array(count), angles = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    luma[i] = (source[4 * i] + 2 * source[4 * i + 1] + source[4 * i + 2]) / 4;
  }
  const horizontal = i => (i % width === width - 1 ? i : i + 1);
  const vertical = i => (i + width >= count ? i : i + width);
  for (let i = 0; i < count; i++) {
    gx[i] = luma[horizontal(i)] - luma[i % width === 0 ? i : i - 1];
    gy[i] = luma[vertical(i)] - luma[i < width ? i : i - width];
  }
  for (let i = 0; i < count; i++) {
    let xx = 0, xy = 0, yy = 0;
    const x = i % width, y = Math.floor(i / width);
    for (let row = Math.max(0, y - 1); row <= Math.min(height - 1, y + 1); row++) {
      for (let col = Math.max(0, x - 1); col <= Math.min(width - 1, x + 1); col++) {
        const p = row * width + col;
        xx += gx[p] * gx[p]; yy += gy[p] * gy[p]; xy += gx[p] * gy[p];
      }
    }
    angles[i] = (Math.round(8 * Math.atan2(2 * xy, xx - yy) / Math.PI) + 24) % 16;
    weight[i] = 1 + Math.min(1.5, Math.sqrt((xx + yy) / 9) / 34);
  }
  return {weight, angles, quiet: contoursmoothregions(weight, width, height)};
}

function contoursmoothregions(weight, width, height) {
  const size = 8, columns = Math.ceil(width / size), rows = Math.ceil(height / size);
  const tiles = new Uint8Array(columns * rows), queue = new Int32Array(tiles.length);
  const quiet = new Uint8Array(weight.length);
  for (let tile = 0; tile < tiles.length; tile++) {
    const left = tile % columns * size, top = Math.floor(tile / columns) * size;
    let smooth = 0, total = 0;
    for (let y = top; y < Math.min(height, top + size); y++) {
      for (let x = left; x < Math.min(width, left + size); x++) {
        if (weight[y * width + x] < 1.1) smooth++;
        total++;
      }
    }
    if (smooth >= total * 0.94) tiles[tile] = 1;
  }
  for (let seed = 0; seed < tiles.length; seed++) {
    if (tiles[seed] !== 1) continue;
    queue[0] = seed;
    tiles[seed] = 2;
    let count = 1;
    for (let next = 0; next < count; next++) {
      const tile = queue[next], x = tile % columns;
      const neighbors = [x ? tile - 1 : -1, x + 1 < columns ? tile + 1 : -1, tile - columns, tile + columns];
      for (const neighbor of neighbors) {
        if (tiles[neighbor] !== 1) continue;
        queue[count++] = neighbor;
        tiles[neighbor] = 2;
      }
    }
    if (count < Math.max(8, tiles.length * 0.12)) continue;
    for (let i = 0; i < count; i++) {
      const tile = queue[i], left = tile % columns * size, top = Math.floor(tile / columns) * size;
      for (let y = top; y < Math.min(height, top + size); y++) {
        quiet.fill(1, y * width + left, y * width + Math.min(width, left + size));
      }
    }
  }
  return quiet;
}

function contouredgeerror(source, rendered, width, height) {
  let difference = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = (y * width + x) * 4;
      for (const step of [4, 4 * width]) {
        const a = p + step, b = p - step;
        const expected = source[a] - source[b] + 2 * (source[a + 1] - source[b + 1]) + source[a + 2] - source[b + 2];
        if (Math.abs(expected) < 48) continue;
        const measured = rendered[a] - rendered[b] + 2 * (rendered[a + 1] - rendered[b + 1]) + rendered[a + 2] - rendered[b + 2];
        difference += Math.abs(expected - measured);
      }
    }
  }
  return difference;
}

function contourpixels(canvas, width, height) {
  if (canvas.width === width && canvas.height === height) {
    return canvas.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, width, height).data;
  }
  const sample = document.createElement("canvas");
  sample.width = width;
  sample.height = height;
  const context = sample.getContext("2d", {willReadFrequently: true});
  context.drawImage(canvas, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}

/*//////////////////////////////////////////////////////////////////////*/

async function contourpriorities(objects, source, screen, width, height, scale, offset, field, current) {
  const geometry = tintdraws(objects, batchfitter, scale, offset, 1, 1, width, height);
  if (!geometry || geometry.area > 1500000) return null;
  const size = width * height;
  const capacity = Math.min(geometry.area, 540000);
  const position = new Uint32Array(capacity), owner = new Uint16Array(capacity);
  const alpha = new Float32Array(capacity), change = new Int16Array(3 * capacity);
  const rgb = new Uint8ClampedArray(size * 3), remaining = new Float32Array(size).fill(1);
  const priority = new Float64Array(objects.length);
  let count = 0, deadline = performance.now() + 12;
  for (let i = 0; i < size; i++) rgb.set(background, i * 3);
  for (let j = geometry.draws.length - 1; j >= 0; j--) {
    const {candidate, entry, index, left, right, top, bottom} = geometry.draws[j];
    const sprite = entry.sprite;
    const color = sprite.role === "fixed" ? (sprite.fixedColor || [255, 255, 255])
      : (sprite.role === "detail" ? candidate.detailRGB : candidate.baseRGB) || [candidate.red, candidate.green, candidate.blue];
    for (let y = top; y < bottom; y++) {
      if (performance.now() >= deadline) {
        await yieldfittask();
        if (!current()) return null;
        deadline = performance.now() + 12;
      }
      for (let x = left; x < right; x++) {
        const p = y * width + x, at = 3 * p;
        const [u, v] = batchfitter.meshlocation(candidate, (x + 0.5) / scale, (y + 0.5 - offset) / scale);
        if (!batchfitter.samplemesh(entry, u, v)) continue;
        if (count >= capacity) return null;
        const pixel = batchfitter.meshpixel;
        position[count] = p; owner[count] = index; alpha[count] = pixel[3];
        for (let c = 0; c < 3; c++) {
          const old = rgb[at + c];
          rgb[at + c] = pixel[c] * color[c] / 255 + old * (1 - pixel[3]);
          change[3 * count + c] = rgb[at + c] - old;
        }
        count++;
      }
    }
  }
  for (let j = count - 1; j >= 0; j--) {
    const p = position[j], at = 4 * p;
    let value = 0;
    for (let c = 0; c < 3; c++) {
      const delta = source[at + c] - screen[at + c];
      value += Math.abs(delta + remaining[p] * change[3 * j + c]) - Math.abs(delta);
    }
    priority[owner[j]] += value * field.weight[p];
    if (field.quiet[p] && remaining[p] * alpha[j] > 0.001) priority[owner[j]] = Infinity;
    remaining[p] *= 1 - alpha[j];
  }
  return priority;
}

/*//////////////////////////////////////////////////////////////////////*/

function contourstamps(width, assets, broad, directions = null) {
  const catalog = Array.from({length: 16}, () => []);
  const factor = Math.max(0.7, Math.min(1.7, width / 252));
  const sizes = [[2, 1.1], [4, 1.2], [7, 1.4], [12, 1.3], [19, 1.7], [29, 1.8],
    [5, 2.5], [9, 2.8], [16, 3.4], [6, 4], [11, 5.5], [17, 7], [4, 4], [8, 8]];
  if (broad) sizes.push([27, 10], [34, 17], [20, 14], [32, 3], [28, 5]);
  for (let angle = 0; angle < 16; angle++) {
    if (directions && !directions.includes(angle)) continue;
    const theta = angle * Math.PI / 16, cos = Math.cos(theta), sin = Math.sin(theta);
    for (const asset of assets) {
      const entry = batchfitter.meshgroups(asset).flat()[0];
      if (!entry || asset.mesh.length !== 1 || asset.fixedonly) continue;
      for (const [length, thickness] of sizes) {
        const w = length * factor, h = thickness * factor;
        if (w > width * asset.naturalwidth / 240 || h > width * asset.naturalheight / 240) continue;
        const rx = Math.ceil((Math.abs(cos) * w + Math.abs(sin) * h) / 2);
        const ry = Math.ceil((Math.abs(sin) * w + Math.abs(cos) * h) / 2);
        const points = [], weights = [];
        for (let dy = -ry; dy <= ry; dy++) {
          for (let dx = -rx; dx <= rx; dx++) {
            const u = asset.centrex + (cos * dx + sin * dy) * asset.naturalwidth / w;
            const v = asset.centrey - (-sin * dx + cos * dy) * asset.naturalheight / h;
            if (!batchfitter.samplemesh(entry, u, v)) continue;
            const a = batchfitter.meshpixel[3];
            if (a < 0.015) continue;
            points.push(dx + width * dy);
            weights.push(a);
          }
        }
        if (points.length) catalog[angle].push({asset, angle: angle * 180 / 16, w, h, rx, ry, cos, sin,
          points: Int32Array.from(points), weights: Float32Array.from(weights)});
      }
    }
  }
  return catalog;
}

/*//////////////////////////////////////////////////////////////////////*/

function contourbrush(source, screen, width, height, field, levels) {
  const pixels = Uint8ClampedArray.from(screen);
  const costs = new Float32Array(width * height);
  const focuscost = p => {
    if (field.quiet[p]) return 0;
    const i = p * 4;
    return (Math.abs(source[i] - pixels[i]) + Math.abs(source[i + 1] - pixels[i + 1])
      + Math.abs(source[i + 2] - pixels[i + 2])) * field.weight[p];
  };
  for (let i = 0; i < costs.length; i++) costs[i] = focuscost(i);
  function focus() {
    let best = 0;
    for (let i = 1; i < costs.length; i++) if (costs[i] > costs[best]) best = i;
    return best;
  }
  function score(stamp, center, best) {
    const x = center % width, y = Math.floor(center / width);
    if (x < stamp.rx || x + stamp.rx >= width || y < stamp.ry || y + stamp.ry >= height) return;
    const points = stamp.points, weights = stamp.weights;
    let red = 0, green = 0, blue = 0, norm = 0;
    for (let j = 0; j < points.length; j++) {
      const p = center + points[j], i = 4 * p, a = weights[j], b = 1 - a, weight = field.weight[p] * a;
      if (field.quiet[p]) return;
      red += weight * (source[i] - b * pixels[i]);
      green += weight * (source[i + 1] - b * pixels[i + 1]);
      blue += weight * (source[i + 2] - b * pixels[i + 2]);
      norm += weight * a;
    }
    red = quantize(red / norm, levels); green = quantize(green / norm, levels); blue = quantize(blue / norm, levels);
    let gain = 0;
    for (let j = 0; j < points.length; j++) {
      const p = center + points[j], i = 4 * p, a = weights[j], b = 1 - a;
      const difference = Math.abs(source[i] - (red * a + b * pixels[i]))
        + Math.abs(source[i + 1] - (green * a + b * pixels[i + 1]))
        + Math.abs(source[i + 2] - (blue * a + b * pixels[i + 2]));
      gain += costs[p] - field.weight[p] * difference;
    }
    if (gain > best.gain) Object.assign(best, {stamp, center, gain, red, green, blue});
  }
  function paint(best) {
    const {stamp, center, red, green, blue} = best;
    for (let j = 0; j < stamp.points.length; j++) {
      const p = center + stamp.points[j], i = p * 4, a = stamp.weights[j], b = 1 - a;
      pixels[i] = red * a + b * pixels[i];
      pixels[i + 1] = green * a + b * pixels[i + 1];
      pixels[i + 2] = blue * a + b * pixels[i + 2];
      costs[p] = focuscost(p);
    }
  }
  return {focus, score, paint, costs, pixels};
}

/*//////////////////////////////////////////////////////////////////////*/

async function refinephotocontours(revision, fraction = 0.4) {
  const original = plan;
  const current = () => revision === fitrevision && plan === original;
  if (!current() || original.length < 128 || !imageopaque || !sourceisopaque()) return false;
  const assets = [497, 495].map(id => library.find(asset => asset.id === id)).filter(Boolean);
  if (!assets.length) return false;
  const {width: fullwidth, height: fullheight} = previewsize();
  if (fullwidth * fullheight > 750000) return false;
  const shrink = Math.min(1, Math.sqrt(120000 / (fullwidth * fullheight)));
  const width = Math.round(fullwidth * shrink), height = Math.round(fullheight * shrink);
  if (Math.min(width, height) < 12) return false;
  const before = measurefittedpreview();
  const source = contourpixels(sourcecomparecanvas, width, height);
  const screen = contourpixels(resultcanvas, width, height);
  const edge = contouredgeerror(source, screen, width, height);
  if (!edge) return false;
  if (!batchfitter) batchfitter = createbatchfitter();
  const scale = width / target.width, offset = (height - target.height * scale) / 2;
  const field = contourfield(source, width, height);
  const priority = await contourpriorities(original, source, screen, width, height, scale, offset, field, current);
  if (!priority || !current()) return false;
  const frozen = new Set(original.filter((object, i) => !Number.isFinite(priority[i])));
  const sorted = original.map((object, index) => index).filter(i => !frozen.has(original[i])
    && original[i].role !== "underlay" && !original[i].macro);
  sorted.sort((a, b) => priority[a] - priority[b] || b - a);
  const room = Math.min(sorted.length, Math.floor(original.length * fraction));
  const removed = new Set(sorted.slice(0, room));
  const proposal = original.filter((item, i) => !removed.has(i));
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  previewrenderer.paintbackground(context, width, height, fullwidth, fullheight, backgroundtile, backgroundtilepixels, background);
  context.save();
  context.translate(0, offset);
  previewrenderer.renderpreview(context, proposal, scale, scale, spriteatlasimages, spriteatlasdimensions);
  context.restore();
  const brush = contourbrush(source, contourpixels(canvas, width, height), width, height, field, Number(colourslider.value));
  const broad = fraction < 0.4;
  const stamps = contourstamps(width, assets, broad);
  let deadline = performance.now() + 12, failed = 0;
  for (let slot = 0; slot < room && failed < 128;) {
    if (performance.now() >= deadline) {
      showfitprogress(revision, proposal);
      await yieldfittask();
      if (!current()) return false;
      deadline = performance.now() + 12;
    }
    const p = brush.focus(), angle = field.angles[p], best = {gain: 0};
    if (brush.costs[p] <= 0) break;
    for (const turn of [0, 2, -2, 4, 8]) {
      for (const stamp of stamps[(angle + turn + 16) % 16]) {
        brush.score(stamp, p, best);
        const dx = Math.round(stamp.cos * stamp.w * 0.28), dy = Math.round(stamp.sin * stamp.w * 0.28);
        const move = dx + width * dy;
        if (move && p % width + Math.abs(dx) < width && p % width >= Math.abs(dx)) {
          brush.score(stamp, p + move, best);
          brush.score(stamp, p - move, best);
        }
      }
    }
    if (!best.stamp) {
      brush.costs[p] = 0;
      failed++;
      continue;
    }
    failed = 0;
    const {stamp, center, red, green, blue} = best;
    brush.paint(best);
    proposal.push({asset: stamp.asset, x: (center % width + 0.5) / scale,
      y: (Math.floor(center / width) + 0.5 - offset) / scale, width: stamp.w / scale,
      height: stamp.h / scale, angle: stamp.angle, warpx: 0, warpy: 0, red, green, blue});
    slot++;
  }
  if (!current() || proposal.length === original.length - room) return false;
  let accepted = false;
  try {
    plan = proposal;
    accepted = measurefittedpreview() < before && contouredgeerror(source, contourpixels(resultcanvas, width, height), width, height) < edge;
  } finally {
    if (!accepted) {plan = original; drawresult();}
  }
  if (accepted && broad) {
    await refinelayercolors(revision, () => contouredgeerror(source, contourpixels(resultcanvas, width, height), width, height) < edge, frozen);
  }
  return accepted;
}

/*//////////////////////////////////////////////////////////////////////*/

function smoothfield(source, width, height) {
  const quiet = new Uint8Array(width * height).fill(1);
  const weight = new Float32Array(width * height).fill(1);
  const steps = [2, 2 * width, 2 * width + 2, 2 * width - 2];
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const p = y * width + x, i = p * 4;
      let span = 0;
      for (const step of steps) {
        for (let c = 0; c < 3; c++) {
          span = Math.max(span, Math.abs(source[i + c] - source[i + c - 4 * step]),
            Math.abs(source[i + c] - source[i + c + 4 * step]));
        }
      }
      if (span <= 16) quiet[p] = 0;
    }
  }
  return {quiet, weight, steps};
}

function smoothresiduals(source, screen, field, width) {
  const peaks = [];
  let roughness = 0, spikes = 0;
  for (let p = 0; p < field.quiet.length; p++) {
    if (field.quiet[p]) continue;
    const i = p * 4;
    let error = 0, contrast = 0;
    for (let c = 0; c < 3; c++) {
      const residual = screen[i + c] - source[i + c];
      error = Math.max(error, Math.abs(residual));
      for (const step of [4, width * 4]) {
        roughness += Math.abs(residual - (screen[i + c + step] - source[i + c + step]));
      }
    }
    if (error < 16) continue;
    for (const step of field.steps) {
      let center = 0, slope = 0;
      for (let c = 0; c < 3; c++) {
        const a = i + c - step * 4, b = i + c + step * 4;
        const left = screen[a] - source[a], right = screen[b] - source[b];
        center = Math.max(center, Math.abs(screen[i + c] - source[i + c] - (left + right) / 2));
        slope = Math.max(slope, Math.abs(left - right));
      }
      contrast = Math.max(contrast, center - slope / 4);
    }
    const severity = Math.min(error, contrast);
    if (severity < 16) continue;
    const x = p % width, y = Math.floor(p / width);
    const bottom = Math.min(field.quiet.length / width - 1, y + 4);
    const right = Math.min(width - 1, x + 4);
    let smooth = 0, samples = 0;
    for (let row = Math.max(0, y - 4); row <= bottom; row += 2) {
      for (let col = Math.max(0, x - 4); col <= right; col += 2) {
        if (!field.quiet[row * width + col]) smooth++;
        samples++;
      }
    }
    peaks.push({p, severity: severity * (0.3 + 0.7 * smooth / samples)});
    spikes += severity * severity;
  }
  peaks.sort((a, b) => b.severity - a.severity);
  return {peaks, spikes, roughness};
}

async function refinesmoothareas(revision) {
  const original = plan;
  const current = () => revision === fitrevision && plan === original;
  if (!current() || !imageopaque || !sourceisopaque()) return false;
  const {width, height} = previewsize();
  if (width * height > 150000 || Math.min(width, height) < 12) return false;
  const asset = library.find(item => item.id === 497);
  if (!asset) return false;
  const before = measurefittedpreview();
  const source = contourpixels(sourcecomparecanvas, width, height);
  const screen = contourpixels(resultcanvas, width, height);
  const field = smoothfield(source, width, height);
  const prior = smoothresiduals(source, screen, field, width);
  if (!prior.peaks.length) return false;
  const edge = contouredgeerror(source, screen, width, height);
  const scale = width / target.width, offset = (height - target.height * scale) / 2;
  if (!batchfitter) batchfitter = createbatchfitter();
  const priority = await contourpriorities(original, source, screen, width, height, scale, offset, field, current);
  if (!priority || !current()) return false;
  const sorted = original.map((item, i) => i).filter(i => Number.isFinite(priority[i])
    && original[i].role !== "underlay" && !original[i].macro).sort((a, b) => priority[a] - priority[b]);
  const budget = Math.min(sorted.length, prior.peaks.length, 40, Math.ceil(original.length * 0.03));
  if (!budget) return false;
  const directions = [0, 4, 8, 12];
  const stamps = contourstamps(width, [asset], false, directions).flat();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  for (const room of [...new Set([budget, Math.ceil(budget / 4)])]) {
    const removed = new Set(sorted.slice(0, room));
    const proposal = original.filter((item, i) => !removed.has(i));
    previewrenderer.paintbackground(context, width, height, width, height, backgroundtile, backgroundtilepixels, background);
    context.save();
    context.translate(0, offset);
    previewrenderer.renderpreview(context, proposal, scale, scale, spriteatlasimages, spriteatlasdimensions);
    context.restore();
    const brush = contourbrush(source, contourpixels(canvas, width, height), width, height, field, Number(colourslider.value));
    let used = 0, deadline = performance.now() + 12;
    for (const {p} of prior.peaks.slice(0, room * 24)) {
      if (performance.now() >= deadline) {
        await yieldfittask();
        if (!current()) return false;
        deadline = performance.now() + 12;
      }
      const i = p * 4;
      if (Math.max(Math.abs(source[i] - brush.pixels[i]), Math.abs(source[i + 1] - brush.pixels[i + 1]),
        Math.abs(source[i + 2] - brush.pixels[i + 2])) < 16) continue;
      const best = {gain: 0};
      for (const stamp of stamps) brush.score(stamp, p, best);
      if (!best.stamp) continue;
      const {stamp, red, green, blue} = best;
      brush.paint(best);
      proposal.push({asset, x: (p % width + 0.5) / scale, y: (Math.floor(p / width) + 0.5 - offset) / scale,
        width: stamp.w / scale, height: stamp.h / scale, angle: stamp.angle, warpx: 0, warpy: 0, red, green, blue});
      if (++used === room) break;
    }
    if (!used || !current()) continue;
    let accepted = false;
    try {
      plan = proposal;
      const color = measurefittedpreview();
      const rendered = contourpixels(resultcanvas, width, height);
      const next = smoothresiduals(source, rendered, field, width);
      accepted = color <= before && next.roughness <= prior.roughness && next.spikes < prior.spikes
        && contouredgeerror(source, rendered, width, height) <= edge;
      if (accepted) return true;
    } finally {
      if (!accepted) {plan = original; drawresult();}
    }
  }
  return false;
}
