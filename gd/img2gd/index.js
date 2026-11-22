const form = document.querySelector(".controlpanel");
const imagefile = document.querySelector(".imagefile");
const dropzone = document.querySelector(".dropzone");
const dropsubtitle = document.querySelector(".dropsubtitle");
const fitmessage = document.querySelector(".fitmessage");
const examplebutton = document.querySelector(".examplebutton");
const seedsearchselect = document.querySelector(".seedsearchselect");
const coverageselect = document.querySelector(".coverageselect");
const limitslider = document.querySelector(".limitslider");
const croptoggle = document.querySelector(".croptoggleinput");
const effortslider = document.querySelector(".effortslider");
const colourslider = document.querySelector(".colourslider");
const fitselect = document.querySelector(".fitselect");
const samplerselect = document.querySelector(".samplerselect");
const legacytoggle = document.querySelector(".legacytoggleinput");
const colourmode = document.querySelector(".colourmode");
const filecaption = document.querySelector(".filecaption");
const filedimensions = document.querySelector(".filedimensions");
const stats = document.querySelector(".stats");
const previewimage = document.querySelector(".previewimage");
const previewdescription = document.querySelector(".previewdescription");
const comparison = document.querySelector(".comparison");
const swipeslider = document.querySelector(".swipeslider");
const sourcecanvas = document.querySelector(".sourcecanvas");
const resultcanvas = document.querySelector(".resultcanvas");
const sourcecomparecanvas = document.createElement("canvas");
const colorfitcanvas = document.createElement("canvas");
const previewrenderer = window.nativepreview;
const tilecount = document.querySelector(".tilecount");
const gridcount = document.querySelector(".gridcount");
const channelcount = document.querySelector(".channelcount");
const sizecount = document.querySelector(".sizecount");
const dimensionscount = document.querySelector(".dimensionscount");
const shapecount = document.querySelector(".shapecount");
const timecount = document.querySelector(".timecount");
const assetstatus = document.querySelector(".assetstatus");
const renderstate = document.querySelector(".renderstate");
const downloadlink = document.querySelector(".downloadlink");
const gdlvldownload = document.querySelector(".gdlvldownload");
const pngdownload = document.querySelector(".pngdownload");
const statuscopy = document.querySelector(".statuscopy");
const catalogversion = "img2gd-packed-1";
const uploadtypes = new Map([
  ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"],
  ["webp", "image/webp"], ["gif", "image/gif"], ["svg", "image/svg+xml"],
]);
const seedoffset = 97;
const sampleedge = 4096;
const pngscale = 0.35;
const emptyprompt = "Choose an image first!";
const levelorigin = {x: 360, y: 300};

const sourceimage = new Image();
const background = [6, 18, 40];
const startbutton = document.querySelector(".startbutton");

function objectlimit() {
  return rangevalue(limitslider);
}

function detailfit() {
  return rangevalue(effortslider) >= 75;
}

function maximumfit() {
  return rangevalue(effortslider) === 100;
}

function fittrials() {
  const effort = rangevalue(effortslider);
  return effort <= 75 ? Math.round(4 + 92 * effort / 75) : Math.round(96 + 288 * (effort - 75) / 25);
}

let imageurl = "";
let imagename = "soggycat";
let target = {width: 0, height: 0};
let targetpixels = new Uint8ClampedArray();
let fittedpixels = new Uint8ClampedArray();
let imageopaque = false;
let sampledopaque = null;
let clearborder = false;
let opacitycheck = Promise.resolve(false);
let imagerevision = 0;
let alphaready = false;
let pixelartactive = false;
let autoselectedpixelart = false;
let dominantcolor = null;
let plan = [];
let underlaycount = 0;
let underlaymessage = "";
let library = [];
let samplinglibrary = [];
let defaultasset = null;
let atlasimages = [];
let atlaspixels = [];
let spriteatlasimages = [];
let spriteatlasdimensions = [];
let backgroundtile = null;
let backgroundtilepixels = null;
let atlasready = false;
const sampledtexture = [0, 0, 0, 0];
let fitting = false;
let fitrevision = 0;
let fitreadyrevision = -1;
let fiterror = 0;
let fitstarttime;
let seedretryoffset = 0;
let batchfitter = null;
let batchfitteractive = false;
let fitpixels = 0;
let fitretries = 0;
let fitcoverage = 1;
let searchcount = 1;

function cleannumber(value, digits = 3) {
  return Number(value.toFixed(digits)).toString();
}

function quantize(value, levels) {
  // GD's RGB/HSV fields cannot reproduce channels outside the byte range.
  // Bound the solver here so its preview uses the same achievable color as the level.
  const bounded = Math.max(0, Math.min(255, value));
  if (levels >= 256) return Math.round(bounded);
  return Math.round(Math.round(bounded * (levels - 1) / 255) * 255 / (levels - 1));
}

