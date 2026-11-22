function transparentsource({width, height} = target) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.imageSmoothingEnabled = samplerselect.value === "average";
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  return {context, pixels};
}

function transparentregions() {
  const {context, pixels} = transparentsource();
  const histogram = new Map();
  const length = pixels.length / 4;
  let foreground = 0;
  for (let i = 0; i < length; i += 1) {
    const off = i * 4;
    const alpha = pixels[off + 3];
    if (alpha < 8) continue;
    foreground += 1;
    const key = (pixels[off] >> 3) * 32768 + (pixels[off + 1] >> 3) * 1024 + (pixels[off + 2] >> 3) * 32 + (alpha >> 3);
    if (!histogram.has(key)) histogram.set(key, {count: 0, solid: 0, sums: [0, 0, 0, 0], samples: new Map()});
    const bin = histogram.get(key);
    bin.count += 1;
    let stable = i % target.width < target.width - 1 && i < length - target.width;
    for (let c = 0; c < 4; c += 1) {
      bin.sums[c] += pixels[off + c];
      if (Math.abs(pixels[off + c] - pixels[off + 4 + c]) > 6
        || Math.abs(pixels[off + c] - pixels[off + target.width * 4 + c]) > 6) stable = false;
    }
    if (stable) {
      bin.solid += 1;
      const value = pixels[off] * 16777216 + pixels[off + 1] * 65536 + pixels[off + 2] * 256 + alpha;
      bin.samples.set(value, (bin.samples.get(value) || 0) + 1);
    }
  }
  const palette = [[0, 0, 0, 0]];
  for (const bin of [...histogram.values()].sort((a, b) => b.solid - a.solid)) {
    if (bin.solid < Math.max(2, foreground * 0.00016) || palette.length >= 33) break;
    const color = bin.sums.map(value => Math.round(value / bin.count));
    let mode = 0, weight = 0;
    for (const [value, count] of bin.samples) if (count > weight) {mode = value; weight = count;}
    if (weight > bin.solid * 0.12) for (let c = 0; c < 4; c += 1) color[c] = (mode >>> (24 - c * 8)) & 255;
    const duplicate = palette.some(other => {
      const tolerance = color[3] === 255 && other[3] === 255 ? 210 : 64;
      return color.reduce((sum, value, c) => sum + (value - other[c]) ** 2, 0) < tolerance;
    });
    if (!duplicate) palette.push(color);
  }
  const associated = palette.map(([r, g, b, a]) => [r * a / 255, g * a / 255, b * a / 255, a]);
  const nearest = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    const off = i * 4, a = pixels[off + 3];
    if (a < 8) continue;
    const r = pixels[off] * a / 255, g = pixels[off + 1] * a / 255, b = pixels[off + 2] * a / 255;
    let best = Infinity;
    for (let k = 0; k < associated.length; k += 1) {
      const color = associated[k];
      const score = (r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2 + 2 * (a - color[3]) ** 2;
      if (score < best) {nearest[i] = k; best = score;}
    }
  }
  const {labels, regions} = labelregions(nearest, Math.max(3, Math.round(length * 0.00008)));
  return {context, pixels, palette, labels, regions: regions.filter(region => region.color)};
}

/*//////////////////////////////////////////////////////////////////////*/

function transparentstrips(loops, color) {
  const heights = [...new Set(loops.flat().map(point => point[1]))].sort((a, b) => a - b);
  const lines = loops.flatMap(loop => loop.map((point, i) => [point, loop[(i + 1) % loop.length]]));
  const objects = [];
  for (let i = 1; i < heights.length; i += 1) {
    const y = heights[i - 1], end = heights[i], middle = (y + end) / 2;
    const sides = [];
    for (const [a, b] of lines) {
      if (middle <= Math.min(a[1], b[1]) || middle >= Math.max(a[1], b[1])) continue;
      const slope = (b[0] - a[0]) / (b[1] - a[1]);
      sides.push([a[0] + (y - a[1]) * slope, a[0] + (end - a[1]) * slope]);
    }
    sides.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    for (let k = 1; k < sides.length; k += 2) {
      const [l, ll] = sides[k - 1], [r, rr] = sides[k];
      const top = Math.max(0, r - l), bottom = Math.max(0, rr - ll);
      if (Math.abs(top - bottom) <= 0.7) {
        const drift = (ll - l + rr - r) / 2;
        objects.push({asset: library.find(asset => asset.id === 495), x: (l + ll + r + rr) / 4, y: middle,
          width: (top + bottom) / 2, height: Math.hypot(drift, end - y), angle: 0, warpx: 0,
          warpy: -Math.atan2(drift, end - y) * 180 / Math.PI, red: color[0], green: color[1], blue: color[2]});
      } else if (top > 0.01 && bottom > 0.01 && color[3] === 255) {
        const polygon = [[l, y], [r, y], [rr, end], [ll, end]];
        const [a, b, c, d] = polygon;
        objects.push(...regiontriangles(polygon, [[a, b, d], [b, c, d]], color));
      } else {
        if (top > 0.01) objects.push(regiontriangle([[l, y], [r, y], [ll, end]], color));
        if (bottom > 0.01) objects.push(regiontriangle([[r, y], [rr, end], [ll, end]], color));
      }
    }
  }
  return objects;
}

