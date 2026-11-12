let opened = null;

function database() {
    if (opened) return opened;
    opened = new Promise((resolve,reject) => {
        const request = indexedDB.open("scribbleidx",1);
        request.onupgradeneeded = () => request.result.createObjectStore("idx");
        request.onerror = () => {opened = null; reject(request.error);};
        request.onblocked = () => {opened = null; reject(Error("browser storage is busy"));};
        request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => {db.close(); opened = null;};
            resolve(db);
        };
    });
    return opened;
}

/*//////////////////////////////////////////////////////////////////////*/

async function transaction(mode,action) {
    const db = await database();
    return new Promise((resolve,reject) => {
        const current = db.transaction("idx",mode);
        const request = action(current.objectStore("idx"));
        current.oncomplete = () => resolve(request?.result);
        current.onerror = () => reject(current.error || Error("browser storage failed"));
        current.onabort = () => reject(current.error || Error("browser storage failed"));
    });
}

export async function read(key) {
    try {return await transaction("readonly",store => store.get(key));}
    catch {return null;}
}

export function write(key,value) {
    return writeall([[key,value]]);
}

export function writeall(items) {
    return transaction("readwrite",store => {for (const [key,value] of items) store.put(value,key);});
}

export function remove(key) {
    return transaction("readwrite",store => store.delete(key));
}

export async function clearparts(signature = "") {
    const keys = await transaction("readonly",store => store.getAllKeys());
    await transaction("readwrite",store => {
        for (const key of keys) {
            if (typeof key === "string" && (key.startsWith("part-" + signature) || key.startsWith("scribble-v") && key !== "scribble-v8" || key === "gonoto-v1")) store.delete(key);
        }
    });
}

export async function persistent(force = false) {
    try {
        if (await navigator.storage?.persisted?.()) return true;
        if (!force && (await read("persistence"))?.asked) return false;
        const granted = Boolean(await navigator.storage?.persist?.());
        await write("persistence",{asked:true,granted});
        return granted;
    } catch {return false;}
}