function sourceisopaque() {
  if (sampledopaque !== null) return sampledopaque;
  const scale = 256 / Math.max(sourceimage.naturalWidth, sourceimage.naturalHeight);
  const width = Math.max(1, Math.round(sourceimage.naturalWidth * scale));
  const height = Math.max(1, Math.round(sourceimage.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.drawImage(sourceimage, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  sampledopaque = true;
  for (let offset = 3; offset < pixels.length; offset += 4) {
    if (pixels[offset] === 255) continue;
    sampledopaque = false;
    break;
  }
  return sampledopaque;
}

function targetsize(width, height, limit, opaque) {
  const ratio = width / height;
  const pixels = fitpixels || (maximumfit() && opaque
    ? 5200
    : Math.max(1600, Math.min(2000, Math.max(limit, 1) * 2.5)));
  const columns = Math.round(Math.sqrt(pixels * ratio));
  const rows = Math.round(columns / ratio);
  if (Math.min(columns, rows) >= 24 && Math.max(columns, rows) <= sampleedge) return {width: columns, height: rows};
  const aspect = Math.max(ratio, 1 / ratio);
  const short = Math.max(1, Math.min(Math.round(Math.sqrt(pixels / aspect)), Math.floor(sampleedge / aspect)));
  const long = Math.min(sampleedge, Math.round(short * aspect));
  return ratio >= 1 ? {width: long, height: short} : {width: short, height: long};
}

function previewsize() {
  if (pixelartactive) return {width: target.width, height: target.height, zoom: 1};
  const zoom = pngscale;
  const requested = Math.max(1, Math.round(720 * zoom));
  const ratio = target.height / target.width;
  const width = Math.max(1, Math.min(requested, 8192, Math.floor(8192 / ratio), Math.floor(Math.sqrt(4000000 / ratio))));
  const height = Math.max(1, Math.min(Math.round(width * ratio), Math.floor(4000000 / width)));
  return {width, height, zoom: width < requested ? width / 720 : zoom};
}

function mostcommoncolor(pixels, levels) {
  const counts = new Uint32Array(4096);
  const sums = new Float64Array(4096 * 3);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const bin = (red >> 4) * 256 + (green >> 4) * 16 + (blue >> 4);
    counts[bin] += 1;
    sums[bin * 3] += red;
    sums[bin * 3 + 1] += green;
    sums[bin * 3 + 2] += blue;
  }
  let mostcommon = 0;
  for (let bin = 1; bin < counts.length; bin += 1) {
    if (counts[bin] > counts[mostcommon]) mostcommon = bin;
  }
  const count = counts[mostcommon];
  if (!count) return null;
  return [0, 1, 2].map(channel => quantize(sums[mostcommon * 3 + channel] / count, levels));
}

function sourcecommoncolor(levels) {
  const scale = 256 / Math.max(sourceimage.naturalWidth, sourceimage.naturalHeight);
  const width = Math.max(1, Math.round(sourceimage.naturalWidth * scale));
  const height = Math.max(1, Math.round(sourceimage.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  for (let offset = 3; offset < pixels.length; offset += 4) {
    if (pixels[offset] < 255) {
      imageopaque = false;
      return null;
    }
  }
  return mostcommoncolor(pixels, levels);
}

function underlaycandidates(limit) {
  if (!imageopaque) return {candidates: [], reason: "Transparent source: underlay skipped to preserve transparency."};
  if (!dominantcolor) return {candidates: [], reason: "Could not determine a dominant source color."};
  const asset = library.find(item => item.id === 211);
  if (!asset) return {candidates: [], reason: "Rectangle object 211 is unavailable; underlay skipped."};
  if (limit < 1) return {candidates: [], reason: "Underlay needs one rectangle, more than the object limit; skipped."};
  return {candidates: [{
    asset,
    role: "underlay",
    x: target.width / 2,
    y: target.height / 2,
    width: target.width + 0.5,
    height: target.height + 0.5,
    angle: 0,
    warpx: 0,
    warpy: 0,
    red: dominantcolor[0],
    green: dominantcolor[1],
    blue: dominantcolor[2],
  }], reason: ""};
}

function installunderlay(limit) {
  plan = [];
  underlaycount = 0;
  const result = underlaycandidates(limit);
  if (!result.candidates.length) {
    underlaymessage = result.reason;
    return 0;
  }
  for (let offset = 0; offset < fittedpixels.length; offset += 3) {
    fittedpixels[offset] = dominantcolor[0];
    fittedpixels[offset + 1] = dominantcolor[1];
    fittedpixels[offset + 2] = dominantcolor[2];
  }
  for (const candidate of result.candidates) {
    paintcandidate(candidate);
    plan.push(candidate);
  }
  underlaycount = plan.length;
  underlaymessage = `Dominant-color base #${dominantcolor.map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase()}.`;
  return underlaycount;
}

function randomseed(extraoffset = 0) {
  let seed = 2166136261;
  const samplecanvas = document.createElement("canvas");
  samplecanvas.width = 64;
  samplecanvas.height = 64;
  const samplecontext = samplecanvas.getContext("2d", {willReadFrequently: true});
  samplecontext.imageSmoothingEnabled = true;
  samplecontext.imageSmoothingQuality = "high";
  samplecontext.drawImage(sourceimage, 0, 0, samplecanvas.width, samplecanvas.height);
  const fold = value => {
    seed ^= value;
    seed = Math.imul(seed, 16777619);
  };
  fold(sourceimage.naturalWidth);
  fold(sourceimage.naturalHeight);
  for (const value of samplecontext.getImageData(0, 0, samplecanvas.width, samplecanvas.height).data) fold(value);
  const next = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  for (let index = 0; index < seedoffset + extraoffset; index += 1) next();
  return next;
}

function loadlocalimage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${path}`));
    image.src = path;
  });
}

function tintbackgroundtile(image) {
  if (!image) return null;
  const tile = document.createElement("canvas");
  tile.width = image.naturalWidth;
  tile.height = image.naturalHeight;
  const context = tile.getContext("2d");
  context.drawImage(image, 0, 0);
  const source = context.getImageData(0, 0, tile.width, tile.height).data;
  backgroundtilepixels = new Float32Array(source.length);
  for (let offset = 0; offset < source.length; offset += 4) {
    const alpha = source[offset + 3] / 255;
    backgroundtilepixels[offset] = source[offset] * alpha;
    backgroundtilepixels[offset + 1] = source[offset + 1] * alpha;
    backgroundtilepixels[offset + 2] = source[offset + 2] * alpha;
    backgroundtilepixels[offset + 3] = source[offset + 3];
  }
  return tile;
}

async function ungzipjson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load native atlas metadata (${response.status})`);
  if (!("DecompressionStream" in window)) throw new Error("This browser cannot read the native atlas gzip stream");
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}

async function loadnativeatlas() {
  const asseturl = name => `assets/${name}?v=${catalogversion}`;
  const [metadata, nativeorders] = await Promise.all([
    ungzipjson(asseturl("objectatlas.gz")).then(expandatlas),
    ungzipjson(asseturl("objectorder.gz")).then(expandorders),
  ]);
  const [objectimages, spriteimages, backgroundimage] = await Promise.all([
    Promise.all(metadata.atlases.map(path => loadlocalimage(asseturl(path)))),
    Promise.all(metadata.sprites.map(path => loadlocalimage(asseturl(path)))),
    metadata.background ? loadlocalimage(asseturl(metadata.background)) : null,
  ]);
  atlasimages = objectimages;
  backgroundtile = tintbackgroundtile(backgroundimage);
  spriteatlasimages = spriteimages;
  spriteatlasdimensions = spriteimages.map(image => [image.naturalWidth, image.naturalHeight]);
  atlaspixels = atlasimages.map(image => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", {willReadFrequently: true});
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, image.width, image.height).data;
  });
  const animatedids = new Set(metadata.excluded?.animatedObjectIds || []);
  const unmodeledids = new Set(nativeorders.unresolvedids || []);
  library = metadata.objects.filter(item => !animatedids.has(item.id) && !unmodeledids.has(item.id)).map(item => {
    const [left, bottom, right, top] = item.bounds;
    return {
      ...item,
      meshorder: nativeorders.objects[String(item.id)],
      fixedonly: Boolean(item.fixedonly),
      pixels: atlaspixels[item.page],
      pagewidth: atlasimages[item.page].width,
      naturalwidth: right - left,
      naturalheight: top - bottom,
      centrex: (left + right) / 2,
      centrey: (bottom + top) / 2,
    };
  }).filter(item => item.naturalwidth > 0 && item.naturalheight > 0);
  library.sort((left, right) => left.id - right.id);
  defaultasset = library.find(item => item.id === 211) || library[0];
  const assetmap = new Map(library.map(asset => [asset.id, asset]));
  samplinglibrary = (metadata.samplingorder || library.map(asset => asset.id))
    .sort((left, right) => left - right)
    .filter(identifier => !unmodeledids.has(identifier))
    .map(identifier => {
      const asset = assetmap.get(identifier);
      if (asset) return asset;
      const omission = metadata.samplingomissions?.[String(identifier)];
      const bounds = omission?.bounds || [0, 0, 1, 1];
      return {id: identifier, samplingdisabled: true, freerotation: Boolean(omission?.freerotation),
        naturalwidth: bounds[2] - bounds[0], naturalheight: bounds[3] - bounds[1]};
    });
  if (!defaultasset) throw new Error("The native atlas has no drawable objects");
  preparetexturepools();
  atlasready = true;
  assetstatus.textContent = `ATLAS ${library.length.toLocaleString()}`;
  updatestart();
}