function transparentrectangles(region, labels, color, budget) {
  const rectangles = [];
  const asset = library.find(item => item.id === 495);
  let active = new Map();
  for (let y = region.top; y < region.bottom; y += 1) {
    const next = new Map();
    for (let x = region.left; x < region.right;) {
      const start = x;
      if (labels[y * target.width + x++] !== region.id) continue;
      while (x < region.right && labels[y * target.width + x] === region.id) x += 1;
      const key = start * (target.width + 1) + x;
      let rectangle = active.get(key);
      if (rectangle) {
        rectangle.y += 0.5;
        rectangle.height += 1;
      } else {
        if (rectangles.length >= budget) return [];
        rectangle = {asset, x: (start + x) / 2, y: y + 0.5, width: x - start, height: 1, angle: 0,
          red: color[0], green: color[1], blue: color[2]};
        rectangles.push(rectangle);
      }
      next.set(key, rectangle);
    }
    active = next;
  }
  return rectangles;
}

function joinregionholes(outline, holes) {
  let polygon = outline;
  const walls = [outline, ...holes];
  for (const hole of holes) {
    let best = Infinity, from = -1, to = -1;
    for (const [i, a] of polygon.entries()) {
      for (const [j, b] of hole.entries()) {
        const distance = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
        if (distance >= best || !distance) continue;
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (!pointinpolygon(mid, outline) || holes.some(loop => pointinpolygon(mid, loop))) continue;
        if ([polygon, ...walls].some(loop => loop.some((p, k) => {
          const q = loop[(k + 1) % loop.length];
          if (p === a || p === b || q === a || q === b) return false;
          return trianglecross(a, b, p) * trianglecross(a, b, q) <= 0
            && trianglecross(p, q, a) * trianglecross(p, q, b) <= 0
            && Math.max(a[0], b[0]) >= Math.min(p[0], q[0]) && Math.max(p[0], q[0]) >= Math.min(a[0], b[0])
            && Math.max(a[1], b[1]) >= Math.min(p[1], q[1]) && Math.max(p[1], q[1]) >= Math.min(a[1], b[1]);
        }))) continue;
        best = distance; from = i; to = j;
      }
    }
    if (from < 0) return [];
    polygon = [...polygon.slice(0, from + 1), ...hole.slice(to), ...hole.slice(0, to + 1), ...polygon.slice(from)];
  }
  return polygon;
}

/*//////////////////////////////////////////////////////////////////////*/

function transparentchoices(region, loops, analysis, later, budget, silhouette = false) {
  const {palette, labels, context, pixels} = analysis;
  const color = palette[region.color].map((value, i) => i === 3 ? value : quantize(value, Number(colourslider.value)));
  const opacity = color[3] / 255;
  const bounds = {left: Math.max(0, region.left - 3), top: Math.max(0, region.top - 3),
    right: Math.min(target.width, region.right + 3), bottom: Math.min(target.height, region.bottom + 3)};
  const width = bounds.right - bounds.left, height = bounds.bottom - bounds.top;
  const required = new Uint8Array(width * height), permitted = new Uint8Array(width * height);
  const protectedarea = new Uint8Array(width * height);
  const outer = loops[0] || [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x, at = (y + bounds.top) * target.width + x + bounds.left;
      const a = pixels[at * 4 + 3];
      if (labels[at] === region.id) required[i] = Math.min(color[3], a);
      else if (later.has(labels[at]) && a >= 248) permitted[i] = 1;
      if (a < color[3] - 24 && x > 1 && x < width - 2 && y > 1 && y < height - 2
        && [-2, 2, -2 * target.width, 2 * target.width].every(step => pixels[(at + step) * 4 + 3] < color[3] - 24))
        protectedarea[i] = a < 8 && loops.length > 1 && pointinpolygon([x + bounds.left + 0.5, y + bounds.top + 0.5], outer) ? 2 : 1;
    }
  }
  const options = [{objects: [], gain: 0}];
  function compare(objects) {
    if (!objects.length || objects.length > budget || objects.some(obj => !obj.width || !obj.height)) return;
    for (const object of objects) {
      object.macro = true;
      [object.red, object.green, object.blue] = color;
      if (opacity < 1) object.opacity = opacity;
      preparecandidate(object);
    }
    context.clearRect(0, 0, target.width, target.height);
    previewrenderer.renderpreview(context, objects, 1, 1, spriteatlasimages, spriteatlasdimensions);
    const actual = context.getImageData(bounds.left, bounds.top, width, height).data;
    let gain = 0, violation = 0;
    for (let i = 0; i < required.length; i += 1) {
      const a = actual[i * 4 + 3];
      if (!a || permitted[i]) continue;
      gain += required[i] ? required[i] - Math.abs(required[i] - a) : -2 * a;
      if (protectedarea[i]) {
        if (protectedarea[i] === 2 && a > 16) return;
        const at = (Math.floor(i / width) + bounds.top) * target.width + i % width + bounds.left;
        const expected = pixels[at * 4 + 3];
        if (expected < 8) violation += a / color[3];
        else gain -= Math.max(0, a - expected) * 6;
      }
    }
    if (violation > Math.max(2, region.count * 0.006) || gain <= 0
      || options.some(choice => choice.objects.length <= objects.length && choice.gain >= gain)) return;
    options.push({objects, gain});
  }
  const coarse = coarseregion(region, palette, true);
  compare([coarse]);
  compare([{...coarse, asset: library.find(asset => asset.id === 497)}]);
  for (const id of loops.length > 1 ? [50, 51, 236] : [50]) {
    const asset = library.find(item => item.id === id);
    if (asset) compare([{...coarse, asset}]);
  }
  for (const factor of [0.975, 1.025]) compare([{...coarse, asset: library.find(asset => asset.id === 497),
    width: coarse.width * factor, height: coarse.height * factor}]);
  compare(transparentrectangles(region, labels, color, Math.min(160, budget)));
  const holes = loops.slice(1).filter(loop => {
    if (polygonarea(loop) >= -2) return false;
    const [a, b] = loop;
    const x = Math.floor((a[0] + b[0] + b[1] - a[1]) / 2);
    const y = Math.floor((a[1] + b[1] + a[0] - b[0]) / 2);
    const at = Math.max(0, Math.min(target.width * target.height - 1, y * target.width + x));
    if (!later.has(labels[at]) || pixels[at * 4 + 3] < 248) return true;
    for (let row = region.top; row < region.bottom; row += 1) {
      for (let col = region.left; col < region.right; col += 1) {
        if (protectedarea[(row - bounds.top) * width + col - bounds.left] && pointinpolygon([col + 0.5, row + 0.5], loop)) return true;
      }
    }
    return false;
  });
  for (const tolerance of silhouette ? [8, 5, 2.8, 1.15] : [2.8, 1.15, 0.7]) {
    const polygon = simplifypolygon(outer, tolerance);
    if (polygon.length < 3 || polygon.length > 96) continue;
    if (!holes.length) {
      const quad = regionquad(outer, polygon, color);
      if (quad) compare([quad]);
      const corners = polygon.slice();
      while (corners.length > 3) {
        const errors = corners.map((p, i) => Math.abs(trianglecross(corners[(i + corners.length - 1) % corners.length], p, corners[(i + 1) % corners.length])));
        corners.splice(errors.indexOf(Math.min(...errors)), 1);
      }
      compare([regiontriangle(alignpolygon(outer, corners, tolerance), color)]);
      try {
        const points = alignpolygon(outer, polygon, tolerance);
        const triangles = triangulatepolygon(points);
        compare(transparenttriangles(points, triangles, color));
      } catch (error) {
        if (error.message !== "Region polygon could not be triangulated without losing geometry.") throw error;
      }
    }
    const outlines = [polygon, ...holes.map(loop => simplifypolygon(loop, Math.min(1, tolerance))).filter(loop => loop.length >= 3)];
    if (outlines.length > 1 && outlines.flat().length <= 110) {
      const ellipse = Array.from({length: Math.round(36 / Math.sqrt(tolerance))}, (_, k) => {
        const angle = k * 2 * Math.PI / Math.round(36 / Math.sqrt(tolerance));
        return [coarse.x + Math.cos(angle) * coarse.width / 2, coarse.y + Math.sin(angle) * coarse.height / 2];
      });
      for (const boundary of [polygon, ellipse]) {
        const joined = joinregionholes(boundary, outlines.slice(1));
        if (joined.length < 3) continue;
        try {compare(transparenttriangles(joined, triangulatepolygon(joined), color));}
        catch (error) {
          if (error.message !== "Region polygon could not be triangulated without losing geometry.") throw error;
        }
      }
    }
    const strips = transparentstrips(outlines, color);
    compare(strips);
    if (!options.some(option => option.objects.length === 1)) {
      strips.sort((a, b) => b.width * b.height * Math.abs(b.matrixdeterminant ?? 1) - a.width * a.height * Math.abs(a.matrixdeterminant ?? 1));
      for (const count of [1, 3, 7, 15]) if (count < strips.length) compare(strips.slice(0, count));
    }
  }
  return options.filter(choice => !options.some(other => other.objects.length < choice.objects.length && other.gain >= choice.gain));
}

