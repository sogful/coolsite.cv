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
  const scale = 720 / target.width;
  if (width * scale / object.asset.naturalwidth < 0.0005 || height * scale / object.asset.naturalheight < 0.0005) return null;
  const ax = Math.atan2(uy, ux) * 180 / Math.PI, ay = Math.atan2(-vx, vy) * 180 / Math.PI;
  const rotated = Math.abs(ax - ay) < 1e-8;
  const candidate = candidatevariant(object, {x, y, width, height, angle: rotated ? ax : 0,
    warpx: rotated ? 0 : ax, warpy: rotated ? 0 : ay});
  return cropinside(cropbounds(candidate, true)) && cropinside(cropbounds(candidate)) ? candidate : null;
}

/*//////////////////////////////////////////////////////////////////////*/

function cropsprite(object, bounds, margin) {
  const compressed = cropaffine(object, bounds, margin, 0);
  if (!compressed || [211, 495].includes(object.asset.id) || !object.asset.pixels) return compressed;
  const choices = [compressed];
  for (const fraction of [0.5, 1]) {
    const choice = cropaffine(object, bounds, margin, fraction);
    if (choice) choices.push(choice);
  }
  if (choices.length === 1) return compressed;
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

function croptriangles(object, polygon, slots) {
  if (polygon.length < 3 || polygon.length - 2 > slots) return [];
  const color = object.baseRGB || [object.red, object.green, object.blue];
  for (let start = 0; start < polygon.length; start += 1) {
    const result = [];
    for (let j = 1; j + 1 < polygon.length; j += 1) {
      const points = [polygon[start], polygon[(start + j) % polygon.length], polygon[(start + j + 1) % polygon.length]];
      if (Math.abs(trianglecross(...points)) < 1e-8) continue;
      let triangle;
      for (let turn = 0; turn < 3; turn += 1) {
        const candidate = candidatevariant(object, {...regiontriangle(points, color, turn), macro: true});
        const scale = 720 / target.width;
        if (candidate.width * scale < 0.0005 * candidate.asset.naturalwidth
          || candidate.height * scale < 0.0005 * candidate.asset.naturalheight) continue;
        if (cropinside(cropbounds(candidate)) && cropinside(cropbounds(candidate, true))) {
          triangle = candidate;
          break;
        }
      }
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
    const choice = cropsprite(object, bounds, margin);
    if (!choice) return [];
    if ([211, 495, 694].includes(object.asset.id)) {
      const polygon = croppolygon(object, Math.max(margin, 0.07 * target.width / 720));
      if (polygon.length < 3) return [];
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

async function finishcrop(revision, limit) {
  if (!croptoggle.checked) return true;
  const current = () => revision === fitrevision;
  renderstate.textContent = "CROPPING";
  statuscopy.textContent = "Fitting edges...";
  try {
    const objects = await croprectangleasync(plan, limit, current);
    if (!objects || !current()) return false;
    plan = objects;
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
