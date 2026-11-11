const macroassets = new Set([211, 495, 497, 694]);
let regionfitactive = false;

/*//////////////////////////////////////////////////////////////////////*/

function vectorregions() {
  const histogram = new Map();
  for (let index = 0; index < targetpixels.length; index += 3) {
    const red = targetpixels[index];
    const green = targetpixels[index + 1];
    const blue = targetpixels[index + 2];
    const key = (red >> 3) * 1024 + (green >> 3) * 32 + (blue >> 3);
    if (!histogram.has(key)) histogram.set(key, {count: 0, red: 0, green: 0, blue: 0});
    const color = histogram.get(key);
    color.count += 1;
    color.red += red;
    color.green += green;
    color.blue += blue;
  }
  const palette = [];
  const length = target.width * target.height;
  for (const color of [...histogram.values()].sort((left, right) => right.count - left.count)) {
    if (color.count < length * 0.0003 || palette.length >= 24) break;
    const rgb = [color.red, color.green, color.blue].map(value => Math.round(value / color.count));
    if (palette.some(existing => existing.reduce((sum, value, index) => sum + (value - rgb[index]) ** 2, 0) < 500)) continue;
    const blend = palette.some((left, index) => palette.slice(index + 1).some(right => {
      const direction = right.map((value, channel) => value - left[channel]);
      const distance = direction.reduce((sum, value) => sum + value * value, 0);
      const fraction = direction.reduce((sum, value, channel) => sum + value * (rgb[channel] - left[channel]), 0) / distance;
      return fraction > 0.05 && fraction < 0.95
        && direction.reduce((sum, value, channel) => sum + (left[channel] + value * fraction - rgb[channel]) ** 2, 0) < 64;
    }));
    if (blend && color.count < length * 0.02) continue;
    palette.push(rgb);
  }
  const nearest = new Uint8Array(length);
  let covered = 0;
  for (let index = 0; index < length; index += 1) {
    let bestscore = Infinity;
    for (const [color, rgb] of palette.entries()) {
      let score = 0;
      for (let channel = 0; channel < 3; channel += 1) score += (targetpixels[index * 3 + channel] - rgb[channel]) ** 2;
      if (score < bestscore) {bestscore = score; nearest[index] = color;}
    }
    if (bestscore <= 75) covered += 1;
    else nearest[index] = 255;
  }
  if (covered / length < 0.88) return {palette, coverage: covered / length, labels: null, regions: []};
  const frontier = new Int32Array(length);
  let pending = 0;
  for (let index = 0; index < length; index += 1) {
    if (nearest[index] !== 255) frontier[pending++] = index;
  }
  function neighbors(index) {
    const x = index % target.width;
    const y = Math.floor(index / target.width);
    return [x ? index - 1 : -1, x + 1 < target.width ? index + 1 : -1,
    y ? index - target.width : -1, y + 1 < target.height ? index + target.width : -1];
  }
  for (let position = 0; position < pending; position += 1) {
    for (const index of neighbors(frontier[position])) {
      if (index < 0 || nearest[index] !== 255) continue;
      let bestscore = Infinity;
      let selected = 255;
      for (const neighbor of neighbors(index)) {
        if (neighbor < 0 || nearest[neighbor] === 255) continue;
        const color = nearest[neighbor];
        const score = palette[color].reduce((sum, value, channel) => sum + (value - targetpixels[index * 3 + channel]) ** 2, 0);
        if (score < bestscore) {bestscore = score; selected = color;}
      }
      if (selected !== 255) {
        nearest[index] = selected;
        frontier[pending++] = index;
      }
    }
  }
  const labels = new Int32Array(length).fill(-1);
  const queue = new Int32Array(length);
  const regions = [];
  for (let index = 0; index < length; index += 1) {
    if (labels[index] !== -1) continue;
    const region = {id: regions.length, color: nearest[index], count: 0, left: target.width, right: 0, top: target.height, bottom: 0};
    labels[index] = region.id;
    let count = 1;
    queue[0] = index;
    for (let position = 0; position < count; position += 1) {
      const current = queue[position];
      const x = current % target.width;
      const y = Math.floor(current / target.width);
      region.left = Math.min(region.left, x);
      region.right = Math.max(region.right, x + 1);
      region.top = Math.min(region.top, y);
      region.bottom = Math.max(region.bottom, y + 1);
      for (const next of [x ? current - 1 : -1, x + 1 < target.width ? current + 1 : -1,
      y ? current - target.width : -1, y + 1 < target.height ? current + target.width : -1]) {
        if (next < 0 || labels[next] !== -1 || nearest[next] !== region.color) continue;
        labels[next] = region.id;
        queue[count++] = next;
      }
    }
    region.count = count;
    regions.push(region);
  }
  return {
    palette, labels, coverage: covered / length,
    regions: regions.filter(region => region.count >= 25)
      .sort((left, right) => right.count - left.count).slice(0, 64),
  };
}

