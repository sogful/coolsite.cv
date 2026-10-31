function pixelerror(index) {
  const offset = index * 3;
  return Math.abs(targetpixels[offset] - fittedpixels[offset]) + Math.abs(targetpixels[offset + 1] - fittedpixels[offset + 1]) + Math.abs(targetpixels[offset + 2] - fittedpixels[offset + 2]);
}

function findfocus(blocked = null) {
  let bestindex = 0;
  let bestscore = -1;
  const pixels = target.width * target.height;
  for (let index = 0; index < pixels; index += 1) {
    if (blocked?.has(index)) continue;
    const score = pixelerror(index);
    if (score > bestscore) {
      bestscore = score;
      bestindex = index;
    }
  }
  return {x: bestindex % target.width + 0.5, y: Math.floor(bestindex / target.width) + 0.5, score: bestscore};
}

function candidatebounds(candidate) {
  preparecandidate(candidate);
  const halfwidth = (Math.abs(candidate.matrix00) * candidate.width + Math.abs(candidate.matrix01) * candidate.height) / 2 + 1;
  const halfheight = (Math.abs(candidate.matrix10) * candidate.width + Math.abs(candidate.matrix11) * candidate.height) / 2 + 1;
  return {
    left: Math.max(0, Math.floor(candidate.x - halfwidth)),
    right: Math.min(target.width, Math.ceil(candidate.x + halfwidth)),
    top: Math.max(0, Math.floor(candidate.y - halfheight)),
    bottom: Math.min(target.height, Math.ceil(candidate.y + halfheight)),
  };
}

function preparecandidate(candidate) {
  if (Number.isFinite(candidate.matrixdeterminant)) return;
  candidate.warpx = Number(candidate.warpx || 0);
  candidate.warpy = Number(candidate.warpy || 0);
  const usesaxiswarp = candidate.warpx !== 0 || candidate.warpy !== 0;
  const baseangle = usesaxiswarp ? 0 : Number(candidate.angle || 0);
  const rotationx = (usesaxiswarp ? candidate.warpy : baseangle) * Math.PI / 180;
  const rotationy = (usesaxiswarp ? candidate.warpx : baseangle) * Math.PI / 180;
  candidate.matrix00 = Math.cos(rotationy);
  candidate.matrix01 = -Math.sin(rotationx);
  candidate.matrix10 = Math.sin(rotationy);
  candidate.matrix11 = Math.cos(rotationx);
  candidate.matrixdeterminant = candidate.matrix00 * candidate.matrix11 - candidate.matrix01 * candidate.matrix10;
}

function sampleasset(candidate, x, y) {
  preparecandidate(candidate);
  const deltax = x - candidate.x;
  const deltay = y - candidate.y;
  const localx = (candidate.matrix11 * deltax - candidate.matrix01 * deltay) / candidate.matrixdeterminant;
  const localy = (-candidate.matrix10 * deltax + candidate.matrix00 * deltay) / candidate.matrixdeterminant;
  const u = localx / candidate.width + 0.5;
  const v = localy / candidate.height + 0.5;
  const [left, top, width, height] = candidate.asset.source;
  if (u < 0 || u >= 1 || v < 0 || v >= 1) {
    sampledtexture.fill(0);
    return sampledtexture;
  }
  const sourcex = Math.max(left, Math.min(left + width - 1, left + u * width - 0.5));
  const sourcey = Math.max(top, Math.min(top + height - 1, top + v * height - 0.5));
  const x0 = Math.floor(sourcex);
  const y0 = Math.floor(sourcey);
  const x1 = Math.min(left + width - 1, x0 + 1);
  const y1 = Math.min(top + height - 1, y0 + 1);
  const fx = sourcex - x0;
  const fy = sourcey - y0;
  const pixels = candidate.asset.pixels;
  const row0 = y0 * candidate.asset.pagewidth * 4;
  const row1 = y1 * candidate.asset.pagewidth * 4;
  const offset00 = row0 + x0 * 4;
  const offset10 = row0 + x1 * 4;
  const offset01 = row1 + x0 * 4;
  const offset11 = row1 + x1 * 4;
  for (let channel = 0; channel < 4; channel += 1) {
    const upper = pixels[offset00 + channel] * (1 - fx) + pixels[offset10 + channel] * fx;
    const lower = pixels[offset01 + channel] * (1 - fx) + pixels[offset11 + channel] * fx;
    sampledtexture[channel] = upper * (1 - fy) + lower * fy;
  }
  return sampledtexture;
}

