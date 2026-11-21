const form = document.querySelector(".controlpanel");
const imagefile = document.querySelector(".imagefile");
const dropzone = document.querySelector(".dropzone");
const dropsubtitle = document.querySelector(".dropsubtitle");
const browsehint = dropsubtitle.textContent;
const examplebutton = document.querySelector(".examplebutton");
const presetselect = document.querySelector(".presetselect");
const seedsearchfield = document.querySelector(".seedsearchfield");
const seedsearchselect = document.querySelector(".seedsearchselect");
const coverageselect = document.querySelector(".coverageselect");
const limitslider = document.querySelector(".limitslider");
const underlaytoggle = document.querySelector(".underlaytoggleinput");
const croptoggle = document.querySelector(".croptoggleinput");
const underlaystyle = document.querySelector(".underlaystyle");
const trialslider = document.querySelector(".trialslider");
const colourslider = document.querySelector(".colourslider");
const fitselect = document.querySelector(".fitselect");
const samplerselect = document.querySelector(".samplerselect");
const warpselect = document.querySelector(".warpselect");
const colourmode = document.querySelector(".colourmode");
const previewzoomslider = document.querySelector(".previewzoomslider");
const previewzoomvalue = document.querySelector(".previewzoomvalue");
const previewzoomhelp = document.querySelector(".previewzoomhelp");
const limitvalue = document.querySelector(".limitvalue");
const trialvalue = document.querySelector(".trialvalue");
const colourvalue = document.querySelector(".colourvalue");
const sourcename = document.querySelector(".sourcename");
const sourcecanvas = document.querySelector(".sourcecanvas");
const resultcanvas = document.querySelector(".resultcanvas");
const sourcecomparecanvas = document.createElement("canvas");
const colorfitcanvas = document.createElement("canvas");
const previewrenderer = window.nativepreview;
const tilecount = document.querySelector(".tilecount");
const gridcount = document.querySelector(".gridcount");
const channelcount = document.querySelector(".channelcount");
const sizecount = document.querySelector(".sizecount");
const assetstatus = document.querySelector(".assetstatus");
const renderstate = document.querySelector(".renderstate");
const downloadlink = document.querySelector(".downloadlink");
const gdlvldownload = document.querySelector(".gdlvldownload");
const pngdownload = document.querySelector(".pngdownload");
const statuscopy = document.querySelector(".statuscopy");
const cataloggrid = document.querySelector(".cataloggrid");
const catalogsearch = document.querySelector(".catalogsearch");
const catalogcount = document.querySelector(".catalogcount");
const catalogintro = document.querySelector(".catalogintro");
const catalogheading = document.querySelector(".catalogheading");
const catalogmore = document.querySelector(".catalogmore");
const catalogversion = "img2gd-native-batches-20261028-23";
const uploadtypes = new Map([
  ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"],
  ["webp", "image/webp"], ["gif", "image/gif"], ["svg", "image/svg+xml"],
]);
const seedoffset = 97;
const sampleedge = 4096;
const levelorigin = {x: 360, y: 300};

const sourceimage = new Image();
const background = [6, 18, 40];
const presetdata = {
  fast: {limit: 250, trials: 12, colours: 32, fit: "auto", sampler: "average", underlay: true, coverage: 1},
  balanced: {limit: 800, trials: 40, colours: 128, fit: "auto", sampler: "average", underlay: true, coverage: 1},
  detail: {limit: 1500, trials: 96, colours: 256, fit: "auto", sampler: "average", underlay: true, coverage: 1},
  max: {limit: 1500, trials: 384, colours: 256, fit: "auto", sampler: "average", underlay: false, coverage: 2},
};

