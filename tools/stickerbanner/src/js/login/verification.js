export async function verifyrequest(seed, skin) {
    if (location.origin !== "https://www.tiktok.com") throw Error("open www.tiktok.com first");
    document.querySelector(".stickerverificationclose")?.click();
    document.querySelector(".stickerverificationpanel")?.remove();
    const panel = document.createElement("dialog");
    panel.className = "stickerverificationpanel";
    panel.setAttribute("aria-label","tiktok login verification");
    Object.assign(panel.style,{position:"fixed",inset:"16px",margin:"0",width:"auto",height:"auto",maxWidth:"none",maxHeight:"none",boxSizing:"border-box",border:"0",background:"#ffffff",color:"#111111",padding:"16px",overflow:"auto",font:"16px sans-serif"});
    for (const name of ["keydown","keypress","keyup"]) panel.addEventListener(name,event => event.stopPropagation());
    const message = document.createElement("p");
    message.textContent = "loading tiktok verification";
    const button = document.createElement("button");
    button.textContent = "copy verification info";
    button.disabled = true;
    const close = document.createElement("button");
    close.className = "stickerverificationclose";
    close.textContent = "close";
    const container = document.createElement("div");
    container.className = "stickerverification";
    panel.append(message,button,close,container);
    document.body.append(panel);
    skin?.(panel);
    panel.showModal();
    panel.addEventListener("cancel",event => {event.preventDefault(); close.click();});
    const chunks = window.__LOADABLE_LOADED_CHUNKS__ ||= [];
    const previous = chunks.push;
    const modules = {};
    const cached = {};
    const loadings = {};
    const root = "https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/tiktok/webapp/login/experimental/webapp-login-page/";
    const files = {
        "474":"static/js/vendor.d8a59cdb.js",
        "985":"static/js/async/985.18347fb6.js",
        "949":"static/js/async/949.48eb1c26.js",
        "847":"static/js/async/account.sdk.4024aee0.js"
    };
    let sdk;
    let closed = false;
    function destroysdk() {
        const current = sdk;
        sdk = null;
        current?.destroy?.();
    }
    function receive(data) {
        if (data[0].some(key => Object.hasOwn(files,String(key)))) {
            Object.assign(modules,data[1]);
            return chunks.length;
        }
        return previous.call(this,data);
    }
    chunks.push = receive;
    close.onclick = () => {
        closed = true;
        destroysdk();
        if (chunks.push === receive) chunks.push = previous;
        panel.close();
        panel.remove();
    };
    function require(id) {
        if (cached[id]) return cached[id].exports;
        if (!modules[id]) throw Error("tiktok verification dependency unavailable");
        const item = {exports:{}};
        cached[id] = item;
        modules[id](item,item.exports,require);
        return item.exports;
    }
    require.r = target => Object.defineProperty(target,"__esModule",{value:true});
    require.d = (target,values) => {
        for (const [key,get] of Object.entries(values)) {
            if (!Object.hasOwn(target,key)) Object.defineProperty(target,key,{enumerable:true,get});
        }
    };
    require.n = value => {
        const getter = value?.__esModule ? () => value.default : () => value;
        require.d(getter,{a:getter});
        return getter;
    };
    require.o = (target,key) => Object.hasOwn(target,key);
    require.nmd = item => {item.paths = []; item.children ||= []; return item;};
    require.hmd = item => item;
    require.g = globalThis;
    require.p = root;
    require.b = document.baseURI;
    require.m = modules;
    require.c = cached;
    require.t = (id,mode) => mode & 1 ? require(id) : id;
    require.e = id => loadings[id] ||= new Promise((resolve,reject) => {
        if (!files[id]) {reject(Error("tiktok verification dependency unavailable")); return;}
        const script = document.createElement("script");
        script.src = root + files[id];
        script.onload = resolve;
        script.onerror = () => reject(Error("tiktok verification could not load"));
        document.head.append(script);
    });
    try {
        const decision = typeof seed.decision === "string" ? JSON.parse(seed.decision) : seed.decision;
        const ticket = decision.passport_ticket;
        if (typeof ticket !== "string" || !ticket || ticket.length > 20000 || /[\r\n]/.test(ticket)) throw Error("tiktok verification request is incomplete");
        await require.e("474");
        await require.e("985");
        await require.e("847");
        if (closed) return;
        const library = require(82712);
        sdk = new library.TTAccountSDK({aid:1459,host:"https://www.tiktok.com",region:"sg",lang:"en",idv:{rootElement:".stickerverification",appId:1459,language:"en",region:"sg",requiredIDVVersion:"1.0.1"}});
        message.textContent = "complete tiktok's verification below";
        await sdk.handleIDVRequired(decision);
        if (closed) return;
        const job = {...seed.job,ticket};
        const bytes = new TextEncoder().encode(JSON.stringify(job));
        const text = "// this is your account data, do NOT share it outside coolsite.cv!\n" + btoa(Array.from(bytes,value => String.fromCharCode(value)).join(""));
        button.disabled = false;
        message.textContent = "verified! copy this request into the sticker banner page and connect again.";
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
    } catch (error) {if (!closed) message.textContent = error.message.toLowerCase();}
    finally {if (chunks.push === receive) chunks.push = previous;}
}
