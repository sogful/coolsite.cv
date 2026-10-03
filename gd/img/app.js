const form = document.querySelector(".controlpanel");
const imagefile = document.querySelector(".imagefile");
const dropzone = document.querySelector(".dropzone");
const examplebutton = document.querySelector(".examplebutton");
const presetselect = document.querySelector(".presetselect");
const limitslider = document.querySelector(".limitslider");
const trialslider = document.querySelector(".trialslider");
const colourslider = document.querySelector(".colourslider");
const fitselect = document.querySelector(".fitselect");
const samplerselect = document.querySelector(".samplerselect");
const warpselect = document.querySelector(".warpselect");
const colourmode = document.querySelector(".colourmode");
const limitvalue = document.querySelector(".limitvalue");
const trialvalue = document.querySelector(".trialvalue");
const colourvalue = document.querySelector(".colourvalue");
const sourcename = document.querySelector(".sourcename");
const sourcecanvas = document.querySelector(".sourcecanvas");
const resultcanvas = document.querySelector(".resultcanvas");
const tintcanvas = document.createElement("canvas");
const tintcontext = tintcanvas.getContext("2d");
const tilecount = document.querySelector(".tilecount");
const gridcount = document.querySelector(".gridcount");
const channelcount = document.querySelector(".channelcount");
const sizecount = document.querySelector(".sizecount");
const assetstatus = document.querySelector(".assetstatus");
const renderstate = document.querySelector(".renderstate");
const downloadlink = document.querySelector(".downloadlink");
const pngdownload = document.querySelector(".pngdownload");
const statuscopy = document.querySelector(".statuscopy");
const buildbutton = document.querySelector(".buildbutton");
const cataloggrid = document.querySelector(".cataloggrid");
const catalogsearch = document.querySelector(".catalogsearch");
const catalogcount = document.querySelector(".catalogcount");
const catalogmore = document.querySelector(".catalogmore");

const sourceimage = new Image();
const background = [4, 28, 66];
const presetdata = {
  fast: {limit: 250, trials: 12, colours: 32, fit: "adaptive", sampler: "average"},
  balanced: {limit: 800, trials: 32, colours: 128, fit: "adaptive", sampler: "average"},
  detail: {limit: 1500, trials: 96, colours: 256, fit: "adaptive", sampler: "average"},
};

let imageurl = "";
let imagename = "soggycat";
let target = {width: 0, height: 0};
let targetpixels = new Uint8ClampedArray();
let fittedpixels = new Uint8ClampedArray();
let plan = [];
let library = [];
let defaultasset = null;
let atlasimages = [];
let atlaspixels = [];
let catalogresults = [];
let atlasready = false;
let cataloglimit = 72;
const sampledtexture = [0, 0, 0, 0];
let levelsource = "";
let currentdownload = "";
let currentpngdownload = "";
let pngversion = 0;
let refreshid = 0;
let fitrevision = 0;
let fiterror = 0;
let fittime = 0;

function cleannumber(value, digits = 3) {
  return Number(value.toFixed(digits)).toString();
}

function quantize(value, levels) {
  if (levels >= 256) return Math.round(value);
  return Math.round(Math.round(value * (levels - 1) / 255) * 255 / (levels - 1));
}