function preparetarget() {
  target = targetsize(sourceimage.naturalWidth, sourceimage.naturalHeight,
    objectlimit(), sourceisopaque());
  const samplecanvas = document.createElement("canvas");
  samplecanvas.width = target.width;
  samplecanvas.height = target.height;
  const context = samplecanvas.getContext("2d", {willReadFrequently: true});
  context.imageSmoothingEnabled = samplerselect.value === "average";
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, target.width, target.height);
  const sourcepixels = context.getImageData(0, 0, target.width, target.height).data;
  sourcecomparecanvas.width = target.width;
  sourcecomparecanvas.height = target.height;
  const backgroundcontext = sourcecomparecanvas.getContext("2d", {willReadFrequently: true});
  const {width: screenwidth, height: screenheight} = previewsize();
  previewrenderer.paintbackground(backgroundcontext, target.width, target.height, screenwidth,
    screenheight, backgroundtile, backgroundtilepixels, background);
  const backgroundpixels = backgroundcontext.getImageData(0, 0, target.width, target.height).data;
  const levels = Number(colourslider.value);
  imageopaque = true;
  targetpixels = new Uint8ClampedArray(target.width * target.height * 3);
  for (let index = 0; index < target.width * target.height; index += 1) {
    const offset = index * 4;
    const targetoffset = index * 3;
    const alpha = sourcepixels[offset + 3] / 255;
    if (alpha < 1) imageopaque = false;
    targetpixels[targetoffset] = quantize(sourcepixels[offset] * alpha + backgroundpixels[offset] * (1 - alpha), levels);
    targetpixels[targetoffset + 1] = quantize(sourcepixels[offset + 1] * alpha + backgroundpixels[offset + 1] * (1 - alpha), levels);
    targetpixels[targetoffset + 2] = quantize(sourcepixels[offset + 2] * alpha + backgroundpixels[offset + 2] * (1 - alpha), levels);
  }
  dominantcolor = imageopaque ? sourcecommoncolor(levels) : null;
  fittedpixels = new Uint8ClampedArray(target.width * target.height * 3);
  for (let index = 0; index < target.width * target.height; index += 1) {
    const offset = index * 3;
    const sourceoffset = index * 4;
    fittedpixels[offset] = backgroundpixels[sourceoffset];
    fittedpixels[offset + 1] = backgroundpixels[sourceoffset + 1];
    fittedpixels[offset + 2] = backgroundpixels[sourceoffset + 2];
  }
}

