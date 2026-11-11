export function skin(panel) {
    if (!document.querySelector(".stickerskin")) {
        const style = document.createElement("style");
        style.className = "stickerskin";
        style.textContent = `
.stickerpanel {
    font-family: TikTokFont,Arial,Tahoma,PingFangSC,sans-serif; font-size: 16px;
    line-height: 1.5; color: var(--tux-colorTextPrimary,#161823);
    background: var(--tux-colorBGPrimary,#ffffff); box-sizing: border-box;
}
.stickerpanel::backdrop {background: rgba(0,0,0,0.5)}
.stickertitle {
    font-family: TikTokDisplayFont,TikTokFont,Arial,sans-serif; font-weight: 700;
    font-size: 28px; margin: 0 32px 20px 0;
    line-height: 1.2;
}
.stickermessage {
    margin: 16px 0; color: var(--tux-colorTextSecondary,rgba(22,24,35,0.75));
}
.stickeraction {
    display: block; width: 100%;
    min-height: 44px; padding: 10px 16px;
    border: 0; border-radius: 4px;
    font: inherit; font-weight: 600;
    background: var(--tux-colorPrimary,#fe2c55); color: #ffffff;
    cursor: pointer; margin-top: 16px;
}
.stickeraction:disabled {
    opacity: 0.4; cursor: default;
}
.stickerdismiss {
    position: absolute; top: 12px;
    right: 12px; width: 36px;
    height: 36px; padding: 6px;
    border: 0; border-radius: 50%;
    color: inherit; background: var(--tux-colorBGInput,rgba(22,24,35,0.06));
    cursor: pointer;
}
.stickericon {
    display: block; width: 24px;
    height: 24px; fill: currentColor;
}
.stickerfield {
    width: 100%; box-sizing: border-box;
    padding: 14px; border: 1px solid transparent;
    border-radius: 4px; font: inherit;
    background: var(--tux-colorBGInput,rgba(22,24,35,0.06)); color: inherit;
}
.stickerfield:focus {border-color: var(--tux-colorTextTertiary,rgba(22,24,35,0.5))}
`;
        document.head.append(style);
    }
    panel.classList.add("stickerpanel");
    Object.assign(panel.style,{
        position:"fixed",inset:"0",margin:"auto",
        width:panel.classList.contains("stickerverificationpanel") ? "min(720px,calc(100vw - 32px))" : "min(480px,calc(100vw - 32px))",
        height:"auto",maxWidth:"none",maxHeight:"calc(100dvh - 32px)",
        padding:"32px",border:"0",borderRadius:"8px",overflow:"auto",
        fontFamily:"TikTokFont,Arial,Tahoma,PingFangSC,sans-serif",fontSize:"16px",
        color:"var(--tux-colorTextPrimary,#161823)",background:"var(--tux-colorBGPrimary,#ffffff)"
    });
    for (const message of panel.querySelectorAll("p")) message.classList.add("stickermessage");
    for (const field of panel.querySelectorAll("input,textarea")) field.classList.add("stickerfield");
    for (const button of panel.querySelectorAll("button")) {
        if (button.textContent === "close") {
            button.classList.add("stickerdismiss");
            button.setAttribute("aria-label","close");
            button.innerHTML = `<svg class="stickericon" viewBox="0 -960 960 960" aria-hidden="true"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`;
        } else button.classList.add("stickeraction");
    }
}

/*//////////////////////////////////////////////////////////////////////*/

export async function asksetup(skin) {
    try {
        const text = await navigator.clipboard.readText();
        if (text.startsWith("sticker banner setup\n") && text.length <= 100000) return text;
    } catch {}
    return new Promise(resolve => {
        document.querySelector(".stickersetuppanel")?.remove();
        const panel = document.createElement("dialog");
        panel.className = "stickersetuppanel";
        const title = document.createElement("h2");
        title.className = "stickertitle";
        title.textContent = "connect your tiktok";
        const message = document.createElement("p");
        message.textContent = "paste the setup from your clipboard to continue.";
        const field = document.createElement("input");
        field.type = "password";
        field.autocomplete = "off";
        field.maxLength = 100000;
        field.setAttribute("aria-label","login setup");
        const next = document.createElement("button");
        next.textContent = "continue";
        const close = document.createElement("button");
        close.textContent = "close";
        function finish(value) {panel.close(); panel.remove(); resolve(value);}
        next.onclick = () => finish(field.value);
        close.onclick = () => finish(null);
        panel.addEventListener("cancel",event => {event.preventDefault(); finish(null);});
        for (const name of ["keydown","keypress","keyup"]) panel.addEventListener(name,event => {
            event.stopPropagation();
            if (name === "keydown" && event.key === "Enter") {event.preventDefault(); finish(field.value);}
        });
        panel.append(title,message,field,next,close);
        document.body.append(panel);
        skin(panel);
        panel.showModal();
    });
}

/*//////////////////////////////////////////////////////////////////////*/

export function notice(skin, message) {
    const panel = document.createElement("dialog");
    const title = document.createElement("h2");
    title.className = "stickertitle";
    title.textContent = "tiktok login";
    const text = document.createElement("p");
    text.textContent = message;
    const close = document.createElement("button");
    close.textContent = "close";
    close.onclick = () => {panel.close(); panel.remove();};
    panel.append(title,text,close);
    document.body.append(panel);
    skin(panel);
    panel.showModal();
    panel.addEventListener("cancel",event => {event.preventDefault(); close.click();});
}
