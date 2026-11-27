let nextlivepreview = 0;
let fitpartial = null;
let fitbest = null;
let fitpublishing = false;
const underbudget = document.querySelector(".underbudget");

function rememberfit(objects, complete = true) {
  if (!fitting || !objects.length) return;
  const checkpoint = {
    objects: objects.map(object => ({...object})),
    target: {...target}, imageopaque, regionfitactive, pixelartactive,
    legacyactive: legacytoggle.checked, legacyartwidth, seedretryoffset,
  };
  if (complete) fitbest = checkpoint;
  else fitpartial = checkpoint;
}

function startfitpreview() {
  resizecanvases();
  drawsource();
  drawresult([]);
  previewimage.hidden = false;
  clearlivevalues();
  statuscopy.textContent = "Fitting...";
  nextlivepreview = 0;
}

function showfitprogress(revision, objects = plan) {
  if (variantbuilding || revision !== fitrevision || performance.now() < nextlivepreview) return;
  if (typeof objects === "function") objects = objects();
  if (!objects.length) return;
  nextlivepreview = performance.now() + 1000;
  if (!fitbest) rememberfit(objects, false);
  drawresult(objects);
  updatestat(tilecount, objects.length.toLocaleString());
}

/*//////////////////////////////////////////////////////////////////////*/

function updatestart() {
  const label = startbutton.querySelector(".gdgold");
  const text = fitting ? "Abort" : "Start";
  if (label.dataset.text !== text) setgoldtext(label, text);
  startbutton.disabled = !fitting && (fitpublishing || !atlasready || !alphaready || !validrangevalues());
}

function lockfitcontrols(locked) {
  for (const fields of form.querySelectorAll(".sourcefields, .basicfields, .edgeoptions")) fields.inert = locked;
  advancedopen.disabled = locked;
}

function updatefields() {
  const exact = fitselect.value === "pixelart";
  const textures = !exact && !legacytoggle.checked && fitselect.value !== "regions" && !regionfitactive;
  seedsearchselect.disabled = !textures || !maximumfit();
  coverageselect.disabled = !textures || !detailfit();
  samplerselect.disabled = exact;
  underbudget.disabled = exact || legacytoggle.checked;
  croptoggle.disabled = exact || legacytoggle.checked || clearborder;
  for (const slider of [limitslider, effortslider, colourslider]) {
    slider.disabled = exact;
    slider.parentElement.querySelector(".rangevalueeditor").disabled = exact;
  }
  updateoptions();
  updatestart();
}

async function updatepreview() {
  if (fitreadyrevision !== fitrevision) return;
  resizecanvases();
  drawsource();
  drawresult();
  fiterror = measurepreviewerror();
  const result = buildsource();
  invalidateexports();
  const name = levelname();
  const level = new Blob([gmddocument(result.raw, name, legacyactive)], {type: "application/octet-stream"});
  updatestat(tilecount, result.objects.toLocaleString());
  updatestat(gridcount, fiterror.toFixed(1) + "%");
  updatestat(channelcount, result.channels.toLocaleString());
  updatestat(sizecount, prettysize(level.size));
  updatestat(shapecount, new Set(plan.map(object => object.asset.id)).size.toLocaleString());
  renderstate.textContent = pixelartactive ? "PIXEL ART" : "SPRITE FIT";
  statuscopy.textContent = "Preparing files...";
  document.querySelector(".exportlinks").title = visibilitywarning().trim();
  comparison.hidden = false;
  previewdescription.textContent = "Generated image preview";
  enableexport(downloadlink, level, name + ".gmd");
  await prepareexports(result.raw, name);
  if (fitreadyrevision === fitrevision && fitstarttime !== undefined) {
    updatestat(timecount, ((performance.now() - fitstarttime) / 1000).toFixed(1) + "s");
  }
}

/*//////////////////////////////////////////////////////////////////////*/

function resetfitsession() {
  fitting = false;
  fitpublishing = false;
  fitbest = fitpartial = null;
  statuscopy.textContent = "";
  lockfitcontrols(false);
}

