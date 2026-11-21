const pixelartedge = 8192;
const pixelartarea = 4000000;

function pixelartcolor(red, green, blue, alpha) {
  return (red | green << 8 | blue << 16 | alpha << 24) >>> 0;
}

function pixelartpalette(pixels, width, height, limit) {
  const colors = new Map();
  const keys = new Uint32Array(width * height);
  const alphas = new Set();
  for (let index = 0; index < keys.length; index += 1) {
    const offset = index * 4;
    const alpha = pixels[offset + 3];
    if (!alpha) continue;
    const key = pixelartcolor(pixels[offset], pixels[offset + 1], pixels[offset + 2], alpha);
    keys[index] = key;
    const x = index % width;
    const y = Math.floor(index / width);
    const entry = colors.get(key) || {key, alpha, left: x, right: x + 1, top: y, bottom: y + 1, count: 0};
    entry.left = Math.min(entry.left, x);
    entry.right = Math.max(entry.right, x + 1);
    entry.top = Math.min(entry.top, y);
    entry.bottom = Math.max(entry.bottom, y + 1);
    entry.count += 1;
    colors.set(key, entry);
    if (alpha < 255) alphas.add(alpha);
    if (colors.size + alphas.size > limit) return null;
  }
  return {colors, keys, alphaobjects: alphas.size};
}

function pixelartruns(keys, width, height, vertical, maximum) {
  const groups = new Map();
  const columns = vertical ? height : width;
  const rows = vertical ? width : height;
  let count = 0;
  let previous = [];
  for (let row = 0; row < rows; row += 1) {
    const next = [];
    let left = 0;
    while (left < columns) {
      const index = vertical ? left * width + row : row * width + left;
      const key = keys[index];
      const stride = vertical ? width : 1;
      let right = left + 1;
      while (right < columns && keys[index + (right - left) * stride] === key) right += 1;
      if (key) {
        const span = right - left;
        let stamp = previous[left];
        if (stamp?.key === key && (vertical ? stamp.height : stamp.width) === span) {
          if (vertical) stamp.width += 1;
          else stamp.height += 1;
        } else {
          if (++count > maximum) return null;
          stamp = vertical ? {key, x: row, y: left, width: 1, height: span}
            : {key, x: left, y: row, width: span, height: 1};
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(stamp);
        }
        next[left] = stamp;
      }
      left = right;
    }
    previous = next;
  }
  return groups;
}

/*//////////////////////////////////////////////////////////////////////*/

function pixelarttiles(color, keys, width, covered, painted, stamp, vertical, reverse, maximum) {
  const area = [];
  const {key, left, right, top, bottom, alpha} = color;
  const columns = vertical ? bottom - top : right - left;
  const rows = vertical ? right - left : bottom - top;
  const columnstep = (vertical ? width : 1) * (reverse ? -1 : 1);
  const rowstep = (vertical ? 1 : width) * (reverse ? -1 : 1);
  const origin = reverse ? (bottom - 1) * width + right - 1 : top * width + left;
  const opaque = alpha === 255;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = origin + y * rowstep + x * columnstep;
      if (keys[index] !== key || painted[index] === stamp) continue;
      if (area.length >= maximum) return null;
      let w = columns - x, bestw = 1, besth = 1;
      for (let h = 0; y + h < rows; h += 1) {
        const start = index + h * rowstep;
        let length = 0;
        while (length < w) {
          const pixel = start + length * columnstep;
          if (!covered[pixel] && (keys[pixel] !== key || !opaque && painted[pixel] === stamp)) break;
          length += 1;
        }
        if (!length) break;
        w = length;
        if (w * (h + 1) >= bestw * besth) {
          bestw = w;
          besth = h + 1;
        }
      }
      for (let row = 0; row < besth; row += 1) {
        const start = index + row * rowstep;
        for (let column = 0; column < bestw; column += 1) painted[start + column * columnstep] = stamp;
      }
      const posx = vertical ? y : x;
      const posy = vertical ? x : y;
      const wrect = vertical ? besth : bestw;
      const hrect = vertical ? bestw : besth;
      area.push({key, x: reverse ? right - posx - wrect : left + posx,
        y: reverse ? bottom - posy - hrect : top + posy, width: wrect, height: hrect});
    }
  }
  return area;
}

function pixelartlayered(palette, width, height, base, compare, layer) {
  const {keys, colors} = palette;
  const order = Array.from(colors.values());
  if (compare) order.sort(compare);
  const covered = new Uint8Array(width * height);
  const painted = new Uint32Array(width * height);
  const groups = [];
  let stamp = 0;
  for (const color of order) {
    let best = base.get(color.key);
    const area = (color.right - color.left) * (color.bottom - color.top);
    if (area !== color.count && (!best || best.length > 1)) {
      for (const vertical of [false, true]) {
        for (const reverse of [false, true]) {
          const maximum = (best?.length ?? 5001) - 1;
          if (!maximum) break;
          const proposal = pixelarttiles(color, keys, width, covered, painted, ++stamp, vertical, reverse, maximum);
          if (proposal && (!best || proposal.length < best.length)) best = proposal;
        }
      }
    }
    if (!best) return null;
    groups.push(best);
    if (layer && color.alpha === 255) {
      for (const rect of best) {
        for (let y = rect.y; y < rect.y + rect.height; y += 1) {
          covered.fill(1, y * width + rect.x, y * width + rect.x + rect.width);
        }
      }
    }
  }
  return groups.reverse().flat();
}

