function buildlegacysource() {
  const colors = new Map();
  const colorlines = ["1_6_2_18_3_40_6_1000_7_1", "1_6_2_18_3_40_6_1001_7_1"];
  const hsvmode = colourmode.value === "hsv";
  let redchannel = hsvmode;
  function channel(red, green, blue) {
    if (hsvmode) return 999;
    const key = [red, green, blue].join(",");
    if (colors.has(key)) return colors.get(key);
    if (colors.size >= 998) {
      redchannel = true;
      return 999;
    }
    const id = colors.size + 1;
    colors.set(key, id);
    colorlines.push(`1_${red}_2_${green}_3_${blue}_4_-1_6_${id}_7_1`);
    return id;
  }
  const pixelscale = legacyartwidth / target.width;
  const opacitygroups = new Set();
  const parts = plan.map((object, index) => {
    const color = channel(object.red, object.green, object.blue);
    const scale = object.width * pixelscale / object.asset.naturalwidth;
    const {x, y} = objectposition(object, pixelscale, scale, scale);
    const fields = [
      "1", object.asset.id, "2", cleannumber(x, 6), "3", cleannumber(y, 6),
      "6", cleannumber(object.angle, 4), "21", color, "22", color, "24", 5, "25", index + 1,
      "32", cleannumber(scale, 2), "64", 1, "67", 1, "96", 1,
    ];
    if (color === 999) {
      const hsv = hsvvalue(object);
      fields.push("41", 1, "42", 1, "43", hsv, "44", hsv);
    }
    const alpha = opacitybyte(object);
    if (alpha < 255) {
      fields.push("57", alpha);
      opacitygroups.add(alpha);
    }
    return fields.join(",");
  });
  for (const alpha of opacitygroups) {
    const opacity = pixelartactive ? pixelartopacity(alpha) : exportedopacity(alpha);
    parts.push(["1", 1007, "2", 15, "3", 120, "10", 0, "35", opacity, "51", alpha].join(","));
  }
  if (redchannel) colorlines.push("1_255_2_0_3_0_4_-1_6_999_7_1");
  const header = ["kA2", 0, "kA3", 0, "kA4", 0, "kA6", 1, "kA7", 1, "kA8", 0, "kA9", 0,
    "kA10", 0, "kA11", 0, "kA13", 0, "kS38", colorlines.join("|") + "|"];
  return {raw: header.join(",") + ";" + parts.join(";") + ";", objects: parts.length,
    channels: colors.size + Number(redchannel), overflow: redchannel && !hsvmode,
    helpers: opacitygroups.size, opacityhelpers: opacitygroups.size};
}
