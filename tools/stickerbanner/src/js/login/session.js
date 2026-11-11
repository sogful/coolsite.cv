const name = "stickerbannersession";
const context = new TextEncoder().encode("sticker banner session 1");

function database() {
    return new Promise((resolve,reject) => {
        const request = indexedDB.open(name,1);
        let expired = false;
        const timer = setTimeout(() => {expired = true; reject(Error("browser storage is unavailable."));},8000);
        request.onupgradeneeded = () => request.result.createObjectStore("session");
        request.onsuccess = () => {
            clearTimeout(timer);
            if (expired) request.result.close();
            else resolve(request.result);
        };
        request.onerror = () => {clearTimeout(timer); reject(Error("browser storage is unavailable."));};
    });
}

async function transaction(mode, action) {
    const connection = await database();
    try {
        return await new Promise((resolve,reject) => {
            const operation = connection.transaction("session",mode);
            const result = {};
            operation.oncomplete = () => resolve(result);
            operation.onabort = () => reject(Error("the saved login could not be updated."));
            operation.onerror = () => {};
            try {action(operation.objectStore("session"),result);}
            catch (error) {operation.abort(); reject(error);}
        });
    } finally {connection.close();}
}

/*//////////////////////////////////////////////////////////////////////*/

export async function savesession(value) {
    validate(value);
    const key = await crypto.subtle.generateKey({name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = await crypto.subtle.encrypt({name:"AES-GCM",iv:nonce,additionalData:context},key,plaintext);
    await transaction("readwrite",store => {
        store.put(key,"key");
        store.put({version:1,nonce,ciphertext},"login");
    });
}

export async function loadsession() {
    const stored = await transaction("readonly",(store,result) => {
        store.get("key").onsuccess = event => {result.key = event.target.result;};
        store.get("login").onsuccess = event => {result.login = event.target.result;};
    });
    if (!stored.login) return null;
    try {
        const {nonce,ciphertext,version} = stored.login;
        if (version !== 1 || !stored.key || stored.key.extractable || !(nonce instanceof Uint8Array) || nonce.length !== 12 || !(ciphertext instanceof ArrayBuffer) || ciphertext.byteLength > 1500000) throw Error();
        const plaintext = await crypto.subtle.decrypt({name:"AES-GCM",iv:nonce,additionalData:context},stored.key,ciphertext);
        const value = JSON.parse(new TextDecoder().decode(plaintext));
        validate(value);
        return value;
    } catch {throw Error("the saved login could not be opened. sign in again.");}
}

export async function forgetsession() {
    await transaction("readwrite",store => {
        store.delete("login");
        store.delete("key");
    });
}

/*//////////////////////////////////////////////////////////////////////*/

function validate(value) {
    if (value?.version !== 1 || typeof value.relay !== "string" || value.relay.length > 2048 || !/^[0-9]{1,30}$/.test(value.device) || !/^[\w.]{1,32}$/.test(value.account) || typeof value.agent !== "string" || !value.agent || value.agent.length > 512 || /[\r\n]/.test(value.agent)) throw Error("invalid saved login.");
    const relay = new URL(value.relay);
    if (relay.protocol !== "wss:" && !(relay.protocol === "ws:" && ["127.0.0.1","localhost"].includes(relay.hostname))) throw Error("invalid saved relay.");
    if (!Array.isArray(value.cookies) || !value.cookies.length || value.cookies.length > 128) throw Error("invalid saved login.");
    for (const item of value.cookies) {
        if (!Array.isArray(item) || item.length !== 2 || typeof item[0] !== "string" || !/^[!#$%&'*+.^_`|~0-9a-z-]{1,256}$/i.test(item[0]) || typeof item[1] !== "string" || item[1].length > 8192 || /[\r\n]/.test(item[1])) throw Error("invalid saved login.");
    }
    if (value.expires !== undefined && (!Array.isArray(value.expires) || value.expires.length > 128 || value.expires.some(item => !Array.isArray(item) || item.length !== 2 || typeof item[0] !== "string" || !Number.isFinite(item[1])))) throw Error("invalid saved login.");
}
