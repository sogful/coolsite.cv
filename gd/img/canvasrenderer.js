function preparecanvascandidate(candidate) {
  if (Number.isFinite(candidate.matrixdeterminant)) return;
  const warpx = Number(candidate.warpx || 0);
  const warpy = Number(candidate.warpy || 0);
  const usesaxiswarp = warpx !== 0 || warpy !== 0;
  const baseangle = usesaxiswarp ? 0 : Number(candidate.angle || 0);
  const rotationx = (usesaxiswarp ? warpy : baseangle) * Math.PI / 180;
  const rotationy = (usesaxiswarp ? warpx : baseangle) * Math.PI / 180;
  candidate.matrix00 = Math.cos(rotationy);
  candidate.matrix01 = -Math.sin(rotationx);
  candidate.matrix10 = Math.sin(rotationy);
  candidate.matrix11 = Math.cos(rotationx);
  candidate.matrixdeterminant = candidate.matrix00 * candidate.matrix11 - candidate.matrix01 * candidate.matrix10;
}

function createcanvaspreview() {
  const tintcanvas = document.createElement("canvas");
  const tintcontext = tintcanvas.getContext("2d", {willReadFrequently: true});

  function paintbackground(context, width, height, screenwidth, screenheight, tile, tilepixels, color) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    if (tile && tilepixels) {
      const tilewidth = tile.width;
      const tileheight = tile.height;
      const pixels = context.createImageData(width, height);
      const destination = pixels.data;
      const source = tilepixels;
      const wrap = (value, size) => (value % size + size) % size;
      const phasecenterx = 255.6;
      const phasecentery = 384.3;
      for (let y = 0; y < height; y += 1) {
        const screeny = phasecentery + (y + 0.5 - height / 2) * screenheight / height;
        const sourcey = wrap(screeny * tileheight / 576 - 0.5, tileheight);
        const y0 = Math.floor(sourcey);
        const y1 = (y0 + 1) % tileheight;
        const fy = sourcey - y0;
        for (let x = 0; x < width; x += 1) {
          const screenx = phasecenterx + (x + 0.5 - width / 2) * screenwidth / width;
          const sourcex = wrap(screenx * tilewidth / 576 - 0.5, tilewidth);
          const x0 = Math.floor(sourcex);
          const x1 = (x0 + 1) % tilewidth;
          const fx = sourcex - x0;
          const offset00 = (y0 * tilewidth + x0) * 4;
          const offset10 = (y0 * tilewidth + x1) * 4;
          const offset01 = (y1 * tilewidth + x0) * 4;
          const offset11 = (y1 * tilewidth + x1) * 4;
          const upperweight = 1 - fy;
          const lowerweight = fy;
          const leftweight = 1 - fx;
          const rightweight = fx;
          const index = (y * width + x) * 4;
          for (let channel = 0; channel < 3; channel += 1) {
            const upper = source[offset00 + channel] * leftweight + source[offset10 + channel] * rightweight;
            const lower = source[offset01 + channel] * leftweight + source[offset11 + channel] * rightweight;
            destination[index + channel] = (upper * upperweight + lower * lowerweight) * color[channel] / 255;
          }
          destination[index + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
    } else {
      context.fillStyle = `rgb(${color.join(",")})`;
      context.fillRect(0, 0, width, height);
    }
    context.restore();
  }

  function drawcandidate(context, candidate, scalex, scaley, spriteimages, spritedimensions) {
    preparecanvascandidate(candidate);
    const meshes = (candidate.asset.mesh || []).map((sprite, index) => ({
      sprite,
      index,
      order: candidate.asset.meshorder?.[index],
    }));
    meshes.sort((left, right) => {
      const leftorder = left.order ? left.order.order : left.index;
      const rightorder = right.order ? right.order.order : right.index;
      return leftorder - rightorder;
    });
    for (const entry of meshes) {
      const sprite = entry.sprite;
      const fallback = [candidate.red, candidate.green, candidate.blue];
      const tint = sprite.role === "fixed"
        ? (sprite.fixedColor || [255, 255, 255])
        : sprite.role === "detail" && Array.isArray(candidate.detailRGB)
          ? candidate.detailRGB
          : sprite.role !== "detail" && Array.isArray(candidate.baseRGB)
            ? candidate.baseRGB
            : fallback;
      const page = spriteimages[sprite.page];
      const [left, top, width, height] = sprite.source;
      const [pagewidth, pageheight] = spritedimensions[sprite.page];
      const quadpoints = sprite.vertices.map(([x, y]) => {
        const localx = (x - candidate.asset.centrex) * candidate.width / candidate.asset.naturalwidth;
        const localy = -(y - candidate.asset.centrey) * candidate.height / candidate.asset.naturalheight;
        return {
          x: (candidate.x + candidate.matrix00 * localx + candidate.matrix01 * localy) * scalex,
          y: (candidate.y + candidate.matrix10 * localx + candidate.matrix11 * localy) * scaley,
        };
      });
      const uv = sprite.uv;
      const deviationx = (uv[2][0] - uv[1][0] - uv[3][0] + uv[0][0]) * pagewidth;
      const deviationy = (uv[2][1] - uv[1][1] - uv[3][1] + uv[0][1]) * pageheight;
      const geometryx = quadpoints[2].x - quadpoints[1].x - quadpoints[3].x + quadpoints[0].x;
      const geometryy = quadpoints[2].y - quadpoints[1].y - quadpoints[3].y + quadpoints[0].y;
      const pieces = (Math.max(Math.abs(deviationx), Math.abs(deviationy)) > 1 && !candidate.legacyuv)
        || Math.max(Math.abs(geometryx), Math.abs(geometryy)) > 0.000001
        ? [[0, 1, 1, 3], [1, 2, 3, 3]]
        : [[0, 1, 2, 3]];
      tintcanvas.width = width;
      tintcanvas.height = height;
      tintcontext.globalCompositeOperation = "source-over";
      tintcontext.globalAlpha = 1;
      tintcontext.clearRect(0, 0, width, height);
      tintcontext.drawImage(page, left, top, width, height, 0, 0, width, height);
      const tinted = tintcontext.getImageData(0, 0, width, height);
      const data = tinted.data;
      const red = tint[0] / 255;
      const green = tint[1] / 255;
      const blue = tint[2] / 255;
      for (let offset = 0; offset < data.length; offset += 4) {
        data[offset] = Math.round(data[offset] * red);
        data[offset + 1] = Math.round(data[offset + 1] * green);
        data[offset + 2] = Math.round(data[offset + 2] * blue);
      }
      tintcontext.putImageData(tinted, 0, 0);
      for (const piece of pieces) {
        const points = piece.map(index => quadpoints[index]);
        const coordinates = piece.map(index => uv[index]);
        const s0 = [coordinates[0][0] * pagewidth - left, coordinates[0][1] * pageheight - top];
        const s1 = [coordinates[1][0] * pagewidth - left, coordinates[1][1] * pageheight - top];
        const s3 = [coordinates[3][0] * pagewidth - left, coordinates[3][1] * pageheight - top];
        const dx1 = s1[0] - s0[0];
        const dy1 = s1[1] - s0[1];
        const dx3 = s3[0] - s0[0];
        const dy3 = s3[1] - s0[1];
        const determinant = dx1 * dy3 - dx3 * dy1;
        if (Math.abs(determinant) < 1e-8) continue;
        const tx1 = points[1].x - points[0].x;
        const ty1 = points[1].y - points[0].y;
        const tx3 = points[3].x - points[0].x;
        const ty3 = points[3].y - points[0].y;
        const a = (tx1 * dy3 - tx3 * dy1) / determinant;
        const c = (-tx1 * dx3 + tx3 * dx1) / determinant;
        const b = (ty1 * dy3 - ty3 * dy1) / determinant;
        const d = (-ty1 * dx3 + ty3 * dx1) / determinant;
        const e = points[0].x - a * s0[0] - c * s0[1];
        const f = points[0].y - b * s0[0] - d * s0[1];
        context.save();
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        context.lineTo(points[1].x, points[1].y);
        context.lineTo(points[2].x, points[2].y);
        context.lineTo(points[3].x, points[3].y);
        context.closePath();
        context.clip();
        context.globalCompositeOperation = sprite.blendDestination === 1 ? "lighter" : "source-over";
        context.globalAlpha = sprite.opacity;
        context.imageSmoothingEnabled = sprite.sampler !== "nearest" && candidate.smoothingquality !== "nearest";
        context.imageSmoothingQuality = candidate.smoothingquality || "medium";
        context.transform(a, b, c, d, e, f);
        context.drawImage(tintcanvas, 0, 0);
        context.restore();
      }
    }
  }

  function renderobjects(context, plan, scalex, scaley, spriteimages, spritedimensions) {
    for (const candidate of plan) drawcandidate(context, candidate, scalex, scaley, spriteimages, spritedimensions);
  }

  return {paintbackground, renderobjects};
}

window.nativepreview = createcanvaspreview();