/*//////////////////////////////////////////////////////////////////////*/

function transparenttriangles(polygon, triangles, color) {
  if (color[3] === 255) return regiontriangles(polygon, triangles, color);
  return triangles.map(vertices => regiontriangle(vertices, color));
}

async function refinetransparentplan(groups, choices, limit, revision) {
  const canvas = document.createElement("canvas");
  const size = previewsize();
  canvas.width = size.width * size.height <= 200000 ? size.width : target.width;
  canvas.height = size.width * size.height <= 200000 ? size.height : target.height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, canvas.width, canvas.height);
  const source = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const expected = new Uint16Array(source.length);
  for (let i = 0; i < source.length; i += 4) {
    for (let c = 0; c < 3; c += 1) expected[i + c] = Math.round(source[i + c] * source[i + 3] / 255);
    expected[i + 3] = source[i + 3];
  }
  function score(objects) {
    const scale = canvas.width / target.width;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(0, (canvas.height - target.height * scale) / 2);
    previewrenderer.renderpreview(context, objects, scale, scale, spriteatlasimages, spriteatlasdimensions);
    const actual = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0;
    for (let i = 0; i < actual.length; i += 4) {
      const alpha = actual[i + 3], delta = alpha - expected[i + 3];
      total += Math.abs(delta) * (expected[i + 3] === 0 ? 4 : 1);
      for (let c = 0; c < 3; c += 1) {
        const black = Math.round(actual[i + c] * alpha / 255) - expected[i + c];
        total += Math.abs(black) + Math.abs(black - delta);
      }
    }
    return total + objects.length * 160;
  }
  let best = score(groups.flat());
  for (const [i, options] of choices.entries()) {
    if (revision !== fitrevision) return false;
    for (const option of options.slice().sort((a, b) => a.objects.length - b.objects.length)) {
      const prior = groups[i] || [];
      if (prior === option.objects) continue;
      groups[i] = option.objects;
      const objects = groups.flat();
      const used = objects.length + opacitycost(objects) + (limit > visibilitycost && visibilityrequired(objects) ? visibilitycost : 0);
      if (used <= limit) {
        const next = score(objects);
        if (next < best || next === best && option.objects.length < prior.length) {best = next; continue;}
      }
      groups[i] = prior;
    }
    showfitprogress(revision, () => groups.flat());
    await yieldfittask();
  }
  const primitives = groups.flatMap((group, i) => group?.length === 1 && group[0].asset.id !== 694
    ? [{i, area: group[0].width * group[0].height}] : []).sort((a, b) => b.area - a.area).slice(0, 8);
  for (const {i} of primitives) {
    for (const step of [1, 0.4]) {
      for (const key of ["width", "height", "x", "y"]) {
        const original = groups[i][0];
        let selected = original;
        for (const direction of [-1, 1]) {
          const delta = step * direction * (key === "width" || key === "height" ? 2 : 1);
          if ((key === "width" || key === "height") && original[key] + delta < 0.75) continue;
          groups[i] = [{...original, [key]: original[key] + delta}];
          const objects = groups.flat();
          if (objects.length + opacitycost(objects) + (limit > visibilitycost && visibilityrequired(objects) ? visibilitycost : 0) > limit) continue;
          const next = score(objects);
          if (next < best) {best = next; selected = groups[i][0];}
        }
        groups[i] = [selected];
      }
    }
    showfitprogress(revision, () => groups.flat());
    await yieldfittask();
    if (revision !== fitrevision) return false;
  }
  return revision === fitrevision;
}

