async function gmd2document(raw, name, legacy = false, packed = gzipbase64(raw)) {
  const data = levelfields(await packed, name, legacy ? 35 : 47, legacy ? 21 : 22);
  const archive = new JSZip();
  archive.file("level.data", `<d>${data}</d>`);
  archive.file("level.meta", JSON.stringify({compression: "none", version: 1}));
  return archive.generateAsync({type: "blob", compression: "DEFLATE", mimeType: "application/octet-stream"});
}
