const {rangevalue, validrangevalues} = (() => {
  const controls = new Map();

  for (const slider of document.querySelectorAll(".gdslider > .gdrange")) {
    const rail = slider.parentElement;
    const minimum = Number(slider.min);
    const railmax = Number(slider.max);
    const maximum = Number(slider.dataset.editMax ?? slider.max);
    const limitmessages = slider.hasAttribute("data-limit-messages");
    const fractional = !Number.isInteger(Number(slider.step));
    const editor = document.createElement("input");
    const warning = document.createElement("span");
    const warningtext = document.createElement("cr");
    const emoji = document.createElement("img");
    const control = {value: slider.valueAsNumber, valid: true};

    editor.type = "text";
    editor.inputMode = fractional ? "decimal" : "numeric";
    editor.className = "rangevalueeditor";
    editor.value = slider.value;
    editor.autocomplete = "off";
    editor.spellcheck = false;
    editor.setAttribute("aria-label", (slider.getAttribute("aria-label") || "Slider") + " value");

    warning.id = "range-warning-" + controls.size;
    warning.className = "rangevaluemessage";
    warning.setAttribute("role", "status");
    warning.hidden = true;
    warning.append(warningtext);
    editor.setAttribute("aria-describedby", warning.id);

    if (limitmessages) {
      emoji.alt = "";
      emoji.hidden = true;
      warning.append(emoji);
    }

    rail.append(editor);
    rail.after(warning);
    controls.set(slider, control);

    function place() {
      const percent = (slider.valueAsNumber - minimum) / (railmax - minimum) * 100;
      rail.style.setProperty("--gdprogress", percent + "%");
      if (control.value === slider.valueAsNumber) slider.removeAttribute("aria-valuetext");
      else slider.setAttribute("aria-valuetext", String(control.value));
    }

    function message(text, overkill) {
      warningtext.textContent = text;
      warning.hidden = !text;
      editor.setAttribute("aria-invalid", String(!control.valid));
      if (limitmessages) {
        if (overkill && !emoji.getAttribute("src")) emoji.src = "assets/gulpemoji.webp";
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

    editor.addEventListener("input", () => edit(editor.value));
    slider.addEventListener("input", () => edit(slider.value));
    slider.addEventListener("change", () => {
      if (slider.valueAsNumber !== Math.min(control.value, railmax)) edit(slider.value);
    });
    place();
  }

  /*//////////////////////////////////////////////////////////////////////*/

  return {
    rangevalue: slider => controls.get(slider)?.value ?? slider.valueAsNumber,
    validrangevalues: () => Array.from(controls.values()).every(control => control.valid),
  };
})();
