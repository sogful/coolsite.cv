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
    const scale = Math.max(1,1 / (visualViewport?.scale || 1));
    Object.assign(panel.style,{
        position:"fixed",inset:"0",margin:"auto",
        width:Math.min(panel.classList.contains("stickerverificationpanel") ? 720 : 480,(visualViewport?.width || innerWidth) / scale - 32) + "px",
        height:"auto",maxWidth:"none",maxHeight:((visualViewport?.height || innerHeight) / scale - 32) + "px",zoom:scale,
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
