let module;
let loading;

export class verification extends Error {
    constructor(decision) {
        super("complete tiktok's login verification");
        this.decision = decision;
    }
}

export function readrequest(value) {
    if (value.trim().startsWith("sticker banner setup")) throw Error("run the tiktok helper on tiktok with this setup, then copy its login request");
    const encoded = value.trim().replace(/^\/\/ this is your account data, do NOT share it outside coolsite\.cv\/tools\/stickerbanner!\s*/, "").trim();
    if (!encoded || encoded.length > 40000) throw Error("paste a fresh login request from tiktok");
    let job;
    try {job = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), item => item.charCodeAt(0))));}
    catch {throw Error("the login request is incomplete");}
    let url;
    let index;
    let callback;
    try {url = new URL(job.url); index = new URL(job.index); callback = new URL(index.searchParams.get("next_url"));}
    catch {throw Error("invalid tiktok login request");}
    const signed = url.origin === "https://www.tiktok.com" && url.pathname === "/passport/web/check_qrconnect/" && url.searchParams.get("token") && url.searchParams.has("X-Gnarly");
    const matching = index.origin === url.origin && index.pathname === "/passport/web/scan_index/" && index.searchParams.get("token") === url.searchParams.get("token");
    const destination = callback.origin === url.origin && callback.pathname === "/passport/web/scan_qrcode/" && /^[A-Z0-9]{8}$/.test(callback.searchParams.get("client_secret") || "");
    const identity = typeof job.device === "string" && /^[0-9]+$/.test(job.device) && typeof job.account === "string" && /^(?:[\w.]{1,32})?$/.test(job.account);
    const agent = typeof job.agent === "string" && !/[\r\n]/.test(job.agent) && job.agent.length > 0 && job.agent.length <= 512;
    if (job.version !== 1 || !signed || !matching || !destination || !identity || !agent || !Number.isFinite(job.expires)) throw Error("invalid tiktok login request");
    if (!(job.ticket && job.qr === "") && (typeof job.qr !== "string" || !/^[a-z0-9+/=]+$/i.test(job.qr) || job.qr.length > 20000)) throw Error("invalid tiktok login image");
    if (job.ticket !== undefined && (typeof job.ticket !== "string" || !job.ticket || job.ticket.length > 20000 || /[\r\n]/.test(job.ticket) || url.searchParams.has("passport_ticket") && url.searchParams.get("passport_ticket") !== job.ticket)) throw Error("invalid tiktok verification result");
    return job;
}

/*//////////////////////////////////////////////////////////////////////*/

export async function createtransport(relay) {
    const address = new URL(relay);
    const hosts = {
        // hey, don't look!
        "stickerrelay.cvowot.workers.dev":"stickers.coolsite.cv",
        "stickerrelay-dev.cvowot.workers.dev":"stickers-preview.coolsite.cv"
    };
    address.hostname = hosts[address.hostname] || address.hostname;
    if (address.protocol !== "wss:" && !(address.protocol === "ws:" && ["127.0.0.1","localhost"].includes(address.hostname))) throw Error("the relay must use a secure websocket");
    await checkrelay(address.href);
    if (!loading) loading = import("/assets/static/js/epoxy/index.js").then(async library => {
        await library.default({module_or_path:new URL("/assets/static/js/epoxy/index.wasm",import.meta.url)});
        module = library;
    }).catch(error => {loading = null; throw error;});
    await loading;
    return new transport(() => {
        const options = new module.EpoxyClientOptions();
        options.wisp_v2 = false;
        options.disable_certificate_validation = false;
        options.user_agent = navigator.userAgent;
        options.redirect_limit = 0;
        return new module.EpoxyClient(address.href,options);
    },address.href);
}

/*//////////////////////////////////////////////////////////////////////*/