async function publishfit(revision) {
  fitting = false;
  fitpublishing = true;
  fitreadyrevision = revision;
  updatestart();
  await updatepreview();
  if (revision === fitrevision) openvariants();
}

async function abortfit() {
  if (!fitting) return;
  const revision = ++fitrevision;
  const checkpoint = fitbest || fitpartial;
  batchfitteractive = false;
  fitpixels = fitretries = 0;
  fitcoverage = 1;
  batchfitter?.clear();
  try {
    if (checkpoint) {
      ({target, imageopaque, regionfitactive, pixelartactive, legacyactive, legacyartwidth, seedretryoffset} = checkpoint);
      plan = checkpoint.objects;
      const limit = objectlimit();
      if (croptoggle.checked && !croptoggle.disabled && !legacyactive && !pixelartactive) {
        plan = plan.filter(cropvalid);
      }
      if (!pixelartactive) {
        const cost = () => plan.length + opacitycost(plan) + (visibilityrequired(plan) ? visibilitycost : 0);
        if (cost() > limit) plan.length = Math.max(0, plan.length - (cost() - limit));
      }
      underlaycount = plan.filter(object => object.role === "underlay").length;
      if (plan.length) {
        await publishfit(revision);
        return;
      }
    }
    fitreadyrevision = -1;
    stats.hidden = true;
    drawidlepreview(sourceimage);
    renderstate.textContent = "ABORTED";
  } catch (error) {
    if (revision !== fitrevision) return;
    renderstate.textContent = "ERROR";
    fitmessage.textContent = "Could not save the partial fit.";
    console.error(error);
  } finally {
    if (revision === fitrevision) {
      resetfitsession();
      updatefields();
    }
  }
}

async function startfit() {
  if (fitting) return abortfit();
  if (startbutton.disabled) return;
  const revision = ++fitrevision;
  clearvariants();
  fitting = true;
  fitbest = fitpartial = null;
  pixelartactive = false;
  legacyactive = false;
  regionfitactive = false;
  previewimage.classList.remove("ispixelart");
  fitstarttime = performance.now();
  fitmessage.textContent = "";
  if (advanceddialog.open) advanceddialog.close();
  lockfitcontrols(true);
  comparison.hidden = true;
  stats.hidden = false;
  channelcount.parentElement.hidden = colourmode.value === "hsv";
  clearlivevalues();
  invalidateexports();
  renderstate.textContent = "FITTING";
  seedretryoffset = 0;
  updatestart();

  try {
    await yieldfittask();
    if (revision !== fitrevision) return;
    if (legacytoggle.checked) {
      if (!await fitlegacy(revision)) return;
    } else if (fitselect.value === "pixelart") {
      if (!await fitpixelart(revision)) return;
    } else {
      const limit = objectlimit();
      if (!await runfitsearch(limit, fittrials(), revision)) return;
      if (revision !== fitrevision) return;
      rememberfit(plan);
      const layerbudget = limit - visibilitycost;
      let layers = !sourceisopaque() && await fitlayeredcontours(layerbudget, revision);
      if (revision !== fitrevision) return;
      if (layers && limit >= 350 && layers.length < layerbudget) {
        const analysis = transparentsource();
        layers = await fitglowunderlay(layers, analysis, layerbudget, revision);
        if (!layers || revision !== fitrevision) return;
        layers = await filltransparentdetails(layers, analysis, layerbudget, revision, true);
        if (revision !== fitrevision) return;
      }
      if (layers && layers.length + opacitycost(layers) + (visibilityrequired(layers) ? visibilitycost : 0) <= limit
        && prefercontourplan(layers, plan)) {
        plan = layers;
        underlaycount = 0;
        rememberfit(plan);
      }
      if (!await finishcrop(revision, limit)) return;
      if (!await spendfitbudget(limit, revision)) return;
    }
    if (revision === fitrevision) await publishfit(revision);
  } catch (error) {
    if (revision !== fitrevision) return;
    renderstate.textContent = "ERROR";
    fitmessage.textContent = "Image fit failed.";
    console.error(error);
  } finally {
    if (revision === fitrevision) {
      resetfitsession();
      updatefields();
    }
  }
}

