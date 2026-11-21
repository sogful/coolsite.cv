function cropbounds(object, serialized = false) {
  const {asset} = object;
  const geometry = Number.isFinite(object.matrixdeterminant) ? object : {...object};
  preparecandidate(geometry);
  let matrix = geometry;
  let sx = object.width / asset.naturalwidth, sy = object.height / asset.naturalheight;
  let x = object.x - matrix.matrix00 * asset.centrex * sx + matrix.matrix01 * asset.centrey * sy;
  let y = object.y - matrix.matrix10 * asset.centrex * sx + matrix.matrix11 * asset.centrey * sy;
  if (serialized) {
    const scale = 720 / target.width;
    const maximum = object.role === "underlay" || object.macro && macroassets.has(asset.id) ? Infinity : 3;
    sx = Math.min(maximum, sx * scale);
    sy = Math.min(maximum, sy * scale);
    const position = objectposition(geometry, scale, sx, sy);
    x = (Number(cleannumber(position.x)) - levelorigin.x) / scale;
    y = target.height - (Number(cleannumber(position.y)) - levelorigin.y) / scale;
    sx = Number(cleannumber(sx)) / scale;
    sy = Number(cleannumber(sy)) / scale;
    const warpx = Number(cleannumber(object.warpx || 0)), warpy = Number(cleannumber(object.warpy || 0));
    matrix = {warpx, warpy, angle: warpx === warpy && warpx ? warpx : Number(cleannumber(object.angle || 0))};
    preparecandidate(matrix);
  }
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const sprite of asset.mesh) {
    for (const [u, v] of sprite.vertices) {
      const px = x + matrix.matrix00 * u * sx - matrix.matrix01 * v * sy;
      const py = y + matrix.matrix10 * u * sx - matrix.matrix11 * v * sy;
      left = Math.min(left, px); right = Math.max(right, px);
      top = Math.min(top, py); bottom = Math.max(bottom, py);
    }
  }
  return {left, right, top, bottom};
}

function cropinside(bounds) {
  const tolerance = 1e-8;
  return bounds.left >= -tolerance && bounds.right <= target.width + tolerance
    && bounds.top >= -tolerance && bounds.bottom <= target.height + tolerance;
}

function cropmargin(object) {
  const [left, bottom, right, top] = object.asset.bounds;
  const x = Math.max(Math.abs(left), Math.abs(right)), y = Math.max(Math.abs(bottom), Math.abs(top));
  return (x + y + 2) * 0.00056 * target.width / 720
    + (x * object.width / object.asset.naturalwidth + y * object.height / object.asset.naturalheight) * 0.00001;
}

function cropaxis(low, high, maximum, margin, retain) {
  const start = Math.max(low, margin), end = Math.min(high, maximum - margin);
  if (end <= start) return null;
  const span = end - start + retain * (Math.min(high - low, maximum - 2 * margin) - (end - start));
  const destination = Math.max(margin, Math.min(maximum - margin - span, (low + high - span) / 2));
  return {start: destination, ratio: span / (high - low)};
}

function cropvalid(object) {
  const {asset} = object;
  const scale = 720 / target.width;
  const sx = object.width * scale / asset.naturalwidth, sy = object.height * scale / asset.naturalheight;
  const maximum = object.role === "underlay" || object.macro && macroassets.has(asset.id) ? Infinity : 3.000001;
  return sx >= 0.0005 && sy >= 0.0005 && sx <= maximum && sy <= maximum
    && cropinside(cropbounds(object)) && cropinside(cropbounds(object, true));
}

function cropaffine(object, bounds, margin, retain) {
  const horizontal = cropaxis(bounds.left, bounds.right, target.width, margin, retain);
  const vertical = cropaxis(bounds.top, bounds.bottom, target.height, margin, retain);
  if (!horizontal || !vertical) return null;
  const shape = candidatevariant(object, {});
  preparecandidate(shape);
  const x = horizontal.start + (object.x - bounds.left) * horizontal.ratio;
  const y = vertical.start + (object.y - bounds.top) * vertical.ratio;
  const ux = shape.matrix00 * horizontal.ratio, uy = shape.matrix10 * vertical.ratio;
  const vx = shape.matrix01 * horizontal.ratio, vy = shape.matrix11 * vertical.ratio;
  const width = Math.hypot(ux, uy) * object.width, height = Math.hypot(vx, vy) * object.height;
  const ax = Math.atan2(uy, ux) * 180 / Math.PI, ay = Math.atan2(-vx, vy) * 180 / Math.PI;
  const rotated = Math.abs(ax - ay) < 1e-8;
  const candidate = candidatevariant(object, {x, y, width, height, angle: rotated ? ax : 0,
    warpx: rotated ? 0 : ax, warpy: rotated ? 0 : ay});
  return cropvalid(candidate) ? candidate : null;
}

