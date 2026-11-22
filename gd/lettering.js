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
  label.replaceChildren(face);
}

/*//////////////////////////////////////////////////////////////////////*/

(() => {
  document.querySelectorAll("gold").forEach(label => label.classList.add("gdgold"));
  document.querySelectorAll("oxygene").forEach(label => label.classList.add("gdlogo"));

  for (const label of document.querySelectorAll(".gdplain")) {
    const synctext = () => {label.dataset.text = label.textContent;};
    synctext();
    new MutationObserver(synctext).observe(label, {childList: true, characterData: true, subtree: true});
  }

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