let imageurl = "";
let imagename = "soggycat";
let target = {width: 0, height: 0};
let targetpixels = new Uint8ClampedArray();
let fittedpixels = new Uint8ClampedArray();
let imageopaque = false;
let sampledopaque = null;
let opacitycheck = Promise.resolve(false);
let imagerevision = 0;
let alphaready = false;
let originalplan = [];
let croppedplan = null;
let originalrevision = -1;
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
let catalogresults = [];
const cataloguses = new Map();
let atlasready = false;
let cataloglimit = 72;
const sampledtexture = [0, 0, 0, 0];
let levelsource = "";
let levelraw = "";
let currentdownload = "";
let currentgdlvldownload = "";
let currentpngdownload = "";
let exportversion = 0;
let pngversion = 0;
let refreshid = 0;
let fitrevision = 0;
let fitreadyrevision = -1;
let fiterror = 0;
let seedretryoffset = 0;
let fittime = 0;
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
  const pixels = fitpixels || (presetselect.value === "max" && opaque
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
  const zoom = Number(previewzoomslider.value);
  const requested = Math.max(1, Math.round(720 * zoom));
  const ratio = target.height / target.width;
  const width = Math.max(1, Math.min(requested, 8192, Math.floor(8192 / ratio), Math.floor(Math.sqrt(4000000 / ratio))));
  const height = Math.max(1, Math.min(Math.round(width * ratio), Math.floor(4000000 / width)));
  return {width, height, limited: width < requested, zoom: width < requested ? width / 720 : zoom};
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
  if (!underlaytoggle.checked) return {candidates: [], reason: "Dominant-color underlay is off."};
  if (!imageopaque) return {candidates: [], reason: "Transparent source: underlay skipped to preserve transparency."};
  if (!dominantcolor) return {candidates: [], reason: "Could not determine a dominant source color."};
  const asset = library.find(item => item.id === 211);
  if (!asset) return {candidates: [], reason: "Rectangle object 211 is unavailable; underlay skipped."};
  if (underlaystyle.value === "single") {
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
  const pixelscale = 720 / target.width;
  const maximumwidth = 3 * asset.naturalwidth / pixelscale;
  const maximumheight = 3 * asset.naturalheight / pixelscale;
  const columns = Math.max(1, Math.ceil(target.width / Math.max(1, maximumwidth - 1)));
  const rows = Math.max(1, Math.ceil(target.height / Math.max(1, maximumheight - 1)));
  const count = columns * rows;
  if (count > limit) {
    return {candidates: [], reason: `Underlay needs ${count} tiles, more than the ${limit}-object limit; skipped.`};
  }
  const cellwidth = target.width / columns;
  const cellheight = target.height / rows;
  const candidates = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = column * cellwidth;
      const top = row * cellheight;
      candidates.push({
        asset,
        role: "underlay",
        x: left + cellwidth / 2,
        y: top + cellheight / 2,
        width: Math.min(maximumwidth, cellwidth + 0.5),
        height: Math.min(maximumheight, cellheight + 0.5),
        angle: 0,
        warpx: 0,
        warpy: 0,
        red: dominantcolor[0],
        green: dominantcolor[1],
        blue: dominantcolor[2],
      });
    }
  }
  return {candidates, reason: ""};
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

function gridsize(width, height, limit) {
  if (!limit || !width || !height) return {columns: 0, rows: 0};
  const ratio = width / height;
  let columns = Math.max(1, Math.round(Math.sqrt(limit * ratio)));
  let rows = Math.max(1, Math.floor(limit / columns));
  while ((columns + 1) * rows <= limit && Math.abs((columns + 1) / rows - ratio) < Math.abs(columns / rows - ratio)) columns += 1;
  while (columns * (rows + 1) <= limit && Math.abs(columns / (rows + 1) - ratio) < Math.abs(columns / rows - ratio)) rows += 1;
  return {columns, rows};
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
  const metadata = await ungzipjson(`assets/atlas/gd-object-atlas.json.gz?v=${catalogversion}`);
  const [objectimages, spritepackage, backgroundimage, nativeorders] = await Promise.all([
    Promise.all(metadata.atlases.map(path => loadlocalimage(`assets/atlas/${path}?v=${catalogversion}`))),
    ungzipjson(`assets/atlas/${metadata.spriteArchive}?v=${catalogversion}`),
    metadata.background ? loadlocalimage(`assets/atlas/${metadata.background}?v=${catalogversion}`) : Promise.resolve(null),
    ungzipjson(`assets/atlas/gd-object-native-orders.json.gz?v=${catalogversion}`),
  ]);
  atlasimages = objectimages;
  backgroundtile = tintbackgroundtile(backgroundimage);
  spriteatlasdimensions = spritepackage.pages.map(page => [page.width, page.height]);
  spriteatlasimages = await Promise.all(spritepackage.pages.map(page =>
    loadlocalimage(`data:image/png;base64,${page.data}`)));
  spritepackage.pages.forEach(page => { page.data = ""; });
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
  catalogheading.textContent = `${library.length.toLocaleString()} stable native object visuals`;
  catalogintro.textContent = "Search by object ID, dimensions or sprite count.";
  rendercatalog(true);
  schedulepreview();
}

