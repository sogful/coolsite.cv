function photocells(source, width, height, count) {
  const stride = width + 1;
  const sums = Array.from({length: 3}, () => new Float64Array(stride * (height + 1)));
  for (let y = 0; y < height; y += 1) {
    const row = [0, 0, 0];
    for (let x = 0; x < width; x += 1) {
      const p = (y * width + x) * 4, at = (y + 1) * stride + x + 1;
      for (let c = 0; c < 3; c += 1) {
        row[c] += source[p + c];
        sums[c][at] = sums[c][at - stride] + row[c];
      }
    }
  }
  function region(l, t, r, b) {
    const area = (r - l) * (b - t);
    const sum = sums.map(s => s[b * stride + r] + s[t * stride + l] - s[t * stride + r] - s[b * stride + l]);
    const cell = {l, t, r, b, color: sum.map(value => value / area), gain: 0};
    for (const vertical of [true, false]) {
      const start = vertical ? l : t, end = vertical ? r : b;
      for (let cut = start + 1; cut < end; cut += 1) {
        const rx = vertical ? cut : r, by = vertical ? b : cut;
        const n = (rx - l) * (by - t);
        let gain = 0;
        for (let c = 0; c < 3; c += 1) {
          const s = sums[c];
          const part = s[by * stride + rx] + s[t * stride + l] - s[t * stride + rx] - s[by * stride + l];
          gain += (part - n * cell.color[c]) ** 2;
        }
        gain *= area / (n * (area - n));
        if (gain > cell.gain) Object.assign(cell, {gain, cut, vertical});
      }
    }
    return cell;
  }
  const cells = [region(0, 0, width, height)];
  while (cells.length < count) {
    let best = 0;
    for (let i = 1; i < cells.length; i += 1) if (cells[i].gain > cells[best].gain) best = i;
    const {l, t, r, b, gain, cut, vertical} = cells[best];
    if (!gain) break;
    cells[best] = region(l, t, vertical ? cut : r, vertical ? b : cut);
    cells.push(region(vertical ? cut : l, vertical ? t : cut, r, b));
  }
  return cells;
}

/*//////////////////////////////////////////////////////////////////////*/

function photostamps(width, height, assets) {
  const cache = new Map();
  const small = Math.min(width, height);
  const lengths = [0.38, 0.25, 0.16, 0.10, 0.065, 0.042, 0.026].map(fraction => Math.max(2, small * fraction));
  function stamp(id, length, ratio, turn) {
    const key = [id, length, ratio, turn].join(",");
    if (cache.has(key)) return cache.get(key);
    const w = lengths[length], h = Math.max(1.1, w * ratio), angle = turn * Math.PI / 8;
    const asset = assets.get(id);
    if (!asset || id === 1011 && (w > width * asset.naturalwidth / 240 || h > width * asset.naturalheight / 240)) return null;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const rx = Math.ceil((Math.abs(cos) * w + Math.abs(sin) * h) / 2);
    const ry = Math.ceil((Math.abs(sin) * w + Math.abs(cos) * h) / 2);
    const dxs = [], dys = [], weights = [], sparse = [];
    const step = Math.max(1, Math.round(Math.sqrt(w * h / 65)));
    for (let y = -ry; y <= ry; y += 1) {
      for (let x = -rx; x <= rx; x += 1) {
        const u = (x * cos + y * sin) / w + 0.5, v = (-x * sin + y * cos) / h + 0.5;
        if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
        if (id === 497 && (2 * u - 1) ** 2 + (2 * v - 1) ** 2 > 1 || id === 694 && u + v < 1) continue;
        if ((x + rx) % step === 0 && (y + ry) % step === 0) sparse.push(dxs.length);
        dxs.push(x); dys.push(y); weights.push(id === 1011 ? v : 1);
      }
    }
    const shape = {asset, w, h, angle: turn * 22.5, xs: Int16Array.from(dxs), ys: Int16Array.from(dys),
      alpha: Float32Array.from(weights), sparse: Int32Array.from(sparse), area: dxs.length};
    cache.set(key, shape);
    return shape;
  }
  return stamp;
}

