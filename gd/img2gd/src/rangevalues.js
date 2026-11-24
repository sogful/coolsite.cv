const {rangevalue, validrangevalues} = (() => {
  const controls = new Map();

  for (const slider of document.querySelectorAll(".gdslider > .gdrange")) {
    const rail = slider.parentElement;
    const minimum = Number(slider.min);
    const railmax = Number(slider.max);
    const maximum = Number(slider.dataset.editMax ?? slider.max);
    const limitmessages = slider.hasAttribute("data-limit-messages");
    const step = Number(slider.step);
    const fractional = !Number.isInteger(step);
    const precision = slider.step.split(".")[1]?.length || 0;
    const interval = Number(slider.dataset.snap ?? slider.step);
    const stops = [minimum];
    for (let index = Math.floor(minimum / interval) + 1; index * interval < railmax; index++) {
      stops.push(Number((index * interval).toFixed(precision)));
    }
    stops.push(railmax);
    const editor = rail.querySelector(".rangevalueeditor");
    const warning = rail.closest(".sliderlabel").querySelector(".rangevaluemessage");
    const warningtext = warning.querySelector("cr");
    const emoji = warning.querySelector("img");
    const control = {value: slider.valueAsNumber, valid: true};
    controls.set(slider, control);

    function place() {
      const fraction = (slider.valueAsNumber - minimum) / (railmax - minimum);
      rail.style.setProperty("--gdfraction", fraction);
      rail.style.setProperty("--gdprogress", fraction * 100 + "%");
      rail.style.setProperty("--gdfillstop", fraction > 0 && fraction < 1 ? "var(--gdthumbcenter)" : fraction * 100 + "%");
      if (control.value === slider.valueAsNumber) slider.removeAttribute("aria-valuetext");
      else slider.setAttribute("aria-valuetext", String(control.value));
    }

    function message(text, overkill) {
      warningtext.textContent = text;
      warning.hidden = !text;
      editor.setAttribute("aria-invalid", String(!control.valid));
      if (limitmessages) {
        if (overkill && !emoji.getAttribute("src")) emoji.src = "../assets/images/gulpemoji.webp";
        emoji.hidden = !overkill;
      }
    }

    function edit(value) {
      const text = String(value);
      if (editor.value !== text) editor.value = text;
      const input = text.trim().replace(",", ".");
      const parsed = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input) ? Number(input) : NaN;
      const overkill = limitmessages && parsed > maximum;
      let issue = "";
      if (Number.isNaN(parsed)) issue = "Enter a number";
      else if (parsed < minimum) issue = limitmessages ? "Too low!" : minimum + " min";
      else if (parsed > maximum) issue = overkill ? "That's a bit of an overkill..." : maximum + " max";
      else if (!fractional && !Number.isInteger(parsed)) issue = "Enter a whole number";

      control.valid = !issue;
      if (control.valid) {
        control.value = parsed;
        slider.valueAsNumber = Math.min(parsed, railmax);
      }
      place();
      message(issue, overkill);
      slider.dispatchEvent(new Event("rangevaluechange", {bubbles: true}));
    }

    function snap(value) {
      return stops.reduce((nearest, candidate) => Math.abs(candidate - value) < Math.abs(nearest - value) ? candidate : nearest);
    }

    function keyvalue(event) {
      if (event.key === "Home") return minimum;
      if (event.key === "End") return railmax;
      const forward = getComputedStyle(slider).direction === "rtl" ? -1 : 1;
      const moves = {ArrowLeft: -forward, ArrowRight: forward, ArrowDown: -1, ArrowUp: 1, PageDown: -3, PageUp: 3};
      const move = moves[event.key];
      if (!move) return null;
      const value = slider.valueAsNumber;
      const start = move > 0 ? stops.findIndex(stop => stop > value) : stops.findLastIndex(stop => stop < value);
      if (start < 0) return move > 0 ? railmax : minimum;
      return stops[Math.max(0, Math.min(stops.length - 1, start + move - Math.sign(move)))];
    }

    editor.addEventListener("input", () => edit(editor.value));
    slider.addEventListener("input", event => edit(event.isTrusted ? snap(slider.valueAsNumber) : slider.value));
    slider.addEventListener("keydown", event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const value = keyvalue(event);
      if (value === null) return;
      event.preventDefault();
      if (value === control.value && value === slider.valueAsNumber && control.valid) return;
      slider.valueAsNumber = value;
      slider.dispatchEvent(new Event("input", {bubbles: true}));
      slider.dispatchEvent(new Event("change", {bubbles: true}));
    });
    slider.addEventListener("change", () => {
      if (slider.valueAsNumber !== Math.min(control.value, railmax)) edit(slider.value);
    });
    place();
  }

  /*//////////////////////////////////////////////////////////////////////*/

  return {
    rangevalue: slider => controls.get(slider)?.value ?? slider.valueAsNumber,
    validrangevalues: () => Array.from(controls).every(([slider, control]) => slider.disabled || control.valid),
  };
})();
