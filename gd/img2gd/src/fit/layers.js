function layerpalette(data, width) {
  const bins = new Map();
  let opaque = 0, clear = 0, translucent = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3];
    if (alpha < 8) clear += 1;
    if (alpha < 245) {
      if (alpha > 24 && alpha < 225 && offset / 4 % width < width - 1
        && Math.abs(alpha - data[offset + 7]) < 6 && Math.abs(alpha - data[offset + width * 4 + 3]) < 6) translucent += 1;
      continue;
    }
    opaque += 1;
    const key = (data[offset] >> 3) * 1024 + (data[offset + 1] >> 3) * 32 + (data[offset + 2] >> 3);
    if (!bins.has(key)) bins.set(key, {count: 0, flat: 0, sum: [0, 0, 0]});
    const bin = bins.get(key);
    bin.count += 1;
    let flat = offset / 4 % width + 1 < width && offset + width * 4 < data.length;
    for (let c = 0; c < 3; c += 1) {
      bin.sum[c] += data[offset + c];
      if (Math.abs(data[offset + c] - data[offset + 4 + c]) > 12
        || Math.abs(data[offset + c] - data[offset + width * 4 + c]) > 12) flat = false;
    }
    if (flat) bin.flat += 1;
  }
  if (!clear || opaque < 16 || translucent > opaque * 0.035) return null;
  const colors = [];
  const ranked = [...bins.values()].sort((a, b) => b.flat * 6 + b.count - a.flat * 6 - a.count);
  for (const bin of ranked) {
    if (bin.count < Math.max(3, opaque * 0.0025) || bin.flat < opaque * 0.0005 && bin.count < opaque * 0.012) continue;
    const color = bin.sum.map(channel => Math.round(channel / bin.count));
    if (colors.some(prior => prior.reduce((sum, value, c) => sum + (value - color[c]) ** 2, 0) < 32 ** 2)) continue;
    if (bin.flat < bin.count * 0.25 && colors.some((a, index) => colors.slice(index + 1).some(b => {
      const span = b.map((v, c) => v - a[c]);
      const t = span.reduce((sum, v, c) => sum + v * (color[c] - a[c]), 0) / span.reduce((sum, v) => sum + v * v, 0);
      return t > 0 && t < 1 && span.reduce((sum, v, c) => sum + (color[c] - a[c] - t * v) ** 2, 0) < 22 ** 2;
    }))) continue;
    colors.push(color);
    if (colors.length > 12) return null;
  }
  return colors.length ? colors : null;
}

/*//////////////////////////////////////////////////////////////////////*/

