"""Local-only web bridge to GDGen's SFX-to-level converter."""

from __future__ import annotations

import cgi
import io
import json
import mimetypes
import os
import re
import sys
import tempfile
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit


HERE = Path(__file__).resolve().parent
SITE_ROOT = HERE.parent
GDGEN = HERE.parents[2] / "gdgen"
SFX_CACHE = GDGEN / "data" / "sfx"
MAX_UPLOAD = 100 * 1024 * 1024
MAX_DURATION = 30.0
MAX_SFX_IDS = 4096
PORT = 8765

sys.path.insert(0, str(GDGEN))


def status():
    catalog_path = SFX_CACHE / "catalog.json"
    index_path = SFX_CACHE / "index-62ms.npz"
    if not catalog_path.is_file() or not index_path.is_file():
        return {"ready": False, "message": "GDGen local SFX catalog/index not found. See README.md."}
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        import numpy as np

        with np.load(index_path) as index:
            windows = len(index["ids"])
        cache = SFX_CACHE / "files"
        with os.scandir(cache) as entries:
            available = sum(1 for entry in entries
                            if entry.name.startswith("s") and entry.name.endswith(".ogg") and entry.is_file())
        return {"ready": available > 0, "sounds": catalog.get("sounds", len(catalog.get("files", []))),
                "cached": available, "index_windows": windows,
                "message": None if available else "No cached SFX clips found. Run the GDGen SFX cache command first."}
    except Exception as error:
        return {"ready": False, "message": f"Could not read local SFX index: {error}"}


