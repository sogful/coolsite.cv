function preparecoveragetarget(resolution) {
  const width = target.width * resolution;
  const height = target.height * resolution;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently:true});
  const {width: screenwidth, height: screenheight} = previewsize();
  previewrenderer.paintbackground(context, width, height, screenwidth, screenheight,
    backgroundtile, backgroundtilepixels, background);
  const backdrop = context.getImageData(0, 0, width, height).data;
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = samplerselect.value === "average";
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, width, height);
  const original = context.getImageData(0, 0, width, height).data;
  const source = new Uint8ClampedArray(width * height * 3);
  const ground = new Uint8ClampedArray(source.length);
  const levels = Number(colourslider.value);
  const samplecount = resolution * resolution;
  for (let y = 0; y < target.height; y += 1) {
    for (let x = 0; x < target.width; x += 1) {
      const index = y * target.width + x;
      for (let sampleindex = 0; sampleindex < samplecount; sampleindex += 1) {
        const row = y * resolution + Math.floor(sampleindex / resolution);
        const column = x * resolution + sampleindex % resolution;
        const input = (row * width + column) * 4;
        const output = (index * samplecount + sampleindex) * 3;
        const alpha = original[input + 3] / 255;
        for (let channel = 0; channel < 3; channel += 1) {
          source[output + channel] = quantize(original[input + channel] * alpha
            + backdrop[input + channel] * (1 - alpha), levels);
          ground[output + channel] = underlaycount ? fittedpixels[index * 3 + channel] : backdrop[input + channel];
        }
      }
    }
  }
  return {source, ground};
}

/*//////////////////////////////////////////////////////////////////////*/

