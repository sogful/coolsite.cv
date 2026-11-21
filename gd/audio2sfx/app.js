const form = document.querySelector("#convert-form");
const picker = document.querySelector("#audio-file");
const dropzone = document.querySelector("#dropzone");
const fileTitle = document.querySelector("#file-title");
const fileSubtitle = document.querySelector("#file-subtitle");
const button = document.querySelector("#convert-button");
const statusPanel = document.querySelector(".status-panel");
const statusHeading = document.querySelector("#status-heading");
const statusCopy = document.querySelector("#status-copy");
const progress = document.querySelector("#progress-track");
const result = document.querySelector("#result");
const catalog = document.querySelector("#catalog-status");
const folderButton = document.querySelector("#save-sfx-folder");
const zipButton = document.querySelector("#download-sfx-zip");
const sfxActions = document.querySelector("#sfx-actions");
const sfxActionNote = document.querySelector("#sfx-action-note");
const maxBytes = 100 * 1024 * 1024;
let objectUrl;
let latestSfxIds = [];

function prettySize(bytes) {
  return bytes < 1048576
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`;
}

function showFile(file) {
  if (!file) return;
  fileTitle.textContent = file.name;
  fileSubtitle.textContent = `${prettySize(file.size)} · ready to convert`;
  dropzone.classList.add("has-file");
}

function setStatus(kind, title, copy) {
  statusPanel.classList.remove("busy", "done", "error");
  if (kind) statusPanel.classList.add(kind);
  statusHeading.textContent = title;
  statusCopy.textContent = copy;
}

function setSfxButtonsDisabled(disabled) {
  folderButton.disabled = disabled;
  zipButton.disabled = disabled;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function downloadSfxZip(ids, message) {
  if (!ids.length) return;
  setSfxButtonsDisabled(true);
  sfxActionNote.textContent = message || "Preparing a ZIP with every SFX used by this level…";

  try {
    const response = await fetch("/api/sfx-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      let detail = "Could not prepare the SFX ZIP.";
      try {
        detail = (await response.json()).error || detail;
      } catch {}
      throw new Error(detail);
    }

    const blob = await response.blob();
    triggerDownload(blob, "gd-sfx-pack.zip");
    const count = response.headers.get("X-SFX-Count") || ids.length;
    sfxActionNote.textContent = `${Number(count).toLocaleString()} SFX downloaded. Extract the files into your GeometryDash folder.`;
  } catch (error) {
    sfxActionNote.textContent = error.message;
  } finally {
    setSfxButtonsDisabled(false);
  }
}

async function saveSfxToFolder(ids) {
  if (!ids.length) return;
  if (!window.showDirectoryPicker) {
    await downloadSfxZip(ids, "This browser cannot grant folder access. Preparing the ZIP fallback…");
    return;
  }

  let directory;
  try {
    directory = await window.showDirectoryPicker({
      id: "gdgen-sfx-folder",
      mode: "readwrite",
    });
  } catch (error) {
    if (error.name === "AbortError") {
      sfxActionNote.textContent = "Folder selection cancelled. You can still download the SFX ZIP.";
      return;
    }
    await downloadSfxZip(ids, "Folder access was unavailable. Preparing the ZIP fallback…");
    return;
  }

  setSfxButtonsDisabled(true);
  let saved = 0;
  let skipped = 0;

  try {
    for (let start = 0; start < ids.length; start += 8) {
      const batch = ids.slice(start, start + 8);
      const results = await Promise.all(batch.map(async id => {
        const filename = `s${id}.ogg`;
        try {
          await directory.getFileHandle(filename);
          return "skipped";
        } catch (error) {
          if (error.name !== "NotFoundError") throw error;
        }

        const response = await fetch(`/api/sfx/${id}.ogg`);
        if (!response.ok) throw new Error(`Could not read SFX ${id} from the local cache.`);
        const handle = await directory.getFileHandle(filename, { create: true });
        const writable = await handle.createWritable();
        await writable.write(await response.blob());
        await writable.close();
        return "saved";
      }));

      for (const item of results) {
        if (item === "saved") saved += 1;
        else skipped += 1;
      }
      sfxActionNote.textContent = `Saving SFX… ${Math.min(start + batch.length, ids.length)} of ${ids.length}`;
    }

    sfxActionNote.textContent = `${saved} saved. ${skipped} existing files left untouched.`;
  } catch (error) {
    await downloadSfxZip(ids, `Folder access stopped (${saved} saved, ${skipped} existing files untouched). Preparing a complete ZIP fallback…`);
  } finally {
    setSfxButtonsDisabled(false);
  }
}

picker.addEventListener("change", () => showFile(picker.files[0]));
dropzone.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    picker.click();
  }
});

for (const name of ["dragenter", "dragover"]) {
  dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  });
}

for (const name of ["dragleave", "drop"]) {
  dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
  });
}

dropzone.addEventListener("drop", event => {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  picker.files = transfer.files;
  showFile(file);
});

fetch("/api/status")
  .then(response => {
    if (!response.ok) throw new Error("Local converter is not serving this page.");
    return response.json();
  })
  .then(data => {
    catalog.textContent = data.ready
      ? `Local library ready · ${data.sounds.toLocaleString()} sounds · ${data.index_windows.toLocaleString()} indexed windows`
      : data.message || "Local SFX library needs setup. See the README.";
  })
  .catch(() => {
    catalog.replaceChildren(document.createTextNode("Static preview only. "));
    const link = document.createElement("a");
    link.href = "http://127.0.0.1:8765/";
    link.textContent = "Open local converter";
    link.style.color = "var(--lime)";
    link.style.fontWeight = "700";
    catalog.append(link);
  });

folderButton.addEventListener("click", () => saveSfxToFolder(latestSfxIds));
zipButton.addEventListener("click", () => downloadSfxZip(latestSfxIds));

form.addEventListener("submit", async event => {
  event.preventDefault();
  const file = picker.files[0];
  if (!file) {
    setStatus("error", "Choose an audio file", "Select a WAV, OGG or MP3 file to continue.");
    return;
  }
  if (file.size > maxBytes) {
    setStatus("error", "That file is too large", "The local converter accepts audio files up to 100 MB.");
    return;
  }

  const data = new FormData(form);
  data.set("file", file);
  button.disabled = true;
  progress.hidden = false;
  result.hidden = true;
  sfxActions.hidden = true;
  latestSfxIds = [];
  setStatus("busy", "Building your level", "Searching the local SFX library and arranging the triggers. A detailed match can take a few minutes.");
  const started = Date.now();

  try {
    const response = await fetch("/api/convert", { method: "POST", body: data });
    if (!response.ok) {
      let detail = "Conversion failed. Check the audio and local SFX library.";
      try {
        detail = (await response.json()).error || detail;
      } catch {}
      throw new Error(detail);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const encodedName = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const filename = encodedName
      ? decodeURIComponent(encodedName)
      : plainName || "song.gmd";
    latestSfxIds = (response.headers.get("X-Conversion-Sfx-Ids") || "")
      .split(",")
      .map(Number)
      .filter(Number.isInteger);

    objectUrl && URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.className = "download-link";
    link.href = objectUrl;
    link.download = filename;
    link.textContent = "↓  DOWNLOAD .GMD LEVEL";
    result.replaceChildren(link);

    const details = [];
    const events = response.headers.get("X-Conversion-Events");
    if (events) details.push(`${Number(events).toLocaleString()} triggers`);
    details.push(`${latestSfxIds.length.toLocaleString()} unique SFX`);
    details.push(`${Math.round((Date.now() - started) / 1000)}s`);
    const meta = document.createElement("p");
    meta.className = "result-meta";
    meta.textContent = `${details.join(" · ")}. Your uploaded audio has been discarded.`;
    result.append(meta);
    result.hidden = false;
    sfxActions.hidden = latestSfxIds.length === 0;
    progress.hidden = true;
    setStatus("done", "Your level is ready", "Import the downloaded .gmd into Geometry Dash to play your SFX version.");
  } catch (error) {
    progress.hidden = true;
    setStatus("error", "Could not make that level", error.message);
  } finally {
    button.disabled = false;
  }
});
