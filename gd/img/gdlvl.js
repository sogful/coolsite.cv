async function gzipbase64(value) {
  if (typeof CompressionStream !== "function") throw new Error("This browser does not support gzip export.");
  const stream = new Blob([value]).stream().pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return bytesbase64(bytes).replace(/\+/g, "-").replace(/\//g, "_");
}

/*//////////////////////////////////////////////////////////////////////*/

async function gdlvldocument(raw, name) {
  const encoded = await gzipbase64(raw);
  return gzipbase64(leveldocument(encoded, name, 51));
}
