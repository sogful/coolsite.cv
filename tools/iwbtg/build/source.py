from pathlib import Path as path
import json
import tomllib
import zipfile

########################################################################

root = path(__file__).resolve().parents[3]
engine = root / ".claude/iwbtg/enginesource"
vendor = root / "tools/iwbtg/vendor"
licenses = [
    ("iwanna-gm8-web-engine 7b73aaa609afb82ff6dc530504b12fcf3d5e7597", engine / "LICENSE"),
    ("OpenGMK ca910f100ab7f3719a7b57c4ea5f0f3f74f20031", engine / "vendor/OpenGMK/LICENCE.md"),
    ("browser_wasi_shim 0.4.2", root / ".claude/iwbtg/deps/node_modules/@bjorn3/browser_wasi_shim/LICENSE-MIT"),
    ("fflate 0.8.3", root / ".claude/iwbtg/deps/node_modules/fflate/LICENSE")
]
text = "The converter is distributed under GPL-2.0-only. Exact corresponding source and build scripts are in source.zip alongside these files.\n\n"
for title, file in licenses:
    text += title + "\n" + file.read_text(encoding="utf-8") + "\n\n"
(vendor / "licenses.txt").write_text(text, encoding="utf-8")

########################################################################

with zipfile.ZipFile(vendor / "source.zip", "w", zipfile.ZIP_DEFLATED, strict_timestamps=False) as archive:
    selected = list((root / "tools/iwbtg/build").glob("*"))
    selected += list((engine / "crates").rglob("*"))
    selected += list((engine / "runtime/src").rglob("*"))
    selected += list((engine / "vendor/OpenGMK/gm8exe").rglob("*"))
    selected += [file for _, file in licenses]
    selected += [engine / name for name in ["Cargo.toml", "Cargo.lock", "NOTICE.md"]]
    selected += [root / ".claude/iwbtg/deps/package.json", root / ".claude/iwbtg/deps/package-lock.json"]
    for file in sorted(set(selected)):
        if file.is_file() and file.suffix not in [".pyc"]:
            archive.write(file, file.relative_to(root).as_posix())
    lock = tomllib.loads((root / "tools/iwbtg/build/Cargo.lock").read_text())
    runtime = tomllib.loads((engine / "Cargo.lock").read_text())
    lock["package"] += [package for package in runtime["package"] if package["name"] in ["serde", "serde_core", "serde_derive", "serde_json", "syn", "quote", "proc-macro2", "unicode-ident", "itoa", "memchr", "zmij"]]
    registry = path.home() / ".cargo/registry/src"
    included = set()
    for package in lock["package"]:
        if "source" not in package:
            continue
        name = package["name"] + "-" + package["version"]
        if name in included:
            continue
        included.add(name)
        matches = list(registry.glob("*/" + name))
        if not matches:
            continue
        for file in matches[0].rglob("*"):
            if file.is_file():
                archive.write(file, "dependencies/" + name + "/" + file.relative_to(matches[0]).as_posix())
assets = sorted(file.relative_to(root / "tools/iwbtg").as_posix() for file in vendor.rglob("*") if file.is_file() and file.name != "assets.json")
(vendor / "assets.json").write_text(json.dumps(assets, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"source": (vendor / "source.zip").stat().st_size, "assets": len(assets)}))

