import "./chunk-MOJZYGVT.js";

// .claude/iwbtg/enginesource/runtime/src/runtime/wasmBridge.ts
var BRIDGE_BUFFER_MAGIC = 1112364873;
var BRIDGE_BUFFER_VERSION = 5;
var BRIDGE_INPUT_KIND = 1;
var BRIDGE_STEP_RESULT_KIND = 2;
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
var LocalStorageWasmFileHost = class _LocalStorageWasmFileHost {
  constructor(namespace = "iwm-runtime-save") {
    this.namespace = namespace;
  }
  namespace;
  static restartMarkerFiles = ["temp", "temp.dat"];
  packageKey = "unconfigured";
  memoryFallback = /* @__PURE__ */ new Map();
  configurePackage(pkg, basePath) {
    const hash = pkg.manifest.source_hash || pkg.manifest.source_name || "package";
    this.packageKey = `${basePath || "default"}:${hash}`;
    for (const marker of _LocalStorageWasmFileHost.restartMarkerFiles) {
      this.removeFile(marker);
    }
  }
  readFile(path) {
    const encoded = this.storageGet(this.key(path));
    if (!encoded) {
      return null;
    }
    return Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  }
  writeFile(path, bytes) {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    this.storageSet(this.key(path), btoa(binary));
  }
  removeFile(path) {
    const key = this.key(path);
    const existed = this.storageGet(key) != null;
    this.storageRemove(key);
    return existed;
  }
  key(path) {
    return `${this.namespace}:${this.packageKey}:${path}`;
  }
  storageGet(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? this.memoryFallback.get(key) ?? null;
    } catch {
      return this.memoryFallback.get(key) ?? null;
    }
  }
  storageSet(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
      return;
    } catch {
      this.memoryFallback.set(key, value);
    }
  }
  storageRemove(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      this.memoryFallback.delete(key);
    }
  }
};
function createLocalStorageWasmFileHost(namespace) {
  return new LocalStorageWasmFileHost(namespace);
}
function isFunction(value) {
  return typeof value === "function";
}
function isWasmRuntimeExports(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value;
  return !!candidate.memory && isFunction(candidate.iwm_alloc) && isFunction(candidate.iwm_free) && isFunction(candidate.iwm_boot_json) && isFunction(candidate.iwm_set_input_json) && isFunction(candidate.iwm_tick) && isFunction(candidate.iwm_reset) && isFunction(candidate.iwm_select_room) && isFunction(candidate.iwm_snapshot_json) && isFunction(candidate.iwm_frame_json) && isFunction(candidate.iwm_diagnostics_json) && isFunction(candidate.iwm_last_result_len);
}
function readJsonResult(exports, pointer) {
  const byteLength = exports.iwm_last_result_len();
  const bytes = new Uint8Array(exports.memory.buffer, pointer, byteLength);
  const decoded = textDecoder.decode(bytes);
  let parsed;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new Error("WASM bridge returned invalid JSON");
  }
  if (typeof parsed === "object" && parsed && typeof parsed.error === "string") {
    throw new Error(parsed.error);
  }
  return parsed;
}
function writeJsonInput(exports, value) {
  const bytes = textEncoder.encode(JSON.stringify(value));
  const pointer = exports.iwm_alloc(bytes.byteLength);
  new Uint8Array(exports.memory.buffer, pointer, bytes.byteLength).set(bytes);
  return { pointer, byteLength: bytes.byteLength };
}
var BridgeBufferWriter = class {
  bytes = [];
  intoBytes() {
    return Uint8Array.from(this.bytes);
  }
  writeHeader(kind) {
    this.writeU32(BRIDGE_BUFFER_MAGIC);
    this.writeU16(BRIDGE_BUFFER_VERSION);
    this.writeU16(kind);
  }
  writeBool(value) {
    this.writeU8(value ? 1 : 0);
  }
  writeU8(value) {
    this.bytes.push(value & 255);
  }
  writeU16(value) {
    this.writeU8(value);
    this.writeU8(value >> 8);
  }
  writeU32(value) {
    this.writeU8(value);
    this.writeU8(value >> 8);
    this.writeU8(value >> 16);
    this.writeU8(value >> 24);
  }
  writeI32(value) {
    this.writeU32(value >>> 0);
  }
  writeU8Array(values) {
    const array = values ?? [];
    this.writeU32(array.length);
    for (const value of array) {
      this.writeU8(value);
    }
  }
  writeU16Array(values) {
    const array = values ?? [];
    this.writeU32(array.length);
    for (const value of array) {
      this.writeU16(value);
    }
  }
};
var BridgeBufferReader = class {
  constructor(bytes) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  bytes;
  view;
  offset = 0;
  expectHeader(kind) {
    const magic = this.readU32();
    if (magic !== BRIDGE_BUFFER_MAGIC) {
      throw new Error("invalid bridge buffer magic");
    }
    const version = this.readU16();
    if (version !== BRIDGE_BUFFER_VERSION) {
      throw new Error(`unsupported bridge buffer version: ${version}`);
    }
    const actualKind = this.readU16();
    if (actualKind !== kind) {
      throw new Error(`unexpected bridge buffer kind: ${actualKind}`);
    }
  }
  readBool() {
    return this.readU8() !== 0;
  }
  readU8() {
    this.ensureAvailable(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }
  readU16() {
    this.ensureAvailable(2);
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }
  readU32() {
    this.ensureAvailable(4);
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }
  readI32() {
    this.ensureAvailable(4);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }
  readU64() {
    this.ensureAvailable(8);
    const value = Number(this.view.getBigUint64(this.offset, true));
    this.offset += 8;
    return value;
  }
  readF64() {
    this.ensureAvailable(8);
    const value = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return value;
  }
  readString() {
    const byteLength = this.readU32();
    this.ensureAvailable(byteLength);
    const value = textDecoder.decode(
      this.bytes.subarray(this.offset, this.offset + byteLength)
    );
    this.offset += byteLength;
    return value;
  }
  readOptionalU32() {
    return this.readBool() ? this.readU32() : null;
  }
  readOptionalString() {
    return this.readBool() ? this.readString() : null;
  }
  readOptionalI32() {
    return this.readBool() ? this.readI32() : null;
  }
  readStringArray() {
    const count = this.readU32();
    const values = [];
    for (let index = 0; index < count; index += 1) {
      values.push(this.readString());
    }
    return values;
  }
  ensureAvailable(byteLength) {
    if (this.offset + byteLength > this.bytes.byteLength) {
      throw new Error("bridge buffer ended unexpectedly");
    }
  }
};
function writeBinaryInput(exports, input) {
  const writer = new BridgeBufferWriter();
  let flags = 0;
  flags |= input.left ? 1 : 0;
  flags |= input.right ? 2 : 0;
  flags |= input.jump ? 4 : 0;
  flags |= input.jumpPressed ? 8 : 0;
  flags |= input.jumpReleased ? 16 : 0;
  flags |= input.restart ? 32 : 0;
  writer.writeHeader(BRIDGE_INPUT_KIND);
  writer.writeU16(flags);
  writer.writeU16(0);
  writer.writeI32(input.mouseX ?? 0);
  writer.writeI32(input.mouseY ?? 0);
  writer.writeU16Array(input.keysHeld);
  writer.writeU16Array(input.keysPressed);
  writer.writeU16Array(input.keysReleased);
  writer.writeU8Array(input.mouseButtonsHeld);
  writer.writeU8Array(input.mouseButtonsPressed);
  writer.writeU8Array(input.mouseButtonsReleased);
  const bytes = writer.intoBytes();
  const pointer = exports.iwm_alloc(bytes.byteLength);
  new Uint8Array(exports.memory.buffer, pointer, bytes.byteLength).set(bytes);
  return { pointer, byteLength: bytes.byteLength };
}
function readBinaryStepResult(exports, pointer) {
  const byteLength = exports.iwm_last_result_len();
  const bytes = new Uint8Array(exports.memory.buffer, pointer, byteLength);
  if (byteLength < 4 || new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    0,
    true
  ) !== BRIDGE_BUFFER_MAGIC) {
    return readJsonResult(exports, pointer);
  }
  const reader = new BridgeBufferReader(bytes);
  reader.expectHeader(BRIDGE_STEP_RESULT_KIND);
  return {
    snapshot: readBinarySnapshot(reader),
    frame: readBinaryFrame(reader)
  };
}
function readBinarySnapshot(reader) {
  return {
    status: reader.readString(),
    tick: reader.readU64(),
    roomId: reader.readOptionalU32(),
    roomName: reader.readOptionalString(),
    roomSpeed: reader.readOptionalU32(),
    instanceCount: reader.readU32(),
    deaths: reader.readU64(),
    player: readBinaryPlayer(reader),
    pendingDialog: reader.readBool() ? {
      kind: reader.readU8() === 1 ? "question" : "message",
      text: reader.readString(),
      site: reader.readString()
    } : null,
    inputTrace: {
      jumpButtonKey: reader.readU16(),
      jumpPressed: reader.readBool(),
      jumpJustPressed: reader.readBool(),
      jumpJustReleased: reader.readBool(),
      activeKeys: reader.readStringArray()
    },
    tickPhases: {
      inputDiagNanos: reader.readU64(),
      stepEventsNanos: reader.readU64(),
      viewSyncNanos: reader.readU64(),
      playerMovementNanos: reader.readU64(),
      collisionEventsNanos: reader.readU64(),
      alarmsNanos: reader.readU64(),
      keyboardEventsNanos: reader.readU64(),
      renderSubmitNanos: reader.readU64(),
      totalNanos: reader.readU64()
    },
    diagnostics: reader.readStringArray(),
    collisionTrace: readBinaryCollisionTrace(reader),
    deathTrace: readBinaryDeathTrace(reader)
  };
}
function readBinaryCollisionTrace(reader) {
  const count = reader.readU32();
  const traces = [];
  for (let index = 0; index < count; index += 1) {
    traces.push({
      tick: reader.readU64(),
      phase: reader.readString(),
      targetObjectId: reader.readU32(),
      solidCollision: reader.readBool(),
      contactY: reader.readOptionalI32(),
      eventBlocks: reader.readStringArray(),
      owner: readBinaryCollisionParticipant(reader),
      other: readBinaryCollisionParticipant(reader)
    });
  }
  return traces;
}
function readBinaryCollisionParticipant(reader) {
  return {
    runtimeId: reader.readU32(),
    instanceId: reader.readI32(),
    objectId: reader.readU32(),
    objectName: reader.readString(),
    x: reader.readF64(),
    y: reader.readF64(),
    previousX: reader.readF64(),
    previousY: reader.readF64(),
    hspeed: reader.readF64(),
    vspeed: reader.readF64(),
    bounds: [
      reader.readI32(),
      reader.readI32(),
      reader.readI32(),
      reader.readI32()
    ],
    previousBounds: [
      reader.readI32(),
      reader.readI32(),
      reader.readI32(),
      reader.readI32()
    ],
    solid: reader.readBool(),
    hazard: reader.readBool(),
    hasCollisionMask: reader.readBool(),
    collisionMaskSize: reader.readBool() ? [reader.readU32(), reader.readU32()] : null
  };
}
function readBinaryDeathTrace(reader) {
  const count = reader.readU32();
  const traces = [];
  for (let index = 0; index < count; index += 1) {
    traces.push({
      tick: reader.readU64(),
      roomId: reader.readU32(),
      roomName: reader.readString(),
      reason: reader.readString(),
      player: readBinaryCollisionParticipant(reader),
      hazard: reader.readBool() ? readBinaryCollisionParticipant(reader) : null,
      collisionWindow: readBinaryCollisionTrace(reader)
    });
  }
  return traces;
}
function readBinaryPlayer(reader) {
  if (!reader.readBool()) {
    return null;
  }
  return {
    runtimeId: reader.readU32(),
    instanceId: reader.readI32(),
    objectId: reader.readU32(),
    objectName: reader.readString(),
    x: reader.readF64(),
    y: reader.readF64(),
    hspeed: reader.readF64(),
    vspeed: reader.readF64(),
    facingLeft: reader.readBool(),
    alive: reader.readBool(),
    jump: {
      grounded: reader.readBool(),
      active: reader.readBool(),
      holdFrames: reader.readU32(),
      cutApplied: reader.readBool()
    }
  };
}
function readBinaryFrame(reader) {
  const frame = {
    tick: reader.readU64(),
    roomId: reader.readOptionalU32(),
    width: reader.readU32(),
    height: reader.readU32(),
    commands: []
  };
  const commandCount = reader.readU32();
  for (let index = 0; index < commandCount; index += 1) {
    frame.commands.push(readBinaryCommand(reader));
  }
  return frame;
}
function readRgba(reader) {
  return [reader.readU8(), reader.readU8(), reader.readU8(), reader.readU8()];
}
function readBinaryCommand(reader) {
  const kind = reader.readU8();
  switch (kind) {
    case 0:
      return { kind: "clear", colour: readRgba(reader) };
    case 1:
      return {
        kind: "drawBackground",
        backgroundId: reader.readU32(),
        x: reader.readI32(),
        y: reader.readI32(),
        stretch: reader.readBool(),
        tileHorz: reader.readBool(),
        tileVert: reader.readBool(),
        isForeground: reader.readBool()
      };
    case 2:
      return {
        kind: "drawTile",
        backgroundId: reader.readU32(),
        x: reader.readI32(),
        y: reader.readI32(),
        tileX: reader.readU32(),
        tileY: reader.readU32(),
        width: reader.readU32(),
        height: reader.readU32(),
        xscale: reader.readF64(),
        yscale: reader.readF64()
      };
    case 3:
      return {
        kind: "drawSprite",
        spriteId: reader.readU32(),
        frameIndex: reader.readU32(),
        x: reader.readI32(),
        y: reader.readI32(),
        originX: reader.readI32(),
        originY: reader.readI32(),
        xscale: reader.readF64(),
        yscale: reader.readF64(),
        alpha: reader.readF64(),
        angleDegrees: reader.readF64()
      };
    case 4:
      return {
        kind: "fillRect",
        x: reader.readI32(),
        y: reader.readI32(),
        width: reader.readU32(),
        height: reader.readU32(),
        colour: readRgba(reader)
      };
    case 5:
      return {
        kind: "drawText",
        text: reader.readString(),
        x: reader.readI32(),
        y: reader.readI32(),
        size: reader.readU32(),
        fontName: reader.readOptionalString(),
        fontBold: reader.readBool(),
        fontItalic: reader.readBool(),
        colour: readRgba(reader),
        align: reader.readString()
      };
    case 6:
      return { kind: "present" };
    default:
      throw new Error(`unknown bridge draw command kind: ${kind}`);
  }
}
function makeWasmRuntimeBridge(exports) {
  return {
    backend: "opengmk-wasm",
    boot: async (pkg) => {
      const { pointer, byteLength } = writeJsonInput(exports, pkg);
      try {
        return readJsonResult(
          exports,
          exports.iwm_boot_json(pointer, byteLength)
        );
      } finally {
        exports.iwm_free(pointer, byteLength);
      }
    },
    snapshot: async () => {
      return readJsonResult(
        exports,
        exports.iwm_snapshot_json()
      );
    },
    frame: async () => {
      return readJsonResult(
        exports,
        exports.iwm_frame_json()
      );
    },
    setInput: async (input) => {
      const { pointer, byteLength } = writeJsonInput(exports, input);
      try {
        return readJsonResult(
          exports,
          exports.iwm_set_input_json(pointer, byteLength)
        );
      } finally {
        exports.iwm_free(pointer, byteLength);
      }
    },
    step: exports.iwm_step_buffer ? async (input) => {
      const { pointer, byteLength } = writeBinaryInput(exports, input);
      try {
        return readBinaryStepResult(
          exports,
          exports.iwm_step_buffer(pointer, byteLength)
        );
      } finally {
        exports.iwm_free(pointer, byteLength);
      }
    } : exports.iwm_step_json ? async (input) => {
      const { pointer, byteLength } = writeJsonInput(exports, input);
      try {
        return readJsonResult(
          exports,
          exports.iwm_step_json(pointer, byteLength)
        );
      } finally {
        exports.iwm_free(pointer, byteLength);
      }
    } : void 0,
    dialogResponse: async (answer) => {
      if (!exports.iwm_dialog_response) {
        throw new Error("WASM bridge does not support dialog responses");
      }
      return readJsonResult(
        exports,
        exports.iwm_dialog_response(
          answer === "yes" ? 1 : answer === "no" ? 2 : 0
        )
      );
    },
    tick: async (frames = 1) => {
      return readJsonResult(
        exports,
        exports.iwm_tick(Math.max(1, frames))
      );
    },
    reset: async () => {
      return readJsonResult(
        exports,
        exports.iwm_reset()
      );
    },
    selectRoom: async (roomId) => {
      return readJsonResult(
        exports,
        exports.iwm_select_room(roomId)
      );
    },
    diagnostics: async () => {
      return readJsonResult(exports, exports.iwm_diagnostics_json());
    }
  };
}
async function instantiateWasmRuntimeBridge(source, imports = {}, options = {}) {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(
      `failed to fetch wasm module: ${response.status} ${response.statusText}`
    );
  }
  const bytes = await response.arrayBuffer();
  const mergedImports = mergeWasmRuntimeImports(imports, options);
  const instantiated = await WebAssembly.instantiate(bytes, mergedImports);
  const exported = instantiated.instance.exports;
  if (!isWasmRuntimeExports(exported)) {
    throw new Error(
      "WASM module does not expose the expected iwm runtime bridge exports"
    );
  }
  const bindMemory = mergedImports.env?.__iwm_bind_memory;
  if (bindMemory && exported.memory instanceof WebAssembly.Memory) {
    bindMemory(exported.memory);
  }
  return makeWasmRuntimeBridge(exported);
}
function makeWasmRuntimeHostImports(options = {}) {
  const now = typeof options === "function" ? options : options.now ?? (() => globalThis.performance?.now() ?? Date.now());
  const audioHost = typeof options === "function" ? void 0 : options.audioHost;
  const fileHost = typeof options === "function" ? void 0 : options.fileHost ?? createLocalStorageWasmFileHost();
  let memory;
  const readBytes = (pointer, byteLength) => {
    if (!memory) {
      return new Uint8Array();
    }
    return new Uint8Array(memory.buffer, pointer, byteLength);
  };
  const readHostPath = (pointer, byteLength) => {
    return new TextDecoder().decode(readBytes(pointer, byteLength));
  };
  return {
    env: {
      __iwm_bind_memory: (boundMemory) => {
        memory = boundMemory;
      },
      iwm_host_now_nanos: () => Math.max(0, now() * 1e6),
      iwm_host_play_sound: (soundId, mode) => {
        const result = audioHost?.playSound(soundId, wasmSoundMode(mode));
        if (result instanceof Promise) {
          void result.catch(() => void 0);
        }
      },
      iwm_host_stop_sound: (soundId) => {
        audioHost?.stopSound(soundId);
      },
      iwm_host_stop_all_sounds: () => {
        audioHost?.stopAllSounds();
      },
      iwm_host_is_sound_playing: (soundId) => {
        return audioHost?.isSoundPlaying(soundId) ? 1 : 0;
      },
      iwm_host_read_file: (pathPtr, pathLen, outPtr, outLen) => {
        const bytes = fileHost?.readFile(readHostPath(pathPtr, pathLen));
        if (!bytes) {
          return -1;
        }
        if (!outPtr || outLen === 0) {
          return bytes.byteLength;
        }
        const copyLen = Math.min(outLen, bytes.byteLength);
        readBytes(outPtr, copyLen).set(bytes.subarray(0, copyLen));
        return copyLen;
      },
      iwm_host_write_file: (pathPtr, pathLen, bytesPtr, bytesLen) => {
        fileHost?.writeFile(
          readHostPath(pathPtr, pathLen),
          new Uint8Array(readBytes(bytesPtr, bytesLen))
        );
        return 1;
      },
      iwm_host_remove_file: (pathPtr, pathLen) => {
        return fileHost?.removeFile(readHostPath(pathPtr, pathLen)) ? 1 : 0;
      }
    }
  };
}
function wasmSoundMode(mode) {
  return mode === 1 ? "loop" : "once";
}
function mergeWasmRuntimeImports(overrides, options = {}) {
  const defaults = makeWasmRuntimeHostImports(options);
  return {
    ...defaults,
    ...overrides,
    env: {
      ...defaults.env ?? {},
      ...overrides.env ?? {}
    }
  };
}
export {
  instantiateWasmRuntimeBridge
};
