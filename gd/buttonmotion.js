(() => {
  const controls = ".gdbutton, .optionarrow";
  const bounce = [
    {scale: "1", offset: 0, easing: "ease-in"},
    {scale: "1.11", offset: .36, easing: "ease-out"},
    {scale: "1.101", offset: .55, easing: "ease-in"},
    {scale: "1.11", offset: .73, easing: "ease-out"},
    {scale: "1.1075", offset: .82, easing: "ease-in"},
    {scale: "1.11", offset: .91, easing: "ease-out"},
    {scale: "1.109", offset: .955, easing: "ease-in"},
    {scale: "1.11", offset: 1},
  ];
  const motions = new WeakMap();
  let held;

  function hold(button, source) {
    if (!button || held || button.matches(':disabled, [aria-disabled="true"]')) return;
    let motion = motions.get(button);
    if (motion) {
      motion.updatePlaybackRate(1);
      motion.play();
    } else {
      motion = button.animate(bounce, {duration: 350, fill: "both"});
      motion.onfinish = () => {
        if (motion.playbackRate < 0 && held?.button !== button) reset(button);
      };
      motions.set(button, motion);
    }
    held = {button, source};
  }

  function reset(button) {
    motions.get(button)?.cancel();
    motions.delete(button);
  }

  function release(activate = false) {
    if (!held) return;
    const {button} = held;
    held = null;
    if (activate) reset(button);
    else motions.get(button)?.reverse();
  }

  /*//////////////////////////////////////////////////////////////////////*/

  document.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !event.isPrimary) return;
    hold(event.target.closest?.(controls), event.pointerId);
  });

  document.addEventListener("pointerup", event => {
    if (held?.source !== event.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    release(target?.closest(controls) === held.button);
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
    if (held?.button === button) release(true);
    else reset(button);
  }, true);

  window.addEventListener("blur", () => release());
})();