function photoscore(source, canvas, width, height, stamp, x, y, levels, coarse) {
  const {xs, ys, alpha, sparse} = stamp;
  const count = coarse ? sparse.length : xs.length;
  let norm = 0, red = 0, green = 0, blue = 0, constant = 0;
  for (let j = 0; j < count; j += 1) {
    const k = coarse ? sparse[j] : j, px = x + xs[k], py = y + ys[k];
    if (px < 0 || py < 0 || px >= width || py >= height) continue;
    const p = (py * width + px) * 4, a = alpha[k], b = 1 - a;
    const r = canvas[p], g = canvas[p + 1], v = canvas[p + 2];
    const tr = source[p] - b * r, tg = source[p + 1] - b * g, tb = source[p + 2] - b * v;
    red += a * tr; green += a * tg; blue += a * tb; norm += a * a;
    constant += a * (r * (2 * tr - a * r) + g * (2 * tg - a * g) + v * (2 * tb - a * v));
  }
  if (!norm) return null;
  const r = quantize(red / norm, levels), g = quantize(green / norm, levels), b = quantize(blue / norm, levels);
  const gain = (r * (2 * red - norm * r) + g * (2 * green - norm * g) + b * (2 * blue - norm * b) - constant) * xs.length / count;
  return gain > 0 ? {r, g, b, gain, x, y, stamp} : null;
}

function photofocus(source, canvas, width, height, rejected) {
  const size = 5, cols = Math.ceil(width / size), rows = Math.ceil(height / size);
  const energy = new Float64Array(cols * rows), maximum = new Float64Array(cols * rows), points = new Int32Array(cols * rows);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = y * width + x, p = at * 4, cell = Math.floor(y / size) * cols + Math.floor(x / size);
      if (rejected.has(at)) continue;
      const value = (source[p] - canvas[p]) ** 2 + (source[p + 1] - canvas[p + 1]) ** 2 + (source[p + 2] - canvas[p + 2]) ** 2;
      energy[cell] += value;
      if (value > maximum[cell]) {maximum[cell] = value; points[cell] = at;}
    }
  }
  const order = Array.from(energy.keys()).sort((a, b) => energy[b] - energy[a]);
  return order.slice(0, 2).filter(i => maximum[i] > 3).map(i => points[i]);
}

/*//////////////////////////////////////////////////////////////////////*/

function photogradients(cells, source, width, room, levels, asset) {
  if (!asset || !room) return;
  const maxwidth = width * asset.naturalwidth / 245, maxheight = width * asset.naturalheight / 245;
  const options = [];
  for (const cell of cells) {
    const {l, t, r, b, color} = cell, w = r - l, h = b - t;
    for (const vertical of [true, false]) {
      const span = vertical ? h : w, across = vertical ? w : h, tiles = Math.ceil(across / maxwidth);
      if (span < 2 || span > maxheight || tiles > 8) continue;
      const cov = [0, 0, 0];
      let norm = 0;
      for (let y = t; y < b; y += 1) {
        for (let x = l; x < r; x += 1) {
          const a = ((vertical ? y - t : x - l) + 0.5) / span - 0.5;
          const index = (y * width + x) * 4;
          norm += a * a;
          for (let c = 0; c < 3; c += 1) cov[c] += (source[index + c] - color[c]) * a;
        }
      }
      const start = color.map((v, c) => quantize(v - 0.5 * cov[c] / norm, levels));
      const end = color.map((v, c) => quantize(v + 0.5 * cov[c] / norm, levels));
      let gain = 0;
      for (let c = 0; c < 3; c += 1) {
        const slope = end[c] - start[c], offset = (start[c] + end[c]) / 2 - color[c];
        gain += slope * (2 * cov[c] - norm * slope) - w * h * offset ** 2;
      }
      if (gain > 1200 * tiles) options.push({cell, vertical, start, end, tiles, benefit: gain / tiles});
    }
  }
  for (const option of options.sort((a, b) => b.benefit - a.benefit)) {
    if (option.cell.gradient || option.tiles > room) continue;
    option.cell.gradient = option;
    room -= option.tiles;
  }
}

function photocoverage(source, width, height, blocks, gradients, levels, assets, canvas) {
  const shapes = [];
  const cells = photocells(source, width, height, blocks);
  photogradients(cells, source, width, gradients, levels, assets.get(1011));
  for (const {l, t, r, b, color, gradient} of cells) {
    const [red, green, blue] = gradient?.start || color.map(value => quantize(value, levels));
    shapes.push({asset: assets.get(495), x: (l + r) / 2, y: (t + b) / 2, width: r - l, height: b - t,
      angle: 0, macro: true, red, green, blue});
    if (gradient) {
      const {vertical, end, tiles} = gradient;
      const span = (vertical ? r - l : b - t) / tiles;
      for (let i = 0; i < tiles; i += 1) shapes.push({asset: assets.get(1011),
        x: vertical ? l + (i + 0.5) * span : (l + r) / 2, y: vertical ? (t + b) / 2 : t + (i + 0.5) * span,
        width: span, height: vertical ? b - t : r - l, angle: vertical ? 0 : -90, red: end[0], green: end[1], blue: end[2]});
    }
    if (!canvas) continue;
    for (let y = t; y < b; y += 1) {
      for (let x = l; x < r; x += 1) {
        const p = (y * width + x) * 4;
        canvas[p] = red; canvas[p + 1] = green; canvas[p + 2] = blue;
        if (gradient) {
          const a = gradient.vertical ? (y - t + 0.5) / (b - t) : (x - l + 0.5) / (r - l);
          for (let c = 0; c < 3; c += 1) canvas[p + c] += (gradient.end[c] - canvas[p + c]) * a;
        }
      }
    }
  }
  return shapes;
}

