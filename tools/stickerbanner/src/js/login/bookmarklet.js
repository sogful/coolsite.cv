export async function loginrequest(seed, skin) {
    const previous = document.querySelector(".stickerloginpanel");
    if (previous) previous.remove();
    const panel = document.createElement("dialog");
    panel.className = "stickerloginpanel";
    Object.assign(panel.style, {position:"fixed",bottom:"16px",left:"16px",right:"16px",zIndex:"2147483647",background:"#ffffff",color:"#111111",padding:"16px",border:"2px solid #111111",font:"16px sans-serif"});
    const message = document.createElement("p");
    message.textContent = "preparing tiktok login request";
    const button = document.createElement("button");
    button.textContent = "copy login info";
    button.disabled = true;
    const close = document.createElement("button");
    close.textContent = "close";
    close.onclick = () => {panel.close(); panel.remove();};
    panel.append(message,button,close);
    document.body.append(panel);
    skin?.(panel);
    panel.showModal();
    panel.addEventListener("cancel",event => {event.preventDefault(); close.click();});
    let observer;
    try {
        if (location.origin !== "https://www.tiktok.com") throw Error("open www.tiktok.com first");
        const scope = window.__$UNIVERSAL_DATA$__?.__DEFAULT_SCOPE__?.["webapp.app-context"];
        for (let attempt = 0; attempt < 100 && typeof window.byted_acrawler?.frontierSign !== "function"; attempt += 1) await new Promise(resolve => setTimeout(resolve,100));
        const entries = [];
        observer = new PerformanceObserver(list => entries.push(...list.getEntries().map(item => item.name)));
        observer.observe({type:"resource"});
        if (!seed?.token || !Number.isFinite(seed.expires)) throw Error("create fresh login setup on the sticker banner page");
        const query = {aid:"1459",account_sdk_source:"web",app_name:"tiktok_web",device_platform:"web_pc",did:seed.device,next:"https://www.tiktok.com"};
        const data = seed;
        const response = await fetch("/passport/web/check_qrconnect/?" + new URLSearchParams({...query,token:data.token}), {credentials:"omit"});
        const check = await response.json();
        if (check.message !== "success" || !["new","scanned"].includes(check.data?.status)) throw Error(check.data?.description || "tiktok rejected the login request");
        let url;
        for (let attempt = 0; attempt < 30; attempt += 1) {
            url = entries.find(entry => {
                const address = new URL(entry);
                return address.origin === location.origin && address.pathname === "/passport/web/check_qrconnect/" && address.searchParams.get("token") === data.token && address.searchParams.has("X-Gnarly");
            });
            if (url) break;
            await new Promise(resolve => setTimeout(resolve,100));
        }
        if (!url) throw Error("tiktok's login signer is not ready! reload tiktok and try again");
        const job = {version:1,url,index:data.index,qr:data.qr,agent:navigator.userAgent,device:seed.device,account:scope?.user?.uniqueId || "",expires:data.expires};
        const bytes = new TextEncoder().encode(JSON.stringify(job));
        const text = "// this is your actual account data, do NOT share it outside coolsite.cv!\n" + btoa(Array.from(bytes, value => String.fromCharCode(value)).join(""));
        message.textContent = "copy this request into the sticker banner page, then approve the login in tiktok.";
        button.disabled = false;
        button.onclick = async () => {
            try {await navigator.clipboard.writeText(text); message.textContent = "copied! return to the sticker banner page.";}
            catch {
                const field = document.createElement("textarea");
                field.value = text;
                field.readOnly = true;
                panel.append(field);
                field.select();
                message.textContent = "copy the selected request and return to the sticker banner page.";
            }
        };
    } catch (error) {message.textContent = error.message.toLowerCase();}
    finally {observer?.disconnect();}
}
