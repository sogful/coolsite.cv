// .claude/iwbtg/enginesource/runtime/src/runtime/wasmSession.ts
var DEFAULT_INPUT = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  jumpReleased: false,
  restart: false,
  keysHeld: [],
  keysPressed: [],
  keysReleased: []
};
var WasmRuntimeSession = class {
  constructor(bridge, now = () => globalThis.performance?.now() ?? Date.now()) {
    this.bridge = bridge;
    this.now = now;
  }
  bridge;
  now;
  input = { ...DEFAULT_INPUT };
  previousJump = false;
  previousKeys = /* @__PURE__ */ new Set();
  pendingJumpPressed = false;
  pendingJumpReleased = false;
  pendingKeyPresses = /* @__PURE__ */ new Set();
  pendingKeyReleases = /* @__PURE__ */ new Set();
  setInputState(snapshot) {
    const jumpPressed = snapshot.jump && !this.previousJump;
    const jumpReleased = !snapshot.jump && this.previousJump;
    const heldKeys = new Set(snapshot.keysHeld ?? []);
    const keysPressed = /* @__PURE__ */ new Set([
      ...[...heldKeys].filter((key) => !this.previousKeys.has(key)),
      ...snapshot.keysPressed ?? []
    ]);
    const keysReleased = /* @__PURE__ */ new Set([
      ...[...this.previousKeys].filter((key) => !heldKeys.has(key)),
      ...snapshot.keysReleased ?? []
    ]);
    if (jumpPressed) {
      this.pendingJumpPressed = true;
    }
    if (jumpReleased) {
      this.pendingJumpReleased = true;
    }
    for (const key of keysPressed) {
      this.pendingKeyPresses.add(key);
    }
    for (const key of keysReleased) {
      this.pendingKeyReleases.add(key);
    }
    const mouseInput = snapshot.mouseX != null || snapshot.mouseY != null || snapshot.mouseButtonsHeld != null || snapshot.mouseButtonsPressed != null || snapshot.mouseButtonsReleased != null ? {
      mouseX: snapshot.mouseX ?? 0,
      mouseY: snapshot.mouseY ?? 0,
      mouseButtonsHeld: snapshot.mouseButtonsHeld ?? [],
      mouseButtonsPressed: snapshot.mouseButtonsPressed ?? [],
      mouseButtonsReleased: snapshot.mouseButtonsReleased ?? []
    } : {};
    this.input = {
      left: snapshot.left,
      right: snapshot.right,
      jump: snapshot.jump,
      jumpPressed: this.pendingJumpPressed,
      jumpReleased: this.pendingJumpReleased,
      restart: snapshot.restart,
      keysHeld: [...heldKeys],
      keysPressed: [...this.pendingKeyPresses],
      keysReleased: [...this.pendingKeyReleases],
      ...mouseInput
    };
    this.previousJump = snapshot.jump;
    this.previousKeys = heldKeys;
  }
  async stepOnce() {
    const input = { ...this.input };
    const runtimeStart = this.now();
    let snapshot;
    let frame;
    let inputMs = 0;
    let tickMs = 0;
    let snapshotMs = 0;
    let frameMs = 0;
    if (this.bridge.step) {
      const stepStart = this.now();
      const result = await this.bridge.step(input);
      const stepMs = this.now() - stepStart;
      inputMs = stepMs;
      tickMs = 0;
      snapshotMs = 0;
      frameMs = 0;
      snapshot = result.snapshot;
      frame = result.frame;
    } else {
      const inputStart = this.now();
      await this.bridge.setInput(input);
      inputMs = this.now() - inputStart;
      const tickStart = this.now();
      await this.bridge.tick(1);
      tickMs = this.now() - tickStart;
      const snapshotStart = this.now();
      snapshot = await this.bridge.snapshot();
      snapshotMs = this.now() - snapshotStart;
      const frameStart = this.now();
      frame = await this.bridge.frame();
      frameMs = this.now() - frameStart;
    }
    const runtimeMs = this.now() - runtimeStart;
    const preserveEdgesForDialog = Boolean(snapshot.pendingDialog);
    if (!preserveEdgesForDialog) {
      this.pendingJumpPressed = false;
      this.pendingJumpReleased = false;
      this.pendingKeyPresses.clear();
      this.pendingKeyReleases.clear();
      this.input.jumpPressed = false;
      this.input.jumpReleased = false;
      this.input.keysPressed = [];
      this.input.keysReleased = [];
      if (this.input.mouseButtonsPressed) {
        this.input.mouseButtonsPressed = [];
      }
      if (this.input.mouseButtonsReleased) {
        this.input.mouseButtonsReleased = [];
      }
    }
    return {
      snapshot,
      frame,
      timings: {
        inputMs,
        tickMs,
        snapshotMs,
        frameMs,
        runtimeMs
      }
    };
  }
};
export {
  WasmRuntimeSession
};