function fitcandidate(candidate, step) {
  if (batchfitteractive) return batchfitter.fit(candidate, step);
  if (candidate.asset.samplingdisabled) return Number.NEGATIVE_INFINITY;
  const bounds = candidatebounds(candidate);
  const numerator = [0, 0, 0];
  const denominator = [0, 0, 0];
  let count = 0;
  for (let y = bounds.top; y < bounds.bottom; y += step) {
    for (let x = bounds.left; x < bounds.right; x += step) {
      const texture = sampleasset(candidate, x + 0.5, y + 0.5);
      const alpha = texture[3] / 255;
      if (alpha < 0.005) continue;
      const offset = (y * target.width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const coefficient = texture[channel] * alpha / 255;
        const residual = targetpixels[offset + channel] - fittedpixels[offset + channel] * (1 - alpha);
        numerator[channel] += coefficient * residual;
        denominator[channel] += coefficient * coefficient;
      }
      count += 1;
    }
  }
  if (!count) return Number.NEGATIVE_INFINITY;
  if (candidate.asset.fixedonly) {
    candidate.red = 255;
    candidate.green = 255;
    candidate.blue = 255;
  } else {
    const levels = Number(colourslider.value);
    candidate.red = quantize(denominator[0] ? numerator[0] / denominator[0] : 0, levels);
    candidate.green = quantize(denominator[1] ? numerator[1] / denominator[1] : 0, levels);
    candidate.blue = quantize(denominator[2] ? numerator[2] / denominator[2] : 0, levels);
  }
  const tint = [candidate.red, candidate.green, candidate.blue];
  let benefit = 0;
  for (let y = bounds.top; y < bounds.bottom; y += step) {
    for (let x = bounds.left; x < bounds.right; x += step) {
      const texture = sampleasset(candidate, x + 0.5, y + 0.5);
      const alpha = texture[3] / 255;
      if (alpha < 0.005) continue;
      const offset = (y * target.width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const before = fittedpixels[offset + channel];
        const channelTint = candidate.asset.fixedonly ? 255 : tint[channel];
        const after = before * (1 - alpha) + texture[channel] * alpha * channelTint / 255;
        const olddifference = targetpixels[offset + channel] - before;
        const newdifference = targetpixels[offset + channel] - after;
        benefit += olddifference * olddifference - newdifference * newdifference;
      }
    }
  }
  return benefit * step * step;
}

function yieldfittask() {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      channel.port2.close();
      resolve();
    };
    channel.port2.postMessage(0);
  });
}

function evaluatecandidate(candidate) {
  if (candidate.asset.samplingdisabled) return Number.NEGATIVE_INFINITY;
  const bounds = candidatebounds(candidate);
  const area = Math.max(1, (bounds.right - bounds.left) * (bounds.bottom - bounds.top));
  return fitcandidate(candidate, Math.max(1, Math.ceil(Math.sqrt(area / 96))));
}

function refinecandidate(candidate) {
  return fitcandidate(candidate, 1);
}

function candidatevariant(candidate, changes) {
  const variant = {...candidate, ...changes};
  delete variant.matrix00;
  delete variant.matrix01;
  delete variant.matrix10;
  delete variant.matrix11;
  delete variant.matrixdeterminant;
  return variant;
}

function refinegeometry(candidate) {
  const pixelscale = 720 / target.width;
  const maximumwidth = Math.min(target.width, 3 * candidate.asset.naturalwidth / pixelscale);
  const maximumheight = Math.min(target.height, 3 * candidate.asset.naturalheight / pixelscale);
  let best = candidatevariant(candidate, {
    width: Math.min(candidate.width, maximumwidth),
    height: Math.min(candidate.height, maximumheight),
  });
  for (let round = 0; round < 2; round += 1) {
    const positionstep = round ? 0.25 : 0.5;
    const scalefactor = round ? 1.05 : 1.1;
    const angle = round ? 3 : 7;
    const changes = [
      {x: best.x - positionstep}, {x: best.x + positionstep},
      {y: best.y - positionstep}, {y: best.y + positionstep},
      {width: Math.max(0.25, best.width / scalefactor)}, {width: Math.min(maximumwidth, best.width * scalefactor)},
      {height: Math.max(0.25, best.height / scalefactor)}, {height: Math.min(maximumheight, best.height * scalefactor)},
    ];
    if (best.asset.freerotation && !best.warpx && !best.warpy) changes.push({angle: best.angle - angle}, {angle: best.angle + angle});
    if (warpselect.value === "on") {
      changes.push({warpx: best.warpx - angle}, {warpx: best.warpx + angle},
        {warpy: best.warpy - angle}, {warpy: best.warpy + angle});
    }
    let bestscore = evaluatecandidate(best);
    for (const change of changes) {
      const variant = candidatevariant(best, change);
      const score = evaluatecandidate(variant);
      if (score > bestscore) {
        best = variant;
        bestscore = score;
      }
    }
  }
  return best;
}