const overflowcanvas = previewimage.querySelector(".overflowcanvas");

function drawidlepreview(image) {
  const scale = image ? Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight)) : 1;
  resultcanvas.width = image ? Math.max(1, Math.round(image.naturalWidth * scale)) : 1280;
  resultcanvas.height = image ? Math.max(1, Math.round(image.naturalHeight * scale)) : 240;
  previewimage.style.setProperty("--previewaspect", resultcanvas.width / resultcanvas.height);
  previewimage.classList.remove("hasoverhang");
  previewimage.classList.toggle("hasalpha", Boolean(image) && !sourceisopaque());
  previewimage.classList.toggle("ispixelart", Boolean(image) && fitselect.value === "pixelart");
  previewimage.classList.toggle("isempty", !image);
  overflowcanvas.hidden = true;
  previewdescription.textContent = image ? "Source image preview" : emptyprompt;
  const context = resultcanvas.getContext("2d");
  if (image) {
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, resultcanvas.width, resultcanvas.height);
  } else {
    context.font = "64px pusab, Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.lineWidth = 6;
    context.strokeStyle = "#000";
    context.fillStyle = "#faffff";
    const {width, height} = resultcanvas;
    context.strokeText(emptyprompt, width / 2, height / 2, width - 80);
    context.fillText(emptyprompt, width / 2, height / 2, width - 80);
  }
  previewimage.hidden = false;
}

function resizecanvases() {
  const ratio = sourceimage.naturalWidth / sourceimage.naturalHeight;
  const longside = Math.max(520, Math.ceil(Math.max(ratio, 1 / ratio)));
  const size = previewsize();
  const width = pixelartactive ? size.width : ratio >= 1 ? longside : Math.max(1, Math.round(longside * ratio));
  const height = pixelartactive ? size.height : ratio >= 1 ? Math.max(1, Math.round(longside / ratio)) : longside;
  previewimage.style.setProperty("--previewaspect", size.width / size.height);
  if (resultcanvas.width !== size.width) resultcanvas.width = size.width;
  if (resultcanvas.height !== size.height) resultcanvas.height = size.height;
  if (sourcecanvas.width !== width) sourcecanvas.width = width;
  if (sourcecanvas.height !== height) sourcecanvas.height = height;
}

function previewopaque() {
  return imageopaque && sourceisopaque();
}

function drawsource(canvas = sourcecanvas) {
  if (pixelartactive) return drawpixelartsource(canvas);
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  if (canvas !== sourcecanvas || previewopaque()) {
    const screen = previewsize();
    previewrenderer.paintbackground(context, canvas.width, canvas.height, screen.width,
      screen.height, backgroundtile, backgroundtilepixels, background);
  } else context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, canvas.width, canvas.height);
}

function resultbounds(objects, width, height, scale, yoffset) {
  let left = 0, top = 0, right = width, bottom = height;
  const tolerance = 1e-8;
  for (const object of objects) {
    const bounds = cropbounds(object);
    if (Number.isFinite(bounds.left) && bounds.left < -tolerance) {
      left = Math.min(left, Math.floor(bounds.left * scale));
    }
    if (Number.isFinite(bounds.top) && bounds.top < -tolerance) {
      top = Math.min(top, Math.floor(bounds.top * scale + yoffset));
    }
    if (Number.isFinite(bounds.right) && bounds.right > target.width + tolerance) {
      right = Math.max(right, Math.ceil(bounds.right * scale));
    }
    if (Number.isFinite(bounds.bottom) && bounds.bottom > target.height + tolerance) {
      bottom = Math.max(bottom, Math.ceil(bounds.bottom * scale + yoffset));
    }
  }
  return {left, top, width: right - left, height: bottom - top};
}

