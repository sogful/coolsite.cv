import {
  ResourceCache,
  makeBackgroundPathMap,
  makeSpriteFrameMap
} from "./chunk-YVW4QS5N.js";

// .claude/iwbtg/enginesource/runtime/src/render/wasmFrameRenderer.ts
function rgbaToCss([r, g, b, a]) {
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}
function makeFontMap(resources) {
  return new Map((resources.fonts ?? []).map((font) => [font.name.toLowerCase(), font]));
}
function canvasFontForText(command, fonts) {
  const font = command.fontName ? fonts.get(command.fontName.toLowerCase()) : void 0;
  const italic = command.fontItalic ?? font?.italic ?? false;
  const bold = command.fontBold ?? font?.bold ?? false;
  const style = [
    italic ? "italic" : "",
    bold ? "700" : "",
    `${command.size}px`,
    font?.system_name ? `${JSON.stringify(font.system_name)}, sans-serif` : "sans-serif"
  ].filter(Boolean);
  return style.join(" ");
}
function resourcePath(basePath, path) {
  return `${basePath.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
function fontForCommand(command, fonts) {
  return command.fontName ? fonts.get(command.fontName.toLowerCase()) : void 0;
}
function fontAtlasPath(basePath, font) {
  if (!font?.image_path || !font.glyphs?.length) {
    return null;
  }
  return resourcePath(basePath, font.image_path);
}
function drawBitmapText(context, atlas, command, font) {
  if (!font.glyphs?.length || typeof document === "undefined") {
    return false;
  }
  const glyphs = new Map(font.glyphs.map((glyph) => [glyph.code, glyph]));
  const placements = [];
  let textWidth = 0;
  let textHeight = 0;
  let minDrawX = 0;
  let maxDrawX = 0;
  let hasVisibleGlyph = false;
  for (const char of command.text) {
    const code = char.codePointAt(0) ?? 0;
    const glyph = glyphs.get(code) ?? glyphs.get(32);
    if (!glyph) {
      continue;
    }
    const drawX = textWidth + glyph.offset;
    placements.push({ glyph, drawX });
    if (glyph.width > 0 && glyph.height > 0) {
      minDrawX = hasVisibleGlyph ? Math.min(minDrawX, drawX) : drawX;
      maxDrawX = hasVisibleGlyph ? Math.max(maxDrawX, drawX + glyph.width) : drawX + glyph.width;
      hasVisibleGlyph = true;
    }
    textWidth += glyph.advance || glyph.width;
    textHeight = Math.max(textHeight, glyph.height);
  }
  if (placements.length === 0) {
    return false;
  }
  if (!hasVisibleGlyph || textWidth <= 0 || textHeight <= 0) {
    return true;
  }
  const mask = document.createElement("canvas");
  mask.width = Math.max(1, Math.ceil(maxDrawX - minDrawX));
  mask.height = Math.max(1, Math.ceil(textHeight));
  const maskContext = mask.getContext("2d");
  if (!maskContext) {
    return false;
  }
  for (const { glyph, drawX } of placements) {
    if (glyph.width <= 0 || glyph.height <= 0) {
      continue;
    }
    maskContext.drawImage(
      atlas,
      glyph.x,
      glyph.y,
      glyph.width,
      glyph.height,
      drawX - minDrawX,
      0,
      glyph.width,
      glyph.height
    );
  }
  maskContext.globalCompositeOperation = "source-in";
  maskContext.fillStyle = rgbaToCss(command.colour);
  maskContext.fillRect(0, 0, mask.width, mask.height);
  let x = command.x;
  if (command.align === "center") {
    x -= textWidth / 2;
  } else if (command.align === "right") {
    x -= textWidth;
  }
  context.drawImage(mask, x + minDrawX, command.y);
  return true;
}
function resolveAxisPositions(offset, imageSize, roomSize, shouldTile) {
  if (!shouldTile || imageSize <= 0) {
    return [offset];
  }
  let start = offset;
  while (start > 0) {
    start -= imageSize;
  }
  while (start + imageSize <= 0) {
    start += imageSize;
  }
  const positions = [];
  for (let position = start; position < roomSize; position += imageSize) {
    positions.push(position);
  }
  return positions.length > 0 ? positions : [offset];
}
function drawBackground(context, frame, image, command) {
  if (command.stretch) {
    context.drawImage(image, 0, 0, frame.width, frame.height);
    return;
  }
  const xPositions = resolveAxisPositions(command.x, image.width, frame.width, command.tileHorz);
  const yPositions = resolveAxisPositions(command.y, image.height, frame.height, command.tileVert);
  for (const x of xPositions) {
    for (const y of yPositions) {
      context.drawImage(image, x, y);
    }
  }
}
function drawTile(context, image, command) {
  const drawWidth = Math.max(1, Math.round(command.width * command.xscale));
  const drawHeight = Math.max(1, Math.round(command.height * command.yscale));
  context.drawImage(
    image,
    command.tileX,
    command.tileY,
    command.width,
    command.height,
    command.x,
    command.y,
    drawWidth,
    drawHeight
  );
}
function resolveSpriteFrame(sprite, frameIndex) {
  if (sprite.frames.length === 0) {
    return null;
  }
  const resolvedIndex = Number.isFinite(frameIndex) && frameIndex >= 0 ? frameIndex % sprite.frames.length : 0;
  return sprite.frames[resolvedIndex] ?? sprite.frames[0] ?? null;
}
async function renderWasmFrame(canvas, frame, resources, basePath, cache = new ResourceCache()) {
  if (canvas.width !== frame.width) {
    canvas.width = frame.width;
  }
  if (canvas.height !== frame.height) {
    canvas.height = frame.height;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2d context unavailable");
  }
  const backgroundPaths = makeBackgroundPathMap(basePath, resources);
  const spritePaths = makeSpriteFrameMap(basePath, resources);
  const fonts = makeFontMap(resources);
  const imagesToLoad = /* @__PURE__ */ new Set();
  for (const command of frame.commands) {
    switch (command.kind) {
      case "drawBackground": {
        const path = backgroundPaths.get(command.backgroundId);
        if (path) {
          imagesToLoad.add(path);
        }
        break;
      }
      case "drawTile": {
        const path = backgroundPaths.get(command.backgroundId);
        if (path) {
          imagesToLoad.add(path);
        }
        break;
      }
      case "drawSprite": {
        const sprite = spritePaths.get(command.spriteId);
        const frame2 = sprite ? resolveSpriteFrame(sprite, command.frameIndex) : null;
        if (frame2) {
          imagesToLoad.add(frame2.imagePath);
        }
        break;
      }
      case "drawText": {
        const path = fontAtlasPath(basePath, fontForCommand(command, fonts));
        if (path) {
          imagesToLoad.add(path);
        }
        break;
      }
    }
  }
  await Promise.all([...imagesToLoad].map((path) => cache.getImage(path)));
  for (const command of frame.commands) {
    switch (command.kind) {
      case "clear":
        context.clearRect(0, 0, frame.width, frame.height);
        context.fillStyle = rgbaToCss(command.colour);
        context.fillRect(0, 0, frame.width, frame.height);
        break;
      case "drawBackground": {
        const path = backgroundPaths.get(command.backgroundId);
        if (!path) {
          continue;
        }
        const image = cache.getCachedImage(path);
        drawBackground(context, frame, image, command);
        break;
      }
      case "drawTile": {
        const path = backgroundPaths.get(command.backgroundId);
        if (!path) {
          continue;
        }
        const image = cache.getCachedImage(path);
        drawTile(context, image, command);
        break;
      }
      case "drawSprite": {
        const sprite = spritePaths.get(command.spriteId);
        if (!sprite) {
          continue;
        }
        const frame2 = resolveSpriteFrame(sprite, command.frameIndex);
        if (!frame2) {
          continue;
        }
        const image = cache.getCachedImage(frame2.imagePath);
        context.save();
        context.globalAlpha = Math.max(0, Math.min(1, command.alpha ?? 1));
        context.translate(command.x, command.y);
        if (command.angleDegrees !== 0) {
          context.rotate(command.angleDegrees * Math.PI / 180);
        }
        if (command.xscale !== 1 || command.yscale !== 1) {
          context.scale(command.xscale, command.yscale);
        }
        context.drawImage(image, -command.originX, -command.originY);
        context.restore();
        break;
      }
      case "fillRect":
        context.fillStyle = rgbaToCss(command.colour);
        context.fillRect(command.x, command.y, command.width, command.height);
        break;
      case "drawText":
        context.save();
        context.fillStyle = rgbaToCss(command.colour);
        {
          const font = fontForCommand(command, fonts);
          const path = fontAtlasPath(basePath, font);
          const drewBitmapText = font && path ? drawBitmapText(context, cache.getCachedImage(path), command, font) : false;
          if (!drewBitmapText) {
            context.font = canvasFontForText(command, fonts);
            context.textAlign = command.align;
            context.textBaseline = "top";
            context.fillText(command.text, command.x, command.y);
          }
        }
        context.restore();
        break;
      case "present":
        break;
    }
  }
}
export {
  renderWasmFrame
};
