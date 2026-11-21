let opentooltip = null;
let tooltipdelay;

function hidetooltip() {
  clearTimeout(tooltipdelay);
  opentooltip?.tooltip.hidePopover();
  opentooltip = null;
}

function showtooltip(trigger, tooltip, touch) {
  hidetooltip();
  tooltip.classList.toggle("touchtooltip", touch);
  tooltip.style.left = "";
  tooltip.style.top = "";
  tooltip.showPopover();
  opentooltip = {trigger, tooltip, touch};
  if (touch) return;
  const anchor = trigger.getBoundingClientRect();
  const {width, height} = tooltip.getBoundingClientRect();
  const viewport = document.documentElement;
  const left = Math.min(viewport.clientWidth - width - 12, Math.max(12, anchor.left + (anchor.width - width) / 2));
  const top = anchor.bottom + height + 8 <= viewport.clientHeight ? anchor.bottom + 6 : anchor.top - height - 6;
  tooltip.style.left = left + "px";
  tooltip.style.top = Math.max(8, top) + "px";
}

function tooltipleave(trigger, tooltip) {
  if (opentooltip?.tooltip !== tooltip || opentooltip.touch) return;
  clearTimeout(tooltipdelay);
  tooltipdelay = setTimeout(() => {
    if (!trigger.matches(":focus-visible")) hidetooltip();
  }, 120);
}

/*//////////////////////////////////////////////////////////////////////*/

for (const trigger of document.querySelectorAll(".helptrigger")) {
  const tooltip = trigger.parentElement.querySelector(".settingtooltip");
  trigger.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") showtooltip(trigger, tooltip, false);
  });
  trigger.addEventListener("pointerleave", () => tooltipleave(trigger, tooltip));
  tooltip.addEventListener("pointerenter", () => clearTimeout(tooltipdelay));
  tooltip.addEventListener("pointerleave", () => tooltipleave(trigger, tooltip));
  trigger.addEventListener("focus", () => {
    if (trigger.matches(":focus-visible")) showtooltip(trigger, tooltip, matchMedia("(hover: none)").matches);
  });
  trigger.addEventListener("blur", () => {
    if (opentooltip?.tooltip === tooltip && !opentooltip.touch) hidetooltip();
  });
  trigger.addEventListener("click", event => {
    const touch = event.pointerType === "touch" || matchMedia("(hover: none)").matches;
    if (opentooltip?.tooltip === tooltip && opentooltip.touch && touch && event.detail) hidetooltip();
    else showtooltip(trigger, tooltip, touch);
  });
}

document.addEventListener("pointerdown", event => {
  if (opentooltip && !opentooltip.trigger.contains(event.target) && !opentooltip.tooltip.contains(event.target)) {
    hidetooltip();
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && opentooltip) {
    event.preventDefault();
    hidetooltip();
  }
});
document.addEventListener("close", event => {
  if (opentooltip && event.target.contains(opentooltip.trigger)) hidetooltip();
}, true);
form.addEventListener("submit", hidetooltip);
window.addEventListener("resize", hidetooltip);
window.addEventListener("scroll", hidetooltip, true);