/*//////////////////////////////////////////////////////////////////////*/

function cropmatch(object, bounds, choices) {
  if (choices.length <= 1) return choices[0];
  const extent = choices.map(choice => cropbounds(choice));
  const left = Math.max(0, Math.min(bounds.left, ...extent.map(box => box.left)));
  const right = Math.min(target.width, Math.max(bounds.right, ...extent.map(box => box.right)));
  const top = Math.max(0, Math.min(bounds.top, ...extent.map(box => box.top)));
  const bottom = Math.min(target.height, Math.max(bounds.bottom, ...extent.map(box => box.bottom)));
  const stride = Math.max(right - left, bottom - top) / 20;
  const columns = Math.max(2, Math.round((right - left) / stride));
  const rows = Math.max(2, Math.round((bottom - top) / stride));
  const errors = choices.map(() => 0);
  const reference = new Float64Array(4);
  const original = Number.isFinite(object.matrixdeterminant) ? object : {...object};
  preparecandidate(original);
  for (const choice of choices) preparecandidate(choice);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = left + (column + 0.5) * (right - left) / columns;
      const y = top + (row + 0.5) * (bottom - top) / rows;
      reference.set(sampleasset(original, x, y));
      for (const [i, choice] of choices.entries()) {
        const actual = sampleasset(choice, x, y);
        errors[i] += Math.abs(reference[3] - actual[3]);
        for (let c = 0; c < 3; c += 1) errors[i] += Math.abs(reference[c] * reference[3] - actual[c] * actual[3]) / 765;
      }
    }
  }
  return choices[errors.indexOf(Math.min(...errors))];
}

function cropsprite(object, bounds, margin, polygon) {
  const choices = [];
  for (const retain of [211, 495].includes(object.asset.id) ? [0] : [0, 0.5, 1]) {
    const choice = cropaffine(object, bounds, margin, retain);
    if (choice) choices.push(choice);
  }
  if (polygon) choices.push(...cropflat(object, polygon));
  if (!object.asset.pixels) return choices[0];
  return cropmatch(object, bounds, choices);
}

/*//////////////////////////////////////////////////////////////////////*/