function targetsize(width, height, limit) {
  const ratio = width / height;
  const pixels = Math.max(1600, Math.min(5200, Math.max(limit, 1) * 2.5));
  const columns = Math.max(24, Math.round(Math.sqrt(pixels * ratio)));
  const rows = Math.max(24, Math.round(columns / ratio));
  return {width: columns, height: rows};
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

function randomseed() {
  let seed = 2166136261;
  for (const value of targetpixels) {
    seed ^= value;
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function loadlocalimage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${path}`));
    image.src = path;
  });
}

async function ungzipjson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load native atlas metadata (${response.status})`);
  if (!("DecompressionStream" in window)) throw new Error("This browser cannot read the native atlas gzip stream");
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}

async function loadnativeatlas() {
  const metadata = await ungzipjson("assets/gd-objects-v2/gd-object-atlas.json.gz");
  atlasimages = await Promise.all(metadata.atlases.map(path => loadlocalimage(`assets/gd-objects-v2/${path}`)));
  atlaspixels = atlasimages.map(image => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", {willReadFrequently: true});
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, image.width, image.height).data;
  });
  library = metadata.objects.map(item => {
    const [left, bottom, right, top] = item.bounds;
    return {
      ...item,
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
  if (!defaultasset) throw new Error("The native atlas has no drawable objects");
  atlasready = true;
  assetstatus.textContent = `ATLAS ${library.length.toLocaleString()}`;
  rendercatalog(true);
  schedulepreview();
}

function catalogdescription(asset) {
  const uses = plan.reduce((count, candidate) => count + (candidate.asset.id === asset.id ? 1 : 0), 0);
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

function preparetarget() {
  target = targetsize(sourceimage.naturalWidth, sourceimage.naturalHeight, Number(limitslider.value));
  const samplecanvas = document.createElement("canvas");
  samplecanvas.width = target.width;
  samplecanvas.height = target.height;
  const context = samplecanvas.getContext("2d", {willReadFrequently: true});
  context.fillStyle = `rgb(${background.join(",")})`;
  context.fillRect(0, 0, target.width, target.height);
  context.imageSmoothingEnabled = samplerselect.value === "average";
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, target.width, target.height);
  const sourcepixels = context.getImageData(0, 0, target.width, target.height).data;
  const levels = Number(colourslider.value);
  targetpixels = new Uint8ClampedArray(target.width * target.height * 3);
  for (let index = 0; index < target.width * target.height; index += 1) {
    const offset = index * 4;
    const targetoffset = index * 3;
    const alpha = sourcepixels[offset + 3] / 255;
    targetpixels[targetoffset] = quantize(sourcepixels[offset] * alpha + background[0] * (1 - alpha), levels);
    targetpixels[targetoffset + 1] = quantize(sourcepixels[offset + 1] * alpha + background[1] * (1 - alpha), levels);
    targetpixels[targetoffset + 2] = quantize(sourcepixels[offset + 2] * alpha + background[2] * (1 - alpha), levels);
  }
  fittedpixels = new Uint8ClampedArray(target.width * target.height * 3);
  for (let index = 0; index < target.width * target.height; index += 1) {
    const offset = index * 3;
    fittedpixels[offset] = background[0];
    fittedpixels[offset + 1] = background[1];
    fittedpixels[offset + 2] = background[2];
  }
}

function pixelerror(index) {
  const offset = index * 3;
  return Math.abs(targetpixels[offset] - fittedpixels[offset]) + Math.abs(targetpixels[offset + 1] - fittedpixels[offset + 1]) + Math.abs(targetpixels[offset + 2] - fittedpixels[offset + 2]);
}

function findfocus() {
  let bestindex = 0;
  let bestscore = -1;
  const pixels = target.width * target.height;
  for (let index = 0; index < pixels; index += 1) {
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
  const radians = candidate.angle * Math.PI / 180;
  candidate.cos = Math.cos(radians);
  candidate.sin = Math.sin(radians);
  candidate.warpx = Number(candidate.warpx || 0);
  candidate.warpy = Number(candidate.warpy || 0);
  const warpx = candidate.warpx * Math.PI / 180;
  const warpy = candidate.warpy * Math.PI / 180;
  const warp00 = Math.cos(warpy);
  const warp01 = -Math.sin(warpx);
  const warp10 = Math.sin(warpy);
  const warp11 = Math.cos(warpx);
  candidate.matrix00 = candidate.cos * warp00 - candidate.sin * warp10;
  candidate.matrix01 = candidate.cos * warp01 - candidate.sin * warp11;
  candidate.matrix10 = candidate.sin * warp00 + candidate.cos * warp10;
  candidate.matrix11 = candidate.sin * warp01 + candidate.cos * warp11;
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
  const levels = Number(colourslider.value);
  candidate.red = quantize(denominator[0] ? numerator[0] / denominator[0] : 0, levels);
  candidate.green = quantize(denominator[1] ? numerator[1] / denominator[1] : 0, levels);
  candidate.blue = quantize(denominator[2] ? numerator[2] / denominator[2] : 0, levels);
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
        const after = before * (1 - alpha) + texture[channel] * alpha * tint[channel] / 255;
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
  const bounds = candidatebounds(candidate);
  const area = Math.max(1, (bounds.right - bounds.left) * (bounds.bottom - bounds.top));
  return fitcandidate(candidate, Math.max(1, Math.ceil(Math.sqrt(area / 96))));
}

function refinecandidate(candidate) {
  return fitcandidate(candidate, 1);
}

function candidatevariant(candidate, changes) {
  const variant = {...candidate, ...changes};
  delete variant.cos;
  delete variant.sin;
  delete variant.matrix00;
  delete variant.matrix01;
  delete variant.matrix10;
  delete variant.matrix11;
  delete variant.matrixdeterminant;
  return variant;
}

function refinegeometry(candidate) {
  let best = candidatevariant(candidate, {});
  for (let round = 0; round < 2; round += 1) {
    const positionstep = round ? 0.25 : 0.5;
    const scalefactor = round ? 1.05 : 1.1;
    const angle = round ? 3 : 7;
    const changes = [
      {x: best.x - positionstep}, {x: best.x + positionstep},
      {y: best.y - positionstep}, {y: best.y + positionstep},
      {width: Math.max(0.25, best.width / scalefactor)}, {width: Math.min(target.width, best.width * scalefactor)},
      {height: Math.max(0.25, best.height / scalefactor)}, {height: Math.min(target.height, best.height * scalefactor)},
    ];
    if (best.asset.freerotation) changes.push({angle: best.angle - angle}, {angle: best.angle + angle});
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
  const bounds = candidatebounds(candidate);
  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    for (let x = bounds.left; x < bounds.right; x += 1) {
      const texture = sampleasset(candidate, x + 0.5, y + 0.5);
      const alpha = texture[3] / 255;
      if (alpha < 0.005) continue;
      const offset = (y * target.width + x) * 3;
      fittedpixels[offset] = fittedpixels[offset] * (1 - alpha) + texture[0] * alpha * candidate.red / 255;
      fittedpixels[offset + 1] = fittedpixels[offset + 1] * (1 - alpha) + texture[1] * alpha * candidate.green / 255;
      fittedpixels[offset + 2] = fittedpixels[offset + 2] * (1 - alpha) + texture[2] * alpha * candidate.blue / 255;
    }
  }
}

function chooseasset(trial, trials, random) {
  const index = Math.min(library.length - 1, Math.floor((trial + random()) * library.length / trials));
  return library[index];
}

function makecandidate(focus, progress, trial, trials, random) {
  const asset = chooseasset(trial, trials, random);
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
  const warps = [[0, 0], [0, 0], [0, 0], [0, 18], [0, -18], [18, 0], [-18, 0], [0, 30], [0, -30], [30, 0], [-30, 0]];
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

async function fitadaptive(limit, trials, revision) {
  const random = randomseed();
  plan = [];
  for (let index = 0; index < limit; index += 1) {
    if (revision !== fitrevision) return false;
    const focus = findfocus();
    if (focus.score < 2) break;
    let bestcandidate = null;
    let bestscore = 0;
    const progress = index / Math.max(limit - 1, 1);
    for (let trial = 0; trial < trials; trial += 1) {
      const candidate = makecandidate(focus, progress, trial, trials, random);
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
    if (bestscore <= 0) break;
    paintcandidate(bestcandidate);
    plan.push(bestcandidate);
    if (index % 4 === 3 || index + 1 === limit) {
      renderstate.textContent = `SEARCH ${index + 1}/${limit}`;
      await yieldfittask();
    }
  }
  return revision === fitrevision;
}

function fitgrid(limit) {
  plan = [];
  const grid = gridsize(target.width, target.height, limit);
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
      paintcandidate(candidate);
      plan.push(candidate);
    }
  }
}

function measurepreviewerror() {
  let difference = 0;
  const source = sourcecanvas.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, sourcecanvas.width, sourcecanvas.height).data;
  const result = resultcanvas.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, resultcanvas.width, resultcanvas.height).data;
  for (let index = 0; index < source.length; index += 4) {
    difference += Math.abs(source[index] - result[index]) + Math.abs(source[index + 1] - result[index + 1]) + Math.abs(source[index + 2] - result[index + 2]);
  }
  return difference / Math.max(1, sourcecanvas.width * sourcecanvas.height * 765) * 100;
}

function resizecanvases() {
  const ratio = sourceimage.naturalWidth / sourceimage.naturalHeight;
  const longside = 520;
  const width = ratio >= 1 ? longside : Math.max(160, Math.round(longside * ratio));
  const height = ratio >= 1 ? Math.max(160, Math.round(longside / ratio)) : longside;
  for (const canvas of [sourcecanvas, resultcanvas]) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawsource() {
  const context = sourcecanvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  context.fillStyle = `rgb(${background.join(",")})`;
  context.fillRect(0, 0, sourcecanvas.width, sourcecanvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, sourcecanvas.width, sourcecanvas.height);
}

function drawcandidate(context, candidate, scalex, scaley) {
  preparecandidate(candidate);
  const [left, top, width, height] = candidate.asset.source;
  const drawwidth = Math.max(1, Math.ceil(candidate.width * scalex));
  const drawheight = Math.max(1, Math.ceil(candidate.height * scaley));
  tintcanvas.width = width;
  tintcanvas.height = height;
  tintcontext.globalCompositeOperation = "source-over";
  tintcontext.globalAlpha = 1;
  tintcontext.clearRect(0, 0, width, height);
  tintcontext.drawImage(atlasimages[candidate.asset.page], left, top, width, height, 0, 0, width, height);
  tintcontext.globalCompositeOperation = "multiply";
  tintcontext.fillStyle = `rgb(${candidate.red},${candidate.green},${candidate.blue})`;
  tintcontext.fillRect(0, 0, width, height);
  tintcontext.globalCompositeOperation = "destination-in";
  tintcontext.drawImage(atlasimages[candidate.asset.page], left, top, width, height, 0, 0, width, height);
  context.save();
  context.translate(candidate.x * scalex, candidate.y * scaley);
  context.rotate(candidate.angle * Math.PI / 180);
  context.transform(Math.cos(candidate.warpy * Math.PI / 180), Math.sin(candidate.warpy * Math.PI / 180),
    -Math.sin(candidate.warpx * Math.PI / 180), Math.cos(candidate.warpx * Math.PI / 180), 0, 0);
  context.drawImage(tintcanvas, -drawwidth / 2, -drawheight / 2, drawwidth, drawheight);
  context.restore();
}

function drawresult() {
  const context = resultcanvas.getContext("2d");
  const scalex = resultcanvas.width / target.width;
  const scaley = resultcanvas.height / target.height;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  context.fillStyle = `rgb(${background.join(",")})`;
  context.fillRect(0, 0, resultcanvas.width, resultcanvas.height);
  context.imageSmoothingEnabled = true;
  for (const candidate of plan) drawcandidate(context, candidate, scalex, scaley);
}

function hsvvalue(candidate) {
  const red = candidate.red / 255;
  const green = candidate.green / 255;
  const blue = candidate.blue / 255;
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
  const radians = candidate.angle * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const unwarpedx = candidate.asset.centrex * scalex;
  const unwarpedy = candidate.asset.centrey * scaley;
  const localx = Math.cos(candidate.warpy * Math.PI / 180) * unwarpedx + Math.sin(candidate.warpx * Math.PI / 180) * unwarpedy;
  const localy = -Math.sin(candidate.warpy * Math.PI / 180) * unwarpedx + Math.cos(candidate.warpx * Math.PI / 180) * unwarpedy;
  const rotatedx = localx * cos + localy * sin;
  const rotatedy = -localx * sin + localy * cos;
  return {
    x: 300 + candidate.x * pixelscale - rotatedx,
    y: 120 + (target.height - candidate.y) * pixelscale - rotatedy,
  };
}

function buildsource() {
  const colors = new Map();
  const colorlines = ["1_6_2_18_3_40_6_1000_7_1", "1_6_2_18_3_40_6_1001_7_1", "1_255_2_255_3_255_6_1004_7_1"];
  const hsvmode = colourmode.value === "hsv";
  if (hsvmode) colorlines.push("1_255_2_0_3_0_4_-1_6_999_7_1");
  const pixelscale = 720 / Math.max(target.width, 1);
  const parts = [];
  for (let index = 0; index < plan.length; index += 1) {
    const candidate = plan[index];
    if (hsvmode) {
      candidate.channel = 999;
      candidate.hsv = hsvvalue(candidate);
    } else {
      const key = `${candidate.red},${candidate.green},${candidate.blue}`;
      if (!colors.has(key)) {
        const channel = channelid(colors.size + 1);
        colors.set(key, channel);
        colorlines.push(`1_${candidate.red}_2_${candidate.green}_3_${candidate.blue}_4_-1_6_${channel}_7_1`);
      }
      candidate.channel = colors.get(key);
    }
    const scalex = Math.min(3, candidate.width * pixelscale / candidate.asset.naturalwidth);
    const scaley = Math.min(3, candidate.height * pixelscale / candidate.asset.naturalheight);
    const position = objectposition(candidate, pixelscale, scalex, scaley);
    const fields = [
      "1", candidate.asset.id, "2", cleannumber(position.x), "3", cleannumber(position.y), "20", "5", "21", candidate.channel, "22", candidate.channel, "96", "1", "64", "1", "67", "1", "121", "1", "24", "5", "25", index + 1, "128", cleannumber(scalex), "129", cleannumber(scaley), "6", cleannumber(candidate.angle),
    ];
    if (candidate.warpy) fields.push("131", cleannumber(candidate.warpy));
    if (candidate.warpx) fields.push("132", cleannumber(candidate.warpx));
    if (hsvmode) fields.push("41", "1", "42", "1", "43", candidate.hsv, "44", candidate.hsv);
    parts.push(fields.join(","));
  }
  const header = ["kA2", "0", "kA3", "0", "kA4", "0", "kA6", "1", "kA7", "1", "kA8", "0", "kA9", "0", "kA10", "0", "kA11", "0", "kA13", "0", "kA22", "0", "kA40", "1", "kS38", `${colorlines.join("|")}|`];
  return {raw: `${header.join(",")};${parts.join(";")};`, channels: hsvmode ? 1 : colors.size};
}

function xmlescape(value) {
  const escape = {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;"};
  return value.replace(/[&<>"']/g, character => escape[character]);
}

function asbase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function levelname() {
  const name = imagename.replace(/\.[^/.]+$/, "").trim();
  return name || "Image mosaic";
}

function updatepngdownload() {
  const version = ++pngversion;
  pngdownload.hidden = true;
  resultcanvas.toBlob(blob => {
    if (!blob || version !== pngversion) return;
    if (currentpngdownload) URL.revokeObjectURL(currentpngdownload);
    currentpngdownload = URL.createObjectURL(blob);
    pngdownload.href = currentpngdownload;
    pngdownload.download = `${levelname()}-fit.png`;
    pngdownload.hidden = false;
  }, "image/png");
}

function gmddocument(raw) {
  const title = xmlescape(levelname());
  const description = asbase64("Generated locally by GD Image to Level. Static no-touch native-object image fit.");
  return `<?xml version="1.0" encoding="utf-8"?>\n<plist version="1.0" gjver="2.0"><dict><k>kCEK</k><i>4</i><k>k2</k><s>${title}</s><k>k3</k><s>${description}</s><k>k4</k><s>${xmlescape(raw)}</s><k>k5</k><s>GD Image</s><k>k13</k><t/><k>k14</k><f/><k>k16</k><i>1</i><k>k17</k><i>22</i><k>k21</k><i>2</i><k>k45</k><i>0</i><k>k50</k><i>47</i></dict></plist>`;
}

function prettysize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function updatefields() {
  limitvalue.textContent = Number(limitslider.value).toLocaleString();
  trialvalue.textContent = trialslider.value;
  colourvalue.textContent = colourslider.value;
}

async function refresh(revision = fitrevision) {
  if (revision !== fitrevision) return false;
  updatefields();
  if (!sourceimage.naturalWidth || !sourceimage.naturalHeight) return false;
  if (!atlasready) {
    renderstate.textContent = "WAITING";
    statuscopy.textContent = "Loading the medium native object atlas in the background.";
    return false;
  }
  downloadlink.hidden = true;
  pngdownload.hidden = true;
  renderstate.textContent = "FITTING";
  const started = performance.now();
  preparetarget();
  const limit = Number(limitslider.value);
  if (fitselect.value === "grid") fitgrid(limit);
  else if (!await fitadaptive(limit, Number(trialslider.value), revision)) return false;
  if (revision !== fitrevision) return false;
  fittime = performance.now() - started;
  resizecanvases();
  drawsource();
  drawresult();
  fiterror = measurepreviewerror();
  const result = buildsource();
  levelsource = gmddocument(result.raw);
  updatepngdownload();
  tilecount.textContent = plan.length.toLocaleString();
  gridcount.textContent = `${fiterror.toFixed(1)}%`;
  channelcount.textContent = result.channels.toLocaleString();
  sizecount.textContent = prettysize(new Blob([levelsource]).size);
  renderstate.textContent = fitselect.value === "adaptive" ? "SPRITE FIT" : "SPRITE MOSAIC";
  const mapping = colourmode.value === "hsv" ? "one HSV-red channel 999" : "shared native colour channels";
  const method = fitselect.value === "adaptive" ? `${trialslider.value} sprite trials per object` : "native shape cells";
  const transforms = warpselect.value === "on" ? "rotation, XY scale and axis warp" : "rotation and XY scale";
  statuscopy.textContent = `${plan.length.toLocaleString()} native-mesh objects fitted with ${method}, ${transforms}, ${mapping}, ${fiterror.toFixed(1)}% browser-preview mean RGB error vs source in ${Math.max(1, Math.round(fittime))} ms.`;
  rendercatalog(true);
  return true;
}

function schedulepreview() {
  const revision = ++fitrevision;
  updatefields();
  if (!sourceimage.naturalWidth) return;
  downloadlink.hidden = true;
  pngdownload.hidden = true;
  renderstate.textContent = atlasready ? "QUEUED" : "WAITING";
  window.clearTimeout(refreshid);
  refreshid = window.setTimeout(() => refresh(revision), 120);
}

function loadimage(url, name) {
  fitrevision += 1;
  window.clearTimeout(refreshid);
  if (imageurl) URL.revokeObjectURL(imageurl);
  imageurl = url.startsWith("blob:") ? url : "";
  imagename = name;
  sourceimage.src = url;
  sourcename.textContent = `${name} · loading preview`;
  downloadlink.hidden = true;
  pngdownload.hidden = true;
  renderstate.textContent = "LOADING";
}

function validimage(file) {
  return file && (file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".svg"));
}

function downloadlevel() {
  if (!levelsource || !plan.length) return;
  if (currentdownload) URL.revokeObjectURL(currentdownload);
  currentdownload = URL.createObjectURL(new Blob([levelsource], {type: "application/xml"}));
  downloadlink.href = currentdownload;
  downloadlink.download = `${levelname()}.gmd`;
  downloadlink.textContent = "↓  DOWNLOAD .GMD LEVEL";
  downloadlink.hidden = false;
  const transforms = warpselect.value === "on" ? "free rotation, XY scale and axis warp" : "free rotation and independent XY scale";
  statuscopy.textContent = `GMD ready: ${plan.length.toLocaleString()} no-touch native objects, ${channelcount.textContent} colour channels, ${transforms} saved locally.`;
}

function applypreset() {
  const preset = presetdata[presetselect.value];
  limitslider.value = preset.limit;
  trialslider.value = preset.trials;
  colourslider.value = preset.colours;
  fitselect.value = preset.fit;
  samplerselect.value = preset.sampler;
  schedulepreview();
}

sourceimage.addEventListener("load", () => {
  sourcename.textContent = `${imagename} · ${sourceimage.naturalWidth} × ${sourceimage.naturalHeight}`;
  schedulepreview();
});

sourceimage.addEventListener("error", () => {
  sourcename.textContent = "Could not read that image";
  statuscopy.textContent = "Choose a supported JPG, PNG, WEBP, GIF or SVG image.";
  renderstate.textContent = "ERROR";
});

imagefile.addEventListener("change", () => {
  const file = imagefile.files[0];
  if (validimage(file)) loadimage(URL.createObjectURL(file), file.name);
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
  const file = event.dataTransfer.files[0];
  if (validimage(file)) loadimage(URL.createObjectURL(file), file.name);
});

presetselect.addEventListener("change", applypreset);
catalogsearch.addEventListener("input", () => rendercatalog(true));
catalogmore.addEventListener("click", () => {
  cataloglimit = Math.min(catalogresults.length, cataloglimit + 72);
  rendercatalog();
});
limitslider.addEventListener("input", schedulepreview);
trialslider.addEventListener("input", schedulepreview);
colourslider.addEventListener("input", schedulepreview);
fitselect.addEventListener("change", schedulepreview);
samplerselect.addEventListener("change", schedulepreview);
warpselect.addEventListener("change", schedulepreview);
colourmode.addEventListener("change", schedulepreview);
form.addEventListener("submit", event => {
  event.preventDefault();
  buildbutton.disabled = true;
  const revision = ++fitrevision;
  window.clearTimeout(refreshid);
  window.setTimeout(async () => {
    const completed = await refresh(revision);
    if (completed && revision === fitrevision) downloadlevel();
    buildbutton.disabled = false;
  }, 0);
});

loadnativeatlas().catch(error => {
  assetstatus.textContent = "ATLAS ERROR";
  renderstate.textContent = "ERROR";
  statuscopy.textContent = error.message;
});
loadimage("assets/soggycat.jpg", "soggycat.jpg");
