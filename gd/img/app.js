const form = document.querySelector(".controlpanel");
const imagefile = document.querySelector(".imagefile");
const dropzone = document.querySelector(".dropzone");
const examplebutton = document.querySelector(".examplebutton");
const presetselect = document.querySelector(".presetselect");
const limitslider = document.querySelector(".limitslider");
const colourslider = document.querySelector(".colourslider");
const samplerselect = document.querySelector(".samplerselect");
const colourmode = document.querySelector(".colourmode");
const limitvalue = document.querySelector(".limitvalue");
const colourvalue = document.querySelector(".colourvalue");
const sourcename = document.querySelector(".sourcename");
const sourcecanvas = document.querySelector(".sourcecanvas");
const resultcanvas = document.querySelector(".resultcanvas");
const tilecount = document.querySelector(".tilecount");
const gridcount = document.querySelector(".gridcount");
const channelcount = document.querySelector(".channelcount");
const sizecount = document.querySelector(".sizecount");
const downloadlink = document.querySelector(".downloadlink");
const statuscopy = document.querySelector(".statuscopy");
const buildbutton = document.querySelector(".buildbutton");

const sourceimage = new Image();
const presetdata = {
  fast:{limit:250,levels:4,sampler:"nearest"},
  balanced:{limit:800,levels:8,sampler:"average"},
  detail:{limit:1500,levels:256,sampler:"average"},
};

let imageurl = "";
let imagename = "soggycat";
let tiles = [];
let grid = {columns:0,rows:0};
let levelsource = "";
let currentdownload = "";

function cleannumber(value, digits = 3) {
  return Number(value.toFixed(digits)).toString();
}

function gridsize(width, height, limit) {
  if (!limit || !width || !height) return {columns:0,rows:0};
  const ratio = width / height;
  let columns = Math.max(1, Math.round(Math.sqrt(limit * ratio)));
  let rows = Math.max(1, Math.floor(limit / columns));
  while ((columns + 1) * rows <= limit && Math.abs((columns + 1) / rows - ratio) < Math.abs(columns / rows - ratio)) columns += 1;
  while (columns * (rows + 1) <= limit && Math.abs(columns / (rows + 1) - ratio) < Math.abs(columns / rows - ratio)) rows += 1;
  return {columns,rows};
}

function quantize(value, levels) {
  if (levels >= 256) return value;
  return Math.round(Math.round(value * (levels - 1) / 255) * 255 / (levels - 1));
}

function channelid(index) {
  const reserved = 1000;
  return index < reserved ? index : index + 12;
}

function hsvvalue(tile) {
  const red = tile.red / 255;
  const green = tile.green / 255;
  const blue = tile.blue / 255;
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

function preparetiles() {
  grid = gridsize(sourceimage.naturalWidth, sourceimage.naturalHeight, Number(limitslider.value));
  tiles = [];
  if (!grid.columns || !grid.rows) return;
  const samplecanvas = document.createElement("canvas");
  samplecanvas.width = grid.columns;
  samplecanvas.height = grid.rows;
  const context = samplecanvas.getContext("2d", {willReadFrequently:true});
  context.imageSmoothingEnabled = samplerselect.value === "average";
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceimage, 0, 0, grid.columns, grid.rows);
  const pixels = context.getImageData(0, 0, grid.columns, grid.rows).data;
  const levels = Number(colourslider.value);
  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const offset = (row * grid.columns + column) * 4;
      const alpha = pixels[offset + 3];
      if (alpha < 16) continue;
      tiles.push({
        column,
        row,
        red:quantize(pixels[offset], levels),
        green:quantize(pixels[offset + 1], levels),
        blue:quantize(pixels[offset + 2], levels),
        alpha:Math.round(alpha * 1000 / 255) / 1000,
      });
    }
  }
}

function drawimage(context, image) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  context.fillStyle = "#041c42";
  context.fillRect(0, 0, width, height);
  if (!image.naturalWidth || !image.naturalHeight) return;
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawwidth = image.naturalWidth * scale;
  const drawheight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawwidth) / 2, (height - drawheight) / 2, drawwidth, drawheight);
}

function drawtiles(context) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  context.fillStyle = "#041c42";
  context.fillRect(0, 0, width, height);
  if (!grid.columns || !grid.rows) return;
  const scale = Math.min(width / grid.columns, height / grid.rows);
  const drawwidth = grid.columns * scale;
  const drawheight = grid.rows * scale;
  const left = (width - drawwidth) / 2;
  const top = (height - drawheight) / 2;
  for (const tile of tiles) {
    context.fillStyle = `rgba(${tile.red},${tile.green},${tile.blue},${tile.alpha})`;
    context.fillRect(left + tile.column * scale, top + tile.row * scale, Math.ceil(scale) + 0.15, Math.ceil(scale) + 0.15);
  }
}