function croppolygon(object, margin) {
  const geometry = {...object};
  preparecandidate(geometry);
  let corners = object.asset.id === 694 ? [[1, 1], [-1, 1], [1, -1]] : [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  corners = corners.map(([u, v]) => [
    object.x + (geometry.matrix00 * u * object.width + geometry.matrix01 * v * object.height) / 2,
    object.y + (geometry.matrix10 * u * object.width + geometry.matrix11 * v * object.height) / 2,
  ]);
  for (const [axis, value, sign] of [[0, margin, 1], [0, target.width - margin, -1],
    [1, margin, 1], [1, target.height - margin, -1]]) {
    const clipped = [];
    for (const [i, a] of corners.entries()) {
      const b = corners[(i + 1) % corners.length];
      const ain = (a[axis] - value) * sign >= 0, bin = (b[axis] - value) * sign >= 0;
      if (ain) clipped.push(a);
      if (ain === bin) continue;
      const t = (value - a[axis]) / (b[axis] - a[axis]);
      clipped.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
    corners = clipped;
  }
  return corners.filter((point, i) => {
    const next = corners[(i + 1) % corners.length];
    return Math.hypot(point[0] - next[0], point[1] - next[1]) > 1e-8;
  });
}

function croptriangle(object, points) {
  if (Math.abs(trianglecross(...points)) < 1e-8) return null;
  const color = object.baseRGB || [object.red, object.green, object.blue];
  for (let turn = 0; turn < 3; turn += 1) {
    const candidate = candidatevariant(object, {...regiontriangle(points, color, turn), macro: true});
    if (cropvalid(candidate)) return candidate;
  }
  return null;
}

function cropflat(object, polygon) {
  const choices = [];
  let best = null, area = 0;
  for (let i = 0; i + 2 < polygon.length; i += 1) {
    for (let j = i + 1; j + 1 < polygon.length; j += 1) {
      for (let k = j + 1; k < polygon.length; k += 1) {
        const points = [polygon[i], polygon[j], polygon[k]];
        const size = Math.abs(trianglecross(...points));
        if (size > area) {best = points; area = size;}
      }
    }
  }
  const triangle = best && croptriangle(object, best);
  if (triangle?.asset.pixels && (!visibilityrequired([triangle]) || visibilityrequired([object]))) choices.push(triangle);
  if (polygon.length !== 4 || object.asset.id === 694) return choices;
  const [a, b, c, d] = polygon;
  if (Math.hypot(a[0] + c[0] - b[0] - d[0], a[1] + c[1] - b[1] - d[1]) > 1e-6) return choices;
  const hx = b[0] - a[0], hy = b[1] - a[1], vx = d[0] - a[0], vy = d[1] - a[1];
  const ax = Math.atan2(hy, hx) * 180 / Math.PI, ay = Math.atan2(-vx, vy) * 180 / Math.PI;
  const rotated = Math.abs(ax - ay) < 1e-8;
  const quad = candidatevariant(object, {x: (a[0] + c[0]) / 2, y: (a[1] + c[1]) / 2,
    width: Math.hypot(hx, hy), height: Math.hypot(vx, vy),
    angle: rotated ? ax : 0, warpx: rotated ? 0 : ax, warpy: rotated ? 0 : ay});
  if (cropvalid(quad)) choices.push(quad);
  return choices;
}

function croptriangles(object, polygon, slots) {
  if (polygon.length < 3 || polygon.length - 2 > slots) return [];
  for (let start = 0; start < polygon.length; start += 1) {
    const result = [];
    for (let j = 1; j + 1 < polygon.length; j += 1) {
      const points = [polygon[start], polygon[(start + j) % polygon.length], polygon[(start + j + 1) % polygon.length]];
      const triangle = croptriangle(object, points);
      if (!triangle) break;
      result.push(triangle);
    }
    if (result.length === polygon.length - 2) return result;
  }
  return [];
}

function* cropsteps(objects, limit) {
  if (!objects.length || !limit) return [];
  const alternatives = [];
  function clip(object, index) {
    const {asset} = object;
    const radius = object.width * (0.5 + 2 * Math.abs(asset.centrex) / asset.naturalwidth)
      + object.height * (0.5 + 2 * Math.abs(asset.centrey) / asset.naturalheight) + cropmargin(object);
    if (object.x >= radius && object.y >= radius && object.x + radius <= target.width && object.y + radius <= target.height) return [object];
    const bounds = cropbounds(object);
    if (cropinside(bounds) && cropinside(cropbounds(object, true))) return [object];
    const margin = cropmargin(object);
    const flat = [211, 495, 694].includes(asset.id);
    const polygon = flat ? croppolygon(object, Math.max(margin, 0.07 * target.width / 720)) : null;
    if (polygon && polygon.length < 3) return [];
    const choice = cropsprite(object, bounds, margin, polygon);
    if (!choice) return [];
    if (polygon) {
      const area = Math.abs(polygonarea(polygon));
      const box = cropbounds(choice);
      const aligned = Math.abs((box.right - box.left) * (box.bottom - box.top) - area) <= margin * (object.width + object.height) * 3;
      if (object.asset.id === 694 || !aligned) alternatives.push({index, object, polygon, area});
    }
    return [choice];
  }
  const groups = [];
  for (const object of objects) {
    groups.push(clip(object, groups.length));
    yield;
  }
  const used = groups.flat();
  const opacity = opacitycost(used);
  let remaining = limit - used.length - opacity;
  let needsvisibility = limit > visibilitycost && visibilityrequired(used);
  if (needsvisibility) remaining -= visibilitycost;
  for (const {index, object, polygon} of alternatives.sort((a, b) => b.area - a.area)) {
    yield;
    const pieces = croptriangles(object, polygon, remaining + 1);
    if (!pieces.length) continue;
    const setup = !needsvisibility && limit > visibilitycost && visibilityrequired(pieces) ? visibilitycost : 0;
    const additional = pieces.length - 1 + setup;
    if (additional > remaining) continue;
    groups[index] = pieces;
    remaining -= additional;
    if (setup) needsvisibility = true;
  }
  return groups.flat();
}

function croprectangle(objects, limit) {
  const steps = cropsteps(objects, limit);
  let step;
  do {step = steps.next();} while (!step.done);
  return step.value;
}

async function croprectangleasync(objects, limit, current) {
  const steps = cropsteps(objects, limit);
  let deadline = performance.now() + 8;
  while (current()) {
    const step = steps.next();
    if (step.done) return step.value;
    if (performance.now() >= deadline) {
      await yieldfittask();
      deadline = performance.now() + 8;
    }
  }
  return null;
}

/*//////////////////////////////////////////////////////////////////////*/

async function cropopaque(image, current) {
  const width = image.naturalWidth, height = image.naturalHeight;
  const tile = document.createElement("canvas");
  tile.width = Math.min(width, 512);
  tile.height = Math.min(height, 512);
  const context = tile.getContext("2d", {willReadFrequently: true});
  let deadline = performance.now() + 10;
  for (let y = 0; y < height; y += tile.height) {
    for (let x = 0; x < width; x += tile.width) {
      const w = Math.min(tile.width, width - x), h = Math.min(tile.height, height - y);
      context.clearRect(0, 0, w, h);
      context.drawImage(image, x, y, w, h, 0, 0, w, h);
      const pixels = context.getImageData(0, 0, w, h).data;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] !== 255) return false;
      }
      if (performance.now() >= deadline) {
        await yieldfittask();
        if (!current()) return false;
        deadline = performance.now() + 10;
      }
    }
  }
  return true;
}

