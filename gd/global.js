const oxygeneLabels = document.querySelectorAll(".oxygene");

for (const label of oxygeneLabels) {
  const text = label.textContent.trim();
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
  artwork.fetchPriority = "low";
  document.body.append(artwork);
}
