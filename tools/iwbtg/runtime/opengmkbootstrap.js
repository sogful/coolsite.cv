const response = await fetch(new URL("bootstrap.gz", import.meta.url));
if (!response.ok) {throw new Error("Could not load the GameMaker runtime.");}
let source = await new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).text();
source = source.replaceAll("import.meta.url", JSON.stringify(import.meta.url));
source = source.replace(/from ["'](\.\/[^"']+)["']/g, (match, path) => "from " + JSON.stringify(new URL(path, import.meta.url).href));
const url = URL.createObjectURL(new Blob([source], {type: "text/javascript"}));
let runtime;
try {runtime = await import(url);}
finally {URL.revokeObjectURL(url);}
const message = runtime.onMessage;
const cheating = runtime.cheating;
const cheatstate = runtime.cheatstate;
export {message as onMessage, cheating, cheatstate};
export default runtime.default;
