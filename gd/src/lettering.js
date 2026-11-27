function setgoldtext(label, content) {
  label.dataset.text = content;
  const face = document.createElement("span");
  face.className = "gdgoldface";
  for (const text of content.match(/[\p{Ll} ]+|[^\p{Ll} ]+/gu) || []) {
    const run = document.createElement("span");
    run.className = /^[\p{Ll} ]/u.test(text) ? "gdgoldrun gdgoldsmall" : "gdgoldrun";
    run.textContent = text;
    face.append(run);
  }
  const outline = face.cloneNode(false);
  outline.className = "gdgoldoutline";
  outline.setAttribute("aria-hidden", "true");
  for (const run of face.children) {
    const copy = run.cloneNode(false);
    copy.dataset.text = run.textContent;
    outline.append(copy);
  }
  label.replaceChildren(outline, face);
}

/*//////////////////////////////////////////////////////////////////////*/

(() => {
  document.querySelectorAll("gold").forEach(label => label.classList.add("gdgold"));
  document.querySelectorAll("oxygene").forEach(label => label.classList.add("gdlogo"));

  for (const label of document.querySelectorAll(".gdgold")) setgoldtext(label, label.textContent);

  /*//////////////////////////////////////////////////////////////////////*/

  const logos = document.querySelectorAll(".gdlogo");
  for (const label of logos) {
    const face = document.createElement("span");
    face.className = "gdlogoface";
    face.append(...label.childNodes);
    label.append(face);
    label.dataset.text = label.textContent;
  }
})();
