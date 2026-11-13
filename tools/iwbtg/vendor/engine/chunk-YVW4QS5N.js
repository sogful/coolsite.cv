// .claude/iwbtg/enginesource/runtime/src/render/resourceCache.ts
var ResourceCache = class {
  images = /* @__PURE__ */ new Map();
  async getImage(src) {
    const cached = this.images.get(src);
    if (cached) {
      return cached;
    }
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
    image.src = src;
    this.images.set(src, image);
    return loaded;
  }
  getCachedImage(src) {
    const cached = this.images.get(src);
    if (!cached) {
      throw new Error(`Image not preloaded: ${src}`);
    }
    return cached;
  }
};
function makeBackgroundPathMap(basePath, resources) {
  return new Map(
    resources.backgrounds.map((background) => [background.id, `${basePath}/${background.image_path}`])
  );
}
function makeSpriteFrameMap(basePath, resources) {
  return new Map(
    resources.sprites.filter((sprite) => sprite.frame_paths[0]).map((sprite) => [
      sprite.id,
      {
        frames: sprite.frame_paths.map((framePath) => ({
          imagePath: `${basePath}/${framePath}`,
          originX: sprite.origin_x,
          originY: sprite.origin_y
        })),
        originX: sprite.origin_x,
        originY: sprite.origin_y
      }
    ])
  );
}

export {
  ResourceCache,
  makeBackgroundPathMap,
  makeSpriteFrameMap
};
