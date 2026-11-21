const fonts = [
  "Pusab", "TRS Million", "SF Distant Galaxy", "Relish Gargler", "Early GameBoy", "Good Dog",
  "Dancing Script", "Stencilia", "Xirod", "Minercraftory", "Super Mario 256", "Ketchum",
  "Gargle", "Amatic SC", "Cartwheel", "Mothproof Script", "Lemon Milk Bold", "Lemon Milk",
  "Minecraft", "Optimus Princeps", "Autolova", "Karate", "A Annyeong Haseyo", "Ausweis Hollow",
  "Gypsy Curse", "Magic School Two", "Old English Five", "Yeah Papa", "Ninja Naruto", "Metal Lord",
  "Drip Drop", "Electroharmonix", "Aladin", "Creepster", "Call Of Ops Duty", "BlocParty",
  "Astron Boy", "Osaka Sans Serif", "Some Time Later", "Fatboy Slim BLTC", "Moria Citadel",
  "Rise of Kingdom", "Fantaisie Artistique", "Edge of the Galaxy", "Wash Your Hand", "Bitwise",
  "Foul Fiend", "Nandaka Western", "Evil Empire", "Comical Cartoon", "Carton Six", "Assassin Ninja",
  "Public Pixel", "New Walt Disney UI", "Random 5", "Crafting Lesson", "Game Of Squids",
  "Monster Game", "Lo-Sumires", "Gewtymol",
];
const bonusfonts = [
  "Renogare", "Barnacle Boy", "Praetorian", "Protoculture Italic", "Politica",
  "Cloudy With a Chance of Love", "Jua", "Kristen", "La Unica", "Grobold",
  "PaperMarioFont", "ChunkFive Roman", "Cloister Black", "Poosab", "Futura", "Helvetica Italics",
];
const framecolors = {
  green: "#a7eb5e", grey: "#bfc8cf", darkgrey: "#627486", cyan: "#69e3ed",
  magenta: "#f68add", red: "#f76d69", purple: "#b895ff", blue: "#579ffd",
  pink: "#ffb5db", white: "#fff", black: "#111820", fancy: "#f4cf73",
};
const bundled = {gold: "goldtext", logo: "logotext", aller: "allertext", 1: "pusabtext", uploaded: "uploadtext"};
const localfonts = new Map();
const form = document.querySelector(".formatting");
const message = document.querySelector(".message");
const fontselect = document.querySelector(".fontselect");
const fontfile = document.querySelector(".fontfile");
const status = document.querySelector(".fontstatus");
const title = document.querySelector(".fonttitle");
const picked = document.querySelector(".pickedtext");
const specimens = document.querySelector(".specimens");
const samples = document.querySelectorAll(".lettering");
const stages = document.querySelectorAll(".stage");
const numbered = document.querySelector(".gamesfonts");
const bonus = document.querySelector(".bonusfonts");
const characterlist = document.querySelector(".characters");
const ink = document.querySelector(".ink");
const tint = document.querySelector(".tint");
const alignment = document.querySelector(".alignment");
const lettercase = document.querySelector(".lettercase");
const kerning = document.querySelector(".kerning");
const frame = document.querySelector(".frame");
const outlinecolor = document.querySelector(".outlinecolor");
const rimcolor = document.querySelector(".rimcolor");
const shadowcolor = document.querySelector(".shadowcolor");
let fontrevision = 0;
let uploadrevision = 0;
let uploadedfont = null;

for (const [index, name] of fonts.entries()) {
  numbered.append(new Option(`Font ${index + 1} · ${name}`, index + 1));
}
for (const [index, name] of bonusfonts.entries()) bonus.append(new Option(name, "bonus-" + index));

for (const char of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?@#%&+-=.,:()[]<>★☆♥→←↑↓×÷") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = char;
  button.addEventListener("click", () => {
    const start = message.selectionStart;
    const end = message.selectionEnd;
    if (message.value.length - (end - start) >= message.maxLength) return;
    message.setRangeText(char, start, end, "end");
    message.focus();
    redrawtext();
  });
  characterlist.append(button);
}

/*//////////////////////////////////////////////////////////////////////*/

function roundoutline(radius, color) {
  return Array.from({length: 16}, (_, index) => {
    const angle = index * Math.PI / 8;
    const x = Math.cos(angle).toFixed(4);
    const y = Math.sin(angle).toFixed(4);
    return `calc(var(${radius}) * ${x}) calc(var(${radius}) * ${y}) var(${color})`;
  }).join(", ");
}

const rimshadows = roundoutline("--outer-radius", "--rim-ink");
const outlineshadows = roundoutline("--inner-radius", "--stroke-color");
for (const sample of samples) {
  sample.style.setProperty("--rim-shadows", rimshadows);
  sample.style.setProperty("--outline-shadows", outlineshadows);
}