function drawpreviewobjects(context, objects, scale, yoffset) {
  context.save();
  context.translate(0, yoffset);
  previewrenderer.renderpreview(context, objects, scale, scale, spriteatlasimages, spriteatlasdimensions);
  context.restore();
}

function drawoverhang(context, objects, scale, yoffset) {
  const {width, height} = resultcanvas;
  const bounds = resultbounds(objects, width, height, scale, yoffset);
  const expanded = bounds.width !== width || bounds.height !== height;
  overflowcanvas.hidden = !expanded;
  previewimage.classList.toggle("hasoverhang", expanded);
  if (!expanded) {
    if (overflowcanvas.width !== 1) overflowcanvas.width = 1;
    if (overflowcanvas.height !== 1) overflowcanvas.height = 1;
    return false;
  }

  const resolution = Math.min(1, 8192 / bounds.width, 8192 / bounds.height,
    Math.sqrt(4000000 / bounds.width / bounds.height));
  const drawwidth = Math.max(1, Math.floor(bounds.width * resolution));
  const drawheight = Math.max(1, Math.floor(bounds.height * resolution));
  if (overflowcanvas.width !== drawwidth) overflowcanvas.width = drawwidth;
  if (overflowcanvas.height !== drawheight) overflowcanvas.height = drawheight;
  previewimage.style.setProperty("--overhangx", `${100 * bounds.left / width}%`);
  previewimage.style.setProperty("--overhangy", `${100 * bounds.top / height}%`);
  previewimage.style.setProperty("--overhangwidth", bounds.width / width);
  previewimage.style.setProperty("--overhangheight", bounds.height / height);

  const display = overflowcanvas.getContext("2d");
  const drawx = drawwidth / bounds.width, drawy = drawheight / bounds.height;
  display.resetTransform();
  display.clearRect(0, 0, drawwidth, drawheight);
  display.setTransform(drawx, 0, 0, drawy, -bounds.left * drawx, -bounds.top * drawy);
  display.drawImage(resultcanvas, 0, 0);
  drawpreviewobjects(display, objects, scale, yoffset);
  if (resolution < 1) return false;

  context.save();
  context.globalCompositeOperation = "copy";
  context.drawImage(overflowcanvas, -bounds.left, -bounds.top, width, height, 0, 0, width, height);
  context.restore();
  return true;
}

function drawresult(objects = plan, canvas = resultcanvas) {
  if (pixelartactive) return drawpixelartresult(canvas, objects);
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  const onscreen = canvas === resultcanvas;
  const opaque = !onscreen || previewopaque();
  if (onscreen) previewimage.classList.toggle("hasalpha", !opaque);
  if (opaque) {
    previewrenderer.paintbackground(context, canvas.width, canvas.height, canvas.width,
      canvas.height, backgroundtile, backgroundtilepixels, background);
  } else context.clearRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / target.width;
  const yoffset = (canvas.height - target.height * scale) / 2;
  if (onscreen && drawoverhang(context, objects, scale, yoffset)) return;
  drawpreviewobjects(context, objects, scale, yoffset);
}

function hsvvalue(candidate) {
  const red = Math.min(255, candidate.red + 0.5) / 255;
  const green = Math.min(255, candidate.green + 0.5) / 255;
  const blue = Math.min(255, candidate.blue + 0.5) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta) {
    if (maximum === red) hue = ((green - blue) / delta + 6) % 6;
    else if (maximum === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue /= 6;
  }
  const saturation = maximum ? delta / maximum : 0;
  return `${cleannumber(hue * 360)}a${cleannumber(saturation, 5)}a${cleannumber(maximum, 5)}a0a0`;
}

function channelid(index) {
  return index < 999 ? index : index + 13;
}

function objectposition(candidate, pixelscale, scalex, scaley) {
  preparecandidate(candidate);
  const unwarpedx = candidate.asset.centrex * scalex;
  const unwarpedy = candidate.asset.centrey * scaley;
  const rotatedx = candidate.matrix00 * unwarpedx - candidate.matrix01 * unwarpedy;
  const rotatedy = -candidate.matrix10 * unwarpedx + candidate.matrix11 * unwarpedy;
  return {
    x: levelorigin.x + candidate.x * pixelscale - rotatedx,
    y: levelorigin.y + (target.height - candidate.y) * pixelscale - rotatedy,
  };
}

