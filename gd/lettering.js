(() => {
  for (const label of document.querySelectorAll(".gdplain")) {
    const synctext = () => {label.dataset.text = label.textContent;};
    synctext();
    new MutationObserver(synctext).observe(label, {childList: true, characterData: true, subtree: true});
  }

  for (const label of document.querySelectorAll(".gdgold")) {
    label.dataset.text = label.textContent;
    const face = document.createElement("span");
    face.className = "gdgoldface";
    for (const text of label.dataset.text.match(/[\p{Ll} ]+|[^\p{Ll} ]+/gu) || []) {
      const run = document.createElement("span");
      run.className = /^[\p{Ll} ]/u.test(text) ? "gdgoldrun gdgoldsmall" : "gdgoldrun";
      run.textContent = text;
      face.append(run);
    }
    label.replaceChildren(face);
  }

  for (const label of document.querySelectorAll(".gdlogo")) {
    const face = document.createElement("span");
    face.className = "gdlogoface";
    face.append(...label.childNodes);
    label.append(face);
    label.dataset.text = label.textContent;
    face.dataset.text = label.dataset.text;
  }
})();