function paintcandidate(candidate) {
  if (batchfitteractive && candidate.role !== "underlay") return batchfitter.paint(candidate);
  const bounds = candidatebounds(candidate);
  if (candidate.baseRGB && candidate.detailRGB) {
    const image = rendercandidatepixels(candidate, candidate.baseRGB, candidate.detailRGB, bounds);
    for (let y = bounds.top; y < bounds.bottom; y += 1) {
      for (let x = bounds.left; x < bounds.right; x += 1) {
        const sourceoffset = ((y - bounds.top) * image.width + x - bounds.left) * 4;
        const targetoffset = (y * target.width + x) * 3;
        fittedpixels[targetoffset] = image.data[sourceoffset];
        fittedpixels[targetoffset + 1] = image.data[sourceoffset + 1];
        fittedpixels[targetoffset + 2] = image.data[sourceoffset + 2];
      }
    }
    return;
  }
  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    for (let x = bounds.left; x < bounds.right; x += 1) {
      const texture = sampleasset(candidate, x + 0.5, y + 0.5);
      const alpha = texture[3] / 255;
      if (alpha < 0.005) continue;
      const offset = (y * target.width + x) * 3;
      const tint = candidate.asset.fixedonly ? [255, 255, 255] : [candidate.red, candidate.green, candidate.blue];
      fittedpixels[offset] = fittedpixels[offset] * (1 - alpha) + texture[0] * alpha * tint[0] / 255;
      fittedpixels[offset + 1] = fittedpixels[offset + 1] * (1 - alpha) + texture[1] * alpha * tint[1] / 255;
      fittedpixels[offset + 2] = fittedpixels[offset + 2] * (1 - alpha) + texture[2] * alpha * tint[2] / 255;
    }
  }
}

function assethasrole(asset, role) {
  return (asset.mesh || []).some(sprite => sprite.role === role);
}

function assetneedsrolefit(asset) {
  const hasbase = assethasrole(asset, "base");
  const hasdetail = assethasrole(asset, "detail");
  const hasfixed = assethasrole(asset, "fixed");
  return !asset.fixedonly && ((hasbase && hasdetail) || (hasfixed && (hasbase || hasdetail)));
}

function rendercandidatepixels(candidate, baseRGB, detailRGB, bounds) {
  const width = Math.max(1, bounds.right - bounds.left);
  const height = Math.max(1, bounds.bottom - bounds.top);
  colorfitcanvas.width = width;
  colorfitcanvas.height = height;
  const context = colorfitcanvas.getContext("2d", {willReadFrequently: true});
  const backgroundimage = context.createImageData(width, height);
  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    for (let x = bounds.left; x < bounds.right; x += 1) {
      const sourceoffset = (y * target.width + x) * 3;
      const targetoffset = ((y - bounds.top) * width + x - bounds.left) * 4;
      backgroundimage.data[targetoffset] = fittedpixels[sourceoffset];
      backgroundimage.data[targetoffset + 1] = fittedpixels[sourceoffset + 1];
      backgroundimage.data[targetoffset + 2] = fittedpixels[sourceoffset + 2];
      backgroundimage.data[targetoffset + 3] = 255;
    }
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  context.putImageData(backgroundimage, 0, 0);
  context.save();
  context.translate(-bounds.left, -bounds.top);
  previewrenderer.renderobjects(context, [{...candidate, baseRGB, detailRGB, legacyuv: true}], 1, 1,
    spriteatlasimages, spriteatlasdimensions);
  context.restore();
  return context.getImageData(0, 0, width, height);
}

function colorbenefit(image, bounds) {
  let benefit = 0;
  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    for (let x = bounds.left; x < bounds.right; x += 1) {
      const imageoffset = ((y - bounds.top) * image.width + x - bounds.left) * 4;
      const targetoffset = (y * target.width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const before = fittedpixels[targetoffset + channel];
        const olddifference = targetpixels[targetoffset + channel] - before;
        const newdifference = targetpixels[targetoffset + channel] - image.data[imageoffset + channel];
        benefit += olddifference * olddifference - newdifference * newdifference;
      }
    }
  }
  return benefit;
}