class Handler(BaseHTTPRequestHandler):
    server_version = "ToSFXLocal/1.0"

    def log_message(self, fmt, *args):
        # Avoid logging request bodies, filenames or other user-provided details.
        print(f"[tosfx] {self.address_string()} {self.command} {self.path.split('?')[0]}")

    def send_json(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == "/api/status":
            self.send_json(200, status())
            return
        sound_match = re.fullmatch(r"/api/sfx/(\d+)\.ogg", path)
        if sound_match:
            sound_path = SFX_CACHE / "files" / f"s{int(sound_match.group(1))}.ogg"
            if not sound_path.is_file():
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", "audio/ogg")
            self.send_header("Content-Length", str(sound_path.stat().st_size))
            self.send_header("Cache-Control", "private, max-age=3600")
            self.end_headers()
            with sound_path.open("rb") as sound_file:
                while chunk := sound_file.read(1024 * 1024):
                    self.wfile.write(chunk)
            return
        relative = path.lstrip("/")
        if path == "/":
            target = HERE / "index.html"
        else:
            target = (SITE_ROOT / relative).resolve()
            if SITE_ROOT not in target.parents and target != SITE_ROOT:
                self.send_error(404)
                return
            if not target.exists():
                local_target = (HERE / relative).resolve()
                if HERE in local_target.parents:
                    target = local_target
        if target.is_dir():
            target = target / "index.html"
        if not target.is_file() or (target != SITE_ROOT and SITE_ROOT not in target.parents):
            self.send_error(404)
            return
        body = target.read_bytes()
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type + ("; charset=utf-8" if content_type.startswith(("text/", "application/javascript")) else ""))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        request_path = urlsplit(self.path).path
        if request_path not in {"/api/convert", "/api/sfx-zip"}:
            self.send_error(404)
            return
        if self.client_address[0] not in {"127.0.0.1", "::1"}:
            self.send_json(403, {"error": "The converter only accepts requests from this computer."})
            return
        origin = self.headers.get("Origin")
        if origin and origin != f"http://127.0.0.1:{PORT}":
            self.send_json(403, {"error": "Open the converter from its local page before uploading audio."})
            return
        if request_path == "/api/sfx-zip":
            self.send_sfx_zip()
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json(400, {"error": "Invalid request size."})
            return
        if content_length <= 0 or content_length > MAX_UPLOAD + 1024 * 1024:
            self.send_json(413, {"error": "Choose a file smaller than 100 MB."})
            return
        if not self.headers.get("Content-Type", "").lower().startswith("multipart/form-data"):
            self.send_json(400, {"error": "Upload the audio using the page's file picker."})
            return

        try:
            import soundfile as sf
            from gdgen.sfx import convert

            fields = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={
                "REQUEST_METHOD": "POST", "CONTENT_TYPE": self.headers["Content-Type"],
                "CONTENT_LENGTH": str(content_length),
            }, keep_blank_values=True)
            uploaded = fields["file"] if "file" in fields else None
            if uploaded is None or not uploaded.filename:
                raise ValueError("Choose a WAV, OGG or MP3 audio file.")
            original_name = Path(uploaded.filename.replace("\\", "/")).name
            extension = Path(original_name).suffix.lower()
            if extension not in {".wav", ".ogg", ".mp3"}:
                raise ValueError("Supported audio formats are WAV, OGG and MP3.")
            audio_bytes = uploaded.file.read(MAX_UPLOAD + 1)
            if not audio_bytes or len(audio_bytes) > MAX_UPLOAD:
                raise ValueError("Choose a non-empty audio file up to 100 MB.")
            params = {}
            for key in ("start", "duration", "layers", "volume", "hop", "shortlist"):
                field = fields[key] if key in fields else None
                params[key] = field.value if field is not None else None
            start = float(params["start"] or 0)
            duration = float(params["duration"] or 10)
            layers = int(params["layers"] or 4)
            volume = float(params["volume"] or 0.75)
            hop = float(params["hop"] or 0.0625)
            shortlist = int(params["shortlist"] or 128)
            if start < 0 or not (0.25 <= duration <= MAX_DURATION):
                raise ValueError("Start must be non-negative and length must be between 0.25 and 30 seconds.")
            if not (1 <= layers <= 12) or not (0.05 <= volume <= 2.0):
                raise ValueError("Layers must be 1–12 and volume must be 0.05–2.0.")
            if hop not in {0.0625, 0.125, 0.25} or shortlist not in {32, 64, 128}:
                raise ValueError("Choose one of the listed matching settings.")
            indexname = {0.0625: "index-62ms", 0.125: "index-125ms", 0.25: "index"}[hop]
            if not (SFX_CACHE / f"{indexname}.npz").is_file():
                raise ValueError(f"The local {hop * 1000:g} ms SFX index is missing.")
            if not status().get("ready"):
                raise ValueError("The local SFX cache or index is missing. Follow README.md setup steps.")

            with tempfile.TemporaryDirectory(prefix="tosfx-") as temporary:
                workspace = Path(temporary)
                source = workspace / ("upload" + extension)
                source.write_bytes(audio_bytes)
                info = sf.info(source)
                if info.duration <= start:
                    raise ValueError("The selected start time is past the end of this audio file.")
                if duration > info.duration - start + 1 / info.samplerate:
                    raise ValueError(f"This file only has {max(0, info.duration-start):.2f} seconds after the chosen start.")
                outdir = workspace / "converted"
                report = convert(source, outdir, SFX_CACHE, start=start, duration=duration,
                                 hop=hop, volume=volume, layers=layers, indexname=indexname,
                                 shortlist=shortlist, refine=0.015625, timingscale=1.0152)
                payload = (outdir / "level.gmd").read_bytes()
                filename = (Path(original_name).stem[:180] or "song") + ".gmd"
                fallback = re.sub(r"[^A-Za-z0-9_.-]+", "-", filename.encode("ascii", "ignore").decode("ascii"))
                fallback = fallback.strip("-.") or "song.gmd"
                encoded_filename = quote(filename, safe="")
                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Disposition",
                                 f'attachment; filename="{fallback}"; filename*=UTF-8\'\'{encoded_filename}')
                self.send_header("Content-Length", str(len(payload)))
                self.send_header("Cache-Control", "no-store")
                self.send_header("X-Conversion-Events", str(report["events"]))
                self.send_header("X-Conversion-Sounds", str(report["unique_sfx"]))
                self.send_header("X-Conversion-Sfx-Ids", ",".join(map(str, report["sfxids"])))
                self.end_headers()
                self.wfile.write(payload)
        except (ValueError, RuntimeError) as error:
            self.send_json(400, {"error": str(error)})
        except Exception as error:
            self.send_json(500, {"error": f"Conversion failed: {error}"})

    def send_sfx_zip(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > 128 * 1024:
                raise ValueError("The SFX list is missing or too large.")
            request = json.loads(self.rfile.read(content_length))
            identifiers = request.get("ids") if isinstance(request, dict) else None
            if not isinstance(identifiers, list) or not identifiers or len(identifiers) > MAX_SFX_IDS:
                raise ValueError("Choose a level with between 1 and 4,096 unique SFX files.")
            if any(isinstance(identifier, bool) or not isinstance(identifier, int) or identifier < 0
                   for identifier in identifiers):
                raise ValueError("The SFX list contains an invalid sound ID.")
            identifiers = sorted(set(identifiers))
            catalog = json.loads((SFX_CACHE / "catalog.json").read_text(encoding="utf-8"))
            valid_ids = {item["id"] for item in catalog.get("files", [])}
            if any(identifier not in valid_ids for identifier in identifiers):
                raise ValueError("The SFX list contains an ID outside the local catalog.")
            sound_paths = [(identifier, SFX_CACHE / "files" / f"s{identifier}.ogg")
                           for identifier in identifiers]
            missing = [identifier for identifier, path in sound_paths if not path.is_file()]
            if missing:
                raise ValueError(f"{len(missing)} required SFX files are not cached locally.")

            archive = io.BytesIO()
            with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_STORED, allowZip64=False) as bundle:
                for identifier, path in sound_paths:
                    bundle.write(path, f"s{identifier}.ogg")
            payload = archive.getvalue()
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", 'attachment; filename="gd-sfx-pack.zip"')
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-SFX-Count", str(len(identifiers)))
            self.end_headers()
            self.wfile.write(payload)
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json(400, {"error": str(error)})
        except Exception as error:
            self.send_json(500, {"error": f"Could not prepare the SFX ZIP: {error}"})


def main():
    info = status()
    print(f"To SFX · local audio-to-level converter · SFX ready: {info.get('ready')}")
    print(f"Open http://127.0.0.1:{PORT}/ (listening on this computer only)")
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping local converter.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
