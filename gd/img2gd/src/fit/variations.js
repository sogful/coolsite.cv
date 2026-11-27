const variantcontrols = document.querySelector(".variantcontrols");
const variantchoice = document.querySelector(".variantchoice");
const variantselect = document.querySelector(".variantselect");
const variantmore = document.querySelector(".variantmore");
const variants = [];
let variantbuilding = false;
let variantindex = 0;
let variantseed = 0;
let variantpublish;

function clearvariants() {
  clearTimeout(variantpublish);
  variants.length = 0;
  variantindex = variantseed = 0;
  variantbuilding = false;
  variantcontrols.hidden = true;
}

function variantstate(objects = plan) {
  return {objects:objects.map(object => ({...object})), target:{...target}, imageopaque,
    regionfitactive, targetpixels, underlaycount, underlaymessage, fitpoolname};
}

function usevariant(item) {
  ({target, imageopaque, regionfitactive, targetpixels, underlaycount, underlaymessage, fitpoolname} = item);
  plan = item.objects;
}

function storevariant() {
  if (!plan.length) return;
  const raw = buildsource();
  if (variants.length && raw.objects > objectlimit()) return;
  if (variants.some(item => item.raw === raw.raw)) return;
  variants.push({...variantstate(), raw:raw.raw});
}

function showvariants() {
  variantselect.replaceChildren(...variants.map((_,index) => new Option(
    index ? String(index) : "original", String(index))));
  variantselect.value = String(variantindex);
  variantchoice.hidden = variants.length < 2;
  variantselect.disabled = variantbuilding;
  variantmore.disabled = variantbuilding || variants.length >= 16;
}

function openvariants() {
  if (legacyactive || pixelartactive || !plan.length) return;
  storevariant();
  variantcontrols.hidden = false;
  showvariants();
}

/*//////////////////////////////////////////////////////////////////////*/

function selectvariant(index) {
  if (variantbuilding || !variants[index] || index === variantindex) return;
  const revision = ++fitrevision;
  fitreadyrevision = revision;
  variantindex = index;
  variantselect.value = String(index);
  usevariant(variants[index]);
  invalidateexports();
  drawresult();
  statuscopy.textContent = "preparing files...";
  clearTimeout(variantpublish);
  variantpublish = setTimeout(async () => {
    try {
      await updatepreview();
      if (revision === fitrevision) statuscopy.textContent = "";
    } catch (error) {
      if (revision === fitrevision) statuscopy.textContent = "could not export this variation";
      console.error(error);
    }
  }, 100);
}

variantselect.addEventListener("change", () => selectvariant(Number(variantselect.value)));
let wheeldistance = 0;
let wheeltime = 0;
variantchoice.addEventListener("wheel", event => {
  if (variantbuilding || event.ctrlKey || !event.deltaY) return;
  const direction = Math.sign(event.deltaY);
  const next = Math.max(0, Math.min(variants.length - 1, variantindex + direction));
  event.preventDefault();
  if (next === variantindex) return;
  if (performance.now() - wheeltime > 180 || Math.sign(wheeldistance) !== direction) wheeldistance = 0;
  wheeltime = performance.now();
  wheeldistance += event.deltaY * (event.deltaMode ? 16 : 1);
  if (Math.abs(wheeldistance) < 24) return;
  wheeldistance = 0;
  selectvariant(next);
}, {passive:false});

/*//////////////////////////////////////////////////////////////////////*/

variantmore.addEventListener("click", async () => {
  if (!variants.length || variantbuilding || fitting || fitpublishing) return;
  clearTimeout(variantpublish);
  const revision = ++fitrevision;
  fitreadyrevision = revision;
  const selected = variants[variantindex];
  const starting = variants.length;
  const targetcount = Math.min(starting + 4, 16);
  const limit = objectlimit();
  variantbuilding = fitpublishing = true;
  lockfitcontrols(true);
  updatestart();
  showvariants();
  statuscopy.textContent = "fitting variations...";
  try {
    const contours = !sourceisopaque() && !(croptoggle.checked && !croptoggle.disabled);
    if (contours) {
      await fitlayeredcontours(Math.max(0,limit - visibilitycost), revision, objects => {
        plan = objects;
        underlaycount = 0;
        storevariant();
        return variants.length < targetcount;
      });
    }
    for (let trial = 0; trial < 4 && variants.length < targetcount && revision === fitrevision; trial++) {
      regionfitactive = false;
      preparetarget();
      if (!await fitadaptive(limit, Math.min(32,fittrials()), revision, 97 + ++variantseed * 17)) break;
      if (!await finishcrop(revision,limit)) break;
      storevariant();
    }
    if (revision !== fitrevision) return;
    usevariant(selected);
    await updatepreview();
    if (revision === fitrevision) statuscopy.textContent = variants.length > starting ? "" : "no additional variations found";
  } catch (error) {
    if (revision !== fitrevision) return;
    usevariant(selected);
    statuscopy.textContent = "could not fit more variations";
    console.error(error);
  } finally {
    if (revision === fitrevision) {
      variantbuilding = fitpublishing = false;
      lockfitcontrols(false);
      updatefields();
      showvariants();
    }
  }
});
