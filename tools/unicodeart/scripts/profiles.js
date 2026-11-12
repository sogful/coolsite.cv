export const profiles = {
    youtube: {name: "YouTube", family: "unicodeyoutube, Arial, sans-serif", sourcefamily: "Roboto, Arial, sans-serif", size: 14, height: 20, baseline: 14, weight: 400, background: "#0f0f0f", color: "#f1f1f1"},
    discord: {name: "Discord", family: 'unicodediscord, unicodenoto, "Helvetica Neue", Helvetica, Arial, sans-serif', sourcefamily: '"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif', size: 16, height: 22, baseline: 16, weight: 400, background: "#323339", color: "#f3f3f4"},
    twitter: {name: "twitter", family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', sourcefamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', size: 15, height: 20, baseline: 15, weight: 400, background: "#000000", color: "#e7e9ea"}
};

/*//////////////////////////////////////////////////////////////////////*/

export async function loadfonts(fontset) {
    const response = await fetch(new URL("../fonts/faces.json", import.meta.url));
    if (!response.ok) throw new Error("Could not load font list.");
    const faces = await response.json();
    const families = new Set(faces.map(face => face.family));
    const existing = [...fontset].filter(font => families.has(font.family.replaceAll('"', "")));
    if (existing.length === faces.length) {
        await Promise.all(existing.map(font => font.load()));
        return;
    }
    await Promise.all(faces.map(async face => {
        const url = new URL("../" + face.file, import.meta.url).href;
        const font = new FontFace(face.family, `url("${url}")`, {weight: face.weight, unicodeRange: face.range});
        await font.load();
        fontset.add(font);
    }));
}

export function encode(text, site) {
    if (site === "discord") return text.replace(/[\\`*_~|>#\[\]()\-+.!]/g, "\\$&");
    return text;
}

export function decode(text, site) {
    return site === "discord" ? text.replace(/\\([\\`*_~|>#\[\]()\-+.!])/g, "$1") : text;
}

export function count(text, site) {
    if (site !== "twitter") return site === "discord" ? text.length : Array.from(text).length;
    let amount = 0;
    for (const char of text) {
        const point = char.codePointAt(0);
        amount += point <= 0x10ff || point >= 0x2000 && point <= 0x200d || point >= 0x2010 && point <= 0x201f || point >= 0x2032 && point <= 0x2037 ? 1 : 2;
    }
    return amount;
}