/*//////////////////////////////////////////////////////////////////////*/

function regioncontour(region, labels) {
  const stride = target.width + 1;
  const edges = new Map();
  function edge(x, y, xx, yy) {edges.set(y * stride + x, yy * stride + xx);}
  for (let y = region.top; y < region.bottom; y += 1) {
    for (let x = region.left; x < region.right; x += 1) {
      const index = y * target.width + x;
      if (labels[index] !== region.id) continue;
      if (!y || labels[index - target.width] !== region.id) edge(x, y, x + 1, y);
      if (x + 1 === target.width || labels[index + 1] !== region.id) edge(x + 1, y, x + 1, y + 1);
      if (y + 1 === target.height || labels[index + target.width] !== region.id) edge(x + 1, y + 1, x, y + 1);
      if (!x || labels[index - 1] !== region.id) edge(x, y + 1, x, y);
    }
  }
  const contours = [];
  while (edges.size) {
    const start = edges.keys().next().value;
    let current = start;
    const points = [];
    do {
      points.push([current % stride, Math.floor(current / stride)]);
      const next = edges.get(current);
      edges.delete(current);
      current = next;
    } while (current !== undefined && current !== start && points.length <= target.width * target.height * 4);
    if (current === start) contours.push(points);
  }
  return contours.sort((left, right) => polygonarea(right) - polygonarea(left))[0] || [];
}

function polygonarea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    area += points[index][0] * next[1] - next[0] * points[index][1];
  }
  return area / 2;
}

function simplifyline(points, tolerance) {
  if (points.length < 3) return points;
  const start = points[0];
  const end = points.at(-1);
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  let best = tolerance;
  let selected = -1;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = length ? Math.abs(dy * (points[index][0] - start[0]) - dx * (points[index][1] - start[1])) / length
      : Math.hypot(points[index][0] - start[0], points[index][1] - start[1]);
    if (distance > best) {best = distance; selected = index;}
  }
  if (selected < 0) return [start, end];
  return [...simplifyline(points.slice(0, selected + 1), tolerance).slice(0, -1),
  ...simplifyline(points.slice(selected), tolerance)];
}

function simplifypolygon(points, tolerance = 1.4) {
  if (points.length < 4) return points;
  let farthest = 1;
  for (let index = 2; index < points.length; index += 1) {
    if (Math.hypot(points[index][0] - points[0][0], points[index][1] - points[0][1])
      > Math.hypot(points[farthest][0] - points[0][0], points[farthest][1] - points[0][1])) farthest = index;
  }
  return [...simplifyline(points.slice(0, farthest + 1), tolerance).slice(0, -1),
  ...simplifyline([...points.slice(farthest), points[0]], tolerance).slice(0, -1)];
}

function trianglecross(a, b, c) {return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);}

function triangulatepolygon(points) {
  const remaining = points.map((point, index) => index);
  const triangles = [];
  if (polygonarea(points) < 0) remaining.reverse();
  while (remaining.length > 3) {
    let ear = -1;
    let quality = -1;
    for (let index = 0; index < remaining.length; index += 1) {
      const a = points[remaining[(index + remaining.length - 1) % remaining.length]];
      const b = points[remaining[index]];
      const c = points[remaining[(index + 1) % remaining.length]];
      if (trianglecross(a, b, c) <= 1e-8) continue;
      const inside = remaining.some(other => {
        const point = points[other];
        return point !== a && point !== b && point !== c && trianglecross(a, b, point) >= -1e-8
          && trianglecross(b, c, point) >= -1e-8 && trianglecross(c, a, point) >= -1e-8;
      });
      const perimeter = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (b[0] - c[0]) ** 2
        + (b[1] - c[1]) ** 2 + (c[0] - a[0]) ** 2 + (c[1] - a[1]) ** 2;
      const score = trianglecross(a, b, c) / perimeter;
      if (!inside && score > quality) {ear = index; quality = score;}
    }
    if (ear < 0) throw new Error("Region polygon could not be triangulated without losing geometry.");
    triangles.push([points[remaining[(ear + remaining.length - 1) % remaining.length]],
    points[remaining[ear]], points[remaining[(ear + 1) % remaining.length]]]);
    remaining.splice(ear, 1);
  }
  if (remaining.length === 3) triangles.push(remaining.map(index => points[index]));
  return triangles;
}

