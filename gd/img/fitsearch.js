function capturefit(score) {
  return {score, plan: plan.slice(), pixels: new Uint8ClampedArray(fittedpixels),
    target: {...target}, source: targetpixels, underlaycount, underlaymessage, offset: seedretryoffset};
}

function restorefit(best) {
  plan = best.plan;
  fittedpixels = best.pixels;
  target = best.target;
  targetpixels = best.source;
  underlaycount = best.underlaycount;
  underlaymessage = best.underlaymessage;
  seedretryoffset = best.offset;
}

/*//////////////////////////////////////////////////////////////////////*/

async function runfitsearch(limit, trials, revision) {
  batchfitteractive = false;
  fitpixels = 0;
  fitretries = 0;
  searchcount = 1;
  preparetarget();
  if (fitselect.value === "grid") {
    fitgrid(limit);
    return revision === fitrevision;
  }
  if (!await fitadaptive(limit, trials, revision)) return false;
  if (revision !== fitrevision) return false;
  const detailed = presetselect.value === "detail" || presetselect.value === "max";
  const maxseedsearch = presetselect.value === "max" && trials >= 384 && limit > 0;
  let best = capturefit(detailed ? measurefittedpreview() : measuretargeterror());
  try {
    if (maxseedsearch) {
      const offsets = Number(seedsearchselect.value) >= 6 ? [1, 17, 64, 65, 81] : [1, 17];
      for (const [index, offset] of offsets.entries()) {
        if (revision !== fitrevision) return false;
        statuscopy.textContent = `Comparing search ${index + 2} of ${offsets.length + 1}.`;
        preparetarget();
        if (!await fitadaptive(limit, trials, revision, offset)) return false;
        searchcount += 1;
        const score = measurefittedpreview();
        if (score < best.score) {
          seedretryoffset = offset;
          best = capturefit(score);
        }
      }
    } else if (!detailed && limit > 0 && plan.length < limit
      && plan.length < Math.max(8, limit * 0.05) && best.score > 8) {
      for (const offset of [1, 17]) {
        if (revision !== fitrevision) return false;
        preparetarget();
        if (!await fitadaptive(limit, trials, revision, offset)) return false;
        searchcount += 1;
        const score = measuretargeterror();
        if (score < best.score) {
          seedretryoffset = offset;
          best = capturefit(score);
        }
        if (best.score <= 8 || best.plan.length >= Math.max(8, limit * 0.05)) break;
      }
    }
    if (detailed && limit > 0) {
      const pools = presetselect.value === "max"
        ? [{pixels: 2000, native: false}, {pixels: 2000, native: true}, {pixels: 5200, native: true}]
        : [{pixels: 5200, native: true}];
      for (const [index, pool] of pools.entries()) {
        if (revision !== fitrevision) return false;
        statuscopy.textContent = `Comparing candidate pool ${index + 1} of ${pools.length}.`;
        fitpixels = pool.pixels;
        fitretries = 4;
        batchfitteractive = pool.native;
        if (batchfitteractive && !batchfitter) batchfitter = createbatchfitter();
        preparetarget();
        if (!await fitadaptive(limit, Math.min(96, trials), revision)) return false;
        searchcount += 1;
        const score = measurefittedpreview();
        if (score < best.score) {
          seedretryoffset = 0;
          best = capturefit(score);
        }
      }
    }
    if (revision !== fitrevision) return false;
    restorefit(best);
    return true;
  } finally {
    if (revision === fitrevision) {
      batchfitteractive = false;
      fitpixels = 0;
      fitretries = 0;
      batchfitter?.clear();
    }
  }
}