async function photoshapes(source, width, height, count, levels, assets, current, preview) {
  const canvas = new Uint8ClampedArray(source.length);
  const shapes = photocoverage(source, width, height, Math.max(8, Math.round(count * 0.32)),
    Math.floor(count * 0.13), levels, assets, canvas);
  preview(shapes);
  await yieldfittask();
  const stamp = photostamps(width, height, assets);
  const rejected = new Set();
  let deadline = performance.now() + 10;
  while (shapes.length < count && current() && rejected.size < 20) {
    const focus = photofocus(source, canvas, width, height, rejected);
    if (!focus.length) break;
    const shortlist = [];
    const progress = shapes.length / count;
    for (const point of focus) {
      const x = point % width, y = Math.floor(point / width);
      const luma = (x, y) => {
        const p = (Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4;
        return source[p] + 2 * source[p + 1] + source[p + 2];
      };
      const gx = luma(x + 1, y) - luma(x - 1, y), gy = luma(x, y + 1) - luma(x, y - 1);
      const turn = (Math.round(Math.atan2(gy, gx) * 8 / Math.PI) + 20) % 16;
      for (let length = progress < 0.65 ? 0 : 1; length < 7; length += 1) {
        for (const [id, ratio, direction] of [[497, 1, 0], [497, 0.46, turn], [497, 0.2, turn],
          [495, 0.32, turn], [495, 0.65, 0], [694, 0.65, turn], [694, 0.65, (turn + 8) % 16],
          [1011, 0.8, turn], [1011, 0.8, (turn + 8) % 16]]) {
          const shape = stamp(id, length, ratio, direction);
          if (!shape || !shape.area) continue;
          const trial = photoscore(source, canvas, width, height, shape, x, y, levels, true);
          if (trial && (shortlist.length < 6 || trial.gain > shortlist[shortlist.length - 1].gain)) {
            shortlist.push(trial);
            shortlist.sort((a, b) => b.gain - a.gain);
            if (shortlist.length > 6) shortlist.pop();
          }
        }
      }
    }
    let best = null;
    for (const trial of shortlist) {
      const refined = photoscore(source, canvas, width, height, trial.stamp, trial.x, trial.y, levels, false);
      if (refined && (!best || refined.gain > best.gain)) best = refined;
    }
    if (!best) {for (const point of focus) rejected.add(point);}
    else {
      const {r, g, b, stamp, x, y} = best;
      shapes.push({asset: stamp.asset, x: x + 0.5, y: y + 0.5, width: stamp.w, height: stamp.h,
        angle: stamp.angle, macro: macroassets.has(stamp.asset.id), red: r, green: g, blue: b});
      for (let j = 0; j < stamp.area; j += 1) {
        const px = x + stamp.xs[j], py = y + stamp.ys[j];
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        const p = (py * width + px) * 4, a = stamp.alpha[j];
        canvas[p] += (r - canvas[p]) * a;
        canvas[p + 1] += (g - canvas[p + 1]) * a;
        canvas[p + 2] += (b - canvas[p + 2]) * a;
      }
    }
    if (performance.now() >= deadline) {
      preview(shapes);
      await yieldfittask();
      deadline = performance.now() + 10;
    }
  }
  return current() ? shapes : null;
}

/*//////////////////////////////////////////////////////////////////////*/

function photoproject(shapes, width, height) {
  const sx = target.width / width, sy = target.height / height;
  return shapes.map(object => ({...object, x: object.x * sx, y: object.y * sy, width: object.width * sx, height: object.height * sy}));
}

async function photoedges(shapes, base, gridwidth, gridheight, assets, current) {
  const room = Math.min(120, Math.floor(shapes.length * 0.26));
  const {width, height} = previewsize();
  if (width * height > 120000 || Math.min(width, height) < 30 || room < 8) return null;
  const kept = shapes.slice(0, -room);
  drawresult([...base, ...photoproject(kept, gridwidth, gridheight)]);
  const source = contourpixels(sourcecanvas, width, height);
  const field = contourfield(source, width, height);
  const brush = contourbrush(source, contourpixels(resultcanvas, width, height), width, height, field, Number(colourslider.value));
  if (!batchfitter) batchfitter = createbatchfitter();
  const stamps = contourstamps(width, [assets.get(497), assets.get(495)].filter(Boolean), true);
  const scale = width / gridwidth, offset = (height - gridheight * scale) / 2;
  let deadline = performance.now() + 10, missed = 0;
  while (kept.length < shapes.length && missed < 36) {
    if (!current()) return null;
    const p = brush.focus();
    if (brush.costs[p] <= 0) break;
    const best = {gain: 0}, angle = field.angles[p];
    for (const turn of [0, 2, -2, 8]) for (const stamp of stamps[(angle + turn + 16) % 16]) {
      brush.score(stamp, p, best);
      const dx = Math.round(stamp.cos * stamp.w * 0.28), dy = Math.round(stamp.sin * stamp.w * 0.28);
      if (p % width < Math.abs(dx) || p % width + Math.abs(dx) >= width) continue;
      const shift = dx + width * dy;
      if (shift) {brush.score(stamp, p + shift, best); brush.score(stamp, p - shift, best);}
    }
    if (best.stamp) {
      const {stamp, center, red, green, blue} = best;
      brush.paint(best);
      kept.push({asset: stamp.asset, x: (center % width + 0.5) / scale, y: (Math.floor(center / width) + 0.5 - offset) / scale,
        width: stamp.w / scale, height: stamp.h / scale, angle: stamp.angle, red, green, blue});
      missed = 0;
    } else {brush.costs[p] = 0; missed++;}
    if (performance.now() >= deadline) {
      await yieldfittask();
      deadline = performance.now() + 10;
    }
  }
  return kept.length > shapes.length - room ? kept : null;
}

async function photobase(limit, revision) {
  if (limit < 50 || limit > 500 || fitselect.value !== "auto" || !imageopaque) return null;
  if (!await opacitycheck || revision !== fitrevision) return null;
  const base = underlaycandidates(limit).candidates;
  const count = limit - base.length - visibilitycost;
  if (!base.length || count < 20) return null;
  const assets = new Map(library.filter(asset => [495, 497, 694, 1011].includes(asset.id)).map(asset => [asset.id, asset]));
  if (!assets.has(495)) return null;
  const factor = Math.min(Math.sqrt((4600 + 10 * limit) / (target.width * target.height)), 192 / Math.max(target.width, target.height));
  const width = Math.max(1, Math.round(target.width * factor)), height = Math.max(1, Math.round(target.height * factor));
  if (Math.min(width, height) < 10) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.imageSmoothingEnabled = samplerselect.value === "average";
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, width, height);
  const source = context.getImageData(0, 0, width, height).data;
  const levels = Number(colourslider.value);
  const gradients = assets.has(1011) ? Math.floor(count * 0.18) : 0;
  const coverage = photocoverage(source, width, height, count - gradients, gradients, levels, assets);
  const current = () => revision === fitrevision;
  if (!detailfit()) return {width, height, coverage, limit};
  const preview = objects => showfitprogress(revision, () => [...base, ...photoproject(objects, width, height)]);
  const shapes = await photoshapes(source, width, height, count, levels, assets, current, preview);
  if (!shapes || !current()) return null;
  const edges = await photoedges(shapes, base, width, height, assets, current);
  return current() ? {width, height, coverage, shapes, edges, limit} : null;
}

function comparephotobase(proposal, revision) {
  if (!proposal || revision !== fitrevision) return false;
  const {width, height} = previewsize();
  if (width * height > 400000) return false;
  const original = plan;
  const base = original.filter(object => object.role === "underlay");
  if (!base.length) return false;
  let score = measurefittedpreview();
  const source = contourpixels(sourcecomparecanvas, width, height);
  const edge = contouredgeerror(source, contourpixels(resultcanvas, width, height), width, height);
  let winner = original;
  try {
    for (const objects of [proposal.shapes, proposal.edges, proposal.coverage]) {
      if (!objects) continue;
      const shapes = [...base, ...photoproject(objects, proposal.width, proposal.height)];
      if (shapes.length + (visibilityrequired(shapes) ? visibilitycost : 0) > proposal.limit) continue;
      plan = shapes;
      drawresult();
      const color = measurepreviewerror();
      if (color < score && contouredgeerror(source, contourpixels(resultcanvas, width, height), width, height) <= edge) {
        winner = shapes;
        score = color;
      }
    }
  } finally {
    if (plan !== winner) {plan = winner; drawresult();}
  }
  return winner !== original;
}
