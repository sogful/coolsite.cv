(() => {
  document.querySelectorAll("gold").forEach(label => label.classList.add("gdgold"));
  document.querySelectorAll("oxygene").forEach(label => label.classList.add("gdlogo"));

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

  /*//////////////////////////////////////////////////////////////////////*/

  const logos = document.querySelectorAll(".gdlogo");
  if (logos.length) {
    const filters = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    filters.setAttribute("class", "gdletterfilters");
    filters.setAttribute("aria-hidden", "true");
    filters.innerHTML = `<defs>
      <filter id="gdlogobevel" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">
        <feOffset in="SourceAlpha" dy="-.061" result="raised"/>
        <feComposite in="SourceAlpha" in2="raised" operator="out" result="bottom"/>
        <feColorMatrix in="SourceGraphic" values=".5 0 0 0 .1333  .5 0 0 0 .4  0 0 .5 0 .0333  0 0 0 1 0" result="shade"/>
        <feComposite in="shade" in2="bottom" operator="in" result="bevel"/>
        <feOffset in="SourceAlpha" dy=".012" result="lowered"/>
        <feComposite in="SourceAlpha" in2="lowered" operator="out" result="top"/>
        <feColorMatrix in="SourceGraphic" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 .6667  3.75 0 0 0 -2"/>
        <feComposite in2="top" operator="in" result="shine"/>
        <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="bevel"/><feMergeNode in="shine"/></feMerge>
      </filter>
    </defs>`;
    document.body.append(filters);
  }

  for (const label of logos) {
    const face = document.createElement("span");
    face.className = "gdlogoface";
    face.append(...label.childNodes);
    label.append(face);
    label.dataset.text = label.textContent;
  }
})();