function catalogdescription(asset) {
  const uses = cataloguses.get(asset.id) || 0;
  return `${Math.round(asset.naturalwidth)} × ${Math.round(asset.naturalheight)} · ${asset.spritecount} sprite${asset.spritecount === 1 ? "" : "s"}${uses ? ` · used ${uses}×` : ""}`;
}

function catalogmatches(asset, query) {
  if (!query) return true;
  return `${asset.id} ${asset.naturalwidth} ${asset.naturalheight} ${asset.spritecount} ${asset.content}`.toLowerCase().includes(query);
}

function makecatalogcard(asset) {
  const card = document.createElement("article");
  card.className = "catalogcard";
  const thumb = document.createElement("canvas");
  thumb.className = "catalogthumb";
  thumb.width = 176;
  thumb.height = 72;
  const context = thumb.getContext("2d");
  const [left, top, width, height] = asset.source;
  const scale = Math.min(156 / width, 54 / height);
  const drawwidth = width * scale;
  const drawheight = height * scale;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(atlasimages[asset.page], left, top, width, height,
    (thumb.width - drawwidth) / 2, (thumb.height - drawheight) / 2, drawwidth, drawheight);
  const id = document.createElement("span");
  id.className = "catalogid";
  id.textContent = `OBJECT ${asset.id}`;
  const meta = document.createElement("span");
  meta.className = "catalogmeta";
  meta.textContent = catalogdescription(asset);
  card.append(thumb, id, meta);
  return card;
}

function rendercatalog(reset = false) {
  if (!atlasready || !cataloggrid) return;
  if (reset) {
    const query = catalogsearch.value.trim().toLowerCase();
    catalogresults = library.filter(asset => catalogmatches(asset, query));
    cataloglimit = Math.min(72, catalogresults.length);
    cataloggrid.replaceChildren();
  }
  const existing = cataloggrid.childElementCount;
  for (const asset of catalogresults.slice(existing, cataloglimit)) cataloggrid.append(makecatalogcard(asset));
  catalogcount.textContent = catalogresults.length === library.length
    ? `${library.length.toLocaleString()} native object IDs · showing ${Math.min(cataloglimit, catalogresults.length).toLocaleString()}`
    : `${catalogresults.length.toLocaleString()} matches · showing ${Math.min(cataloglimit, catalogresults.length).toLocaleString()}`;
  catalogmore.hidden = cataloglimit >= catalogresults.length;
}

function updatecatalogusage() {
  cataloguses.clear();
  for (const object of plan) {
    const id = object.asset.id;
    cataloguses.set(id, (cataloguses.get(id) || 0) + 1);
  }
  cataloggrid.querySelectorAll(".catalogmeta").forEach((meta, index) => {
    const text = catalogdescription(catalogresults[index]);
    if (meta.textContent !== text) meta.textContent = text;
  });
}

function preparetarget() {
  target = targetsize(sourceimage.naturalWidth, sourceimage.naturalHeight,
    Number(limitslider.value), sourceisopaque());
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

function resizecanvases() {
  const ratio = sourceimage.naturalWidth / sourceimage.naturalHeight;
  const longside = Math.max(520, Math.ceil(Math.max(ratio, 1 / ratio)));
  const width = ratio >= 1 ? longside : Math.max(1, Math.round(longside * ratio));
  const height = ratio >= 1 ? Math.max(1, Math.round(longside / ratio)) : longside;
  const zoom = Number(previewzoomslider.value);
  const size = previewsize();
  if (resultcanvas.width !== size.width) resultcanvas.width = size.width;
  if (resultcanvas.height !== size.height) resultcanvas.height = size.height;
  if (sourcecanvas.width !== width) sourcecanvas.width = width;
  if (sourcecanvas.height !== height) sourcecanvas.height = height;
  previewzoomvalue.textContent = `${cleannumber(zoom)}×`;
  previewzoomhelp.textContent = size.limited
    ? `Preview and PNG limited to ${size.width} × ${size.height} px at ${cleannumber(size.zoom)}×. The level is 720 units wide.`
    : `At ${cleannumber(zoom)}×, the 720-unit image is ${size.width} px wide. PNG export uses the preview's pixel scale.`;
}

function drawsource(canvas = sourcecanvas) {
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  const screen = previewsize();
  previewrenderer.paintbackground(context, canvas.width, canvas.height, screen.width,
    screen.height, backgroundtile, backgroundtilepixels, background);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, canvas.width, canvas.height);
}

