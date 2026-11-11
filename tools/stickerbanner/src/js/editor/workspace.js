import {geometry} from "./geometry.js";

export function createworkspace(flow) {
    const area = document.querySelector(".workspace");
    const banner = document.querySelector(".banner");
    const rows = document.querySelector(".rowcount");
    const handle = document.querySelector(".rowhandle");
    const panel = document.querySelector(".publishing");
    const frame = document.querySelector(".previewframe");
    const theme = document.querySelector(".themebutton");
    let drag = null;
    try {document.body.classList.toggle("dark",localStorage.getItem("stickerbannertheme") === "dark");} catch {}

    function fit() {
        const layout = geometry(document.querySelector(".profilewidth").value,rows.value);
        const style = getComputedStyle(area);
        const width = area.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const height = area.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const logical = layout.tile * Number(rows.value) + (Number(rows.value) - 1) * 8 + 16;
        const maximum = layout.tile * 4 + 40;
        const size = Math.max(1,Math.min(760,width,height * layout.profile / maximum));
        frame.style.width = size + "px";
        frame.style.height = size * maximum / layout.profile + "px";
        banner.style.width = size + "px";
        banner.style.height = size * logical / layout.profile + "px";
        banner.style.setProperty("--unit",size / layout.profile + "px");
        handle.setAttribute("aria-valuenow",rows.value);
        handle.setAttribute("aria-valuetext",`3 columns, ${rows.value} rows`);
    }

    function setrows(value) {
        value = Math.max(1,Math.min(4,value));
        if (Number(rows.value) === value) return;
        rows.value = value;
        rows.dispatchEvent(new Event("change"));
        fit();
    }

    function settheme() {
        const dark = document.body.classList.contains("dark");
        theme.querySelector("path").setAttribute("d",dark
            ? "M440-840v-80h80v80h-80Zm0 800v-80h80v80h-80ZM840-440v-80h80v80h-80ZM40-440v-80h80v80H40Zm722-266-56-56 57-57 56 56-57 57ZM141-141l-56-56 57-57 56 56-57 57Zm622 56-57-57 56-56 57 57-56 56ZM198-706l-57-57 56-56 57 57-56 56ZM480-240q-100 0-170-70t-70-170q0-100 70-170t170-70q100 0 170 70t70 170q0 100-70 170t-170 70Zm0-80q66 0 113-47t47-113q0-66-47-113t-113-47q-66 0-113 47t-47 113q0 66 47 113t113 47Z"
            : "M480-80q-167 0-283.5-116.5T80-480q0-150 96-262t244-134q-33 57-44.5 123T364-620q0 117 82 199t199 82q67 0 133-19t122-55q-22 148-134 240T480-80Z");
        theme.setAttribute("aria-pressed",String(dark));
        theme.setAttribute("aria-label",dark ? "use light mode" : "use dark mode");
    }

    function open() {
        const account = document.querySelector(".account").textContent;
        flow.notify("accountrequest");
        panel.querySelector(".dialogtitle").textContent = account.startsWith("@") ? "your tiktok account" : "log in to tiktok";
        if (!panel.open) panel.showModal();
    }

    document.querySelector(".accountbutton").addEventListener("click",open);
    document.querySelector(".publishbar").addEventListener("click",() => {
        open();
        flow.notify("publishrequest");
        panel.querySelector(".dialogtitle").textContent = "publish your banner";
    });
    document.querySelector(".closepublishing").addEventListener("click",() => panel.close());
    document.querySelector(".choosevideo").addEventListener("click",() => document.querySelector(".source").click());
    const account = document.querySelector(".account");
    const caption = document.querySelector(".accountcaption");
    new MutationObserver(() => {
        caption.textContent = account.textContent.startsWith("@") ? "signed in as " + account.textContent : account.textContent === "connecting" ? "connecting to tiktok" : "log in to tiktok";
    }).observe(account,{childList:true,subtree:true,characterData:true});
    theme.addEventListener("click",() => {
        document.body.classList.toggle("dark");
        try {localStorage.setItem("stickerbannertheme",document.body.classList.contains("dark") ? "dark" : "light");} catch {}
        settheme();
        document.dispatchEvent(new Event("bannertheme"));
    });
    handle.addEventListener("pointerdown",event => {
        if (handle.disabled) return;
        drag = {top:event.clientY,rows:Number(rows.value),step:banner.clientWidth / Number(document.querySelector(".profilewidth").value) * (geometry(document.querySelector(".profilewidth").value,4).tile + 8)};
        handle.setPointerCapture(event.pointerId);
        event.preventDefault();
    });
    handle.addEventListener("pointermove",event => {
        if (drag) setrows(drag.rows + Math.round((event.clientY - drag.top) / Math.max(40,drag.step)));
    });
    for (const name of ["pointerup","pointercancel","lostpointercapture"]) handle.addEventListener(name,() => {drag = null;});
    handle.addEventListener("keydown",event => {
        if (!["ArrowUp","ArrowDown","Home","End"].includes(event.key) || handle.disabled) return;
        event.preventDefault();
        setrows(event.key === "Home" ? 1 : event.key === "End" ? 4 : Number(rows.value) + (event.key === "ArrowDown" ? 1 : -1));
    });
    new ResizeObserver(fit).observe(area);
    settheme();
    return {fit};
}
