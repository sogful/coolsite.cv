/*//////////////////////////////////////////////////////////////////////*/

function request(operation) {
    return new Promise((resolve, reject) => {
        operation.onsuccess = () => resolve(operation.result);
        operation.onerror = () => reject(operation.error);
    });
}

async function database() {
    const operation = indexedDB.open("fangameplayer", 2);
    operation.onupgradeneeded = () => {
        const connection = operation.result;
        if (!connection.objectStoreNames.contains("games")) {connection.createObjectStore("games", {keyPath: "id"});}
        if (!connection.objectStoreNames.contains("entries")) {
            const entries = connection.createObjectStore("entries", {keyPath: "id"});
            const cursor = operation.transaction.objectStore("games").openCursor();
            cursor.onsuccess = () => {
                const current = cursor.result;
                if (!current) {return;}
                entries.put({id: current.value.id, name: current.value.name});
                current.continue();
            };
        }
    };
    return request(operation);
}

export async function library() {
    const connection = await database();
    try {return await request(connection.transaction("entries").objectStore("entries").getAll());}
    finally {connection.close();}
}

export async function getgame(id) {
    const connection = await database();
    try {return await request(connection.transaction("games").objectStore("games").get(id));}
    finally {connection.close();}
}

export async function remember(game) {
    const connection = await database();
    try {
        await new Promise((resolve, reject) => {
            const transaction = connection.transaction(["games", "entries"], "readwrite");
            transaction.objectStore("games").put(game);
            transaction.objectStore("entries").put({id: game.id, name: game.name});
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error("Game storage was interrupted."));
        });
    } finally {connection.close();}
}

/*//////////////////////////////////////////////////////////////////////*/

function encode(bytes) {
    let text = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) {
        text += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    return btoa(text);
}

function decode(value) {
    return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

function pathkey(path) {
    const normalized = path.replaceAll("\\", "/").toLowerCase().replace(/^\/+/, "");
    if (normalized.includes(":") || normalized.split("/").includes("..") || normalized.includes("\0")) {
        throw new Error("Invalid save path.");
    }
    return normalized;
}

export function savehost(id, files, changed) {
    const key = "fangame:saves:" + id;
    const initial = new Map(files.map(([path, bytes]) => [pathkey(path), bytes]));
    let state = {version: 1, id, files: {}, deleted: []};
    const existing = localStorage.getItem(key);
    if (existing) {state = validate(JSON.parse(existing));}

    function validate(data) {
        if (data?.version !== 1 || data.id !== id || !data.files || typeof data.files !== "object" || Array.isArray(data.files) || !Array.isArray(data.deleted)) {
            throw new Error("These saves belong to another game or have an invalid format.");
        }
        if (JSON.stringify(data).length > 4 * 1024 * 1024) {throw new Error("The save backup is too large.");}
        const normalized = {version: 1, id, files: {}, deleted: data.deleted.map(pathkey)};
        for (const [path, value] of Object.entries(data.files)) {
            if (typeof value !== "string") {throw new Error("Invalid save data.");}
            decode(value);
            Object.defineProperty(normalized.files, pathkey(path), {value, enumerable: true, writable: true, configurable: true});
        }
        return normalized;
    }

    function persist(next) {
        localStorage.setItem(key, JSON.stringify(next));
        state = next;
        changed("saves stored in this browser");
    }

    return {
        readFile(path) {
            const name = pathkey(path);
            if (state.deleted.includes(name)) {return null;}
            return Object.hasOwn(state.files, name) ? decode(state.files[name]) : initial.get(name) ?? null;
        },
        writeFile(path, bytes) {
            const name = pathkey(path);
            if (name === "temp" || name === "temp.dat") {initial.set(name, bytes.slice()); return;}
            persist({...state, files: {...state.files, [name]: encode(bytes)}, deleted: state.deleted.filter(item => item !== name)});
        },
        removeFile(path) {
            const name = pathkey(path);
            const next = {...state.files};
            const exists = Object.hasOwn(next, name) || initial.has(name);
            delete next[name];
            initial.delete(name);
            persist({...state, files: next, deleted: [...new Set([...state.deleted, name])]});
            return exists;
        },
        backup() {return JSON.stringify(state, null, 2);},
        restore(data) {persist(validate(data));}
    };
}

export function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}