function drawresult(objects = plan) {
  const context = resultcanvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  previewrenderer.paintbackground(context, resultcanvas.width, resultcanvas.height, resultcanvas.width,
    resultcanvas.height, backgroundtile, backgroundtilepixels, background);
  const scalex = resultcanvas.width / target.width;
  context.save();
  context.translate(0, (resultcanvas.height - target.height * scalex) / 2);
  previewrenderer.renderpreview(context, objects, scalex, scalex, spriteatlasimages, spriteatlasdimensions);
  context.restore();
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
    const fields = [
      "1", candidate.asset.id, "2", cleannumber(position.x), "3", cleannumber(position.y), "20", "5", "21", basechannel, "22", detailchannel, "96", "1", "64", "1", "67", "1", "121", "1", "24", candidate.role === "underlay" ? "3" : "5", "25", index + 1, "128", cleannumber(scalex), "129", cleannumber(scaley), "6", cleannumber(angle),
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
    helpers.push(["1", "1007", "2", "15", "3", "120", "10", "0", "35", exportedopacity(alpha), "51", group].join(","));
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

function updatepngdownload() {
  const version = ++pngversion;
  pngdownload.hidden = true;
  resultcanvas.toBlob(blob => {
    if (!blob || version !== pngversion || fitreadyrevision !== fitrevision) return;
    if (currentpngdownload) URL.revokeObjectURL(currentpngdownload);
    currentpngdownload = URL.createObjectURL(blob);
    pngdownload.href = currentpngdownload;
    pngdownload.download = `${levelname()}-fit-${cleannumber(previewsize().zoom)}x.png`;
    pngdownload.hidden = false;
  }, "image/png");
}

function invalidateexports() {
  exportversion += 1;
  downloadlink.hidden = true;
  gdlvldownload.hidden = true;
  downloadlink.removeAttribute("href");
  gdlvldownload.removeAttribute("href");
  if (currentdownload) URL.revokeObjectURL(currentdownload);
  if (currentgdlvldownload) URL.revokeObjectURL(currentgdlvldownload);
  currentdownload = "";
  currentgdlvldownload = "";
}

function prettysize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function updatefields() {
  limitvalue.textContent = Number(limitslider.value).toLocaleString();
  trialvalue.textContent = trialslider.value;
  colourvalue.textContent = colourslider.value;
  previewzoomvalue.textContent = `${cleannumber(Number(previewzoomslider.value))}×`;
  seedsearchfield.hidden = presetselect.value !== "max" || Number(trialslider.value) < 384
    || fitselect.value === "regions" || fitselect.value === "grid" || regionfitactive;
  underlaystyle.disabled = !underlaytoggle.checked;
  coverageselect.disabled = !["detail", "max"].includes(presetselect.value)
    || fitselect.value === "regions" || fitselect.value === "grid" || regionfitactive;
  warpselect.disabled = fitselect.value === "regions" || regionfitactive;
}

function updatepreview(updatecatalog = false) {
  if (fitreadyrevision !== fitrevision) return;
  resizecanvases();
  drawsource();
  drawresult();
  fiterror = measurepreviewerror();
  const result = buildsource();
  invalidateexports();
  levelraw = result.raw;
  levelsource = gmddocument(levelraw, levelname());
  updatepngdownload();
  tilecount.textContent = result.objects.toLocaleString();
  gridcount.textContent = `${fiterror.toFixed(1)}%`;
  channelcount.textContent = result.channels.toLocaleString();
  sizecount.textContent = prettysize(new Blob([levelsource]).size);
  renderstate.textContent = fitselect.value === "grid" ? "SPRITE MOSAIC" : "SPRITE FIT";
  const mapping = colourmode.value === "hsv" ? "one HSV-red channel 999"
    : result.overflow ? "native base/detail colour channels with HSV for extra colours" : "native base/detail colour channels";
  const method = regionfitactive ? "clean color regions" : fitselect.value === "grid"
    ? "native shape cells" : `${trialslider.value} sprite trials per object`;
  const transforms = warpselect.value === "on" ? "rotation, XY scale and axis warp" : "rotation and XY scale";
  const fittedcount = plan.length - underlaycount;
  const objectsummary = underlaycount
    ? `${underlaycount.toLocaleString()} dominant-color base object${underlaycount === 1 ? "" : "s"} + ${fittedcount.toLocaleString()} fitted sprites (${underlaymessage})`
    : `${fittedcount.toLocaleString()} fitted sprites (${underlaymessage})`;
  const seednote = searchcount > 1 ? ` · best of ${searchcount} searches` : "";
  const helpernote = result.helpers ? ` + ${result.helpers} ${result.opacityhelpers ? "setup" : "visibility"} helper${result.helpers === 1 ? "" : "s"}` : "";
  statuscopy.textContent = `${objectsummary}${helpernote} · ${result.objects.toLocaleString()} objects total${seednote}. ${method}, ${transforms}, ${mapping}, ${fiterror.toFixed(1)}% preview mean RGB error vs source at ${cleannumber(previewsize().zoom)}× editor zoom in ${Math.max(1, Math.round(fittime))} ms.${visibilitywarning()}`;
  if (updatecatalog) updatecatalogusage();
}

async function refresh(revision = fitrevision) {
  if (revision !== fitrevision) return false;
  updatefields();
  if (!alphaready || !sourceimage.naturalWidth || !sourceimage.naturalHeight) return false;
  const aspect = sourceimage.naturalWidth / sourceimage.naturalHeight;
  if (Math.max(aspect, 1 / aspect) > sampleedge) {
    renderstate.textContent = "ERROR";
    statuscopy.textContent = `This image is too narrow to fit. Use an aspect ratio up to ${sampleedge} to 1 in either direction.`;
    return false;
  }
  if (!atlasready) {
    renderstate.textContent = "WAITING";
    statuscopy.textContent = "Loading the medium native object atlas in the background.";
    return false;
  }
  invalidateexports();
  pngdownload.hidden = true;
  renderstate.textContent = "FITTING";
  const started = performance.now();
  seedretryoffset = 0;
  const limit = Number(limitslider.value);
  if (!await runfitsearch(limit, Number(trialslider.value), revision)) return false;
  if (revision !== fitrevision) return false;
  originalplan = plan;
  originalrevision = revision;
  croppedplan = null;
  fittime = performance.now() - started;
  return finishcrop(revision);
}

function schedulepreview() {
  const revision = ++fitrevision;
  updatefields();
  if (!sourceimage.naturalWidth) return;
  invalidateexports();
  pngdownload.hidden = true;
  renderstate.textContent = atlasready ? "QUEUED" : "WAITING";
  window.clearTimeout(refreshid);
  refreshid = window.setTimeout(() => refresh(revision), 120);
}

function loadimage(url, name) {
  fitrevision += 1;
  imagerevision += 1;
  sampledopaque = null;
  alphaready = false;
  croptoggle.disabled = true;
  originalplan = [];
  croppedplan = null;
  window.clearTimeout(refreshid);
  if (imageurl) URL.revokeObjectURL(imageurl);
  imageurl = url.startsWith("blob:") ? url : "";
  imagename = name;
  dropsubtitle.textContent = browsehint;
  sourceimage.src = url;
  sourcename.textContent = `${name} · loading preview`;
  invalidateexports();
  pngdownload.hidden = true;
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
  dropsubtitle.textContent = "Choose a JPG, PNG, WebP, GIF or SVG image.";
}

async function downloadlevel() {
  if (!levelsource || fitreadyrevision !== fitrevision) return;
  invalidateexports();
  const version = exportversion;
  const revision = fitrevision;
  const raw = levelraw;
  const name = levelname();
  currentdownload = URL.createObjectURL(new Blob([levelsource], {type: "application/xml"}));
  downloadlink.href = currentdownload;
  downloadlink.download = `${name}.gmd`;
  downloadlink.hidden = false;
  statuscopy.textContent = "GMD ready. Preparing GDLVL...";
  try {
    const contents = await gdlvldocument(raw, name);
    if (version !== exportversion || revision !== fitrevision || fitreadyrevision !== fitrevision) return;
    currentgdlvldownload = URL.createObjectURL(new Blob([contents], {type: "application/octet-stream"}));
    gdlvldownload.href = currentgdlvldownload;
    gdlvldownload.download = `${name}.gdlvl`;
    gdlvldownload.hidden = false;
    const objects = tilecount.textContent;
    const channels = channelcount.textContent;
    statuscopy.textContent = `GMD and GDLVL ready. ${objects} object${objects === "1" ? "" : "s"}, ${channels} colour channel${channels === "1" ? "" : "s"}.${visibilitywarning()}`;
  } catch (error) {
    if (version !== exportversion || revision !== fitrevision || fitreadyrevision !== fitrevision) return;
    statuscopy.textContent = `GMD ready. GDLVL export failed: ${error.message}${visibilitywarning()}`;
  }
}

function applypreset() {
  const preset = presetdata[presetselect.value];
  limitslider.value = preset.limit;
  trialslider.value = preset.trials;
  colourslider.value = preset.colours;
  fitselect.value = preset.fit;
  samplerselect.value = preset.sampler;
  underlaytoggle.checked = preset.underlay;
  coverageselect.value = preset.coverage;
  schedulepreview();
}

sourceimage.addEventListener("load", async () => {
  const revision = ++imagerevision;
  sampledopaque = null;
  alphaready = !croptoggle.checked;
  sourcename.textContent = `${imagename} · ${sourceimage.naturalWidth} × ${sourceimage.naturalHeight}`;
  if (alphaready) schedulepreview();
  opacitycheck = sourceisopaque() ? cropopaque(sourceimage, () => revision === imagerevision) : Promise.resolve(false);
  const opaque = await opacitycheck;
  if (revision !== imagerevision) return;
  croptoggle.disabled = !opaque;
  if (!opaque) croptoggle.checked = false;
  if (!alphaready) {
    alphaready = true;
    schedulepreview();
  }
});

sourceimage.addEventListener("error", () => {
  sourcename.textContent = "Could not read that image";
  statuscopy.textContent = "Choose a supported JPG, PNG, WEBP, GIF or SVG image.";
  renderstate.textContent = "ERROR";
});

imagefile.addEventListener("change", () => {
  loadupload(imagefile.files);
  imagefile.value = "";
});

examplebutton.addEventListener("click", () => loadimage("assets/soggycat.jpg", "soggycat.jpg"));

for (const name of ["dragenter", "dragover"]) {
  dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.add("isdragging");
  });
}

