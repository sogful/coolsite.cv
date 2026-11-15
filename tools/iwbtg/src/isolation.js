export async function isolate() {
    if (crossOriginIsolated || !navigator.serviceWorker || !isSecureContext) {return;}
    const marker = "fangame:isolation:" + location.pathname;
    if (sessionStorage.getItem(marker)) {return;}
    try {
        await navigator.serviceWorker.register(new URL("../isolation.js", import.meta.url), {scope: new URL("../", import.meta.url).href, updateViaCache: "none"});
        await Promise.race([
            new Promise(resolve => {
                if (navigator.serviceWorker.controller) {resolve();}
                else {navigator.serviceWorker.addEventListener("controllerchange", resolve, {once: true});}
            }),
            new Promise((resolve, reject) => setTimeout(() => reject(new Error("Player setup timed out.")), 15000))
        ]);
        sessionStorage.setItem(marker, "1");
        location.reload();
        await new Promise(() => {});
    } catch (error) {console.warn(error);}
}
