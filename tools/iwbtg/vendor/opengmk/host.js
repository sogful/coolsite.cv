// OpenGMK as a GEMS plugin (the GEMS spec §4): the module a host imports, published as host.js. The
// session is Rust (opengmk_host.js, from host/src); the engine runs in worker.js. Importing this
// touches nothing: both wasm modules load in `create`.

const EXE_RE = /\.(exe|gm81|gmk)$/i;

export default {
  id: "opengmk",
  apiVersion: 5,
  capabilities: {
    // The audio-cache knobs. The defaults are the conservative ones; a host that knows its device says.
    settings: [
      { kind: "flag", key: "audio.lazy", default: false, limited: true },
      { kind: "number", key: "audio.shortCompressedBytes", default: 256 * 1024, min: 0, unit: "bytes" },
      { kind: "number", key: "audio.shortDurationSecs", default: 5, min: 0, unit: "seconds" },
      { kind: "number", key: "audio.musicBudgetBytes", default: 192 * 1024 * 1024, min: 0, unit: "bytes" },
      { kind: "number", key: "audio.midiSampleRate", default: 22050, min: 8000, unit: "hertz" },
    ],
  },

  /** By extension only: a GameMaker 8 runner is an ordinary .exe until it is parsed. */
  async accepts(files) {
    const entry = files.files.find((file) => EXE_RE.test(file.path));
    return entry ? { confidence: "probable", entry: entry.path } : null;
  },

  async create(host) {
    let glue;
    try {
      glue = await import("./opengmk_host.js");
      await glue.default();
    } catch (error) {
      const detail = String(error);
      throw Object.assign(new Error(`asset-unavailable: ${detail}`), {
        name: "EngineError",
        engineError: true,
        code: "asset-unavailable",
        detail,
      });
    }
    // Beside this module, not at `assets.base`, which may be a CDN holding only the SoundFont.
    return glue.createSession(host, new URL("worker.js", import.meta.url).href);
  },
};
