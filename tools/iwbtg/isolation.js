self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
    if (new URL(event.request.url).origin !== self.location.origin || event.request.method !== "GET") {return;}
    event.respondWith((async () => {
        const response = await fetch(event.request);
        if (response.status === 0) {return response;}
        const headers = new Headers(response.headers);
        headers.set("Cross-Origin-Opener-Policy", "same-origin");
        headers.set("Cross-Origin-Embedder-Policy", "require-corp");
        return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
    })());
});
