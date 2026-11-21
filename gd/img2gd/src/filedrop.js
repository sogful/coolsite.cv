const uploadrow = document.querySelector(".uploadrow");
const fileoverlay = document.querySelector(".fileoverlay");
let filedragdepth = 0;

function showfiledrag(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  uploadrow.classList.toggle("isdragging", uploadrow.contains(event.target));
  if (!fileoverlay.matches(":popover-open")) fileoverlay.showPopover?.();
}

function clearfiledrag() {
  filedragdepth = 0;
  uploadrow.classList.remove("isdragging");
  fileoverlay.hidePopover?.();
}

/*//////////////////////////////////////////////////////////////////////*/

document.addEventListener("dragenter", event => {
  if (!event.dataTransfer?.types.includes("Files")) return;
  filedragdepth += 1;
  showfiledrag(event);
});

document.addEventListener("dragover", event => {
  if (event.dataTransfer?.types.includes("Files")) showfiledrag(event);
});

document.addEventListener("dragleave", () => {
  if (--filedragdepth <= 0) clearfiledrag();
});

document.addEventListener("dragend", clearfiledrag);
document.addEventListener("drop", event => {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  clearfiledrag();
  loadupload(event.dataTransfer.files);
});