function layercomponents(data, colors, width, height) {
  const length = width * height;
  const classes = new Uint8Array(length);
  const labels = new Int32Array(length);
  const pairs = [];
  const ink = colors.map(color => Math.max(...color) < 52);
  for (const [i, a] of colors.entries()) {
    for (let j = 0; j < i; j += 1) {
      const b = colors[j], span = a.map((value, c) => value - b[c]);
      const norm = span.reduce((sum, value) => sum + value * value, 0);
      pairs.push({i, j, b, span, norm, threshold: 0.5 + (Number(ink[j]) - Number(ink[i])) * 0.1});
    }
  }
  const cache = new Map();
  for (let i = 0; i < length; i += 1) {
    const at = i * 4;
    if (data[at + 3] < 128) continue;
    const red = data[at], green = data[at + 1], blue = data[at + 2];
    const key = red * 65536 + green * 256 + blue;
    let label = cache.get(key);
    if (!label) {
      let distance = Infinity;
      for (const [k, color] of colors.entries()) {
        const error = (color[0] - red) ** 2 + (color[1] - green) ** 2 + (color[2] - blue) ** 2;
        if (error < distance) {distance = error; label = k + 1;}
      }
      if (distance > 20) {
        for (const pair of pairs) {
          const r = red - pair.b[0], g = green - pair.b[1], b = blue - pair.b[2];
          const mix = (r * pair.span[0] + g * pair.span[1] + b * pair.span[2]) / pair.norm;
          if (mix <= 0 || mix >= 1) continue;
          const error = (r - mix * pair.span[0]) ** 2 + (g - mix * pair.span[1]) ** 2 + (b - mix * pair.span[2]) ** 2 + 20;
          if (error < distance) {distance = error; label = (mix > pair.threshold ? pair.i : pair.j) + 1;}
        }
      }
      cache.set(key, label);
    }
    classes[i] = label;
  }
  const groups = new Map();
  for (let i = 0; i < length; i += 1) {
    if (!classes[i] || labels[i]) continue;
    const id = groups.size + 1;
    if (id > 320) return null;
    const cells = [i];
    labels[i] = id;
    let left = width, top = height, right = 0, bottom = 0;
    for (let head = 0; head < cells.length; head += 1) {
      const cell = cells[head], x = cell % width, y = Math.floor(cell / width);
      left = Math.min(x, left); top = Math.min(y, top);
      right = Math.max(x + 1, right); bottom = Math.max(y + 1, bottom);
      for (const next of [x ? cell - 1 : -1, x + 1 < width ? cell + 1 : -1, cell - width, cell + width]) {
        if (classes[next] !== classes[i] || labels[next]) continue;
        cells.push(next);
        labels[next] = id;
      }
    }
    groups.set(id, {id, cells, color: classes[i], left, top, right, bottom, edges: new Map()});
  }
  for (const group of groups.values()) {
    for (const cell of group.cells) {
      const x = cell % width;
      for (const next of [x ? cell - 1 : -1, x + 1 < width ? cell + 1 : -1, cell - width, cell + width]) {
        const other = labels[next] || 0;
        if (other !== group.id) group.edges.set(other, (group.edges.get(other) || 0) + 1);
      }
    }
  }
  return {groups, labels};
}

function joinlayergroup(front, back, groups, labels) {
  for (const cell of front.cells) {labels[cell] = back.id; back.cells.push(cell);}
  back.left = Math.min(back.left, front.left); back.top = Math.min(back.top, front.top);
  back.right = Math.max(back.right, front.right); back.bottom = Math.max(back.bottom, front.bottom);
  back.edges.delete(front.id);
  for (const [id, count] of front.edges) {
    if (id === back.id) continue;
    back.edges.set(id, (back.edges.get(id) || 0) + count);
    const neighbor = groups.get(id);
    if (neighbor) {
      neighbor.edges.delete(front.id);
      neighbor.edges.set(back.id, back.edges.get(id));
    }
  }
  groups.delete(front.id);
}

function ordercolorlayers(segmentation, colors, width, height) {
  const {groups, labels} = segmentation;
  const layers = [];
  while (groups.size) {
    let best = -Infinity, front = null, back = null;
    for (const group of groups.values()) {
      const boundary = [...group.edges.values()].reduce((a, b) => a + b, 0);
      for (const [id, count] of group.edges) {
        const neighbor = groups.get(id);
        if (!neighbor) continue;
        const affinity = neighbor.color === group.color ? 3 : count / boundary;
        const size = Math.min(1, Math.sqrt(neighbor.cells.length / group.cells.length));
        const score = affinity * (0.8 + 0.2 * size) + 0.03 / Math.sqrt(group.cells.length);
        if (score > best) {best = score; front = group; back = neighbor;}
      }
    }
    if (!front) front = groups.values().next().value;
    if (front.color !== back?.color && front.cells.length >= 4) {
      const loops = regioncontour(front, labels, true, width, height);
      const smooth = loops.filter(loop => Math.abs(polygonarea(loop)) >= 3).map(loop =>
        loop.map((point, i) => {
          const radius = Math.min(5, (loop.length - 1) >> 1);
          let x = point[0] * (radius + 1), y = point[1] * (radius + 1);
          for (let k = 1; k <= radius; k += 1) {
            const before = loop[(i + loop.length - k) % loop.length], after = loop[(i + k) % loop.length];
            const weight = radius + 1 - k;
            x += (before[0] + after[0]) * weight;
            y += (before[1] + after[1]) * weight;
          }
          const total = (radius + 1) ** 2;
          return [x / total, y / total];
        }));
      if (smooth.length) layers.push({loops: smooth, color: colors[front.color - 1]});
    }
    if (back) joinlayergroup(front, back, groups, labels);
    else groups.delete(front.id);
  }
  return layers.reverse();
}