/*//////////////////////////////////////////////////////////////////////*/

function cropdifference(a, b, i) {
  return Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
}

function cropedgestamp(source, pixels, width, height, point, levels) {
  const x = point % width, y = Math.floor(point / width);
  const distances = [x, width - x - 1, y, height - y - 1];
  const distance = Math.min(...distances), side = distances.indexOf(distance);
  let best = null, gain = 0;
  for (const length of [3, 7, 13, 21]) {
    const half = (length - 1) / 2;
    for (const depth of [1, 2, 4, 7]) {
      if (depth <= distance) continue;
      const left = side === 0 ? 0 : side === 1 ? Math.max(0, width - depth) : Math.max(0, x - half);
      const right = side === 0 ? Math.min(depth, width) : side === 1 ? width : Math.min(width, x + half + 1);
      const top = side === 2 ? 0 : side === 3 ? Math.max(0, height - depth) : Math.max(0, y - half);
      const bottom = side === 2 ? Math.min(depth, height) : side === 3 ? height : Math.min(height, y + half + 1);
      const area = (right - left) * (bottom - top);
      const color = [0, 0, 0];
      let original = 0;
      for (let row = top; row < bottom; row += 1) {
        for (let column = left; column < right; column += 1) {
          const i = 4 * (row * width + column);
          original += cropdifference(source, pixels, i);
          for (let c = 0; c < 3; c += 1) color[c] += source[i + c];
        }
      }
      for (let c = 0; c < 3; c += 1) color[c] = quantize(color[c] / area, levels);
      let error = 0;
      for (let row = top; row < bottom; row += 1) {
        for (let column = left; column < right; column += 1) {
          const i = 4 * (row * width + column);
          for (let c = 0; c < 3; c += 1) error += Math.abs(color[c] - source[i + c]);
        }
      }
      if (original - error <= Math.max(gain, original * 0.25, area * 4)) continue;
      gain = original - error;
      best = {left, right, top, bottom, color};
    }
  }
  return best;
}