function createbatchfitter(prepare = preparecoveragetarget) {
  const pages = spriteatlasimages.map(image => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", {willReadFrequently: true});
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    for (let offset = 0; offset < data.length; offset += 4) {
      const alpha = data[offset + 3] / 255;
      for (let channel = 0; channel < 3; channel += 1) data[offset + channel] = Math.round(data[offset + channel] * alpha);
    }
    return {width: image.width, height: image.height, data};
  });
  const cache = new WeakMap();
  const ranks = [...new Set(library.flatMap(asset => asset.mesh.map(sprite => sprite.batch || 0)))].sort((left, right) => left - right);
  let layers = [];
  let ground = null;
  let resolution = 1;
  let samplecount = 1;
  const pixel = new Float64Array(4);
  const basis = new Float64Array(9);
  const average = new Float64Array(3);
  const prior = new Float64Array(3);
  let targetsubpixels = null;

  /*//////////////////////////////////////////////////////////////////////*/

  function meshes(asset) {
    if (cache.has(asset)) return cache.get(asset);
    const entries = asset.mesh.map((sprite, index) => {
      const horizontal = sprite.vertices.map(vertex => vertex[0]);
      const vertical = sprite.vertices.map(vertex => vertex[1]);
      const left = Math.min(...horizontal);
      const right = Math.max(...horizontal);
      const top = Math.min(...vertical);
      const bottom = Math.max(...vertical);
      const margin = Math.max(1, right - left, bottom - top) * 1e-7;
      const triangles = [[0, 1, 3], [1, 2, 3]].map(indices => {
        const [origin, horizontal, vertical] = indices.map(index => sprite.vertices[index]);
        const [start, across, upward] = indices.map(index => sprite.uv[index]);
        const determinant = (horizontal[0] - origin[0]) * (vertical[1] - origin[1])
          - (horizontal[1] - origin[1]) * (vertical[0] - origin[0]);
        return {origin, horizontal, vertical, determinant, start, across, upward};
      });
      return {sprite, order: asset.meshorder?.[index]?.order ?? index, triangles,
        left: left - margin, right: right + margin, top: top - margin, bottom: bottom + margin};
    });
    entries.sort((left, right) => (left.sprite.batch || 0) - (right.sprite.batch || 0) || left.order - right.order);
    const groups = ranks.map(rank => entries.filter(entry => (entry.sprite.batch || 0) === rank));
    cache.set(asset, groups);
    return groups;
  }

  /*//////////////////////////////////////////////////////////////////////*/

  function sample(entry, x, y) {
    pixel.fill(0);
    if (x < entry.left || x > entry.right || y < entry.top || y > entry.bottom) return false;
    const sprite = entry.sprite;
    let u = 0;
    let v = 0;
    let inside = false;
    for (const triangle of entry.triangles) {
      const {origin, horizontal, vertical, determinant, start, across, upward} = triangle;
      if (Math.abs(determinant) < 1e-10) continue;
      const dx = x - origin[0];
      const dy = y - origin[1];
      const s = (dx * (vertical[1] - origin[1]) - dy * (vertical[0] - origin[0])) / determinant;
      const t = ((horizontal[0] - origin[0]) * dy - (horizontal[1] - origin[1]) * dx) / determinant;
      if (s < -1e-8 || t < -1e-8 || s + t > 1 + 1e-8) continue;
      u = start[0] + s * (across[0] - start[0]) + t * (upward[0] - start[0]);
      v = start[1] + s * (across[1] - start[1]) + t * (upward[1] - start[1]);
      inside = true;
      break;
    }
    if (!inside) return false;
    const page = pages[sprite.page];
    const nearest = sprite.sampler === "nearest";
    const sx = Math.max(0, Math.min(page.width - 1, u * page.width - (nearest ? 0 : 0.5)));
    const sy = Math.max(0, Math.min(page.height - 1, v * page.height - (nearest ? 0 : 0.5)));
    const xzero = Math.floor(sx);
    const yzero = Math.floor(sy);
    const fx = nearest ? 0 : sx - xzero;
    const fy = nearest ? 0 : sy - yzero;
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 2; column += 1) {
        const offset = (Math.min(page.height - 1, yzero + row) * page.width
          + Math.min(page.width - 1, xzero + column)) * 4;
        const weight = (row ? fy : 1 - fy) * (column ? fx : 1 - fx) * sprite.opacity;
        const alpha = page.data[offset + 3] / 255;
        for (let channel = 0; channel < 3; channel += 1) {
          pixel[channel] += page.data[offset + channel] * weight;
        }
        pixel[3] += alpha * weight;
      }
    }
    return pixel[3] > 0;
  }

  function location(candidate, x, y) {
    const dx = x - candidate.x;
    const dy = y - candidate.y;
    const localx = (candidate.matrix11 * dx - candidate.matrix01 * dy) / candidate.matrixdeterminant;
    const localy = (-candidate.matrix10 * dx + candidate.matrix00 * dy) / candidate.matrixdeterminant;
    return [candidate.asset.centrex + localx * candidate.asset.naturalwidth / candidate.width,
      candidate.asset.centrey - localy * candidate.asset.naturalheight / candidate.height];
  }

  function subcoefficients(candidate, groups, x, y, sampleindex) {
    const index = y * target.width + x;
    const offset = (index * samplecount + sampleindex) * 4;
    basis.fill(0);
    basis[0] = ground[(index * samplecount + sampleindex) * 3];
    basis[1] = ground[(index * samplecount + sampleindex) * 3 + 1];
    basis[2] = ground[(index * samplecount + sampleindex) * 3 + 2];
    for (let channel = 0; channel < 3; channel += 1) prior[channel] = basis[channel];
    const [localx, localy] = location(candidate,
      x + (sampleindex % resolution + 0.5) / resolution,
      y + (Math.floor(sampleindex / resolution) + 0.5) / resolution);
    for (let batch = 0; batch < ranks.length; batch += 1) {
      const layer = layers[batch];
      const transmission = layer[offset + 3];
      for (let channel = 0; channel < 3; channel += 1) prior[channel] = prior[channel] * transmission + layer[offset + channel];
      for (let channel = 0; channel < 9; channel += 1) basis[channel] *= transmission;
      for (let channel = 0; channel < 3; channel += 1) basis[channel] += layer[offset + channel];
      for (const entry of groups[batch]) {
        if (!sample(entry, localx, localy)) continue;
        const sprite = entry.sprite;
        const transmission = sprite.blendDestination === 1 ? 1 : 1 - pixel[3];
        for (let channel = 0; channel < 9; channel += 1) basis[channel] *= transmission;
        for (let channel = 0; channel < 3; channel += 1) {
          if (sprite.role === "fixed") basis[channel] += pixel[channel] * (sprite.fixedColor?.[channel] ?? 255) / 255;
          else basis[(sprite.role === "detail" ? 6 : 3) + channel] += pixel[channel] / 255;
        }
      }
    }
    return basis;
  }

  /*//////////////////////////////////////////////////////////////////////*/

  function scorecandidate(candidate, step, separate = false) {
    if (samplecount > 1) return scorecoverage(candidate, step, separate);
    if (candidate.asset.samplingdisabled) return Number.NEGATIVE_INFINITY;
    const bounds = candidatebounds(candidate);
    if (Math.abs(candidate.matrixdeterminant) < 1e-8) return Number.NEGATIVE_INFINITY;
    const groups = meshes(candidate.asset);
    const sums = Array.from({length: 3}, () => new Float64Array(5));
    const samples = [];
    for (let y = bounds.top; y < bounds.bottom; y += step) {
      for (let x = bounds.left; x < bounds.right; x += step) {
        const offset = (y * target.width + x) * 3;
        subcoefficients(candidate, groups, x, y, 0);
        samples.push({offset, basis: new Float64Array(basis)});
        for (let channel = 0; channel < 3; channel += 1) {
          const baseweight = basis[3 + channel];
          const detailweight = basis[6 + channel];
          const residual = targetpixels[offset + channel] - basis[channel];
          sums[channel][0] += baseweight * baseweight;
          sums[channel][1] += baseweight * detailweight;
          sums[channel][2] += detailweight * detailweight;
          sums[channel][3] += baseweight * residual;
          sums[channel][4] += detailweight * residual;
        }
      }
    }
    const base = [];
    const detail = [];
    const levels = Number(colourslider.value);
    for (const [aa, ab, bb, ar, br] of sums) {
      const determinant = aa * bb - ab * ab;
      if (separate && determinant > 1e-8 * Math.max(1, aa * bb)) {
        base.push(quantize((ar * bb - br * ab) / determinant, levels));
        detail.push(quantize((br * aa - ar * ab) / determinant, levels));
      } else {
        const denominator = aa + 2 * ab + bb;
        const value = quantize(denominator ? (ar + br) / denominator : 0, levels);
        base.push(value);
        detail.push(value);
      }
    }
    candidate.red = base[0];
    candidate.green = base[1];
    candidate.blue = base[2];
    if (separate) {
      candidate.baseRGB = base;
      candidate.detailRGB = detail;
    }
    let benefit = 0;
    for (const {offset, basis} of samples) {
      for (let channel = 0; channel < 3; channel += 1) {
        const before = fittedpixels[offset + channel];
        const after = Math.max(0, Math.min(255, basis[channel] + basis[3 + channel] * base[channel]
          + basis[6 + channel] * detail[channel]));
        const olddifference = targetpixels[offset + channel] - before;
        const difference = targetpixels[offset + channel] - after;
        benefit += olddifference * olddifference - difference * difference;
      }
    }
    return benefit * step * step;
  }

  /*//////////////////////////////////////////////////////////////////////*/

  function scorecoverage(candidate, step, separate) {
    if (candidate.asset.samplingdisabled) return Number.NEGATIVE_INFINITY;
    const bounds = candidatebounds(candidate);
    if (Math.abs(candidate.matrixdeterminant) < 1e-8) return Number.NEGATIVE_INFINITY;
    const groups = meshes(candidate.asset);
    const sums = Array.from({length:3}, () => new Float64Array(5));
    const samples = [];
    for (let y = bounds.top; y < bounds.bottom; y += step) {
      for (let x = bounds.left; x < bounds.right; x += step) {
        const index = y * target.width + x;
        for (let sampleindex = 0; sampleindex < samplecount; sampleindex += 1) {
          const offset = (index * samplecount + sampleindex) * 3;
          subcoefficients(candidate, groups, x, y, sampleindex);
          samples.push({offset, basis:new Float64Array(basis), before:new Float64Array(prior)});
          for (let channel = 0; channel < 3; channel += 1) {
            const baseweight = basis[3 + channel];
            const detailweight = basis[6 + channel];
            const residual = targetsubpixels[offset + channel] - basis[channel];
            sums[channel][0] += baseweight * baseweight;
            sums[channel][1] += baseweight * detailweight;
            sums[channel][2] += detailweight * detailweight;
            sums[channel][3] += baseweight * residual;
            sums[channel][4] += detailweight * residual;
          }
        }
      }
    }
    const base = [];
    const detail = [];
    const levels = Number(colourslider.value);
    for (const [aa, ab, bb, ar, br] of sums) {
      const determinant = aa * bb - ab * ab;
      if (separate && determinant > 1e-8 * Math.max(1, aa * bb)) {
        base.push(quantize((ar * bb - br * ab) / determinant, levels));
        detail.push(quantize((br * aa - ar * ab) / determinant, levels));
      } else {
        const denominator = aa + 2 * ab + bb;
        const value = quantize(denominator ? (ar + br) / denominator : 0, levels);
        base.push(value);
        detail.push(value);
      }
    }
    candidate.red = base[0];
    candidate.green = base[1];
    candidate.blue = base[2];
    if (separate) {
      candidate.baseRGB = base;
      candidate.detailRGB = detail;
    }
    let benefit = 0;
    for (const {offset, basis, before} of samples) {
      for (let channel = 0; channel < 3; channel += 1) {
        const after = Math.max(0, Math.min(255, basis[channel] + basis[3 + channel] * base[channel]
          + basis[6 + channel] * detail[channel]));
        const olddifference = targetsubpixels[offset + channel] - before[channel];
        const difference = targetsubpixels[offset + channel] - after;
        benefit += olddifference * olddifference - difference * difference;
      }
    }
    return benefit * step * step / samplecount;
  }

  /*//////////////////////////////////////////////////////////////////////*/

  function commit(candidate) {
    const bounds = candidatebounds(candidate);
    const groups = meshes(candidate.asset);
    for (let y = bounds.top; y < bounds.bottom; y += 1) {
      for (let x = bounds.left; x < bounds.right; x += 1) {
        const index = y * target.width + x;
        average.fill(0);
        for (let sampleindex = 0; sampleindex < samplecount; sampleindex += 1) {
          const offset = (index * samplecount + sampleindex) * 4;
          const [localx, localy] = location(candidate,
            x + (sampleindex % resolution + 0.5) / resolution,
            y + (Math.floor(sampleindex / resolution) + 0.5) / resolution);
          for (let batch = 0; batch < ranks.length; batch += 1) {
            const layer = layers[batch];
            for (const entry of groups[batch]) {
              if (!sample(entry, localx, localy)) continue;
              const sprite = entry.sprite;
              const color = sprite.role === "fixed" ? sprite.fixedColor || [255, 255, 255]
                : sprite.role === "detail" ? candidate.detailRGB || [candidate.red, candidate.green, candidate.blue]
                  : candidate.baseRGB || [candidate.red, candidate.green, candidate.blue];
              const transmission = sprite.blendDestination === 1 ? 1 : 1 - pixel[3];
              for (let channel = 0; channel < 3; channel += 1) {
                layer[offset + channel] = layer[offset + channel] * transmission + pixel[channel] * color[channel] / 255;
              }
              layer[offset + 3] *= transmission;
            }
          }
          for (let channel = 0; channel < 3; channel += 1) {
            let color = ground[(index * samplecount + sampleindex) * 3 + channel];
            for (const layer of layers) color = color * layer[offset + 3] + layer[offset + channel];
            average[channel] += color / samplecount;
          }
        }
        for (let channel = 0; channel < 3; channel += 1) fittedpixels[index * 3 + channel] = average[channel];
      }
    }
  }

  function reset(coverage = 1) {
    resolution = coverage === 2 ? 2 : 1;
    samplecount = resolution * resolution;
    ground = new Uint8ClampedArray(fittedpixels);
    if (samplecount > 1) {
      const prepared = prepare(resolution);
      targetsubpixels = prepared.source;
      ground = prepared.ground;
      for (let index = 0; index < target.width * target.height; index += 1) {
        for (let channel = 0; channel < 3; channel += 1) {
          let value = 0;
          let initial = 0;
          for (let sampleindex = 0; sampleindex < samplecount; sampleindex += 1) {
            const offset = (index * samplecount + sampleindex) * 3 + channel;
            value += targetsubpixels[offset] / samplecount;
            initial += ground[offset] / samplecount;
          }
          targetpixels[index * 3 + channel] = value;
          fittedpixels[index * 3 + channel] = initial;
        }
      }
    }
    layers = ranks.map(() => {
      const layer = new Float32Array(target.width * target.height * samplecount * 4);
      for (let index = 3; index < layer.length; index += 4) layer[index] = 1;
      return layer;
    });
  }

  function refine(candidate) {
    const shared = {...candidate};
    const sharedscore = scorecandidate(shared, 1);
    const separate = {...candidate};
    const score = scorecandidate(separate, 1, true);
    return score > sharedscore ? {candidate: separate, score} : {candidate: shared, score: sharedscore};
  }

  function clear() {
    layers = [];
    ground = null;
    targetsubpixels = null;
  }

  return {reset, fit: scorecandidate, paint: commit, refine, clear,
    meshgroups: meshes, samplemesh: sample, meshpixel: pixel, meshlocation: location};
}

