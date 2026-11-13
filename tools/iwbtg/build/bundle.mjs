import path from "node:path";
import fs from "node:fs/promises";
import {fileURLToPath as filepath} from "node:url";
import {build} from "../../../.claude/iwbtg/deps/node_modules/esbuild/lib/main.js";

/*//////////////////////////////////////////////////////////////////////*/

const root = path.resolve(path.dirname(filepath(import.meta.url)), "../../..");
const deps = path.join(root, ".claude/iwbtg/deps");
const upstream = "../../enginesource/runtime/src/";
const entries = path.join(deps, "entries");
await fs.mkdir(entries, {recursive: true});
const modules = {
    bridge: `export {instantiateWasmRuntimeBridge} from "${upstream}runtime/wasmBridge.ts";`,
    audio: `export {createWebAudioHost} from "${upstream}runtime/wasmAudioHost.ts";`,
    session: `export {WasmRuntimeSession} from "${upstream}runtime/wasmSession.ts";`,
    renderer: `export {renderWasmFrame} from "${upstream}render/wasmFrameRenderer.ts";`,
    cache: `export {ResourceCache} from "${upstream}render/resourceCache.ts";`
};
for (const [name, code] of Object.entries(modules)) {await fs.writeFile(path.join(entries, name + ".ts"), code);}
await build({entryPoints: Object.keys(modules).map(name => path.join(entries, name + ".ts")), outdir: path.join(root, "tools/iwbtg/vendor/engine"), bundle: true, splitting: true, format: "esm"});
await fs.writeFile(path.join(root, "tools/iwbtg/vendor/runtime.js"), Object.entries({bridge: "instantiateWasmRuntimeBridge", audio: "createWebAudioHost", session: "WasmRuntimeSession", renderer: "renderWasmFrame", cache: "ResourceCache"}).map(([file, symbol]) => `export {${symbol}} from "./engine/${file}.js";`).join("\n") + "\n");
const shim = path.join(deps, "node_modules/@bjorn3/browser_wasi_shim/dist");
await build({entryPoints: {wasi: path.join(shim, "wasi.js"), files: path.join(shim, "fs_mem.js"), descriptors: path.join(shim, "fd.js")}, outdir: path.join(root, "tools/iwbtg/vendor/wasi"), bundle: true, splitting: true, format: "esm"});
await fs.writeFile(path.join(root, "tools/iwbtg/vendor/wasi.js"), 'export {default as WASI} from "./wasi/wasi.js";\nexport {File, Directory, OpenFile, ConsoleStdout, PreopenDirectory} from "./wasi/files.js";\n');
await fs.writeFile(path.join(entries, "zipread.js"), 'export {unzipSync} from "fflate";\n');
await fs.writeFile(path.join(entries, "zipwrite.js"), 'export {zipSync} from "fflate";\n');
await build({entryPoints: [path.join(entries, "zipread.js"), path.join(entries, "zipwrite.js")], outdir: path.join(root, "tools/iwbtg/vendor/zip"), bundle: true, splitting: true, format: "esm"});
await fs.writeFile(path.join(root, "tools/iwbtg/vendor/zip.js"), 'export {zipSync} from "./zip/zipwrite.js";\nexport {unzipSync} from "./zip/zipread.js";\n');
