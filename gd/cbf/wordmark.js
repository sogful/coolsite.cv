const cbfmark = document.querySelector(".cbfmark");
for (const line of cbfmark.querySelectorAll(".cbfline")) {
  const face = line.querySelector(".letterface");
  for (const layer of [line, face, line.querySelector(".cbfshine")]) layer.dataset.text = face.textContent;
}

function cbfring(radius, color) {
  const shadows = [];
  for (let i = 0; i < 24; i += 1) {
    const angle = i * Math.PI / 12;
    const x = Math.cos(angle).toFixed(5);
    const y = Math.sin(angle).toFixed(5);
    shadows.push(`calc(var(${radius}) * ${x}) calc(var(${radius}) * ${y}) ${color}`);
  }
  return shadows.join(", ");
}

cbfmark.style.setProperty("--outline", cbfring("--inner", "#000"));

/*//////////////////////////////////////////////////////////////////////*/

function cbfnode(name, attributes) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

const cbffilters = cbfnode("svg", {"class": "cbffilters", "aria-hidden": "true", "focusable": "false"});
const cbfdefs = cbfnode("defs", {});
cbffilters.append(cbfdefs);
const cbfoffsets = [];

function cbfrim() {
  const filter = cbfnode("filter", {id: "cbfrim", "color-interpolation-filters": "sRGB", x: "-10%", y: "-15%", width: "120%", height: "130%"});
  const merge = cbfnode("feMerge", {result: "expanded"});
  const reach = 0.01595;
  for (const y of [-reach, 0, reach]) {
    for (const x of [-reach, 0, reach]) {
      const result = "rim" + merge.childElementCount;
      const offset = cbfnode("feOffset", {in: "SourceAlpha", result});
      cbfoffsets.push({offset, x, y});
      filter.append(offset);
      merge.append(cbfnode("feMergeNode", {in: result}));
    }
  }
  filter.append(merge, cbfnode("feFlood", {"flood-color": "#ffffff", result: "white"}),
    cbfnode("feComposite", {in: "white", in2: "expanded", operator: "in"}));
  cbfdefs.append(filter);
}

function cbfedge(id, color, thickness, sides = false) {
  const filter = cbfnode("filter", {id, "color-interpolation-filters": "sRGB", x: "-10%", y: "-15%", width: "120%", height: "130%"});
  const offset = cbfnode("feOffset", {in: "SourceAlpha", result: "shifted"});
  cbfoffsets.push({offset, x: 0, y: thickness});
  filter.append(offset, cbfnode("feComposite", {in: "SourceAlpha", in2: "shifted", operator: "out", result: "vertical"}));
  let edge = "vertical";
  if (sides) {
    const side = cbfnode("feOffset", {in: "SourceAlpha", result: "sideshift"});
    cbfoffsets.push({offset: side, x: thickness, y: 0});
    filter.append(side, cbfnode("feComposite", {in: "SourceAlpha", in2: "sideshift", operator: "out", result: "side"}),
      cbfnode("feComposite", {in: "vertical", in2: "side", operator: "over", result: "bevel"}));
    edge = "bevel";
  }
  filter.append(cbfnode("feFlood", {"flood-color": color, result: "color"}),
    cbfnode("feComposite", {in: "color", in2: edge, operator: "in"}));
  cbfdefs.append(filter);
}

cbfrim();
cbfedge("cbfshadeupper", "#88cc33", -0.0638);
cbfedge("cbfshadelower", "#66aa22", -0.0638);
cbfedge("cbfhighlight", "#ffffaa", 0.01276, true);

const cbfsnap = cbfnode("filter", {id: "cbfalphasnap", "color-interpolation-filters": "sRGB"});
const cbftransfer = cbfnode("feComponentTransfer", {});
cbftransfer.append(cbfnode("feFuncA", {type: "discrete", tableValues: "0 1"}));
cbfsnap.append(cbftransfer);
cbfdefs.append(cbfsnap);
document.body.append(cbffilters);

function cbfscale() {
  const size = parseFloat(getComputedStyle(cbfmark).fontSize);
  const width = cbfmark.getBoundingClientRect().width * devicePixelRatio;
  cbfmark.classList.toggle("cbfcrisp", Math.abs(width - 924) < 0.5);
  for (const {offset, x, y} of cbfoffsets) {
    offset.setAttribute("dx", size * x);
    offset.setAttribute("dy", size * y);
  }
}
new ResizeObserver(cbfscale).observe(cbfmark);
window.addEventListener("resize", cbfscale);
cbfscale();