function checkrelay(address) {
    return new Promise((resolve,reject) => {
        const socket = new WebSocket(address);
        const timer = setTimeout(() => finish(false),10000);
        function finish(connected) {
            clearTimeout(timer);
            socket.onopen = null;socket.onerror = null;socket.onclose = null;
            socket.close();
            if (connected) resolve();
            else reject(Error("couldn't reach the login relay. check your connection and retry"));
        }
        socket.onopen = () => finish(true);
        socket.onerror = () => finish(false);
        socket.onclose = () => finish(false);
    });
}

/*//////////////////////////////////////////////////////////////////////*/

function waitvisible(signal) {
    signal.throwIfAborted();
    if (!document.hidden) return Promise.resolve(false);
    return new Promise((resolve,reject) => {
        function cleanup() {
            document.removeEventListener("visibilitychange",visible);
            signal.removeEventListener("abort",cancel);
        }
        function visible() {
            if (document.hidden) return;
            cleanup();
            resolve(true);
        }
        function cancel() {cleanup(); reject(signal.reason);}
        document.addEventListener("visibilitychange",visible);
        signal.addEventListener("abort",cancel,{once:true});
    });
}

/*//////////////////////////////////////////////////////////////////////*/

class transport {
    constructor(factory, relay = "") {
        this.factory = factory;
        this.relay = relay;
        this.client = factory();
        this.cookies = new Map();
        this.expires = new Map();
        this.changed = null;
        this.agent = navigator.userAgent;
        this.reconnect = false;
        this.used = Date.now();
        this.closed = false;
        this.pending = new Map();
        this.retired = new Set();
    }

