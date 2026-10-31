function preparecoveragetarget(resolution) {
  const width = target.width * resolution;
  const height = target.height * resolution;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently:true});
  const screenwidth = Math.max(1, Math.round(720 * Number(previewzoomslider.value)));
  const screenheight = Math.max(1, Math.round(screenwidth * target.height / target.width));
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

  return {reset, fit: scorecandidate, paint: commit, refine, clear};
}