function buildsource() {
  if (legacyactive) return buildlegacysource();
  const colors = new Map();
  const colorlines = ["1_6_2_18_3_40_6_1000_7_1", "1_6_2_18_3_40_6_1001_7_1", "1_255_2_255_3_255_6_1004_7_1"];
  const hsvmode = colourmode.value === "hsv";
  let redchannel = hsvmode;
  function colorchannel(rgb) {
    const key = rgb.join(",");
    if (!colors.has(key)) {
      const channel = channelid(colors.size + 1);
      if (channel > 1101) {
        redchannel = true;
        return 999;
      }
      colors.set(key, channel);
      colorlines.push(`1_${rgb[0]}_2_${rgb[1]}_3_${rgb[2]}_4_-1_6_${channel}_7_1`);
    }
    return colors.get(key);
  }
  const pixelscale = 720 / Math.max(target.width, 1);
  const parts = [];
  const helpers = visibilityobjects();
  const opacitygroups = new Map();
  for (let index = 0; index < plan.length; index += 1) {
    const candidate = plan[index];
    const tint = [candidate.red, candidate.green, candidate.blue];
    let base = candidate.baseRGB || tint;
    let detail = candidate.detailRGB || tint;
    let basechannel = 1004;
    let detailchannel = 1004;
    if (hsvmode) {
      basechannel = 999;
      detailchannel = 999;
    } else if (!candidate.asset.fixedonly) {
      const hasbase = assethasrole(candidate.asset, "base");
      const hasdetail = assethasrole(candidate.asset, "detail");
      if (!hasdetail) detail = base;
      else if (!hasbase) base = detail;
      basechannel = colorchannel(base);
      detailchannel = colorchannel(detail);
    }
    candidate.channel = basechannel;
    const macro = candidate.role === "underlay" || candidate.macro && macroassets.has(candidate.asset.id);
    const scalex = macro ? candidate.width * pixelscale / candidate.asset.naturalwidth
      : Math.min(3, candidate.width * pixelscale / candidate.asset.naturalwidth);
    const scaley = macro ? candidate.height * pixelscale / candidate.asset.naturalheight
      : Math.min(3, candidate.height * pixelscale / candidate.asset.naturalheight);
    const position = objectposition(candidate, pixelscale, scalex, scaley);
    const warpx = Number(cleannumber(candidate.warpx || 0));
    const warpy = Number(cleannumber(candidate.warpy || 0));
    const angle = warpx === warpy && warpx ? warpx : candidate.angle;
    const layer = candidate.zlayer ?? (candidate.role === "underlay" ? 3 : 5);
    const precision = pixelartactive ? 6 : 3;
    const fields = [
      "1", candidate.asset.id, "2", cleannumber(position.x, precision), "3", cleannumber(position.y, precision),
      "20", "5", "21", basechannel, "22", detailchannel,
      "96", "1", "64", "1", "67", "1", "121", "1", "24", layer, "25", index + 1,
      "128", cleannumber(scalex, precision), "129", cleannumber(scaley, precision), "6", cleannumber(angle),
    ];
    if (warpx !== warpy) {
      if (warpy) fields.push("131", cleannumber(warpy));
      if (warpx) fields.push("132", cleannumber(warpx));
    }
    if (basechannel === 999) fields.push("41", "1");
    if (detailchannel === 999) fields.push("42", "1");
    if (basechannel === 999) {
      candidate.basehsv = hsvvalue({red: base[0], green: base[1], blue: base[2]});
      fields.push("43", candidate.basehsv);
    }
    if (detailchannel === 999) {
      candidate.detailhsv = hsvvalue({red: detail[0], green: detail[1], blue: detail[2]});
      fields.push("44", candidate.detailhsv);
    }
    for (const [key, value] of Object.entries(candidate.asset.gmdfields || {})) fields.push(key, value);
    const groups = helpers.length ? ["5001"] : [];
    const alpha = opacitybyte(candidate);
    if (alpha < 255) {
      const group = 5002 + alpha;
      groups.push(group);
      opacitygroups.set(group, alpha);
    }
    if (groups.length) fields.push("57", groups.join("."));
    fields.push("372", "1");
    parts.push(fields.join(","));
  }
  if (redchannel) colorlines.push("1_255_2_0_3_0_4_-1_6_999_7_1");
  const opacityhelpers = opacitygroups.size;
  for (const [group, alpha] of opacitygroups) {
    const opacity = pixelartactive ? pixelartopacity(alpha) : exportedopacity(alpha);
    helpers.push(["1", "1007", "2", "15", "3", "120", "10", "0", "35", opacity, "51", group].join(","));
  }
  const header = ["kA2", "0", "kA3", "0", "kA4", "0", "kA6", "1", "kA7", "1", "kA8", "0", "kA9", "0", "kA10", "0", "kA11", "0", "kA13", "0", "kA22", "0", "kA40", "1", "kS38", `${colorlines.join("|")}|`];
  return {raw: `${header.join(",")};${[...parts, ...helpers].join(";")};`,
    channels: colors.size + Number(redchannel), overflow: redchannel && !hsvmode,
    objects: parts.length + helpers.length, helpers: helpers.length, opacityhelpers};
}

function levelname() {
  const name = imagename.replace(/\.[^/.]+$/, "").trim();
  return name || "Image mosaic";
}

function enableexport(link, blob, filename) {
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.removeAttribute("aria-disabled");
}