    async request(url, options = {}) {
        const address = new URL(url);
        if (address.protocol !== "https:" || address.username || address.password || address.port || !trustedhost(address.hostname)) throw Error("unexpected tiktok request destination");
        const {session = false, signal, retry = true, timeout = 120000, ...settings} = options;
        if (this.closed) throw Error("the tiktok connection is closed");
        signal?.throwIfAborted();
        const headers = {"User-Agent":this.agent, ...settings.headers};
        if (session) this.prune();
        if (session) headers.Cookie = Array.from(this.cookies, ([name,value]) => name + "=" + value).join("; ");
        let response;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            let timer;
            let abort;
            try {
                if (this.reconnect || Date.now() - this.used > 20000) {
                    this.retire(this.client);
                    this.client = this.factory();
                    this.reconnect = false;
                }
                this.used = Date.now();
                const deadline = new Promise((resolve,reject) => {timer = setTimeout(() => reject(Error("connection timed out")),timeout);});
                const cancelled = new Promise((resolve,reject) => {
                    abort = () => reject(signal.reason);
                    signal?.addEventListener("abort",abort,{once:true});
                });
                response = await Promise.race([this.fetch(this.client,address.href,{...settings,headers,redirect:"manual"}),deadline,cancelled]);
                this.used = Date.now();
                break;
            } catch {
                this.reconnect = true;
                signal?.throwIfAborted();
                if (!retry || attempt || !["GET","HEAD"].includes(settings.method || "GET")) throw Error("the encrypted tiktok connection failed. check your connection and retry");
            } finally {clearTimeout(timer); signal?.removeEventListener("abort",abort);}
        }
        if (session) this.store(response);
        return response;
    }

    fetch(client,url,options) {
        const pending = this.pending.get(client) || new Set();
        this.pending.set(client,pending);
        const request = Promise.resolve().then(() => client.fetch(url,options));
        pending.add(request);
        const settled = () => {
            pending.delete(request);
            if (!pending.size) {
                this.pending.delete(client);
                if (this.retired.delete(client)) this.dispose(client);
            }
        };
        request.then(settled,settled);
        return request;
    }

    retire(client) {
        if (this.pending.has(client)) this.retired.add(client);
        else this.dispose(client);
    }

    dispose(client) {
        try {client.free();} catch {}
    }

    async authenticate(job, signal, update) {
        this.agent = job.agent;
        this.cookies.clear();
        this.expires.clear();
        const secret = new URL(new URL(job.index).searchParams.get("next_url")).searchParams.get("client_secret");
        const deadline = performance.now() + 180000;
        while (performance.now() < deadline) {
            signal.throwIfAborted();
            if (await waitvisible(signal)) this.reconnect = true;
            const address = new URL(job.url);
            address.hostname = "login-row.www.tiktok.com";
            const controller = new AbortController();
            let paused = false;
            let response;
            let data;
            const cancel = () => controller.abort(signal.reason);
            const pause = () => {
                if (!document.hidden) return;
                paused = true;
                this.reconnect = true;
                controller.abort();
            };
            signal.addEventListener("abort",cancel,{once:true});
            document.addEventListener("visibilitychange",pause);
            try {
                response = await this.request(address.href,{signal:controller.signal,timeout:10000,headers:{Origin:"https://www.tiktok.com",Referer:"https://www.tiktok.com/",...(job.ticket ? {"x-tt-passport-ticket":job.ticket} : {})}});
                data = await response.json();
                signal.throwIfAborted();
                if (paused) continue;
            } catch (error) {
                signal.throwIfAborted();
                if (paused || document.hidden) {this.reconnect = true; continue;}
                throw error;
            } finally {
                signal.removeEventListener("abort",cancel);
                document.removeEventListener("visibilitychange",pause);
            }
            const state = data.data || {};
            if (state.error_code === 2135) {
                const decision = response.headers.get("x-tt-verify-idv-decision-conf");
                if (!decision || decision.length > 40000) throw Error("tiktok requested login verification without instructions");
                throw new verification(decision);
            }
            if (state.status === "confirmed" && state.client_secret !== secret) throw Error("tiktok login verification failed");
            if (state.status === "confirmed") this.store(response);
            if (state.status === "confirmed" && this.cookies.has("sessionid")) return;
            if (state.status === "expired") throw Error("tiktok expired this qr login! create fresh login setup");
            if (!["new","scanned"].includes(state.status)) throw Error(state.description || `tiktok login ${state.error_code || state.status || "failed"}. create fresh login setup`);
            update(state.status === "scanned" ? "approve the login in tiktok, then return here" : "open tiktok and approve the login, then return here");
            await new Promise(resolve => setTimeout(resolve,1200));
        }
        throw Error("timed out waiting for tiktok login.. prepare a new login to try again.");
    }

    store(response) {
        let changed = false;
        for (const entry of response.rawHeaders?.["set-cookie"] || []) {
            const [pair,...attributes] = entry.split(";");
            const split = pair.indexOf("=");
            if (split <= 0) continue;
            const name = pair.slice(0,split).trim();
            const value = pair.slice(split + 1);
            let expires = 0;
            let age = null;
            for (const attribute of attributes) {
                const separator = attribute.indexOf("=");
                if (separator < 0) continue;
                const key = attribute.slice(0,separator).trim().toLowerCase();
                const content = attribute.slice(separator + 1).trim();
                if (key === "max-age" && /^-?[0-9]+$/.test(content)) age = Number(content);
                if (key === "expires") {
                    const parsed = Date.parse(content);
                    expires = Number.isFinite(parsed) ? parsed || -1 : 0;
                }
            }
            if (age !== null) expires = Date.now() + age * 1000;
            if (expires && expires <= Date.now()) {
                changed = this.cookies.delete(name) || changed;
                this.expires.delete(name);
            } else {
                changed = this.cookies.get(name) !== value || this.expires.get(name) !== expires || changed;
                this.cookies.set(name,value);
                this.expires.set(name,expires);
            }
        }
        if (changed) this.changed?.();
    }

    prune() {
        let changed = false;
        for (const [name,expires] of this.expires) {
            if (expires && expires <= Date.now()) {
                changed = this.cookies.delete(name) || changed;
                this.expires.delete(name);
            }
        }
        if (changed) this.changed?.();
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        this.cookies.clear();
        this.expires.clear();
        this.changed = null;
        this.retire(this.client);
    }
}

/*//////////////////////////////////////////////////////////////////////*/

export function trustedhost(host) {
    return ["tiktok.com","tiktokv.com","tiktokcdn.com","byteoversea.com","ibytedtos.com"].some(suffix => host === suffix || host.endsWith("." + suffix));
}
