(() => {
  const controls = ".gdbutton, .optionarrow";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const accelerate = "cubic-bezier(.333333, 0, .666667, .333333)";
  const decelerate = "cubic-bezier(.333333, .666667, .666667, 1)";
  const bounce = [
    [0, 0, accelerate],
    [4 / 11, 1, decelerate],
    [6 / 11, .75, accelerate],
    [8 / 11, 1, decelerate],
    [9 / 11, .9375, accelerate],
    [10 / 11, 1, decelerate],
    [10.5 / 11, .984375, accelerate],
    [1, 1],
  ];
  const motions = new WeakMap();
  let held;
  let rejectedpointer;

  function reset(button) {
    motions.get(button)?.cancel();
    motions.delete(button);
  }

  function animate(button, selected) {
    const from = parseFloat(getComputedStyle(button).scale) || 1;
    const to = selected ? 1.26 : 1;
    reset(button);
    if (reduced.matches || from === to) return;
    const keyframes = bounce.map(([offset, progress, easing]) => ({
      offset, easing, scale: String(from + (to - from) * progress),
    }));
    const motion = button.animate(keyframes, {duration: selected ? 300 : 400, fill: "forwards"});
    if (!selected) motion.onfinish = () => {
      if (motions.get(button) === motion) reset(button);
    };
    motions.set(button, motion);
  }

  function enabled(button) {
    return button && !button.matches(':disabled, [aria-disabled="true"]');
  }

  function hold(button, source) {
    if (held || !enabled(button)) return;
    held = {button, source, selected: true};
    animate(button, true);
  }

  function select(selected) {
    if (held.selected === selected) return;
    held.selected = selected;
    animate(held.button, selected);
  }

  function release(activate = false) {
    if (!held) return;
    if (activate) reset(held.button);
    else select(false);
    held = null;
  }

  /*//////////////////////////////////////////////////////////////////////*/

  function underpointer(event) {
    return document.elementFromPoint(event.clientX, event.clientY)?.closest(controls);
  }

  document.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !event.isPrimary) return;
    rejectedpointer = null;
    hold(event.target.closest?.(controls), event.pointerId);
  });

  document.addEventListener("pointermove", event => {
    if (held?.source !== event.pointerId) return;
    if (event.buttons & 1) select(underpointer(event) === held.button);
    else release();
  }, true);

  document.addEventListener("pointerout", event => {
    if (held?.source === event.pointerId && !event.relatedTarget) select(false);
  });

  document.addEventListener("pointerup", event => {
    if (held?.source !== event.pointerId) return;
    const activate = underpointer(event) === held.button && enabled(held.button);
    if (!activate) rejectedpointer = {button: held.button, id: event.pointerId};
    release(activate);
  }, true);

  document.addEventListener("pointercancel", event => {
    if (held?.source === event.pointerId) release();
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key !== " " || event.repeat) return;
    const button = event.target.closest?.(controls);
    if (button?.matches("button, summary")) hold(button, "space");
  });

  document.addEventListener("keyup", event => {
    if (event.key === " " && held?.source === "space") release(document.activeElement === held.button);
  }, true);

  document.addEventListener("focusout", event => {
    if (held?.source === "space" && event.target === held.button) release();
  });

  document.addEventListener("click", event => {
    const button = event.target.closest?.(controls);
    if (!button) return;
    if (rejectedpointer?.button === button && rejectedpointer.id === event.pointerId) {
      rejectedpointer = null;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (held?.button === button) release(true);
    else reset(button);
  }, true);

  window.addEventListener("blur", () => release());
})();