/*//////////////////////////////////////////////////////////////////////*/

function transparentpixelerror(source, rendered, at, alpha = 0, color = null, behind = false) {
  const remaining = 1 - alpha / 255;
  const delta = rendered[at + 3] * remaining + alpha - source[at + 3];
  let error = Math.abs(delta) * (source[at + 3] <= 3 ? 8 : 2);
  for (let c = 0; c < 3; c += 1) {
    const value = behind
      ? rendered[at + c] + color[c] * alpha / 255 * (1 - rendered[at + 3] / 255)
      : rendered[at + c] * remaining + (color ? color[c] * alpha / 255 : 0);
    const black = value - source[at + c];
    error += Math.abs(black) + Math.abs(black - delta);
  }
  return error;
}

function transparentpremultiply(pixels) {
  const result = Float32Array.from(pixels);
  for (let at = 0; at < result.length; at += 4) {
    for (let c = 0; c < 3; c += 1) result[at + c] *= result[at + 3] / 255;
  }
  return result;
}

/*//////////////////////////////////////////////////////////////////////*/

async function fitglowunderlay(objects, analysis, budget, revision) {
  const {width, height} = target;
  const {context, pixels} = analysis;
  const room = Math.min(72, budget - objects.length - opacitycost(objects));
  if (room < 2) return objects;
  const gradients = [503, 1292, 504, 3958].map(id => library.find(asset => asset.id === id))
    .filter(asset => asset && !asset.samplingdisabled);
  if (!gradients.length) return objects;
  const seeds = [];
  for (let y = 3; y < height - 3; y += 3) {
    for (let x = 3; x < width - 3; x += 3) {
      const at = (y * width + x) * 4, alpha = pixels[at + 3];
      if (alpha < 18 || alpha > 224) continue;
      const neighbors = [-8, 8, -8 * width, 8 * width].map(offset => pixels[at + offset + 3]);
      if (neighbors.filter(value => value > 8 && value < 244).length < 3) continue;
      const dx = neighbors[1] - neighbors[0], dy = neighbors[3] - neighbors[2];
      const gradient = Math.hypot(dx, dy);
      if (gradient >= 12) seeds.push({x: x + 0.5, y: y + 0.5, at, dx: dx / gradient, dy: dy / gradient});
    }
  }
  if (seeds.length < 12) return objects;

  context.clearRect(0, 0, width, height);
  previewrenderer.renderpreview(context, objects, 1, 1, spriteatlasimages, spriteatlasdimensions);
  const base = transparentpremultiply(context.getImageData(0, 0, width, height).data);
  const source = transparentpremultiply(pixels);
  const rendered = base.slice();
  const levels = Number(colourslider.value);
  const additions = [];
  const visited = new Set();
  const score = (candidate, apply = false) => {
    const bounds = candidatebounds(candidate);
    let gain = 0;
    for (let y = bounds.top; y < bounds.bottom; y += 1) {
      for (let x = bounds.left; x < bounds.right; x += 1) {
        const at = (y * width + x) * 4;
        const remaining = 1 - base[at + 3] / 255;
        if (remaining < 0.004) continue;
        const texture = sampleasset(candidate, x + 0.5, y + 0.5);
        const alpha = texture[3] / 255;
        if (alpha < 0.004) continue;
        const coverage = remaining * alpha;
        const oldalpha = rendered[at + 3] - source[at + 3];
        const newalpha = oldalpha + alpha * (255 - rendered[at + 3]);
        gain += (Math.abs(oldalpha) - Math.abs(newalpha)) * (source[at + 3] <= 3 ? 8 : 2);
        for (let c = 0; c < 3; c += 1) {
          const color = c === 0 ? candidate.red : c === 1 ? candidate.green : candidate.blue;
          const before = rendered[at + c] - source[at + c];
          const change = coverage * color * texture[c] / 255 - alpha * (rendered[at + c] - base[at + c]);
          const after = before + change;
          gain += Math.abs(before) + Math.abs(before - oldalpha) - Math.abs(after) - Math.abs(after - newalpha);
          if (apply) rendered[at + c] += change;
        }
        if (apply) rendered[at + 3] += newalpha - oldalpha;
      }
    }
    return gain;
  };
  for (let attempt = 0; attempt < room * 3 && additions.length < room; attempt += 1) {
    if (attempt % 8 === 0) {
      await yieldfittask();
      if (revision !== fitrevision) return null;
    }
    let seed = null, residual = 27;
    for (const point of seeds) {
      const error = source[point.at + 3] - rendered[point.at + 3];
      if (!visited.has(point) && error > residual) {seed = point; residual = error;}
    }
    if (!seed) break;
    visited.add(seed);
    const [red, green, blue] = [0, 1, 2].map(c => quantize(pixels[seed.at + c], levels));
    let best = null, gain = 480;
    for (const asset of gradients) {
      const strip = asset.id === 503 || asset.id === 1292;
      const angle = Math.atan2(-seed.dx, seed.dy) * 180 / Math.PI;
      for (const depth of [6, 10, 16, 24]) {
        for (const aspect of strip ? [1.4, 2.6] : [1]) {
          const bound = target.width / 240;
          const candidate = {asset, red, green, blue, x: seed.x + seed.dx * depth * 0.08,
            y: seed.y + seed.dy * depth * 0.08, width: Math.min(depth * aspect, asset.naturalwidth * bound),
            height: Math.min(depth, asset.naturalheight * bound), angle, zlayer: 3};
          const change = score(candidate);
          if (change > gain) {best = candidate; gain = change;}
        }
      }
    }
    if (best) {
      score(best, true);
      additions.push(best);
    }
  }
  return additions.length ? [...additions, ...objects] : objects;
}