function invalidateexports() {
  for (const link of [downloadlink, gdlvldownload, pngdownload]) {
    const url = link.getAttribute("href");
    if (url) URL.revokeObjectURL(url);
    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
  }
}

function updatestat(element, value) {
  element.textContent = value;
  element.parentElement.toggleAttribute("data-empty", value === "--");
}

function clearlivevalues() {
  for (const value of [tilecount, gridcount, channelcount, sizecount, shapecount, timecount]) {
    updatestat(value, "--");
  }
}

function prettysize(bytes) {
  return bytes < 1024 ? bytes + "b" : (bytes / 1024).toFixed(1) + "kb";
}

function updatestart() {
  startbutton.disabled = fitting || !atlasready || !alphaready || !validrangevalues();
}

function updatefields() {
  const exact = fitselect.value === "pixelart";
  const textures = !exact && !legacytoggle.checked && fitselect.value !== "regions" && !regionfitactive;
  seedsearchselect.disabled = !textures || !maximumfit();
  coverageselect.disabled = !textures || !detailfit();
  samplerselect.disabled = exact;
  croptoggle.disabled = exact || legacytoggle.checked || clearborder;
  for (const slider of [limitslider, effortslider, colourslider]) {
    slider.disabled = exact;
    slider.parentElement.querySelector(".rangevalueeditor").disabled = exact;
  }
  updateoptions();
  updatestart();
}

async function updatepreview() {
  if (fitreadyrevision !== fitrevision) return;
  resizecanvases();
  drawsource();
  drawresult();
  fiterror = measurepreviewerror();
  const result = buildsource();
  invalidateexports();
  const name = levelname();
  const level = new Blob([gmddocument(result.raw, name, legacyactive)], {type: "application/xml"});
  updatestat(tilecount, result.objects.toLocaleString());
  updatestat(gridcount, fiterror.toFixed(1) + "%");
  updatestat(channelcount, result.channels.toLocaleString());
  updatestat(sizecount, prettysize(level.size));
  updatestat(shapecount, new Set(plan.map(object => object.asset.id)).size.toLocaleString());
  renderstate.textContent = pixelartactive ? "PIXEL ART" : "SPRITE FIT";
  statuscopy.textContent = "Preparing files...";
  document.querySelector(".exportlinks").title = visibilitywarning().trim();
  comparison.hidden = false;
  previewdescription.textContent = "Generated image preview";
  enableexport(downloadlink, level, name + ".gmd");
  await prepareexports(result.raw, name);
  if (fitreadyrevision === fitrevision && fitstarttime !== undefined) {
    updatestat(timecount, ((performance.now() - fitstarttime) / 1000).toFixed(1) + "s");
  }
}

async function startfit() {
  if (startbutton.disabled) return;
  const revision = ++fitrevision;
  fitting = true;
  pixelartactive = false;
  legacyactive = false;
  regionfitactive = false;
  previewimage.classList.remove("ispixelart");
  fitstarttime = performance.now();
  fitmessage.textContent = "";
  if (advanceddialog.open) advanceddialog.close();
  form.inert = true;
  advancedopen.disabled = true;
  comparison.hidden = true;
  stats.hidden = false;
  channelcount.parentElement.hidden = colourmode.value === "hsv";
  clearlivevalues();
  updatestat(dimensionscount, sourceimage.naturalWidth + "x" + sourceimage.naturalHeight);
  invalidateexports();
  renderstate.textContent = "FITTING";
  seedretryoffset = 0;
  updatestart();

  try {
    if (legacytoggle.checked) {
      if (!await fitlegacy(revision)) return;
    } else if (fitselect.value === "pixelart") {
      if (!await fitpixelart(revision)) return;
    } else {
      const limit = objectlimit();
      if (!await runfitsearch(limit, fittrials(), revision)) return;
      if (!await finishcrop(revision, limit)) return;
    }
    fitreadyrevision = revision;
    await updatepreview();
  } catch (error) {
    renderstate.textContent = "ERROR";
    fitmessage.textContent = "Image fit failed.";
    console.error(error);
  } finally {
    statuscopy.textContent = "";
    fitting = false;
    form.inert = false;
    advancedopen.disabled = false;
    updatefields();
  }
}

function loadimage(url, name) {
  fitrevision += 1;
  imagerevision += 1;
  comparison.hidden = true;
  stats.hidden = true;
  swipeslider.value = "50";
  updateswipe();
  resetpreviewview();
  clearlivevalues();
  previewimage.hidden = true;
  previewimage.classList.remove("ispixelart");
  pixelartactive = false;
  legacyactive = false;
  regionfitactive = false;
  if (advanceddialog.open) advanceddialog.close();
  sampledopaque = null;
  clearborder = false;
  alphaready = false;
  fitmessage.textContent = "";
  if (imageurl) URL.revokeObjectURL(imageurl);
  imageurl = url.startsWith("blob:") ? url : "";
  imagename = name;
  dropsubtitle.textContent = "";
  sourceimage.src = url;
  filecaption.textContent = name;
  dropzone.title = name;
  filedimensions.hidden = true;
  updatefields();
  invalidateexports();
  renderstate.textContent = "LOADING";
}