function xmlescape(value) {
  const escape = {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;"};
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

function buildsource() {
  const colors = new Map();
  const colorlines = ["1_6_2_18_3_40_6_1000_7_1","1_6_2_18_3_40_6_1001_7_1","1_255_2_255_3_255_6_1004_7_1"];
  const hsvmode = colourmode.value === "hsv";
  if (hsvmode) colorlines.push("1_255_2_0_3_0_4_-1_6_999_7_1");
  for (const tile of tiles) {
    if (hsvmode) {
      tile.channel = 999;
      tile.hsv = hsvvalue(tile);
      continue;
    }
    const key = `${tile.red},${tile.green},${tile.blue},${tile.alpha}`;
    if (!colors.has(key)) {
      const channel = channelid(colors.size + 1);
      colors.set(key, channel);
      colorlines.push(`1_${tile.red}_2_${tile.green}_3_${tile.blue}_4_-1_6_${channel}_7_${tile.alpha}`);
    }
    tile.channel = colors.get(key);
  }
  const header = [
    "kA2","0","kA3","0","kA4","0","kA6","1","kA7","1","kA8","0","kA9","0","kA10","0","kA11","0","kA13","0","kA22","0","kA40","1","kS38",`${colorlines.join("|")}|`,
  ];
  const parts = [header.join(",")];
  const worldwidth = 720;
  const tilewidth = grid.columns ? worldwidth / grid.columns : 0;
  const tileheight = grid.rows ? tilewidth : 0;
  for (let index = 0; index < tiles.length; index += 1) {
    const tile = tiles[index];
    const x = 300 + (tile.column + 0.5) * tilewidth;
    const y = 120 + (grid.rows - tile.row - 0.5) * tileheight;
    const fields = [
      "1","211","2",cleannumber(x),"3",cleannumber(y),"20","5","21",tile.channel,"22",tile.channel,"96","1","64","1","67","1","121","1","24","5","25",index + 1,"128",cleannumber(tilewidth / 30),"129",cleannumber(tileheight / 30),"6","0",
    ];
    if (hsvmode) fields.push("41","1","42","1","43",tile.hsv,"44",tile.hsv);
    parts.push(fields.join(","));
  }
  return {raw:`${parts.join(";")};`,channels:hsvmode ? 1 : colors.size};
}

function gmddocument(raw) {
  const title = xmlescape(levelname());
  const description = asbase64("Generated locally by GD Image to Level. Static no-touch image mosaic.");
  return `<?xml version="1.0" encoding="utf-8"?>\n<plist version="1.0" gjver="2.0"><dict><k>kCEK</k><i>4</i><k>k2</k><s>${title}</s><k>k3</k><s>${description}</s><k>k4</k><s>${xmlescape(raw)}</s><k>k5</k><s>GD Image</s><k>k13</k><t/><k>k14</k><f/><k>k16</k><i>1</i><k>k17</k><i>22</i><k>k21</k><i>2</i><k>k45</k><i>0</i><k>k50</k><i>47</i></dict></plist>`;
}

function prettysize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function updatefields() {
  limitvalue.textContent = Number(limitslider.value).toLocaleString();
  colourvalue.textContent = colourslider.value;
}

function refresh() {
  updatefields();
  if (!sourceimage.naturalWidth) return;
  downloadlink.hidden = true;
  preparetiles();
  drawimage(sourcecanvas.getContext("2d"), sourceimage);
  drawtiles(resultcanvas.getContext("2d"));
  const result = buildsource();
  levelsource = gmddocument(result.raw);
  tilecount.textContent = tiles.length.toLocaleString();
  gridcount.textContent = `${grid.columns} × ${grid.rows}`;
  channelcount.textContent = result.channels.toLocaleString();
  sizecount.textContent = prettysize(new Blob([levelsource]).size);
  const mapping = colourmode.value === "hsv" ? "Object HSV transforms from red channel 999" : "shared native colour channels";
  statuscopy.textContent = `${tiles.length.toLocaleString()} no-touch objects are ready with ${result.channels.toLocaleString()} ${mapping}.`;
}

function loadimage(url, name) {
  if (imageurl) URL.revokeObjectURL(imageurl);
  imageurl = url.startsWith("blob:") ? url : "";
  imagename = name;
  sourceimage.src = url;
  sourcename.textContent = `${name} · loading preview`;
  downloadlink.hidden = true;
}

function downloadlevel() {
  refresh();
  if (!levelsource) return;
  if (currentdownload) URL.revokeObjectURL(currentdownload);
  currentdownload = URL.createObjectURL(new Blob([levelsource], {type:"application/xml"}));
  downloadlink.href = currentdownload;
  downloadlink.download = `${levelname()}.gmd`;
  downloadlink.textContent = "↓  DOWNLOAD .GMD LEVEL";
  downloadlink.hidden = false;
  statuscopy.textContent = `GMD ready: ${tiles.length.toLocaleString()} objects, ${channelcount.textContent} colour channels, imported locally through the GD editor.`;
}

function applypreset() {
  const preset = presetdata[presetselect.value];
  limitslider.value = preset.limit;
  colourslider.value = preset.levels;
  samplerselect.value = preset.sampler;
  refresh();
}

sourceimage.addEventListener("load", () => {
  sourcename.textContent = `${imagename} · ${sourceimage.naturalWidth} × ${sourceimage.naturalHeight}`;
  refresh();
});

sourceimage.addEventListener("error", () => {
  sourcename.textContent = "Could not read that image";
  statuscopy.textContent = "Choose a supported JPG, PNG, WEBP or GIF image.";
});

imagefile.addEventListener("change", () => {
  const file = imagefile.files[0];
  if (file) loadimage(URL.createObjectURL(file), file.name);
});

examplebutton.addEventListener("click", () => loadimage("assets/soggycat.jpg", "soggycat.jpg"));

for (const name of ["dragenter","dragover"]) {
  dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.add("isdragging");
  });
}

for (const name of ["dragleave","drop"]) {
  dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.remove("isdragging");
  });
}

dropzone.addEventListener("drop", event => {
  const file = event.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  imagefile.files = transfer.files;
  loadimage(URL.createObjectURL(file), file.name);
});

presetselect.addEventListener("change", applypreset);
limitslider.addEventListener("input", refresh);
colourslider.addEventListener("input", refresh);
samplerselect.addEventListener("change", refresh);
colourmode.addEventListener("change", refresh);
form.addEventListener("submit", event => {
  event.preventDefault();
  buildbutton.disabled = true;
  window.setTimeout(() => {
    downloadlevel();
    buildbutton.disabled = false;
  }, 0);
});

loadimage("assets/soggycat.jpg", "soggycat.jpg");