/*//////////////////////////////////////////////////////////////////////*/

async function filltransparentdetails(objects, analysis, budget, revision, behind = false) {
  const context = analysis.context;
  const {width, height} = context.canvas;
  const size = width * height;
  const scalex = width / target.width, scaley = height / target.height;
  const source = transparentpremultiply(analysis.pixels);
  context.clearRect(0, 0, width, height);
  previewrenderer.renderpreview(context, objects, scalex, scaley, spriteatlasimages, spriteatlasdimensions);
  const rendered = transparentpremultiply(context.getImageData(0, 0, width, height).data);
  const rectangle = library.find(item => item.id === 495);
  const levels = Number(colourslider.value);
  const opacities = new Set(objects.map(opacitybyte).filter(alpha => alpha < 255));
  const additions = [];
  const errors = new Float32Array(size);
  const unit = Math.max(1, Math.floor(Math.min(width / sourceimage.naturalWidth, height / sourceimage.naturalHeight)));
  const weights = new Float32Array(size).fill(1);
  const step = Math.min(4, unit * 2);
  for (let y = step; y < height - step; y += 1) {
    for (let x = step; x < width - step; x += 1) {
      const i = y * width + x, at = i * 4;
      if (source[at + 3] < 248) continue;
      let contrast = 0;
      for (const jump of [-step, step, -step * width, step * width]) {
        const neighbor = (i + jump) * 4;
        if (source[neighbor + 3] < 248) continue;
        const difference = Math.abs(source[at] - source[neighbor]) + Math.abs(source[at + 1] - source[neighbor + 1])
          + Math.abs(source[at + 2] - source[neighbor + 2]);
        contrast = Math.max(contrast, difference / 3);
      }
      weights[i] += Math.min(2.5, contrast / 32);
    }
  }
  for (let i = 0; i < size; i += 1) {
    const at = i * 4;
    if (!behind || source[at + 3] >= 248 && rendered[at + 3] < 247)
      errors[i] = weights[i] * transparentpixelerror(source, rendered, at);
  }
  const stack = [[0, 0, width, height]];
  const yieldafter = 512;
  for (let visits = 0; stack.length; visits += 1) {
    if (visits && visits % yieldafter === 0) {
      await yieldfittask();
      if (revision !== fitrevision) return null;
    }
    const [left, top, right, bottom] = stack.pop();
    const w = right - left, h = bottom - top, area = w * h;
    const expected = [0, 0, 0, 0], actual = [0, 0, 0, 0];
    let before = 0, totalweight = 0, minopacity = 255, vacancy = 0;
    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const i = y * width + x;
        const at = i * 4;
        before += errors[i];
        totalweight += weights[i];
        minopacity = Math.min(minopacity, source[at + 3]);
        if (behind && !errors[i]) continue;
        if (behind) vacancy += weights[i] * (1 - rendered[at + 3] / 255);
        for (let c = 0; c < 4; c += 1) {
          expected[c] += weights[i] * source[at + c];
          actual[c] += weights[i] * rendered[at + c];
        }
      }
    }
    if (before < 45 || !expected[3]) continue;
    let stamp = null;
    if (minopacity >= (behind ? 248 : 8)) {
      const needed = expected[3] / totalweight >= 248 ? 255
        : 255 * (expected[3] - actual[3]) / Math.max(1, totalweight * 255 - actual[3]);
      const nearby = [...opacities].reduce((best, alpha) => Math.abs(needed - alpha) < Math.abs(needed - best) ? alpha : best, 255);
      const shared = Math.max(16, Math.min(255, Math.round(needed / 16) * 16));
      const bytes = new Set(behind || needed >= 250 ? [255] : [shared, nearby]);
      for (const byte of bytes) {
        if (needed < 8 || Math.abs(needed - byte) > 32) continue;
        const alpha = Math.floor(Math.fround(Math.fround(Number(exportedopacity(byte))) * 255));
        const color = expected.slice(0, 3).map((value, c) => {
          const tint = behind ? (value - actual[c]) / Math.max(1e-6, vacancy)
            : (value - actual[c] * (1 - alpha / 255)) * 255 / (totalweight * alpha);
          return quantize(Math.max(0, Math.min(255, tint)), levels);
        });
        let after = 0;
        for (let y = top; y < bottom; y += 1) {
          for (let x = left; x < right; x += 1) {
            const i = y * width + x;
            if (!behind || errors[i]) after += weights[i] * transparentpixelerror(source, rendered, i * 4, alpha, color, behind);
          }
        }
        const gain = before - after;
        if (gain > Math.max(45, area * 1.5) && (!stamp || gain > stamp.gain)) stamp = {byte, color, gain};
      }
    }
    if (w <= unit && h <= unit || stamp?.gain >= before * 0.78) {
      if (stamp) additions.push({...stamp, w, h, x: (left + right) / 2, y: (top + bottom) / 2});
    } else if (w >= h) {
      const mid = left + Math.floor(w / 2);
      stack.push([left, top, mid, bottom], [mid, top, right, bottom]);
    } else {
      const mid = top + Math.floor(h / 2);
      stack.push([left, top, right, mid], [left, mid, right, bottom]);
    }
  }
  let remaining = budget - objects.length - opacities.size;
  const result = [];
  for (const {byte, color, x, y, w, h} of additions.sort((a, b) => b.gain - a.gain)) {
    const setup = byte < 255 && !opacities.has(byte) ? 1 : 0;
    if (remaining <= setup) continue;
    if (setup) opacities.add(byte);
    remaining -= 1 + setup;
    result.push({asset: rectangle, x: x / scalex, y: y / scaley, width: w / scalex, height: h / scaley,
      angle: 0, macro: true, zlayer: behind ? 3 : 7,
      red: color[0], green: color[1], blue: color[2], opacity: byte / 255});
  }
  return behind ? [...result, ...objects] : [...objects, ...result];
}