function loadupload(files) {
  if (!files.length) return;
  for (const file of files) {
    const extension = file.name.match(/\.([a-z]+)$/i)?.[1].toLowerCase();
    const type = file.type.startsWith("image/") ? file.type : uploadtypes.get(extension);
    if (type) {
      const image = type === file.type ? file : file.slice(0, file.size, type);
      loadimage(URL.createObjectURL(image), file.name);
      return;
    }
  }
  dropsubtitle.textContent = "Unsupported image type.";
}

async function prepareexports(raw, name) {
  const revision = fitrevision;
  const zoom = cleannumber(previewsize().zoom);
  const png = new Promise(resolve => resultcanvas.toBlob(resolve, "image/png"));
  const [image, level] = await Promise.allSettled([png, gdlvldocument(raw, name)]);
  if (revision !== fitrevision) return;
  if (image.status === "fulfilled" && image.value) enableexport(pngdownload, image.value, name + "-fit-" + zoom + "x.png");
  else fitmessage.textContent = "PNG export failed.";
  if (level.status === "fulfilled") {
    enableexport(gdlvldownload, new Blob([level.value], {type: "application/octet-stream"}), name + ".gdlvl");
  } else fitmessage.textContent = "GDLVL export failed.";
}

const advanceddialog = document.querySelector(".advanceddialog");
const advancedopen = document.querySelector(".advancedopen");

function showdialog(dialog) {
  if (dialog.open) return;
  dialog.showModal();
  const keyframes = Array.from({length: 121}, (_, frame) => {
    const time = frame / 120;
    const scale = time === 1 ? 1 : 1 - .9 * 2 ** (-10 * time) * Math.cos(time * 2 * Math.PI / .6);
    return {scale: String(scale)};
  });
  const motion = dialog.animate(keyframes, 500);
  dialog.addEventListener("close", () => motion.cancel(), {once: true});
}

advancedopen.addEventListener("click", () => showdialog(advanceddialog));

document.querySelectorAll(".dialogclose").forEach(button => {
  button.addEventListener("click", () => button.closest(".appdialog").close());
});

sourceimage.addEventListener("load", async () => {
  const revision = ++imagerevision;
  sampledopaque = null;
  filedimensions.textContent = "(" + sourceimage.naturalWidth + "x" + sourceimage.naturalHeight + ")";
  filedimensions.hidden = false;
  dropzone.title = imagename + " " + filedimensions.textContent;
  const aspect = sourceimage.naturalWidth / sourceimage.naturalHeight;
  if (Math.max(aspect, 1 / aspect) > sampleedge) {
    drawidlepreview();
    dropsubtitle.textContent = "Image is too narrow or tall.";
    renderstate.textContent = "ERROR";
    return;
  }
  if (fitselect.value === "auto" || autoselectedpixelart) {
    autoselectedpixelart = sourceimage.naturalWidth < 150 && sourceimage.naturalHeight < 150;
    fitselect.value = autoselectedpixelart ? "pixelart" : "auto";
  }
  drawidlepreview(sourceimage);
  clearborder = cropclearborder(sourceimage);
  updatefields();
  opacitycheck = sourceisopaque() ? cropopaque(sourceimage, () => revision === imagerevision) : Promise.resolve(false);
  const opaque = await opacitycheck;
  if (revision !== imagerevision) return;
  sampledopaque = opaque;
  previewimage.classList.toggle("hasalpha", !opaque);
  alphaready = true;
  updatestart();
});

sourceimage.addEventListener("error", () => {
  filedimensions.hidden = true;
  drawidlepreview();
  dropsubtitle.textContent = "Could not read image.";
  renderstate.textContent = "ERROR";
  updatestart();
});

imagefile.addEventListener("change", () => {
  loadupload(imagefile.files);
  imagefile.value = "";
});

examplebutton.addEventListener("click", () => loadimage("assets/soggycat.jpg", "soggycat.jpg"));

form.addEventListener("rangevaluechange", updatefields);
form.addEventListener("change", event => {
  if (!event.target.matches("select, .croptoggleinput, .legacytoggleinput")) return;
  regionfitactive = false;
  if (event.target === fitselect) {
    autoselectedpixelart = false;
    if (fitselect.value === "regions") coverageselect.value = "2";
    if (alphaready && fitreadyrevision !== fitrevision) {
      previewimage.classList.toggle("ispixelart", fitselect.value === "pixelart");
    }
  }
  updatefields();
});
form.addEventListener("submit", event => {
  event.preventDefault();
  startfit();
});
window.addEventListener("nativepreviewrestored", () => {
  if (fitreadyrevision === fitrevision) drawresult();
});

updatefields();
drawidlepreview();
document.fonts.load("64px pusab").then(() => {
  if (!previewimage.hidden && previewimage.classList.contains("isempty")) drawidlepreview();
}).catch(() => {});
loadnativeatlas().catch(error => {
  assetstatus.textContent = "ATLAS ERROR";
  renderstate.textContent = "ERROR";
  fitmessage.textContent = "Object library failed.";
  fitmessage.title = error.message;
});
