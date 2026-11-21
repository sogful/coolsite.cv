const optionsteppers = [];

function updateoptions() {
  for (const {select, value, previous, next} of optionsteppers) {
    const label = select.selectedOptions[0]?.label || "";
    if (value.textContent !== label) {
      value.textContent = label;
      value.dataset.text = label;
    }
    const disabled = select.matches(":disabled");
    if (previous.disabled !== disabled) previous.disabled = next.disabled = disabled;
  }
}

/*//////////////////////////////////////////////////////////////////////*/

for (const select of document.querySelectorAll("select.gdinput")) {
  const title = select.parentElement.querySelector(".optionlabel");
  if (!title || select.multiple) continue;

  if (!title.id) title.id = "gd-option-" + optionsteppers.length;
  select.setAttribute("aria-labelledby", title.id);

  const stepper = document.createElement("div");
  stepper.className = "optionstepper";
  stepper.setAttribute("role", "group");
  stepper.setAttribute("aria-labelledby", title.id);

  const value = document.createElement("span");
  value.className = "optionvalue gdplain";
  value.id = title.id + "-value";
  value.setAttribute("aria-live", "polite");
  value.setAttribute("aria-atomic", "true");

  const previous = document.createElement("button");
  const next = document.createElement("button");
  previous.className = "optionarrow optionprevious";
  next.className = "optionarrow optionnext";
  for (const [button, action] of [[previous, "Previous"], [next, "Next"]]) {
    button.type = "button";
    button.setAttribute("aria-label", action + " option");
    button.setAttribute("aria-describedby", value.id);
  }

  function changeoption(direction) {
    if (select.matches(":disabled")) return;
    const choices = Array.from(select.options).filter(option => !option.matches(":disabled"));
    if (!choices.length) return;
    const current = choices.indexOf(select.selectedOptions[0]);
    const index = current < 0 && direction === -1 ? 0 : current;
    const choice = direction === "first" ? choices[0] : direction === "last" ? choices.at(-1)
      : choices[(index + direction + choices.length) % choices.length];
    if (choice.selected) return;
    select.selectedIndex = choice.index;
    select.dispatchEvent(new Event("input", {bubbles: true}));
    select.dispatchEvent(new Event("change", {bubbles: true}));
  }

  previous.addEventListener("click", () => changeoption(-1));
  next.addEventListener("click", () => changeoption(1));
  stepper.addEventListener("keydown", event => {
    const direction = {ArrowLeft: -1, ArrowRight: 1, Home: "first", End: "last"}[event.key];
    if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    changeoption(direction);
  });
  select.addEventListener("change", updateoptions);
  select.form?.addEventListener("reset", () => setTimeout(updateoptions, 0));

  stepper.append(previous, value, next);
  select.after(stepper);
  select.hidden = true;
  optionsteppers.push({select, value, previous, next});
}

updateoptions();