function regiontriangle(points, color) {
  let anchor = 0;
  let longest = 0;
  for (let index = 0; index < 3; index += 1) {
    const left = points[(index + 1) % 3];
    const right = points[(index + 2) % 3];
    const length = Math.hypot(right[0] - left[0], right[1] - left[1]);
    if (length > longest) {
      longest = length;
      anchor = index;
    }
  }
  const origin = points[anchor];
  const left = points[(anchor + 1) % 3];
  const top = points[(anchor + 2) % 3];
  const horizontal = [origin[0] - left[0], origin[1] - left[1]];
  const vertical = [origin[0] - top[0], origin[1] - top[1]];
  return {
    asset: library.find(asset => asset.id === 694),
    x: origin[0] - (horizontal[0] + vertical[0]) / 2,
    y: origin[1] - (horizontal[1] + vertical[1]) / 2,
    width: Math.hypot(...horizontal), height: Math.hypot(...vertical),
    angle: 0, warpx: Math.atan2(horizontal[1], horizontal[0]) * 180 / Math.PI,
    warpy: Math.atan2(vertical[1], vertical[0]) * 180 / Math.PI - 90,
    red: color[0], green: color[1], blue: color[2],
  };
}

function regionellipse(region, labels, color) {
  const width = region.right - region.left;
  const height = region.bottom - region.top;
  const x = (region.left + region.right) / 2;
  const y = (region.top + region.bottom) / 2;
  let intersection = 0;
  let union = 0;
  for (let row = region.top; row < region.bottom; row += 1) {
    for (let column = region.left; column < region.right; column += 1) {
      const inside = ((column + 0.5 - x) / (width / 2)) ** 2 + ((row + 0.5 - y) / (height / 2)) ** 2 <= 1;
      const mask = labels[row * target.width + column] === region.id;
      if (inside && mask) intersection += 1;
      if (inside || mask) union += 1;
    }
  }
  if (intersection / union < (region.count < 200 ? 0.85 : 0.945)) return null;
  return {
    asset: library.find(asset => asset.id === 497), x, y, width, height, angle: 0, warpx: 0, warpy: 0,
    red: color[0], green: color[1], blue: color[2],
  };
}

function pointinpolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function regionstitches(polygon, triangles, color) {
  const edges = new Map();
  for (const triangle of triangles) {
    for (let index = 0; index < 3; index += 1) {
      const a = triangle[index];
      const b = triangle[(index + 1) % 3];
      const left = polygon.indexOf(a);
      const right = polygon.indexOf(b);
      if (Math.abs(left - right) === 1 || Math.abs(left - right) === polygon.length - 1) continue;
      const key = [left, right].sort((a, b) => a - b).join(":");
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const altitude = Math.abs(trianglecross(...triangle)) / length;
      const prior = edges.get(key);
      edges.set(key, {a, b, length, altitude: Math.max(altitude, prior?.altitude || 0)});
    }
  }
  const objects = [];
  for (const {a, b, length, altitude} of edges.values()) {
    const ux = (b[0] - a[0]) / length;
    const uy = (b[1] - a[1]) / length;
    const radius = Math.max(0.35, altitude * 0.04);
    const steps = Math.ceil(length);
    let start = null;
    function finish(end) {
      if (start === null || end - start < 1) {start = null; return;}
      const middle = (start + end) / 2;
      objects.push({
        asset: library.find(asset => asset.id === 495), x: a[0] + ux * middle, y: a[1] + uy * middle,
        width: end - start, height: radius * 2, angle: Math.atan2(uy, ux) * 180 / Math.PI, warpx: 0, warpy: 0,
        red: color[0], green: color[1], blue: color[2],
      });
      start = null;
    }
    for (let index = 0; index <= steps; index += 1) {
      const distance = index * length / steps;
      const x = a[0] + ux * distance;
      const y = a[1] + uy * distance;
      const valid = pointinpolygon([x - uy * radius, y + ux * radius], polygon)
        && pointinpolygon([x + uy * radius, y - ux * radius], polygon);
      if (valid && start === null) start = distance;
      if (!valid) finish((index - 1) * length / steps);
    }
    finish(length);
  }
  return objects;
}

