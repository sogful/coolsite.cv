function budgetruns(objects, analysis, room) {
  const asset = library.find(item => item.id === 495);
  if (!asset || room < 16) return objects;
  const {context, pixels} = analysis;
  const {width, height} = context.canvas;
  const scalex = width / target.width, scaley = height / target.height;
  context.clearRect(0, 0, width, height);
  previewrenderer.renderpreview(context, objects, scalex, scaley, spriteatlasimages, spriteatlasdimensions);
  const rendered = context.getImageData(0, 0, width, height).data;
  const candidates = [];
  const levels = Number(colourslider.value);
  const distance = (start, end) => Math.abs(pixels[start] - pixels[end])
    + Math.abs(pixels[start + 1] - pixels[end + 1]) + Math.abs(pixels[start + 2] - pixels[end + 2]);

  for (const vertical of [false, true]) {
    const lanes = vertical ? width : height, length = vertical ? height : width;
    const along = vertical ? width * 4 : 4, across = vertical ? 4 : width * 4;
    for (let lane = 1; lane + 1 < lanes; lane += 1) {
      let start = 0;
      while (start < length) {
        const first = lane * across + start * along;
        if (Math.min(distance(first, first - across), distance(first, first + across)) < 42) {
          start += 1;
          continue;
        }
        let end = start + 1;
        while (end < length) {
          const at = lane * across + end * along;
          if (distance(at, first) > 28 || Math.min(distance(at, at - across), distance(at, at + across)) < 42) break;
          end += 1;
        }
        if (end - start >= 3) {
          const color = [0, 0, 0];
          for (let step = start; step < end; step += 1) {
            const at = lane * across + step * along;
            for (let c = 0; c < 3; c += 1) color[c] += pixels[at + c];
          }
          const run = {first, along, lane, vertical, start, length: end - start,
            color: color.map(value => quantize(value / (end - start), levels))};
          candidates.push(run);
        }
        start = end;
      }
    }
  }

  function gain(run, apply = false) {
    let result = 0;
    for (let step = 0; step < run.length; step += 1) {
      const at = run.first + step * run.along;
      for (let c = 0; c < 3; c += 1) {
        result += Math.abs(rendered[at + c] - pixels[at + c]) - Math.abs(run.color[c] - pixels[at + c]);
        if (apply) rendered[at + c] = run.color[c];
      }
    }
    return result;
  }
  for (const run of candidates) run.gain = gain(run);
  candidates.sort((a, b) => b.gain - a.gain);
  const result = objects.slice();
  const limit = result.length + Math.min(48, Math.floor(room / 6));
  for (const run of candidates) {
    if (result.length >= limit || run.gain < 60) break;
    if (gain(run) < 60) continue;
    gain(run, true);
    const {vertical, lane, start, length, color: [red, green, blue]} = run;
    result.push({asset, red, green, blue, angle: 0, zlayer: 7, macro: true,
      x: (vertical ? lane + 0.5 : start + length / 2) / scalex,
      y: (vertical ? start + length / 2 : lane + 0.5) / scaley,
      width: (vertical ? 1 : length) / scalex, height: (vertical ? length : 1) / scaley});
  }
  return result;
}

/*//////////////////////////////////////////////////////////////////////*/

async function spendfitbudget(limit, revision) {
  if (underbudget.checked) return true;
  const budget = limit - visibilitycost * Number(visibilityrequired(plan));
  const room = budget - plan.length - opacitycost(plan);
  if (room <= 0) return true;
  const {naturalWidth: width, naturalHeight: height} = sourceimage;
  const scale = Math.min(1, 1024 / Math.max(width, height), Math.sqrt(160000 / (width * height)));
  const sample = factor => transparentsource({width: Math.max(1, Math.round(width * scale * factor)),
    height: Math.max(1, Math.round(height * scale * factor))});
  const analysis = sample(1);
  const opaque = sourceisopaque();
  const original = plan;
  const crop = croptoggle.checked && !croptoggle.disabled;
  const clip = objects => {
    if (!objects || !crop) return objects;
    const additions = objects.slice(original.length).map(object => cropvalid(object) ? object
      : cropaffine(object, cropbounds(object), cropmargin(object), 0));
    return [...original, ...additions.filter(Boolean)];
  };
  statuscopy.textContent = "Fitting details...";
  const base = opaque ? clip(budgetruns(original, analysis, room)) : original;
  const available = limit - visibilitycost * Number(visibilityrequired(base));
  const result = await filltransparentdetails(base, analysis, available, revision);
  if (!result || revision !== fitrevision) return false;
  const detailed = clip(result);
  const fits = objects => objects.length + opacitycost(objects) + visibilitycost * Number(visibilityrequired(objects)) <= limit;
  const reference = transparentpremultiply(analysis.pixels);
  const score = objects => {
    const {context} = analysis;
    const {width, height} = context.canvas;
    context.clearRect(0, 0, width, height);
    previewrenderer.renderpreview(context, objects, width / target.width, height / target.height, spriteatlasimages, spriteatlasdimensions);
    const pixels = transparentpremultiply(context.getImageData(0, 0, width, height).data);
    let error = 0;
    for (let at = 0; at < reference.length; at += 4) error += transparentpixelerror(reference, pixels, at);
    return error;
  };
  let best = score(plan);
  if (fits(detailed)) {
    const error = score(detailed);
    if (error < best) {
      best = error;
      plan = detailed;
      rememberfit(plan);
    }
  }
  if (opaque && detailfit() && room >= 32) {
    const result = await filltransparentdetails(base, sample(0.7), available, revision);
    if (!result || revision !== fitrevision) return false;
    const alternative = clip(result);
    if (fits(alternative) && score(alternative) < best) {
      plan = alternative;
      rememberfit(plan);
    }
  }
  return true;
}