function refinecandidatecolors(candidate) {
  if (batchfitteractive) return batchfitter.refine(candidate);
  const hasbase = assethasrole(candidate.asset, "base");
  const hasdetail = assethasrole(candidate.asset, "detail");
  if (!assetneedsrolefit(candidate.asset)) {
    return {candidate, score: refinecandidate(candidate)};
  }
  const bounds = candidatebounds(candidate);
  const zero = [0, 0, 0];
  const white = [255, 255, 255];
  const baseline = rendercandidatepixels(candidate, zero, zero, bounds);
  const basewhite = hasbase ? rendercandidatepixels(candidate, white, zero, bounds) : baseline;
  const detailwhite = hasdetail ? rendercandidatepixels(candidate, zero, white, bounds) : baseline;
  const sums = Array.from({length: 3}, () => [0, 0, 0, 0, 0]);
  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    for (let x = bounds.left; x < bounds.right; x += 1) {
      const imageoffset = ((y - bounds.top) * baseline.width + x - bounds.left) * 4;
      const targetoffset = (y * target.width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const baseslope = basewhite.data[imageoffset + channel] - baseline.data[imageoffset + channel];
        const detailslope = detailwhite.data[imageoffset + channel] - baseline.data[imageoffset + channel];
        const residual = targetpixels[targetoffset + channel] - baseline.data[imageoffset + channel];
        const values = sums[channel];
        values[0] += baseslope * baseslope;
        values[1] += baseslope * detailslope;
        values[2] += detailslope * detailslope;
        values[3] += baseslope * residual;
        values[4] += detailslope * residual;
      }
    }
  }
  const levels = Number(colourslider.value);
  const baseRGB = [];
  const detailRGB = [];
  for (const [baseweight, sharedweight, detailweight, baseresidual, detailresidual] of sums) {
    const determinant = baseweight * detailweight - sharedweight * sharedweight;
    if (hasbase && hasdetail && determinant > 1e-7 * Math.max(baseweight * detailweight, 1)) {
      baseRGB.push(quantize((baseresidual * detailweight - detailresidual * sharedweight) / determinant * 255, levels));
      detailRGB.push(quantize((detailresidual * baseweight - baseresidual * sharedweight) / determinant * 255, levels));
    } else if (hasbase && !hasdetail) {
      baseRGB.push(quantize(baseweight ? baseresidual / baseweight * 255 : candidate[["red", "green", "blue"][baseRGB.length]], levels));
      detailRGB.push(candidate[["red", "green", "blue"][baseRGB.length - 1]]);
    } else if (!hasbase && hasdetail) {
      baseRGB.push(candidate[["red", "green", "blue"][baseRGB.length]]);
      detailRGB.push(quantize(detailweight ? detailresidual / detailweight * 255 : candidate[["red", "green", "blue"][baseRGB.length - 1]], levels));
    } else {
      const combinedweight = baseweight + detailweight + sharedweight * 2;
      const shared = quantize(combinedweight
        ? (baseresidual + detailresidual) / combinedweight * 255
        : candidate[["red", "green", "blue"][baseRGB.length]], levels);
      baseRGB.push(shared);
      detailRGB.push(shared);
    }
  }
  const oldRGB = [candidate.red, candidate.green, candidate.blue];
  const sharedimage = rendercandidatepixels(candidate, oldRGB, oldRGB, bounds);
  const sharedscore = colorbenefit(sharedimage, bounds);
  const roleimage = rendercandidatepixels(candidate, baseRGB, detailRGB, bounds);
  const rolescore = colorbenefit(roleimage, bounds);
  if (rolescore <= sharedscore) return {candidate, score: sharedscore};
  const refined = {...candidate, baseRGB, detailRGB};
  refined.red = Math.round((baseRGB[0] + detailRGB[0]) / 2);
  refined.green = Math.round((baseRGB[1] + detailRGB[1]) / 2);
  refined.blue = Math.round((baseRGB[2] + detailRGB[2]) / 2);
  return {candidate: refined, score: rolescore};
}

function createassetbuckets(extraoffset = 0) {
  const buckets = Array.from({length: 96}, (_, index) => index);
  const random = randomseed(extraoffset);
  for (let index = buckets.length - 1; index > 0; index -= 1) {
    const swapindex = Math.floor(random() * (index + 1));
    [buckets[index], buckets[swapindex]] = [buckets[swapindex], buckets[index]];
  }
  return buckets;
}