function transparentsums(source, rendered, width, height) {
  const stride = width + 1;
  const size = stride * (height + 1);
  const tables = Array.from({length: 15}, () => new Float64Array(size));
  const row = new Float64Array(tables.length);
  let left = width, top = height, right = 0, bottom = 0;
  for (let y = 0; y < height; y += 1) {
    row.fill(0);
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const actual = rendered[at + 3], expected = source[at + 3];
      const delta = expected - actual, vacancy = 255 - actual;
      const weight = expected <= 3 ? 24 : 2;
      let error = delta * delta * weight;
      for (let c = 0; c < 3; c += 1) {
        const previous = rendered[at + c], difference = source[at + c] - previous;
        row[c] += difference;
        row[3 + c] += previous;
        row[6 + c] += previous * difference;
        row[9 + c] += previous * previous;
        error += difference * difference;
      }
      row[12] += weight * vacancy * delta;
      row[13] += weight * vacancy * vacancy;
      row[14] += error;
      if (expected > 3) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + 1);
        bottom = Math.max(bottom, y + 1);
      }
      const index = (y + 1) * stride + x + 1;
      for (let table = 0; table < tables.length; table += 1) {
        tables[table][index] = tables[table][index - stride] + row[table];
      }
    }
  }
  function measure(x0, y0, x1, y1, output) {
    const a = y0 * stride + x0, b = y0 * stride + x1;
    const c = y1 * stride + x0, d = y1 * stride + x1;
    for (let j = 0; j < tables.length; j += 1) {
      const table = tables[j];
      output[j] = table[d] - table[b] - table[c] + table[a];
    }
  }
  return {measure, left, top, right, bottom};
}

/*//////////////////////////////////////////////////////////////////////*/

