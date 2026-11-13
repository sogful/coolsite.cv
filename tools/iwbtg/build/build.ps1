$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Resolve-Path (Join-Path $PSScriptRoot "..\..\.."))
$repository = (Get-Location).Path
$engine = Join-Path $repository ".claude\iwbtg\enginesource"
$dependencies = Join-Path $repository ".claude\iwbtg\deps"
New-Item -ItemType Directory -Force $dependencies | Out-Null
if (!(Test-Path -LiteralPath $engine)) {
    git clone https://github.com/horizonzzzz/iwanna-gm8-web-engine $engine
    if ($LASTEXITCODE) {throw "Could not download the engine"}
    git -C $engine checkout 7b73aaa609afb82ff6dc530504b12fcf3d5e7597
    if ($LASTEXITCODE) {throw "Could not select the engine revision"}
    git -C $engine submodule update --init --depth 1 vendor/OpenGMK
    if ($LASTEXITCODE) {throw "Could not download OpenGMK"}
}
if (Test-Path -LiteralPath (Join-Path $engine ".git")) {
    $revision = git -C $engine rev-parse HEAD
    if ($revision -ne "7b73aaa609afb82ff6dc530504b12fcf3d5e7597") {throw "The engine checkout does not match the required revision"}
}
$manifest = Join-Path $engine "crates\iwm-parser\Cargo.toml"
$contents = Get-Content -Raw -LiteralPath $manifest
[IO.File]::WriteAllText($manifest, ($contents -replace '(?m)^iwm-detector = .*\r?\n', ''))
rustup target add --toolchain stable wasm32-wasip1 wasm32-unknown-unknown
if ($LASTEXITCODE) {throw "Could not install WebAssembly targets"}
$env:CARGO_TARGET_DIR = Join-Path $repository ".claude\iwbtg\target"
cargo +stable rustc --locked --release --manifest-path tools/iwbtg/build/Cargo.toml --target wasm32-wasip1 -- -C lto=off
if ($LASTEXITCODE) {throw "Could not build the converter"}
Copy-Item -LiteralPath (Join-Path $env:CARGO_TARGET_DIR "wasm32-wasip1\release\converter.wasm") -Destination tools/iwbtg/vendor/converter.wasm
$env:CARGO_TARGET_DIR = Join-Path $repository ".claude\iwbtg\runtimebuild"
cargo +stable build --locked --release --manifest-path .claude/iwbtg/enginesource/Cargo.toml -p iwm-runtime-web --target wasm32-unknown-unknown
if ($LASTEXITCODE) {throw "Could not build the runtime"}
Copy-Item -LiteralPath (Join-Path $env:CARGO_TARGET_DIR "wasm32-unknown-unknown\release\iwm_runtime_web.wasm") -Destination tools/iwbtg/vendor/runtime.wasm
npm install --prefix $dependencies --no-audit --no-fund esbuild@0.28.2 @bjorn3/browser_wasi_shim@0.4.2 fflate@0.8.3
if ($LASTEXITCODE) {throw "Could not install JavaScript dependencies"}
node tools/iwbtg/build/bundle.mjs
if ($LASTEXITCODE) {throw "Could not bundle browser libraries"}
python tools/iwbtg/build/source.py
if ($LASTEXITCODE) {throw "Could not package the corresponding source"}