/*//////////////////////////////////////////////////////////////////////*/

function contourlayerobjects(layer, tolerance, scalex, scaley) {
  const outlines = layer.loops.map(loop => simplifypolygon(loop, tolerance))
    .filter(loop => loop.length >= 3).map(loop => loop.map(([x, y]) => [x * scalex, y * scaley]));
  if (!outlines.length) return [];
  const [outer, ...holes] = outlines;
  if (holes.some(hole => polygonarea(hole) > 0)) return null;
  const color = layer.color.map(channel => quantize(channel, Number(colourslider.value)));
  const vertices = outlines.reduce((count, loop) => count + loop.length, 0);
  if (vertices > 160 || holes.length > 8) return null;
  const polygon = holes.length ? joinregionholes(outer, holes) : outer;
  if (polygon.length >= 3 && polygon.length <= 170) {
    if (polygon.length === 4 && !holes.length) {
      const quad = regionquad(polygon, polygon, color);
      if (quad) return [quad];
    }
    try {
      const triangles = triangulatepolygon(polygon);
      return regiontriangles(polygon, triangles, color);
    } catch (error) {
      if (error.message !== "Region polygon could not be triangulated without losing geometry.") throw error;
    }
  }
  return vertices <= 64 && holes.length <= 3 ? transparentstrips(outlines, [...color, 255]) : null;
}

function fitlayeredcontours(limit) {
  const width = sourceimage.naturalWidth, height = sourceimage.naturalHeight;
  if (!width || !height || Math.max(width, height) > 200 || width * height > 30000) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.drawImage(sourceimage, 0, 0);
  const colors = layerpalette(context.getImageData(0, 0, width, height).data, width);
  if (!colors) return null;
  const sampling = width * height <= 16000 ? 3 : 2;
  canvas.width = width * sampling; canvas.height = height * sampling;
  context.imageSmoothingEnabled = true;
  context.drawImage(sourceimage, 0, 0, canvas.width, canvas.height);
  const segmentation = layercomponents(context.getImageData(0, 0, canvas.width, canvas.height).data,
    colors, canvas.width, canvas.height);
  if (!segmentation) return null;
  const layers = ordercolorlayers(segmentation, colors, canvas.width, canvas.height);
  if (!layers.length || layers.length > limit) return null;
  for (const layer of layers) {
    if (layer.loops.length !== 1) continue;
    const points = layer.loops[0].map(([x, y]) => [x * target.width / canvas.width, y * target.height / canvas.height]);
    const color = layer.color.map(channel => quantize(channel, Number(colourslider.value)));
    layer.ellipse = contourellipse(points, color);
  }
  for (const tolerance of [0.22, 0.29, 0.36, 0.44, 0.53, 0.64, 0.77, 0.92, 1.12, 1.42, 1.8, 2.4]) {
    const result = [];
    let complete = true;
    for (const layer of layers) {
      const objects = layer.ellipse ? [layer.ellipse] : contourlayerobjects(layer, tolerance * sampling, target.width / canvas.width, target.height / canvas.height);
      if (!objects) {complete = false; break;}
      result.push(...objects);
      if (result.length > limit) break;
    }
    if (complete && result.length && result.length <= limit) {
      for (const object of result) {
        object.macro = true;
        preparecandidate(object);
      }
      return result;
    }
  }
  return null;
}