async function adaptivealphatiles(objects, analysis, budget, revision) {
  const {width, height} = target;
  const context = analysis.context, asset = library.find(item => item.id === 495);
  const shared = new Set(objects.map(opacitybyte).filter(byte => byte < 255));
  const room = budget - objects.length - shared.size;
  if (!asset || room < 2) return objects;
  context.clearRect(0, 0, width, height);
  previewrenderer.renderpreview(context, objects, 1, 1, spriteatlasimages, spriteatlasdimensions);
  const source = transparentpremultiply(analysis.pixels);
  const rendered = transparentpremultiply(context.getImageData(0, 0, width, height).data);
  const {measure, left, top, right, bottom} = transparentsums(source, rendered, width, height);
  if (left >= right || top >= bottom) return objects;
  const levels = Number(colourslider.value);
  const measured = new Float64Array(15);
  const alphas = [255, ...shared];
  const alpha = new Float64Array(256);
  for (let byte = 1; byte <= 255; byte += 1) {
    alpha[byte] = Math.floor(Math.fround(Math.fround(Number(exportedopacity(byte))) * 255)) / 255;
  }
  function tile(x0, y0, x1, y1) {
    measure(x0, y0, x1, y1, measured);
    const output = {x0, y0, x1, y1, error: measured[14], gain: 0};
    if (output.error < 400) return output;
    const area = (x1 - x0) * (y1 - y0);
    const ideal = measured[13] <= 1 ? 255 : 255 * measured[12] / measured[13];
    let nearest = 255;
    for (const byte of alphas) if (Math.abs(byte - ideal) < Math.abs(nearest - ideal)) nearest = byte;
    const rounded = Math.max(16, Math.min(240, Math.round(ideal / 16) * 16));
    for (const byte of [255, nearest, rounded]) {
      const a = alpha[byte], square = a * a;
      let gain = 2 * a * measured[12] - square * measured[13];
      const color = [0, 0, 0];
      for (let c = 0; c < 3; c += 1) {
        const value = quantize(measured[c] / (area * a) + measured[3 + c] / area, levels);
        color[c] = value;
        gain += 2 * a * (value * measured[c] - measured[6 + c])
          - square * (value * value * area - 2 * value * measured[3 + c] + measured[9 + c]);
      }
      if (gain > output.gain) Object.assign(output, {gain, byte, color});
    }
    return output;
  }

  function split(tiledata) {
    const {x0, y0, x1, y1, gain, error} = tiledata;
    if (x1 - x0 === 1 && y1 - y0 === 1 || error - gain < 250) return null;
    let a, b, best = -Infinity;
    function test(first, second) {
      const combined = first.gain + second.gain;
      if (combined > best) {best = combined; a = first; b = second;}
    }
    const dx = Math.max(1, Math.ceil((x1 - x0) / 10));
    const dy = Math.max(1, Math.ceil((y1 - y0) / 10));
    for (let x = x0 + dx; x < x1; x += dx) test(tile(x0, y0, x, y1), tile(x, y0, x1, y1));
    for (let y = y0 + dy; y < y1; y += dy) test(tile(x0, y0, x1, y), tile(x0, y, x1, y1));
    return a ? {a, b, priority: Math.max(best - gain, (error - gain) / 12)} : null;
  }

  const queue = [];
  function push(data) {
    const branch = split(data);
    if (!branch) return;
    branch.data = data;
    let index = queue.length;
    queue.push(branch);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (queue[parent].priority >= branch.priority) break;
      queue[index] = queue[parent];
      index = parent;
    }
    queue[index] = branch;
  }
  function take() {
    const entry = queue[0], last = queue.pop();
    if (!queue.length) return entry;
    let index = 0;
    while (index * 2 + 1 < queue.length) {
      let child = index * 2 + 1;
      if (child + 1 < queue.length && queue[child + 1].priority > queue[child].priority) child += 1;
      if (queue[child].priority <= last.priority) break;
      queue[index] = queue[child];
      index = child;
    }
    queue[index] = last;
    return entry;
  }
  const root = tile(left, top, right, bottom);
  push(root);
  let deadline = performance.now() + 14;
  const targettiles = Math.ceil(room * 2.5) + 12;
  for (let tiles = 1; queue.length && tiles < targettiles; tiles += 1) {
    if (performance.now() >= deadline) {
      await yieldfittask();
      if (revision !== fitrevision) return null;
      deadline = performance.now() + 14;
    }
    const {data, a, b} = take();
    data.children = [a, b];
    push(a);
    push(b);
  }
  function choose(data, penalty, selected = null) {
    const score = Math.max(0, data.gain - penalty);
    if (data.children) {
      const [left, right] = data.children;
      const a = choose(left, penalty), b = choose(right, penalty);
      if (a.score + b.score > score) {
        if (selected) {
          choose(left, penalty, selected);
          choose(right, penalty, selected);
        }
        return {score: a.score + b.score, count: a.count + b.count};
      }
    }
    if (score && selected) selected.push(data);
    return {score, count: Number(score > 0)};
  }
  let low = 0, high = root.error;
  const slots = Math.max(1, room - Math.min(13, Math.floor(room / 17)));
  for (let i = 0; i < 21; i += 1) {
    const middle = (low + high) / 2;
    if (choose(root, middle).count <= slots) high = middle;
    else low = middle;
  }
  const selected = [];
  choose(root, high, selected);
  const result = objects.slice();
  let remaining = room;
  for (const {x0, y0, x1, y1, gain, byte, color} of selected.sort((a, b) => b.gain - a.gain)) {
    if (gain < 400) break;
    const setup = byte < 255 && !shared.has(byte);
    if (remaining < 1 + setup) continue;
    if (setup) shared.add(byte);
    remaining -= 1 + setup;
    result.push({asset, x: (x0 + x1) / 2, y: (y0 + y1) / 2, width: x1 - x0, height: y1 - y0,
      angle: 0, macro: true, zlayer: 7, red: color[0], green: color[1], blue: color[2], opacity: byte / 255});
  }
  return result;
}

/*//////////////////////////////////////////////////////////////////////*/

async function fittransparentsilhouette(analysis, budget, revision) {
  const {pixels, context, palette} = analysis;
  const mask = new Uint8Array(pixels.length / 4);
  let solid = 0, foreground = 0;
  for (let i = 0; i < mask.length; i += 1) {
    const alpha = pixels[i * 4 + 3];
    if (alpha >= 8) foreground += 1;
    if (alpha >= 248) solid += 1;
    mask[i] = Number(alpha >= 128);
  }
  if (!foreground || solid < foreground * 0.75) return null;
  const color = palette.find(rgb => rgb[3] >= 248);
  if (!color) return null;
  const opacitypalette = [[0, 0, 0, 0], [...color.slice(0, 3), 255]];
  const {labels, regions} = labelregions(mask, 3);
  const groups = [];
  const capacity = Math.max(1, Math.floor(budget * 0.58));
  for (const region of regions.filter(region => region.color).slice(0, 8)) {
    const free = capacity - groups.length - opacitycost(groups);
    if (free <= 0 || revision !== fitrevision) break;
    const loops = regioncontour(region, labels, true);
    const candidates = transparentchoices(region, loops, {context, labels, pixels, palette: opacitypalette}, new Set(), free, true);
    const shape = candidates.reduce((best, choice) => choice.gain - choice.objects.length * 200 >
      best.gain - best.objects.length * 200 ? choice : best, candidates[0]);
    groups.push(...shape.objects);
    await yieldfittask();
  }
  if (revision !== fitrevision) return null;
  if (!groups.length) {
    const solidpixels = pixels.map((value, i) => i % 4 === 3 ? value : color[i % 4]);
    const rectangles = await filltransparentdetails([], {...analysis, pixels: solidpixels}, capacity, revision);
    if (!rectangles) return null;
    groups.push(...rectangles);
  }
  return groups;
}