function chooseasset(trial, trials, random, buckets) {
  const pool = fitassetpool();
  if (buckets) {
    const bucket = buckets[trial % buckets.length];
    const index = Math.min(pool.length - 1, Math.floor((bucket + random()) * pool.length / buckets.length));
    return pool[index];
  }
  const index = Math.min(pool.length - 1, Math.floor((trial + random()) * pool.length / trials));
  return pool[index];
}

function makecandidate(focus, progress, trial, trials, random, buckets) {
  const asset = chooseasset(trial, trials, random, buckets);
  const pixelscale = 720 / target.width;
  const maximumwidth = Math.min(target.width, 3 * asset.naturalwidth / pixelscale);
  const maximumheight = Math.min(target.height, 3 * asset.naturalheight / pixelscale);
  const minimum = Math.min(target.width, target.height);
  const sizes = [1, 0.82, 0.66, 0.5, 0.38, 0.27, 0.2, 0.15];
  const base = Math.max(1.15, minimum * (0.03 + 0.17 * Math.pow(1 - progress, 1.35)) * sizes[trial % sizes.length]);
  const aspect = asset.naturalwidth / asset.naturalheight;
  const stretch = 0.62 + random() * 0.96;
  const width = Math.min(maximumwidth, Math.max(0.25, base * Math.sqrt(aspect) * stretch));
  const height = Math.min(maximumheight, Math.max(0.25, base / Math.sqrt(aspect) / stretch));
  const anglebase = [0, 0, 0, 15, -15, 30, -30, 45, -45, 60, -60, 90][Math.floor(random() * 12)];
  const angle = asset.freerotation ? anglebase + (random() - 0.5) * 8 : Math.round(anglebase / 90) * 90;
  const fastwarps = [[0, 0], [0, 18], [0, 0], [18, 0], [0, 0], [0, -18], [0, 0], [-18, 0], [0, 0], [0, 30], [0, 0], [30, 0], [0, 0], [0, -30], [-30, 0]];
  const accuratewarps = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 18], [0, -18], [0, 30], [0, -30], [18, 0], [-18, 0], [30, 0], [-30, 0]];
  const warps = trials <= 12 ? fastwarps : accuratewarps;
  const [warpx, warpy] = warpselect.value === "on" ? warps[trial % warps.length] : [0, 0];
  const jitter = Math.max(width, height) * (0.2 + random() * 0.75);
  return {
    asset,
    x: focus.x + (random() - 0.5) * jitter,
    y: focus.y + (random() - 0.5) * jitter,
    width,
    height,
    angle,
    warpx,
    warpy,
    cos: Math.cos(angle * Math.PI / 180),
    sin: Math.sin(angle * Math.PI / 180),
    red: 0,
    green: 0,
    blue: 0,
  };
}

function fallbackcandidate(focus) {
  const pixelscale = 720 / target.width;
  const maximumwidth = Math.min(target.width, 3 * defaultasset.naturalwidth / pixelscale);
  const maximumheight = Math.min(target.height, 3 * defaultasset.naturalheight / pixelscale);
  let bestcandidate = null;
  let bestscore = Number.NEGATIVE_INFINITY;
  for (const factor of [1, 0.7, 0.45, 0.25, 0.14, 0.08]) {
    const candidate = {
      asset: defaultasset,
      x: focus.x,
      y: focus.y,
      width: Math.max(0.25, maximumwidth * factor),
      height: Math.max(0.25, maximumheight * factor),
      angle: 0,
      warpx: 0,
      warpy: 0,
      red: 0,
      green: 0,
      blue: 0,
    };
    const score = refinecandidate(candidate);
    if (score > bestscore) {
      bestcandidate = candidate;
      bestscore = score;
    }
  }
  return {candidate: bestcandidate, score: bestscore};
}

