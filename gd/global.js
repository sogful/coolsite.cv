const oxygeneLabels = document.querySelectorAll(".oxygene");
const svgNamespace = "http://www.w3.org/2000/svg";
const filterSvg = document.createElementNS(svgNamespace, "svg");
filterSvg.setAttribute("aria-hidden", "true");
filterSvg.style.position = "absolute";
filterSvg.style.width = "0";
filterSvg.style.height = "0";

const lightFilter = document.createElementNS(svgNamespace, "filter");
lightFilter.id = "oxygenelightfilter";
lightFilter.setAttribute("x", "-10%");
lightFilter.setAttribute("y", "-10%");
lightFilter.setAttribute("width", "120%");
lightFilter.setAttribute("height", "120%");

const upperEdgeFilter = document.createElementNS(svgNamespace, "filter");
upperEdgeFilter.id = "oxygeneupperedgefilter";
upperEdgeFilter.setAttribute("x", "-10%");
upperEdgeFilter.setAttribute("y", "-10%");
upperEdgeFilter.setAttribute("width", "120%");
upperEdgeFilter.setAttribute("height", "130%");

const lowerEdgeFilter = document.createElementNS(svgNamespace, "filter");
lowerEdgeFilter.id = "oxygeneloweredgefilter";
lowerEdgeFilter.setAttribute("x", "-10%");
lowerEdgeFilter.setAttribute("y", "-10%");
lowerEdgeFilter.setAttribute("width", "120%");
lowerEdgeFilter.setAttribute("height", "130%");

const blackBorderFilter = document.createElementNS(svgNamespace, "filter");
blackBorderFilter.id = "oxygeneblackborderfilter";
blackBorderFilter.setAttribute("x", "-10%");
blackBorderFilter.setAttribute("y", "-10%");
blackBorderFilter.setAttribute("width", "120%");
blackBorderFilter.setAttribute("height", "120%");

const addFilterNode = (filter, name, attributes) => {
  const node = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  filter.append(node);
  return node;
};

addFilterNode(lightFilter, "feOffset", { in: "SourceAlpha", dx: "0", dy: "2", result: "below" });
addFilterNode(lightFilter, "feComposite", { in: "SourceAlpha", in2: "below", operator: "out", result: "topEdge" });
addFilterNode(lightFilter, "feOffset", { in: "SourceAlpha", dx: "2", dy: "0", result: "right" });
addFilterNode(lightFilter, "feComposite", { in: "SourceAlpha", in2: "right", operator: "out", result: "leftEdge" });
addFilterNode(lightFilter, "feComposite", { in: "topEdge", in2: "leftEdge", operator: "over", result: "highlightEdge" });
addFilterNode(lightFilter, "feFlood", { "flood-color": "#ffffaa", result: "highlightColor" });
addFilterNode(lightFilter, "feComposite", { in: "highlightColor", in2: "highlightEdge", operator: "in" });

addFilterNode(upperEdgeFilter, "feOffset", { in: "SourceAlpha", dx: "0", dy: "8", result: "offset" });
addFilterNode(upperEdgeFilter, "feComposite", { in: "offset", in2: "SourceAlpha", operator: "out", result: "edge" });
addFilterNode(upperEdgeFilter, "feFlood", { "flood-color": "#88cc33", result: "edgeColor" });
addFilterNode(upperEdgeFilter, "feComposite", { in: "edgeColor", in2: "edge", operator: "in" });

addFilterNode(lowerEdgeFilter, "feOffset", { in: "SourceAlpha", dx: "0", dy: "8", result: "innerOffset" });
addFilterNode(lowerEdgeFilter, "feOffset", { in: "SourceAlpha", dx: "0", dy: "14", result: "outerOffset" });
addFilterNode(lowerEdgeFilter, "feComposite", { in: "outerOffset", in2: "innerOffset", operator: "out", result: "edge" });
addFilterNode(lowerEdgeFilter, "feFlood", { "flood-color": "#66aa22", result: "edgeColor" });
addFilterNode(lowerEdgeFilter, "feComposite", { in: "edgeColor", in2: "edge", operator: "in" });

addFilterNode(blackBorderFilter, "feOffset", { in: "SourceAlpha", dx: "0", dy: "14", result: "extrusion" });
addFilterNode(blackBorderFilter, "feComposite", { in: "extrusion", in2: "SourceAlpha", operator: "over", result: "silhouette" });
addFilterNode(blackBorderFilter, "feGaussianBlur", { in: "silhouette", stdDeviation: "2", result: "softExpansion" });
const expansionTransfer = addFilterNode(blackBorderFilter, "feComponentTransfer", { in: "softExpansion", result: "expanded" });
const expansionAlpha = document.createElementNS(svgNamespace, "feFuncA");
expansionAlpha.setAttribute("type", "linear");
expansionAlpha.setAttribute("slope", "12");
expansionAlpha.setAttribute("intercept", "-1.2");
expansionTransfer.append(expansionAlpha);
addFilterNode(blackBorderFilter, "feComposite", { in: "expanded", in2: "silhouette", operator: "out", result: "outerRing" });
addFilterNode(blackBorderFilter, "feFlood", { "flood-color": "#000", result: "borderColor" });
addFilterNode(blackBorderFilter, "feComposite", { in: "borderColor", in2: "outerRing", operator: "in" });

filterSvg.append(upperEdgeFilter, lowerEdgeFilter, blackBorderFilter, lightFilter);
document.body.prepend(filterSvg);

for (const label of oxygeneLabels) {
  const text = label.textContent.trim();
  label.setAttribute("aria-label", text);
  const upperedge = document.createElement("span");
  upperedge.className = "oxygeneupperedge";
  upperedge.textContent = text;
  upperedge.setAttribute("aria-hidden", "true");

  const loweredge = document.createElement("span");
  loweredge.className = "oxygeneloweredge";
  loweredge.textContent = text;
  loweredge.setAttribute("aria-hidden", "true");

  const white = document.createElement("span");
  white.className = "oxygenewhite";
  white.textContent = text;
  white.setAttribute("aria-hidden", "true");

  const fill = document.createElement("span");
  fill.className = "oxygenefill";
  fill.textContent = text;
  fill.setAttribute("aria-hidden", "true");

  const border = document.createElement("span");
  border.className = "oxygeneborder";
  border.textContent = text;
  border.setAttribute("aria-hidden", "true");

  const light = document.createElement("span");
  light.className = "oxygenelight";
  light.textContent = text;
  light.setAttribute("aria-hidden", "true");

  const face = document.createElement("span");
  face.className = "oxygeneface";
  face.textContent = text;
  face.setAttribute("aria-hidden", "true");
  label.replaceChildren(upperedge, loweredge, white, fill, border, light, face);
}

const goldLabels = document.querySelectorAll(".gold");
for (const label of goldLabels) {
  label.setAttribute("gold", label.textContent.trim());
}

const scriptUrl = document.currentScript.src;
const artworkUrl = new URL("assets/images/corner.png", scriptUrl);
const corners = ["topleft", "topright", "bottomright", "bottomleft"];
for (const corner of corners) {
  const artwork = document.createElement("img");
  artwork.className = `gdcornerart gdcornerart${corner}`;
  artwork.src = artworkUrl.href;
  artwork.alt = "";
  artwork.setAttribute("aria-hidden", "true");
  artwork.decoding = "async";
  document.body.append(artwork);
}