async function refinecropedges(original, objects, limit, current) {
  if (!previewopaque() || objects.length < 12) return objects;
  const identities = new Set(original);
  if (original.length === objects.length && objects.every(object => identities.has(object))) return objects;
  const asset = library.find(asset => asset.id === 495);
  if (!asset) return objects;
  const scale = Math.min(1, 288 / Math.max(target.width, target.height));
  const width = Math.round(target.width * scale), height = Math.round(target.height * scale);
  if (Math.min(width, height) < 14) return objects;
  const pixelscale = width / target.width, offset = (height - target.height * pixelscale) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  const pixels = () => context.getImageData(0, 0, width, height).data;
  const render = shapes => {
    previewrenderer.paintbackground(context, width, height, width, height, backgroundtile, backgroundtilepixels, background);
    context.save();
    context.translate(0, offset);
    previewrenderer.renderpreview(context, shapes, pixelscale, pixelscale, spriteatlasimages, spriteatlasdimensions);
    context.restore();
    return pixels();
  };
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, width, height);
  const source = pixels(), before = render(original), cropped = render(objects);
  const damaged = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (Math.min(x, y, width - x - 1, height - y - 1) >= 7) continue;
      const point = y * width + x, i = 4 * point;
      if (cropdifference(source, cropped, i) - cropdifference(source, before, i) >= 35) damaged.push(point);
    }
  }
  if (!damaged.length || !current()) return objects;
  const used = objects.length + opacitycost(objects) + (limit > visibilitycost && visibilityrequired(objects) ? visibilitycost : 0);
  const available = Math.max(0, limit - used), budget = Math.min(24, Math.ceil(objects.length / 24), damaged.length);
  let removed = new Set();
  if (available < budget) {
    if (!batchfitter) batchfitter = createbatchfitter();
    const field = {weight: new Float32Array(width * height).fill(1), quiet: new Uint8Array(width * height)};
    const priority = await contourpriorities(objects, source, cropped, width, height, pixelscale, offset, field, current);
    if (!current()) return objects;
    if (priority) {
      const indices = objects.map((object, index) => index).filter(i => !objects[i].macro && objects[i].role !== "underlay");
      indices.sort((a, b) => priority[a] - priority[b] || b - a);
      removed = new Set(indices.slice(0, budget - available));
    }
  }
  const proposal = objects.filter((object, i) => !removed.has(i));
  const working = removed.size ? render(proposal) : cropped.slice();
  const pending = new Set(damaged);
  const slots = Math.min(budget, available + removed.size);
  const levels = Number(colourslider.value);
  let added = 0, deadline = performance.now() + 8;
  while (added < slots && pending.size) {
    if (performance.now() >= deadline) {
      await yieldfittask();
      if (!current()) return objects;
      deadline = performance.now() + 8;
    }
    let focus = -1, loss = 34;
    for (const point of pending) {
      const i = 4 * point;
      const damage = cropdifference(source, working, i) - cropdifference(source, before, i);
      if (damage > loss) {focus = point; loss = damage;}
    }
    if (focus < 0) break;
    pending.delete(focus);
    const stamp = cropedgestamp(source, working, width, height, focus, levels);
    if (!stamp) continue;
    const {left, top, right, bottom, color: [red, green, blue]} = stamp;
    const object = {asset, x: (left + right) / (2 * pixelscale), y: ((top + bottom) / 2 - offset) / pixelscale,
      width: (right - left) / pixelscale, height: (bottom - top) / pixelscale, angle: 0, red, green, blue};
    const clipped = cropaffine(object, cropbounds(object), cropmargin(object), 0);
    if (!clipped) continue;
    proposal.push(clipped);
    added += 1;
    for (let row = top; row < bottom; row += 1) {
      for (let column = left; column < right; column += 1) {
        const i = 4 * (row * width + column);
        working[i] = red; working[i + 1] = green; working[i + 2] = blue;
      }
    }
  }
  if (!added || !current()) return objects;
  const result = render(proposal);
  let difference = 0, edges = 0;
  for (let i = 0; i < result.length; i += 4) difference += cropdifference(source, result, i) - cropdifference(source, cropped, i);
  for (const point of damaged) edges += cropdifference(source, result, 4 * point) - cropdifference(source, cropped, 4 * point);
  return difference < 0 && edges < 0 ? proposal : objects;
}

/*//////////////////////////////////////////////////////////////////////*/

async function finishcrop(revision, limit) {
  if (!croptoggle.checked) return true;
  const current = () => revision === fitrevision;
  renderstate.textContent = "CROPPING";
  statuscopy.textContent = "Fitting edges...";
  try {
    const original = plan;
    const objects = await croprectangleasync(original, limit, current);
    if (!objects || !current()) return false;
    const corrected = await refinecropedges(original, objects, limit, current);
    if (!current()) return false;
    plan = corrected;
    underlaycount = plan.filter(object => object.role === "underlay").length;
    return true;
  } catch (error) {
    if (current()) {
      renderstate.textContent = "ERROR";
      fitmessage.textContent = "Edge fit failed.";
      console.error(error);
    }
    return false;
  }
}
