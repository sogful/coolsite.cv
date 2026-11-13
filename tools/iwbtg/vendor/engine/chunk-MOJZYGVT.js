// .claude/iwbtg/enginesource/runtime/src/runtime/wasmAudioHost.ts
function createWebAudioHost(options = {}) {
  const context = options.audioContext ?? defaultAudioContext();
  const fetchSound = options.fetch ?? fetch.bind(globalThis);
  const buffers = /* @__PURE__ */ new Map();
  const activeLoops = /* @__PURE__ */ new Map();
  const activeOneShots = /* @__PURE__ */ new Map();
  const loadingLoops = /* @__PURE__ */ new Map();
  const playingSounds = /* @__PURE__ */ new Set();
  let packageBasePath = "";
  let packageSounds = /* @__PURE__ */ new Map();
  let packageSoundKinds = /* @__PURE__ */ new Map();
  let activeBackgroundMusic;
  const resumeContext = () => {
    if (context?.state === "suspended") {
      void context.resume().catch(() => void 0);
    }
  };
  globalThis.addEventListener?.("pointerdown", resumeContext, { once: true });
  globalThis.addEventListener?.("keydown", resumeContext, { once: true });
  async function loadBuffer(soundId) {
    const path = packageSounds.get(soundId);
    if (!path || !context) {
      return null;
    }
    const cached = buffers.get(soundId);
    if (cached) {
      return cached;
    }
    const loaded = fetchSound(`${packageBasePath}/${path}`).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load sound ${soundId}: ${response.status}`);
      }
      return response.arrayBuffer();
    }).then((bytes) => context.decodeAudioData(bytes));
    buffers.set(soundId, loaded);
    return loaded;
  }
  function startSource(soundId, buffer, mode) {
    if (!context) {
      return;
    }
    if (mode === "loop") {
      stopSource(activeLoops.get(soundId));
    }
    if (isExclusiveMusicKind(packageSoundKinds.get(soundId))) {
      if (activeBackgroundMusic?.soundId !== soundId) {
        stopSource(activeBackgroundMusic?.source);
        if (activeBackgroundMusic) {
          activeLoops.delete(activeBackgroundMusic.soundId);
          discardOneShot(activeBackgroundMusic.soundId, activeBackgroundMusic.source);
          playingSounds.delete(activeBackgroundMusic.soundId);
        }
      }
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = mode === "loop";
    source.onended = () => {
      if (mode !== "loop") {
        discardOneShot(soundId, source);
        if (!activeOneShots.has(soundId) && !activeLoops.has(soundId)) {
          playingSounds.delete(soundId);
        }
      }
    };
    source.connect(context.destination);
    playingSounds.add(soundId);
    source.start();
    if (mode === "loop") {
      activeLoops.set(soundId, source);
    } else {
      let sources = activeOneShots.get(soundId);
      if (!sources) {
        sources = /* @__PURE__ */ new Set();
        activeOneShots.set(soundId, sources);
      }
      sources.add(source);
    }
    if (isExclusiveMusicKind(packageSoundKinds.get(soundId))) {
      activeBackgroundMusic = { soundId, source };
    }
  }
  function stopSource(source) {
    try {
      source?.stop();
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "InvalidStateError") {
        throw error;
      }
    }
  }
  function discardOneShot(soundId, source) {
    const sources = activeOneShots.get(soundId);
    if (!sources) {
      return;
    }
    sources.delete(source);
    if (sources.size === 0) {
      activeOneShots.delete(soundId);
    }
  }
  function stopOneShots(soundId) {
    for (const source of activeOneShots.get(soundId) ?? []) {
      stopSource(source);
    }
    activeOneShots.delete(soundId);
  }
  function stopAllOneShots() {
    for (const sources of activeOneShots.values()) {
      for (const source of sources) {
        stopSource(source);
      }
    }
    activeOneShots.clear();
  }
  return {
    configurePackage(pkg, basePath) {
      for (const source of activeLoops.values()) {
        stopSource(source);
      }
      stopAllOneShots();
      packageBasePath = basePath.replace(/\/$/, "");
      packageSounds = new Map(pkg.resources.sounds.map((sound) => [sound.id, sound.file_path]));
      packageSoundKinds = new Map(pkg.resources.sounds.map((sound) => [sound.id, sound.kind ?? "normal"]));
      buffers.clear();
      activeLoops.clear();
      loadingLoops.clear();
      playingSounds.clear();
      activeBackgroundMusic = void 0;
    },
    async playSound(soundId, mode) {
      resumeContext();
      const loopToken = mode === "loop" ? /* @__PURE__ */ Symbol() : void 0;
      if (loopToken) {
        if (loadingLoops.has(soundId)) {
          return;
        }
        loadingLoops.set(soundId, loopToken);
        playingSounds.add(soundId);
      }
      try {
        const buffer = await loadBuffer(soundId);
        if (loopToken) {
          if (loadingLoops.get(soundId) !== loopToken) {
            return;
          }
          loadingLoops.delete(soundId);
        }
        if (buffer) {
          startSource(soundId, buffer, mode);
        } else if (loopToken) {
          playingSounds.delete(soundId);
        }
      } catch {
        if (loopToken && loadingLoops.get(soundId) === loopToken) {
          loadingLoops.delete(soundId);
          playingSounds.delete(soundId);
        }
      }
    },
    stopSound(soundId) {
      stopSource(activeLoops.get(soundId));
      stopOneShots(soundId);
      activeLoops.delete(soundId);
      loadingLoops.delete(soundId);
      playingSounds.delete(soundId);
      if (activeBackgroundMusic?.soundId === soundId) {
        activeBackgroundMusic = void 0;
      }
    },
    stopAllSounds() {
      for (const source of activeLoops.values()) {
        stopSource(source);
      }
      stopAllOneShots();
      activeLoops.clear();
      loadingLoops.clear();
      playingSounds.clear();
      activeBackgroundMusic = void 0;
    },
    isSoundPlaying(soundId) {
      return playingSounds.has(soundId);
    }
  };
}
function isExclusiveMusicKind(kind) {
  return kind === "background-music" || kind === "multimedia";
}
function defaultAudioContext() {
  const AudioContextCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  return AudioContextCtor ? new AudioContextCtor() : void 0;
}

export {
  createWebAudioHost
};
