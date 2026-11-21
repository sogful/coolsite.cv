const texturepools = {white: []};
let fitpoolname = "full";

function preparetexturepools() {
  texturepools.white = library.filter(asset => {
    if (asset.fixedonly) return false;
    const [left, top, width, height] = asset.source;
    let opaque = 0;
    let colorful = 0;
    let dim = 0;
    for (let y = top; y < top + height; y += 1) {
      for (let x = left; x < left + width; x += 1) {
        const offset = (y * asset.pagewidth + x) * 4;
        if (asset.pixels[offset + 3] < 128) continue;
        const red = asset.pixels[offset];
        const green = asset.pixels[offset + 1];
        const blue = asset.pixels[offset + 2];
        const maximum = Math.max(red, green, blue);
        opaque += 1;
        if (maximum - Math.min(red, green, blue) > 8) colorful += 1;
        if (maximum < 246) dim += 1;
      }
    }
    return colorful <= opaque * 0.01 && dim <= opaque * 0.01;
  });
}

/*//////////////////////////////////////////////////////////////////////*/

function fitassetpool() {
  if (fitpoolname === "white" && texturepools.white.length) return texturepools.white;
  return samplinglibrary.length ? samplinglibrary : library;
}