function pixelartcost(rectangles, width, asset, alphaobjects) {
  const scale = 720 / width;
  const scaledwidth = asset.naturalwidth * 3 / scale;
  const scaledheight = asset.naturalheight * 3 / scale;
  let visibility = 0;
  let splitcount = 0;
  const stepwidth = Math.floor(scaledwidth + 1e-9);
  const stepheight = Math.floor(scaledheight + 1e-9);
  for (const rect of rectangles) {
    if (rect.width > scaledwidth + 1e-9 || rect.height > scaledheight + 1e-9) visibility = visibilitycost;
    splitcount += Math.ceil(rect.width / stepwidth) * Math.ceil(rect.height / stepheight);
  }
  if (splitcount >= rectangles.length + visibility) return {rectangles, count: rectangles.length + visibility + alphaobjects};
  const pieces = [];
  for (const {key, x, y, width: w, height: h} of rectangles) {
    for (let row = 0; row < h; row += stepheight) {
      for (let col = 0; col < w; col += stepwidth) {
        pieces.push({key, x: x + col, y: y + row, width: Math.min(stepwidth, w - col), height: Math.min(stepheight, h - row)});
      }
    }
  }
  return {rectangles: pieces, count: pieces.length + alphaobjects};
}

function pixelartrectangles(pixels, width, height, limit, asset) {
  const palette = pixelartpalette(pixels, width, height, limit);
  if (!palette) return null;
  const {keys, colors, alphaobjects} = palette;
  const maximum = Math.max(80000, limit);
  const horizontal = pixelartruns(keys, width, height, false, maximum);
  const vertical = pixelartruns(keys, width, height, true, maximum);
  const base = new Map();
  for (const key of colors.keys()) {
    const rows = horizontal?.get(key);
    const columns = vertical?.get(key);
    if (rows || columns) base.set(key, !columns || rows && rows.length <= columns.length ? rows : columns);
  }
  let best = base.size === colors.size ? pixelartcost(Array.from(base.values()).flat(), width, asset, alphaobjects) : null;
  const searcharea = Array.from(colors.values()).reduce((sum, color) =>
    sum + (color.right - color.left) * (color.bottom - color.top), 0);
  if (width * height <= 262144 && searcharea <= 786432 && colors.size <= 96) {
    const bycount = (a, b) => a.count - b.count;
    for (const [order, layered] of [[null, false], [bycount, true], [(a, b) => bycount(b, a), true]]) {
      const rectangles = pixelartlayered(palette, width, height, base, order, layered);
      if (!rectangles) continue;
      const proposal = pixelartcost(rectangles, width, asset, alphaobjects);
      if (!best || proposal.count < best.count) best = proposal;
    }
  }
  return best;
}

/*//////////////////////////////////////////////////////////////////////*/

function pixelartopacity(alpha) {
  return cleannumber((alpha + 0.25) / 255, 6);
}

function drawpixelartsource(canvas) {
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(sourceimage, 0, 0, canvas.width, canvas.height);
}

function drawpixelartresult(canvas, objects) {
  const {width, height} = canvas;
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);
  const pixels = image.data;
  for (const object of objects) {
    const left = object.x - object.width / 2;
    const top = object.y - object.height / 2;
    const alpha = Math.round(255 * object.opacity);
    for (let row = top; row < top + object.height; row += 1) {
      for (let index = (row * width + left) * 4; index < (row * width + left + object.width) * 4; index += 4) {
        pixels[index] = object.red;
        pixels[index + 1] = object.green;
        pixels[index + 2] = object.blue;
        pixels[index + 3] = alpha;
      }
    }
  }
  context.putImageData(image, 0, 0);
}

async function fitpixelart(limit, revision) {
  const width = sourceimage.naturalWidth;
  const height = sourceimage.naturalHeight;
  const asset = library.find(item => item.id === 495);
  const reject = message => {
    fitmessage.textContent = message;
    stats.hidden = true;
    previewimage.hidden = true;
    renderstate.textContent = "ERROR";
    return false;
  };
  if (!asset) return reject("Pixel art block unavailable.");
  if (Math.max(width, height) > pixelartedge || width * height > pixelartarea) {
    return reject("Pixel art supports up to 4 megapixels and 8,192 pixels per side.");
  }

  statuscopy.textContent = "Merging pixels...";
  await yieldfittask();
  if (revision !== fitrevision) return false;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  drawpixelartsource(canvas);
  const pixels = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  const result = pixelartrectangles(pixels, width, height, limit, asset);
  if (!result) return reject("Pixel art exceeds this object limit.");
  if (result.count > limit) return reject("Pixel art needs " + result.count.toLocaleString() + " objects.");

  fitpixels = 0;
  underlaycount = 0;
  underlaymessage = "";
  searchcount = 1;
  target = {width, height};
  imageopaque = !pixels.some((value, index) => index % 4 === 3 && value < 255);
  plan = result.rectangles.map(rect => ({
    asset, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height,
    angle: 0, warpx: 0, warpy: 0, macro: true, red: rect.key & 255, green: rect.key >>> 8 & 255,
    blue: rect.key >>> 16 & 255, opacity: (rect.key >>> 24) / 255,
  }));
  pixelartactive = true;
  previewimage.classList.add("ispixelart");
  previewimage.classList.toggle("hasalpha", !imageopaque);
  previewimage.classList.remove("hasoverhang");
  overflowcanvas.hidden = true;
  previewimage.hidden = false;
  return true;
}
