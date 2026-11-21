function photoproject(shapes, width, height) {
  const sx = target.width / width, sy = target.height / height;
  return shapes.map(object => ({...object, x: object.x * sx, y: object.y * sy, width: object.width * sx, height: object.height * sy}));
}

async function photobase(limit, revision) {
  if (limit < 50 || limit > 500 || fitselect.value !== "auto" || !imageopaque) return null;
  if (!await opacitycheck || revision !== fitrevision) return null;
  const scale = Math.min(144, Math.max(96, Math.sqrt(limit) * 6.5)) / Math.max(target.width, target.height);
  const width = Math.max(1, Math.round(target.width * scale));
  const height = Math.max(1, Math.round(target.height * scale));
  if (Math.min(width, height) < 10) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.imageSmoothingEnabled = samplerselect.value === "average";
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, width, height);
  const source = context.getImageData(0, 0, width, height).data;
  const current = () => revision === fitrevision;
  const preview = objects => showfitprogress(revision, () => photoproject(objects, width, height));
  const paint = await photopaint(source, width, height, limit - visibilitycost, current, preview);
  return paint && current() ? {width, height, paint, limit} : null;
}

/*//////////////////////////////////////////////////////////////////////*/

function photogradienterror(source, rendered, width, height) {
  const residual = new Int16Array(width * height);
  for (let i = 0; i < residual.length; i += 1) {
    const at = i * 4;
    residual[i] = source[at] - rendered[at] + 2 * (source[at + 1] - rendered[at + 1]) + source[at + 2] - rendered[at + 2];
  }
  let error = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      error += Math.abs(residual[i + 1] - residual[i - 1]) + Math.abs(residual[i + width] - residual[i - width]);
    }
  }
  return error;
}

function photocoarseerror(source, rendered, width, height, size) {
  let error = 0;
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const bottom = Math.min(height, y + size), right = Math.min(width, x + size);
      let red = 0, green = 0, blue = 0;
      for (let row = y; row < bottom; row += 1) {
        for (let col = x; col < right; col += 1) {
          const p = 4 * (row * width + col);
          red += source[p] - rendered[p];
          green += source[p + 1] - rendered[p + 1];
          blue += source[p + 2] - rendered[p + 2];
        }
      }
      error += Math.abs(red) + Math.abs(green) + Math.abs(blue);
    }
  }
  return 100 * error / (width * height * 765);
}

function photopaintscore(source, pixels, width, height, color) {
  const coarse = Math.max(2, Math.ceil(Math.max(width, height) / 26));
  const tone = photocoarseerror(source, pixels, width, height, coarse);
  const texture = 100 * photogradienterror(source, pixels, width, height) / (width * height * 2040);
  return color + 1.3 * tone + 0.5 * texture;
}

function comparephotobase(proposal, revision) {
  if (!proposal || revision !== fitrevision) return false;
  const {width, height} = previewsize();
  if (width * height > 400000) return false;
  const paint = photoproject(proposal.paint, proposal.width, proposal.height);
  const helpers = opacitycost(paint) + (visibilityrequired(paint) ? visibilitycost : 0);
  if (paint.length + helpers > proposal.limit) return false;
  const original = plan;
  const score = measurefittedpreview();
  const source = contourpixels(sourcecomparecanvas, width, height);
  const originalpx = contourpixels(resultcanvas, width, height);
  const originalscore = photopaintscore(source, originalpx, width, height, score);
  let accepted = false;
  try {
    plan = paint;
    drawresult();
    const color = measurepreviewerror();
    const pixels = contourpixels(resultcanvas, width, height);
    accepted = color <= score * 1.08 && photopaintscore(source, pixels, width, height, color) < originalscore;
    return accepted;
  } finally {
    if (!accepted) {plan = original; drawresult();}
  }
}