for (const name of ["dragleave", "drop"]) {
  dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.remove("isdragging");
  });
}

dropzone.addEventListener("drop", event => {
  loadupload(event.dataTransfer.files);
});

presetselect.addEventListener("change", applypreset);
catalogsearch.addEventListener("input", () => rendercatalog(true));
catalogmore.addEventListener("click", () => {
  cataloglimit = Math.min(catalogresults.length, cataloglimit + 72);
  rendercatalog();
});
limitslider.addEventListener("input", schedulepreview);
croptoggle.addEventListener("change", () => {
  if (originalrevision === fitrevision) finishcrop(fitrevision);
});
underlaytoggle.addEventListener("change", () => {
  updatefields();
  schedulepreview();
});
underlaystyle.addEventListener("change", schedulepreview);
trialslider.addEventListener("input", schedulepreview);
seedsearchselect.addEventListener("change", schedulepreview);
coverageselect.addEventListener("change", schedulepreview);
colourslider.addEventListener("input", schedulepreview);
previewzoomslider.addEventListener("input", () => {
  updatefields();
  if (atlasready && sourceimage.naturalWidth && target.width) updatepreview();
});
previewzoomslider.addEventListener("change", schedulepreview);
fitselect.addEventListener("change", () => {
  if (fitselect.value === "regions") {
    warpselect.value = "on";
    coverageselect.value = "2";
  }
  schedulepreview();
});
samplerselect.addEventListener("change", schedulepreview);
warpselect.addEventListener("change", schedulepreview);
colourmode.addEventListener("change", schedulepreview);
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!levelsource || fitreadyrevision !== fitrevision || !["SPRITE FIT", "SPRITE MOSAIC"].includes(renderstate.textContent)) {
    statuscopy.textContent = "Wait for the image fit to finish before exporting.";
    return;
  }
  downloadlevel();
});
window.addEventListener("nativepreviewrestored", () => {
  if (["SPRITE FIT", "SPRITE MOSAIC"].includes(renderstate.textContent)) updatepreview();
});

loadnativeatlas().catch(error => {
  assetstatus.textContent = "ATLAS ERROR";
  renderstate.textContent = "ERROR";
  statuscopy.textContent = error.message;
});
loadimage("assets/soggycat.jpg", "soggycat.jpg");