function redrawtext() {
  for (const sample of samples) {
    const face = sample.querySelector(".letterface");
    sample.dataset.text = message.value;
    face.dataset.text = message.value;
    face.textContent = message.value;
  }
}

const numberfields = [
  ["size", "--fontsize", 48, "px"],
  ["spacing", "--spacing", 0, "px"],
  ["linewidth", "--line-width", 0, "px"],
  ["outlinewidth", "--outlinewidth", null, "px"],
  ["rimwidth", "--rimwidth", null, "px"],
  ["shadowx", "--shadowx", null, "px"],
  ["shadowy", "--shadowy", null, "px"],
  ["shadowopacity", "--shadowopacity", 30, "%"],
  ["padx", "--padx", 14, "px"],
  ["pady", "--pady", 10, "px"],
].map(([name, property, fallback, unit]) => ({input: document.querySelector("." + name), property, fallback, unit}));

function applyformatting() {
  const styles = specimens.style;
  for (const {input, property, fallback, unit} of numberfields) {
    const value = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : fallback;
    if (value === null) {
      styles.removeProperty(property);
      continue;
    }
    const clamped = Math.min(Number(input.max), Math.max(Number(input.min), value));
    styles.setProperty(property, property === "--line-width" && !clamped ? "none" : clamped + unit);
  }
  styles.setProperty("--ink", ink.value);
  styles.setProperty("--alignment", alignment.value);
  styles.setProperty("--justify", {left: "start", center: "center", right: "end"}[alignment.value]);
  if (lettercase.value === "font") styles.removeProperty("--lettercase");
  else styles.setProperty("--lettercase", lettercase.value);
  styles.setProperty("--kerning", kerning.checked ? "normal" : "none");
  styles.setProperty("--outlinecolor", outlinecolor.value);
  styles.setProperty("--rimcolor", rimcolor.value);
  styles.setProperty("--shadow", `color-mix(in srgb, ${shadowcolor.value} var(--shadowopacity), transparent)`);
  specimens.classList.toggle("tintsolid", tint.value === "solid");
  specimens.classList.toggle("tintgradient", tint.value === "gradient");
  const color = framecolors[frame.value];
  styles.setProperty("--frame-border", color ? `${frame.value === "fancy" ? "5px double" : "2px solid"} ${color}` : "0");
  styles.setProperty("--frame-shadow", color ? `inset 0 0 0 1px ${color}, 0 2px 0 #03101c` : "none");
  for (const stage of stages) stage.classList.toggle("framed", Boolean(color));
}

/*//////////////////////////////////////////////////////////////////////*/

async function setfont() {
  const revision = ++fontrevision;
  const value = fontselect.value;
  const selected = fontselect.selectedOptions[0].textContent;
  title.textContent = selected;
  picked.className = "lettering pickedtext " + (bundled[value] || "allertext");
  if (bundled[value]) {
    status.textContent = value === "uploaded" ? uploadedfont.name : "Bundled typeface.";
    return;
  }
  const name = value === "helvetica" ? "Helvetica Neue" : value.startsWith("bonus-")
    ? bonusfonts[Number(value.slice(6))] : fonts[Number(value) - 1];
  const family = "stylefont-" + value;
  if (!localfonts.has(value)) {
    const loaded = new FontFace(family, `local(${JSON.stringify(name)})`).load().then(font => {
      document.fonts.add(font);
      return true;
    }).catch(() => false);
    localfonts.set(value, loaded);
  }
  status.textContent = `Checking for ${name}.`;
  const found = await localfonts.get(value);
  if (revision !== fontrevision) return;
  if (found) {
    picked.style.setProperty("--local-font", family);
    picked.className = "lettering pickedtext localtext";
  }
  status.textContent = found ? `Using installed ${name}.` : `${name} is unavailable. Showing Aller. Load a font file to preview it.`;
}

fontfile.addEventListener("change", async () => {
  const revision = ++uploadrevision;
  const file = fontfile.files[0];
  if (!file) return;
  try {
    const font = await new FontFace("styleupload", await file.arrayBuffer()).load();
    if (revision !== uploadrevision) return;
    if (uploadedfont) document.fonts.delete(uploadedfont.font);
    document.fonts.add(font);
    uploadedfont = {font, name: file.name};
    const option = fontselect.querySelector('option[value="uploaded"]');
    option.disabled = false;
    option.textContent = file.name;
    fontselect.value = "uploaded";
    await setfont();
  } catch {
    if (revision === uploadrevision) status.textContent = "Could not read this font. Choose a WOFF2, WOFF, TTF, or OTF file.";
  } finally {
    if (revision === uploadrevision) fontfile.value = "";
  }
});

form.addEventListener("submit", event => event.preventDefault());
form.addEventListener("input", event => {
  if (event.target === message) redrawtext();
  else if (event.target !== fontselect && event.target !== fontfile) applyformatting();
});
fontselect.addEventListener("change", setfont);
redrawtext();
applyformatting();
