export function geometry(profile = 384, rows = 2) {
    rows = Math.max(1,Math.min(4,Math.round(Number(rows) || 2)));
    const width = Math.max(240, Math.min(1600, Number(profile) || 384));
    const tile = (width - 48) / 3;
    const gap = 8 / tile;
    return {profile: width, tile, gap, radius: 4 / tile, padding: 16 / tile, width: 3 + gap * 2, height: rows + gap * (rows - 1)};
}

/*//////////////////////////////////////////////////////////////////////*/

export function tilecrop(index, width, height, fit, profile, rows = 2) {
    const layout = geometry(profile,rows);
    const scale = Math[fit === "cover" ? "max" : "min"](layout.width / width, layout.height / height);
    const left = (layout.width - width * scale) / 2;
    const top = (layout.height - height * scale) / 2;
    return {x: (index % 3 * (1 + layout.gap) - left) / scale, y: (Math.floor(index / 3) * (1 + layout.gap) - top) / scale, width: 1 / scale, height: 1 / scale};
}

/*//////////////////////////////////////////////////////////////////////*/

export function positions(rows = 2) {
    if (rows === 2) return ["topleft","topmiddle","topright","bottomleft","bottommiddle","bottomright"];
    return Array.from({length:rows * 3},(item,index) => `row${Math.floor(index / 3) + 1}column${index % 3 + 1}`);
}