async function fitadaptive(limit, trials, revision, extraoffset = 0) {
  const random = randomseed(extraoffset);
  const buckets = presetselect.value !== "fast" && trials >= 32 ? createassetbuckets(extraoffset) : null;
  const baseobjects = installunderlay(limit);
  if (batchfitteractive) batchfitter.reset(fitcoverage);
  const fitlimit = limit - baseobjects;
  const rejected = new Set();
  const retrylimit = fitretries || (presetselect.value === "detail" ? 4 : 1);
  for (let index = 0; index < fitlimit; index += 1) {
    if (revision !== fitrevision) return false;
    const focus = findfocus(rejected);
    if (focus.score < 2) break;
    let bestcandidate = null;
    let bestscore = 0;
    const progress = index / Math.max(fitlimit - 1, 1);
    for (let trial = 0; trial < trials; trial += 1) {
      const candidate = makecandidate(focus, progress, trial, trials, random, buckets);
      const score = evaluatecandidate(candidate);
      if (score > bestscore) {
        bestcandidate = candidate;
        bestscore = score;
      }
    }
    if (!bestcandidate) {
      const fallback = fallbackcandidate(focus);
      bestcandidate = fallback.candidate;
      bestscore = fallback.score;
    } else {
      bestcandidate = refinegeometry(bestcandidate);
      bestscore = refinecandidate(bestcandidate);
    }
    if (bestscore <= 0) {
      const fallback = fallbackcandidate(focus);
      bestcandidate = fallback.candidate;
      bestscore = fallback.score;
    }
    if (bestscore > 0 && assetneedsrolefit(bestcandidate.asset)) {
      const rolefit = refinecandidatecolors(bestcandidate);
      bestcandidate = rolefit.candidate;
      bestscore = rolefit.score;
    }
    if (bestscore <= 0) {
      rejected.add(Math.floor(focus.y) * target.width + Math.floor(focus.x));
      if (rejected.size >= retrylimit) break;
      index -= 1;
      continue;
    }
    rejected.clear();
    paintcandidate(bestcandidate);
    plan.push(bestcandidate);
    if (index % 4 === 3 || index + 1 === fitlimit) {
      renderstate.textContent = `SEARCH ${index + 1}/${fitlimit}`;
      await yieldfittask();
    }
  }
  return revision === fitrevision;
}

function fitgrid(limit) {
  const baseobjects = installunderlay(limit);
  const grid = gridsize(target.width, target.height, limit - baseobjects);
  const total = grid.columns * grid.rows;
  const pixelscale = 720 / target.width;
  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const left = Math.floor(column * target.width / grid.columns);
      const right = Math.max(left + 1, Math.floor((column + 1) * target.width / grid.columns));
      const top = Math.floor(row * target.height / grid.rows);
      const bottom = Math.max(top + 1, Math.floor((row + 1) * target.height / grid.rows));
      const index = row * grid.columns + column;
      const assetindex = Math.min(library.length - 1, Math.floor(index * library.length / total));
      const asset = library[assetindex];
      const candidate = {
        asset,
        x: (left + right) / 2,
        y: (top + bottom) / 2,
        width: Math.min(right - left, 3 * asset.naturalwidth / pixelscale),
        height: Math.min(bottom - top, 3 * asset.naturalheight / pixelscale),
        angle: 0,
        warpx: 0,
        warpy: 0,
      };
      refinecandidate(candidate);
      if (assetneedsrolefit(asset)) {
        Object.assign(candidate, refinecandidatecolors(candidate).candidate);
      }
      paintcandidate(candidate);
      plan.push(candidate);
    }
  }
}

function measurefittedpreview() {
  resizecanvases();
  drawsource();
  drawresult();
  return measurepreviewerror();
}

function measurepreviewerror() {
  let difference = 0;
  sourcecomparecanvas.width = resultcanvas.width;
  sourcecomparecanvas.height = resultcanvas.height;
  const comparecontext = sourcecomparecanvas.getContext("2d", {willReadFrequently: true});
  comparecontext.fillStyle = `rgb(${background.join(",")})`;
  comparecontext.fillRect(0, 0, sourcecomparecanvas.width, sourcecomparecanvas.height);
  comparecontext.imageSmoothingEnabled = true;
  comparecontext.imageSmoothingQuality = "high";
  comparecontext.drawImage(sourcecanvas, 0, 0, sourcecomparecanvas.width, sourcecomparecanvas.height);
  const source = comparecontext.getImageData(0, 0, sourcecomparecanvas.width, sourcecomparecanvas.height).data;
  const result = resultcanvas.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, resultcanvas.width, resultcanvas.height).data;
  for (let index = 0; index < source.length; index += 4) {
    difference += Math.abs(source[index] - result[index]) + Math.abs(source[index + 1] - result[index + 1]) + Math.abs(source[index + 2] - result[index + 2]);
  }
  return difference / Math.max(1, sourcecomparecanvas.width * sourcecomparecanvas.height * 765) * 100;
}

function measuretargeterror() {
  let difference = 0;
  for (let index = 0; index < targetpixels.length; index += 1) difference += Math.abs(targetpixels[index] - fittedpixels[index]);
  return difference / Math.max(1, targetpixels.length * 255) * 100;
}
