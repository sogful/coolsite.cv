function xmlescape(value) {
  const escape = {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;"};
  return value.replace(/[&<>"']/g, character => escape[character]);
}

function bytesbase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function asbase64(value) {
  return bytesbase64(new TextEncoder().encode(value));
}

/*//////////////////////////////////////////////////////////////////////*/

function leveldocument(raw, name, version) {
  const title = xmlescape(name);
  const description = asbase64("Generated locally by GD Image to Level. Static no-touch native-object image fit.");
  return `<?xml version="1.0" encoding="utf-8"?>\n<plist version="1.0" gjver="2.0"><dict><k>kCEK</k><i>4</i><k>k2</k><s>${title}</s><k>k3</k><s>${description}</s><k>k4</k><s>${xmlescape(raw)}</s><k>k5</k><s>GD Image</s><k>k13</k><t/><k>k14</k><f/><k>k16</k><i>1</i><k>k17</k><i>22</i><k>k21</k><i>2</i><k>k45</k><i>0</i><k>k50</k><i>${version}</i></dict></plist>`;
}

function gmddocument(raw, name) {
  return leveldocument(raw, name, 47);
}
