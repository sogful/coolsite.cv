const cataloggrid = document.querySelector(".cataloggrid");
const catalogsearch = document.querySelector(".catalogsearch");
const catalogcount = document.querySelector(".catalogcount");
const catalogmore = document.querySelector(".catalogmore");
const catalogdialog = document.querySelector(".catalogdialog");

let catalogresults = [];
const cataloguses = new Map();
let cataloglimit = 72;

/*//////////////////////////////////////////////////////////////////////*/

function catalogdescription(asset) {
  const uses = cataloguses.get(asset.id) || 0;
  return `${Math.round(asset.naturalwidth)} × ${Math.round(asset.naturalheight)} · ${asset.spritecount} sprite${asset.spritecount === 1 ? "" : "s"}${uses ? ` · used ${uses}×` : ""}`;
}

function catalogmatches(asset, query) {
  if (!query) return true;
  return `${asset.id} ${asset.naturalwidth} ${asset.naturalheight} ${asset.spritecount} ${asset.content}`.toLowerCase().includes(query);
}

function makecatalogcard(asset) {
  const card = document.createElement("article");
  card.className = "catalogcard";
  const thumb = document.createElement("canvas");
  thumb.className = "catalogthumb";
  thumb.width = 176;
  thumb.height = 72;
  const context = thumb.getContext("2d");
  const [left, top, width, height] = asset.source;
  const scale = Math.min(156 / width, 54 / height);
  const drawwidth = width * scale;
  const drawheight = height * scale;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(atlasimages[asset.page], left, top, width, height,
    (thumb.width - drawwidth) / 2, (thumb.height - drawheight) / 2, drawwidth, drawheight);
  const id = document.createElement("span");
  id.className = "catalogid";
  id.textContent = `OBJECT ${asset.id}`;
  const meta = document.createElement("span");
  meta.className = "catalogmeta";
  meta.textContent = catalogdescription(asset);
  card.append(thumb, id, meta);
  return card;
}

function rendercatalog(reset = false) {
  if (!atlasready || !catalogdialog.open) return;
  if (reset) {
    const query = catalogsearch.value.trim().toLowerCase();
    catalogresults = library.filter(asset => catalogmatches(asset, query));
    cataloglimit = Math.min(72, catalogresults.length);
    cataloggrid.replaceChildren();
  }
  const existing = cataloggrid.childElementCount;
  for (const asset of catalogresults.slice(existing, cataloglimit)) cataloggrid.append(makecatalogcard(asset));
  catalogcount.textContent = catalogresults.length === library.length
    ? `${library.length.toLocaleString()} native object IDs · showing ${Math.min(cataloglimit, catalogresults.length).toLocaleString()}`
    : `${catalogresults.length.toLocaleString()} matches · showing ${Math.min(cataloglimit, catalogresults.length).toLocaleString()}`;
  catalogmore.hidden = cataloglimit >= catalogresults.length;
}

function updatecatalogusage() {
  cataloguses.clear();
  for (const object of plan) {
    const id = object.asset.id;
    cataloguses.set(id, (cataloguses.get(id) || 0) + 1);
  }
  cataloggrid.querySelectorAll(".catalogmeta").forEach((meta, index) => {
    const text = catalogdescription(catalogresults[index]);
    if (meta.textContent !== text) meta.textContent = text;
  });
}

/*//////////////////////////////////////////////////////////////////////*/

catalogsearch.addEventListener("input", () => rendercatalog(true));
catalogmore.addEventListener("click", () => {
  cataloglimit = Math.min(catalogresults.length, cataloglimit + 72);
  rendercatalog();
});
document.querySelector(".catalogopen").addEventListener("click", () => {
  catalogdialog.showModal();
  rendercatalog(!cataloggrid.childElementCount);
  updatecatalogusage();
});
