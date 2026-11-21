const resetpreviewview = (() => {
  const viewport = document.querySelector(".previewport");
  const frame = viewport.querySelector(".viewframe");
  const image = frame.querySelector(".previewimage");
  const swipe = image.querySelector(".swipeslider");
  const stats = viewport.querySelector(".stats");
  const footer = viewport.querySelector(".previewfooter");
  const pointers = new Map();
  const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  let viewx = 0;
  let viewy = 0;
  let viewzoom = 1;
  let statsx = 8;
  let statsy = 8;
  let statsdrag;
  let swipepointer;

  function setview(x, y, zoom = viewzoom) {
    if (!(zoom > 0 && Number.isFinite(zoom) && Number.isFinite(x) && Number.isFinite(y))) return;
    viewx = x;
    viewy = y;
    viewzoom = zoom;
    image.style.setProperty("--viewx", x + "px");
    image.style.setProperty("--viewy", y + "px");
    image.style.setProperty("--viewzoom", zoom);
  }

  function zoomview(zoom, from, to = from) {
    const rect = frame.getBoundingClientRect();
    const centerx = rect.left + rect.width / 2;
    const centery = rect.top + rect.height / 2;
    const ratio = zoom / viewzoom;
    setview(to.x - centerx + (viewx - from.x + centerx) * ratio,
      to.y - centery + (viewy - from.y + centery) * ratio, zoom);
  }

  function resetview() {
    setview(0, 0, 1);
  }

  function midpoint(first, second) {
    return {x: (first.x + second.x) / 2, y: (first.y + second.y) / 2};
  }

  function othercontrol(event) {
    return event.target.closest(".swipebar, .swipehandle, input, button, a");
  }

  /*//////////////////////////////////////////////////////////////////////*/

  frame.addEventListener("wheel", event => {
    if (!event.deltaY) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? frame.clientHeight : 1;
    const amount = Math.max(-1.2, Math.min(1.2, -event.deltaY * unit * .0025));
    zoomview(viewzoom * Math.exp(amount), {x: event.clientX, y: event.clientY});
  }, {passive: false});

  frame.addEventListener("pointerdown", event => {
    if (event.button !== 0 || othercontrol(event) || pointers.size >= 2) return;
    if (event.pointerType === "mouse") frame.focus({preventScroll: true});
    frame.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    frame.classList.add("dragging");
  });

  function movecamera(event) {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const point = {x: event.clientX, y: event.clientY};
    pointers.set(event.pointerId, point);
    if (pointers.size === 1) {
      setview(viewx + point.x - previous.x, viewy + point.y - previous.y);
      return;
    }
    const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
    const start = Math.hypot(previous.x - other.x, previous.y - other.y);
    const end = Math.hypot(point.x - other.x, point.y - other.y);
    zoomview(start > 0 && end > 0 ? viewzoom * end / start : viewzoom,
      midpoint(previous, other), midpoint(point, other));
  }

  function endpan(event) {
    if (!pointers.delete(event.pointerId)) return;
    frame.classList.toggle("dragging", pointers.size > 0);
  }

  frame.addEventListener("dblclick", event => {
    if (!othercontrol(event)) resetview();
  });

  frame.addEventListener("keydown", event => {
    if (event.target !== frame || event.altKey || event.ctrlKey || event.metaKey) return;
    const step = event.shiftKey ? 64 : 20;
    const direction = directions[event.key];
    if (direction) {
      setview(viewx + direction[0] * step, viewy + direction[1] * step);
    } else if (event.key === "+" || event.key === "=" || event.key === "-") {
      const factor = event.key === "-" ? 1 / 1.25 : 1.25;
      setview(viewx * factor, viewy * factor, viewzoom * factor);
    } else if (event.key === "Home") {
      resetview();
    } else return;
    event.preventDefault();
  });

  /*//////////////////////////////////////////////////////////////////////*/

  function moveswipe(event) {
    if (event.pointerId !== swipepointer) return;
    const rect = swipe.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    const value = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
    if (!Number.isFinite(value) || value === swipe.valueAsNumber) return;
    swipe.valueAsNumber = value;
    swipe.dispatchEvent(new Event("input", {bubbles: true}));
  }

  function endswipe(event) {
    if (event.pointerId === swipepointer) swipepointer = undefined;
  }

  swipe.addEventListener("pointerdown", event => {
    if (event.button !== 0 || swipepointer !== undefined) return;
    event.preventDefault();
    swipe.focus({preventScroll: true});
    swipe.setPointerCapture(event.pointerId);
    swipepointer = event.pointerId;
    moveswipe(event);
  });

  /*//////////////////////////////////////////////////////////////////////*/

  function movestats(x, y) {
    const limitx = viewport.clientWidth - stats.offsetWidth - 8;
    const limity = viewport.clientHeight - stats.offsetHeight - (footer?.offsetHeight || 0) - 16;
    statsx = Math.max(0, Math.min(x, limitx));
    statsy = Math.max(0, Math.min(y, limity));
    stats.style.setProperty("--statsx", statsx + "px");
    stats.style.setProperty("--statsy", statsy + "px");
  }

  stats.addEventListener("pointerdown", event => {
    if (event.button !== 0 || statsdrag) return;
    event.preventDefault();
    if (event.pointerType === "mouse") stats.focus({preventScroll: true});
    stats.setPointerCapture(event.pointerId);
    statsdrag = {id: event.pointerId, x: event.clientX - statsx, y: event.clientY - statsy};
  });

  function dragstats(event) {
    if (event.pointerId !== statsdrag?.id) return;
    movestats(event.clientX - statsdrag.x, event.clientY - statsdrag.y);
  }

  function endstatsdrag(event) {
    if (event.pointerId === statsdrag?.id) statsdrag = null;
  }

  stats.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = directions[event.key];
    if (direction) {
      const step = event.shiftKey ? 32 : 8;
      movestats(statsx + direction[0] * step, statsy + direction[1] * step);
    } else if (event.key === "Home") {
      movestats(8, 8);
    } else return;
    event.preventDefault();
  });

  /*//////////////////////////////////////////////////////////////////////*/

  function endgesture(event) {
    endpan(event);
    endswipe(event);
    endstatsdrag(event);
  }

  window.addEventListener("pointerdown", endgesture, true);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    window.addEventListener(type, endgesture);
  }

  window.addEventListener("pointermove", event => {
    if (!event.buttons) {
      endgesture(event);
      return;
    }
    movecamera(event);
    moveswipe(event);
    dragstats(event);
  });

  window.addEventListener("blur", () => {
    pointers.clear();
    frame.classList.remove("dragging");
    swipepointer = undefined;
    statsdrag = null;
  });

  const bounds = new ResizeObserver(() => movestats(statsx, statsy));
  bounds.observe(viewport);
  bounds.observe(stats);
  if (footer) bounds.observe(footer);
  return resetview;
})();
