const oxygeneLabels = document.querySelectorAll(".oxygene");
for (const label of oxygeneLabels) {
  const text = label.textContent.trim();
  label.setAttribute("oxygene", text);

  const edge = document.createElement("span");
  edge.className = "oxygeneedge";
  edge.textContent = text;
  edge.setAttribute("aria-hidden", "true");

  const face = document.createElement("span");
  face.className = "oxygeneface";
  face.textContent = text;
  label.replaceChildren(edge, face);
}

const goldLabels = document.querySelectorAll(".gold");
for (const label of goldLabels) {
  label.setAttribute("gold", label.textContent.trim());
}

const scriptUrl = document.currentScript.src;
const artworkUrl = new URL("assets/images/GJ_sideArt_001.png", scriptUrl);
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
