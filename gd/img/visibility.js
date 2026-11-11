const visibilitycost = 5;

function visibilityrequired(candidates = plan) {
  const pixelscale = 720 / Math.max(target.width, 1);
  return candidates.some(candidate => {
    if (candidate.role !== "underlay" && !(candidate.macro && macroassets.has(candidate.asset.id))) return false;
    return candidate.width * pixelscale > candidate.asset.naturalwidth * 3 + 0.000001
      || candidate.height * pixelscale > candidate.asset.naturalheight * 3 + 0.000001;
  });
}

function visibilitycount() {
  return Number(limitslider.value) > visibilitycost && visibilityrequired() ? visibilitycost : 0;
}

function visibilitywarning() {
  return visibilityrequired() && !visibilitycount()
    ? " Low object limit: oversized shapes may unload during gameplay." : "";
}

/*//////////////////////////////////////////////////////////////////////*/

function visibilityobjects() {
  if (!visibilitycount()) return [];
  const objects = [];
  for (let index = 0; index < 4; index += 1) {
    objects.push(["1", "495", "2", cleannumber(levelorigin.x + 1 + 718 * index / 3),
      "3", cleannumber(levelorigin.y - 30), "21", "999", "22", "999", "57", "5001",
      "135", "1", "128", "0.001", "129", "0.001", "121", "1", "372", "1"].join(","));
  }
  objects.push(["1", "3662", "2", "30", "3", "180", "51", "5001"].join(","));
  return objects;
}