function transparentquality(objects, analysis) {
  const {context, pixels} = analysis;
  const {width, height} = target;
  context.clearRect(0, 0, width, height);
  previewrenderer.renderpreview(context, objects, 1, 1, spriteatlasimages, spriteatlasdimensions);
  const rendered = transparentpremultiply(context.getImageData(0, 0, width, height).data);
  const source = transparentpremultiply(pixels);
  let score = objects.length * 100, dark = 0, light = 0;
  let clear = 0, leaks = 0, bright = 0, intersection = 0, union = 0;
  for (let at = 0; at < source.length; at += 4) {
    const expected = source[at + 3], actual = rendered[at + 3];
    const delta = actual - expected;
    score += Math.abs(delta) * (expected <= 3 ? 8 : 2);
    if (expected <= 3) {
      clear += 1;
      if (actual > 15) leaks += 1;
    }
    for (let c = 0; c < 3; c += 1) {
      const difference = rendered[at + c] - source[at + c];
      dark += Math.abs(difference);
      light += Math.abs(difference - delta);
    }
    const brightpixel = buffer => buffer[at] * 0.2126 + buffer[at + 1] * 0.7152 + buffer[at + 2] * 0.0722 > 166;
    const expectedbright = brightpixel(source), actualbright = brightpixel(rendered);
    if (expectedbright) bright += 1;
    if (expectedbright || actualbright) union += 1;
    if (expectedbright && actualbright) intersection += 1;
  }
  return {score: score + dark + light, dark, light, clear, leaks, bright,
    brightoverlap: union ? intersection / union : 1, size: width * height};
}

function preservetransparentdetail(candidate, reference) {
  const tolerance = reference.size * 1.5;
  return candidate.leaks <= reference.leaks + Math.max(8, reference.clear * 0.0125)
    && candidate.dark <= reference.dark * 1.04 + tolerance
    && candidate.light <= reference.light * 1.04 + tolerance
    && (reference.bright < reference.size * 0.005
      || candidate.brightoverlap >= reference.brightoverlap * 0.85);
}

/*//////////////////////////////////////////////////////////////////////*/

async function fittransparentregions(limit, revision) {
  fitpixels = 64000;
  try {
    preparetarget();
    const analysis = transparentregions();
    installunderlay(limit);
    const budget = limit - (limit > visibilitycost ? visibilitycost : 0);
    const groups = enclosingregions(analysis.regions, analysis.labels);
    const later = new Set(groups.map(group => group.id));
    const choices = [];
    const partial = [];
    for (const group of groups) {
      later.delete(group.id);
      const loops = regioncontour(group, analysis.labels, true);
      const options = transparentchoices(group, loops, analysis, later, budget);
      choices.push(options);
      const first = options.find(option => option.objects.length && partial.length + option.objects.length <= budget);
      if (first) partial.push(...first.objects);
      showfitprogress(revision, partial);
      await yieldfittask();
      if (revision !== fitrevision) return false;
    }
    const families = new Map();
    for (const [index, options] of choices.entries()) {
      if (!options[1]) continue;
      const byte = opacitybyte(options[1].objects[0]);
      if (!families.has(byte)) families.set(byte, []);
      families.get(byte).push({index, options});
    }
    let states = Array(budget + 1).fill({gain: 0});
    for (const family of families.values()) {
      const setup = opacitycost(family[0].options[1].objects);
      let active = Array(budget + 1).fill(null);
      for (const {index, options} of family) {
        const next = active.slice();
        for (const choice of options.slice(1)) {
          const count = choice.objects.length;
          for (let capacity = count; capacity <= budget; capacity += 1) {
            const free = capacity - count;
            const unused = states[free - setup], used = active[free];
            const prior = used && (!unused || used.gain > unused.gain) ? used : unused;
            if (prior && (!next[capacity] || prior.gain + choice.gain > next[capacity].gain))
              next[capacity] = {gain: prior.gain + choice.gain, prior, index, objects: choice.objects};
          }
        }
        active = next;
      }
      states = states.map((state, k) => active[k] && active[k].gain > state.gain ? active[k] : state);
    }
    const objects = Array(choices.length);
    for (let state = states[budget]; state.prior; state = state.prior) objects[state.index] = state.objects;
    if (!await refinetransparentplan(objects, choices, limit, revision)) return false;
    const base = objects.flat();
    const completed = await filltransparentdetails(base, analysis, budget, revision);
    if (!completed || revision !== fitrevision) return false;
    rememberfit(completed);
    const silhouette = await fittransparentsilhouette(analysis, budget, revision);
    if (revision !== fitrevision) return false;
    let best = completed;
    let reference = transparentquality(best, analysis);
    if (silhouette) {
      const filled = await filltransparentdetails(silhouette, analysis, budget, revision);
      if (!filled || revision !== fitrevision) return false;
      const quality = transparentquality(filled, analysis);
      if (quality.score < reference.score && (limit <= 500 || preservetransparentdetail(quality, reference))) {
        best = filled;
        rememberfit(best);
        reference = quality;
      }
    }
    let bestscore = reference.score;
    for (const seed of [base, silhouette, []]) {
      if (!seed || (seed === base && !base.length)) continue;
      const candidate = await adaptivealphatiles(seed, analysis, budget, revision);
      if (!candidate || revision !== fitrevision) return false;
      const quality = transparentquality(candidate, analysis);
      if (quality.score < bestscore && preservetransparentdetail(quality, reference)) {
        best = candidate;
        rememberfit(best);
        bestscore = quality.score;
      }
    }
    const glowing = await fitglowunderlay(best, analysis, budget, revision);
    if (!glowing || revision !== fitrevision) return false;
    if (glowing !== best) {
      const quality = transparentquality(glowing, analysis);
      if (quality.score < bestscore && preservetransparentdetail(quality, reference)) best = glowing;
    }
    rememberfit(best);
    if (limit >= 350 && budget - best.length - opacitycost(best) >= 2) {
      const covered = await filltransparentdetails(best, analysis, budget, revision, true);
      if (!covered || revision !== fitrevision) return false;
      if (covered.length > best.length && transparentquality(covered, analysis).score < transparentquality(best, analysis).score)
        best = covered;
    }
    plan = best;
    regionfitactive = true;
    updatefields();
    return true;
  } finally {
    if (revision === fitrevision) fitpixels = 0;
  }
}