/*//////////////////////////////////////////////////////////////////////*/

function tintdraws(objects, fitter, scale, offset, stepx, stepy, width, height) {
  const draws = [];
  let area = 0;
  for (const [index, candidate] of objects.entries()) {
    preparecandidate(candidate);
    if (!Number.isFinite(candidate.matrixdeterminant) || Math.abs(candidate.matrixdeterminant) < 1e-8) continue;
    const asset = candidate.asset;
    for (const group of fitter.meshgroups(asset)) {
      for (const entry of group) {
        const sprite = entry.sprite;
        if ((sprite.blendSource ?? 1) !== 1 || (sprite.blendDestination ?? 771) !== 771) return null;
        let left = width, right = 0, top = height, bottom = 0;
        for (const [vx, vy] of sprite.vertices) {
          const u = (vx - asset.centrex) * candidate.width / asset.naturalwidth;
          const v = (asset.centrey - vy) * candidate.height / asset.naturalheight;
          const x = (candidate.x + candidate.matrix00 * u + candidate.matrix01 * v) * scale / stepx;
          const y = ((candidate.y + candidate.matrix10 * u + candidate.matrix11 * v) * scale + offset) / stepy;
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        left = Math.max(0, Math.floor(left)); right = Math.min(width, Math.ceil(right));
        top = Math.max(0, Math.floor(top)); bottom = Math.min(height, Math.ceil(bottom));
        if (left >= right || top >= bottom) continue;
        area += (right - left) * (bottom - top);
        if (area > 2400000 || draws.length >= 16000) return null;
        const fixed = candidate.role === "underlay" || asset.fixedonly || sprite.role === "fixed";
        const role = fixed ? -1 : 2 * index + Number(sprite.role === "detail");
        draws.push({candidate, entry, index, role, left, right, top, bottom,
          layer: candidate.zlayer ?? (candidate.role === "underlay" ? 3 : 5)});
      }
    }
  }
  draws.sort((a, b) => b.layer - a.layer || (b.entry.sprite.batch || 0) - (a.entry.sprite.batch || 0)
    || b.index - a.index || b.entry.order - a.entry.order);
  return {draws, area};
}

/*//////////////////////////////////////////////////////////////////////*/

async function refinelayercolors(revision, verify = null, frozen = null) {
  const original = plan;
  const zoom = previewzoomslider.value;
  const current = () => revision === fitrevision && plan === original && previewzoomslider.value === zoom;
  if (!current() || !original.length || !target.width || !target.height || !sourceimage.naturalWidth) return false;
  const {width: screenwidth, height: screenheight} = previewsize();
  if (screenwidth * screenheight > 750000) return false;
  const step = Math.max(1, Math.ceil(Math.sqrt(screenwidth * screenheight / 135000)));
  const width = Math.ceil(screenwidth / step), height = Math.ceil(screenheight / step);
  const size = width * height;
  const stepx = screenwidth / width, stepy = screenheight / height;
  const scale = screenwidth / target.width;
  const offset = (screenheight - target.height * scale) / 2;
  if (!batchfitter) batchfitter = createbatchfitter();
  const fitter = batchfitter;
  const geometry = tintdraws(original, fitter, scale, offset, stepx, stepy, width, height);
  if (!geometry || !geometry.area) return false;
  const before = measurefittedpreview();
  const targetdata = sourcecomparecanvas.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, screenwidth, screenheight).data;
  const resultdata = resultcanvas.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, screenwidth, screenheight).data;
  const residual = new Float32Array(3 * size);
  const column = new Float64Array(width), row = new Float64Array(height);
  for (let x = 0; x < width; x++) column[x] = Math.floor((x + 0.5) * stepx) + 0.5;
  for (let y = 0; y < height; y++) {
    row[y] = Math.floor((y + 0.5) * stepy) + 0.5;
    for (let x = 0; x < width; x++) {
      const source = 4 * (Math.floor(row[y]) * screenwidth + Math.floor(column[x]));
      const output = 3 * (y * width + x);
      for (let c = 0; c < 3; c++) residual[output + c] = targetdata[source + c] - resultdata[source + c];
    }
  }
  const capacity = Math.min(geometry.area, 600000);
  const indices = new Uint32Array(capacity), next = new Int32Array(capacity);
  const weights = new Float32Array(3 * capacity);
  const heads = new Int32Array(2 * original.length).fill(-1);
  const transmission = new Float32Array(size).fill(1);
  let count = 0;
  let deadline = performance.now() + 12;
  for (const {candidate, entry, role, left, right, top, bottom} of geometry.draws) {
    for (let y = top; y < bottom; y++) {
      if (performance.now() >= deadline) {
        await yieldfittask();
        if (!current()) return false;
        deadline = performance.now() + 12;
      }
      for (let x = left; x < right; x++) {
        const point = y * width + x;
        const visible = transmission[point];
        if (visible < 0.00001) continue;
        const [u, v] = fitter.meshlocation(candidate, column[x] / scale, (row[y] - offset) / scale);
        if (!fitter.samplemesh(entry, u, v)) continue;
        const pixel = fitter.meshpixel;
        transmission[point] = visible * (1 - pixel[3]);
        if (role < 0 || !Math.max(pixel[0], pixel[1], pixel[2])) continue;
        if (count >= capacity) return false;
        indices[count] = point;
        next[count] = heads[role];
        heads[role] = count;
        for (let c = 0; c < 3; c++) weights[3 * count + c] = visible * pixel[c] / 255;
        count++;
      }
    }
  }
  if (!count) return false;
  const colors = original.map(item => ({...item}));
  const marked = new Int32Array(size).fill(-1), touched = new Uint32Array(size);
  const combined = new Float32Array(3 * size);
  const bins = new Float64Array(3 * 256);
  const levels = Number(colourslider.value);
  let changed = false;
  for (let sweep = 0; sweep < 2; sweep++) {
    for (let role = heads.length - 1; role >= 0; role--) {
      if (heads[role] < 0 || frozen?.has(original[Math.floor(role / 2)])) continue;
      if (performance.now() >= deadline) {
        await yieldfittask();
        if (!current()) return false;
        deadline = performance.now() + 12;
      }
      const item = colors[Math.floor(role / 2)];
      const key = role % 2 ? "detailRGB" : "baseRGB";
      const old = item[key] || [item.red, item.green, item.blue];
      let length = 0;
      const tag = sweep * heads.length + role;
      for (let at = heads[role]; at >= 0; at = next[at]) {
        const point = indices[at], base = 3 * point;
        if (marked[point] !== tag) {
          marked[point] = tag;
          touched[length++] = point;
          combined[base] = combined[base + 1] = combined[base + 2] = 0;
        }
        for (let c = 0; c < 3; c++) combined[base + c] += weights[3 * at + c];
      }
      bins.fill(0);
      const sums = [0, 0, 0];
      for (let i = 0; i < length; i++) {
        const base = 3 * touched[i];
        for (let c = 0; c < 3; c++) {
          const weight = combined[base + c];
          if (weight < 0.00001) continue;
          const value = quantize(old[c] + residual[base + c] / weight, levels);
          bins[256 * c + value] += weight;
          sums[c] += weight;
        }
      }
      const fresh = [...old];
      for (let c = 0; c < 3; c++) {
        if (!sums[c]) continue;
        let sum = 0;
        for (let v = 0; v < 256; v++) {
          sum += bins[256 * c + v];
          if (sum >= sums[c] / 2) {fresh[c] = v; break;}
        }
      }
      const shift = fresh.map((v, c) => v - old[c]);
      if (!shift.some(Boolean)) continue;
      let gain = 0;
      for (let i = 0; i < length; i++) {
        const base = 3 * touched[i];
        for (let c = 0; c < 3; c++) {
          const prior = residual[base + c];
          gain += Math.abs(prior) - Math.abs(prior - combined[base + c] * shift[c]);
        }
      }
      if (gain <= 0) continue;
      for (let i = 0; i < length; i++) {
        const base = 3 * touched[i];
        for (let c = 0; c < 3; c++) residual[base + c] -= combined[base + c] * shift[c];
      }
      item[key] = fresh;
      changed = true;
    }
  }
  if (!changed || !current()) return false;
  let accepted = false;
  try {
    plan = colors;
    accepted = measurefittedpreview() < before && (!verify || verify());
    return accepted;
  } finally {
    if (!accepted) {plan = original; drawresult();}
  }
}