/*//////////////////////////////////////////////////////////////////////*/

function regionobjects(region, palette, labels, tolerance) {
  const color = palette[region.color];
  const ellipse = regionellipse(region, labels, color);
  if (ellipse) return [ellipse];
  const polygon = simplifypolygon(regioncontour(region, labels), tolerance);
  if (polygon.length < 3) return [coarseregion(region, palette)];
  const triangles = triangulatepolygon(polygon);
  const objects = triangles.map(points => {
    const margins = points.map((point, index) => {
      const left = polygon.indexOf(points[(index + 1) % 3]);
      const right = polygon.indexOf(points[(index + 2) % 3]);
      return Math.abs(left - right) === 1 || Math.abs(left - right) === polygon.length - 1 ? 0 : 0.025;
    });
    const total = margins.reduce((sum, value) => sum + value, 0);
    const shift = [0, 1].map(channel => points.reduce((sum, point, index) => sum + point[channel] * margins[index], 0));
    const changes = points.map(point => [point[0] * total - shift[0], point[1] * total - shift[1]]);
    const maximum = Math.max(...changes.map(change => Math.hypot(...change)));
    const factor = Math.min(1, 0.6 / maximum);
    const expanded = points.map((point, index) => [point[0] + changes[index][0] * factor,
    point[1] + changes[index][1] * factor]);
    return regiontriangle(expanded, color);
  });
  return [...objects, ...regionstitches(polygon, triangles, color)];
}

function coarseregion(region, palette, rectangle = false) {
  const color = palette[region.color];
  const width = region.right - region.left;
  const height = region.bottom - region.top;
  const ratio = region.count / (width * height);
  const asset = library.find(asset => asset.id === (rectangle || ratio > 0.9 ? 495 : 497));
  return {
    asset, x: (region.left + region.right) / 2, y: (region.top + region.bottom) / 2,
    width, height, angle: 0, warpx: 0, warpy: 0, red: color[0], green: color[1], blue: color[2],
  };
}

/*//////////////////////////////////////////////////////////////////////*/

async function fitcolorregions(limit, revision) {
  if (!limit || !sourceisopaque()) return null;
  const reserved = limit > visibilitycost ? visibilitycost : 0;
  fitpixels = 64000;
  preparetarget();
  const analysis = vectorregions();
  if (analysis.coverage < 0.88 || !imageopaque) {
    fitpixels = 0;
    return null;
  }
  warpselect.value = "on";
  coverageselect.value = "2";
  batchfitteractive = true;
  fitcoverage = 2;
  if (!batchfitter) batchfitter = createbatchfitter();
  try {
    installunderlay(limit);
    batchfitter.reset(2);
    const regions = analysis.regions.filter(region => !underlaycount || !dominantcolor
      || analysis.palette[region.color].reduce((sum, value, index) => sum + (value - dominantcolor[index]) ** 2, 0) >= 500);
    let groups = [];
    let tolerance = 1.4;
    const available = limit - reserved - plan.length;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      groups = regions.map((region, index) => ({
        region, objects: index === 0 && !underlaycount ? [coarseregion(region, analysis.palette, true)]
          : regionobjects(region, analysis.palette, analysis.labels, tolerance),
      }));
      if (groups.reduce((count, group) => count + group.objects.length, 0) <= available) break;
      tolerance *= 1.7;
    }
    for (const group of groups) {
      if (revision !== fitrevision) return false;
      const remaining = limit - reserved - plan.length;
      if (!remaining) break;
      const objects = group.objects.length <= remaining ? group.objects : [coarseregion(group.region, analysis.palette)];
      for (const candidate of objects) {
        candidate.macro = true;
        preparecandidate(candidate);
        batchfitter.paint(candidate);
        plan.push(candidate);
      }
      renderstate.textContent = `REGIONS ${plan.length}/${limit}`;
      await yieldfittask();
    }
    regionfitactive = true;
    updatefields();
    return revision === fitrevision;
  } catch (error) {
    if (error.message !== "Region polygon could not be triangulated without losing geometry.") throw error;
    return null;
  } finally {
    if (revision === fitrevision) {
      batchfitteractive = false;
      fitpixels = 0;
      fitcoverage = 1;
      batchfitter.clear();
    }
  }
}
