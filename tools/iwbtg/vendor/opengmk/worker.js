const early = [];
self.onmessage = event => early.push(event.data);
const original = self.fetch.bind(self);
self.fetch = async (request, options) => {
    const url = String(request instanceof Request ? request.url : request);
    if (!url.endsWith("/GeneralUser-GS.sf2")) {return original(request, options);}
    const response = await original(new URL("soundfont.gz", import.meta.url), options);
    if (!response.ok) {return response;}
    return new Response(response.body.pipeThrough(new DecompressionStream("gzip")), {headers: {"Content-Type": "application/octet-stream"}});
};

/*//////////////////////////////////////////////////////////////////////*/

function fail(data, code, error) {
    if (data?.w !== "req") {return;}
    const detail = String(error?.message ?? error);
    self.postMessage({w: "err", id: data.id, error: {engineError: true, code, detail}});
}
let handle;
try {
    const engine = await import("./gm8emulator.js");
    await engine.default();
    handle = data => {
        try {engine.onMessage(data);}
        catch (error) {fail(data, data?.body?.kind === "start" ? "corrupt-game" : "internal", error);}
    };
} catch (error) {handle = data => fail(data, "asset-unavailable", error);}
self.onmessage = event => handle(event.data);
early.splice(0).forEach(handle);
