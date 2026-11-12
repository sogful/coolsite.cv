const cdxroutes = [
    {name:"proxy",url:value => "https://cors.coolsite.cv/?url=" + encodeURIComponent(value)},
    {name:"direct",url:value => value},
    {name:"codetabs",url:value => "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(value)}
];

/*//////////////////////////////////////////////////////////////////////*/

async function fetchcdxrowsstream(address,progress,control = {}) {
    const dedupe = document.querySelector(".dedupechk").checked;
    const skip = document.querySelector(".skip404chk").checked;
    const maximum = document.querySelector(".limitenabled").checked
        ? Math.max(1,Math.floor(Number(document.querySelector(".limitval").value) || 5000)) : Infinity;
    const cooldown = new Map();
    let failure = Error("the archive could not be reached");
    for (let pass = 0; pass < 2; pass++) {
        for (const route of cdxroutes) {
            if ((cooldown.get(route.name) || 0) > Date.now()) continue;
            const controller = new AbortController();
            const decoder = new TextDecoder();
            const rows = [];
            const unique = new Map();
            let reader;
            let timer;
            let carry = "";
            let received = 0;
            let valid = 0;
            let limited = false;
            let updated = 0;
            function collected() {return dedupe ? Array.from(unique.values()).slice(0,maximum) : rows;}
            function abort() {
                controller.abort();
                reader?.cancel().catch(() => {});
            }
            function watchdog(milliseconds) {
                clearTimeout(timer);
                timer = setTimeout(abort,milliseconds);
            }
            function line(value) {
                const text = value.trim();
                if (!text) return;
                const match = text.match(/^(\d{14})\s+((?:https?|ftp):\/\/\S+)\s+(\S+)\s+(\d{3}|-)\s+(\d+|-)$/);
                if (!match) throw Error("the archive returned an unreadable response");
                valid++;
                const parts = match.slice(1);
                if (skip && ["404","410"].includes(parts[3])) return;
                if (dedupe) {
                    const key = normalizededupe(parts[1]);
                    const previous = unique.get(key);
                    if (!previous || previous[0] < parts[0]) unique.set(key,parts);
                } else {
                    rows.push(parts);
                    limited = rows.length >= maximum;
                }
            }
            control.abort = abort;
            try {
                if (control.stopped) throw Error("stopped");
                setprogress(progress,"connecting via " + route.name + (pass ? " (retry)" : ""));
                watchdog(20000);
                const response = await fetch(route.url(address),{signal:controller.signal,cache:"no-store"});
                if (!response.ok) {
                    const retry = response.headers.get("retry-after");
                    const delay = /^\d+$/.test(retry || "") ? Number(retry) * 1000 : Date.parse(retry) - Date.now();
                    if (delay > 0) cooldown.set(route.name,Date.now() + delay);
                    throw Error(route.name + " returned HTTP " + response.status);
                }
                if (!response.body) {
                    watchdog(30000);
                    for (const value of (await response.text()).split("\n")) {
                        line(value);
                        if (limited) break;
                    }
                    if (control.stopped) throw Error("stopped");
                    return collected();
                }
                reader = response.body.getReader();
                const total = response.headers.get("content-encoding") ? 0 : Number(response.headers.get("content-length"));
                while (!limited) {
                    if (control.stopped) throw Error("stopped");
                    watchdog(30000);
                    const {done,value} = await reader.read();
                    if (controller.signal.aborted) throw Error("the archive connection stalled");
                    if (done) break;
                    received += value.byteLength;
                    carry += decoder.decode(value,{stream:true});
                    let start = 0;
                    let end;
                    while ((end = carry.indexOf("\n",start)) !== -1) {
                        line(carry.slice(start,end));
                        start = end + 1;
                        if (limited) break;
                    }
                    carry = carry.slice(start);
                    if (carry.length > 1048576) throw Error("the archive returned an oversized row");
                    if (performance.now() - updated > 100) {
                        const amount = (received / 1048576).toFixed(1);
                        setprogress(progress,"receiving " + amount + (total > 0 ? "/" + (total / 1048576).toFixed(1) : "") + " MB (" + (dedupe ? unique.size : rows.length) + " rows)");
                        updated = performance.now();
                    }
                }
                if (control.stopped) throw Error("stopped");
                if (!limited) line(carry + decoder.decode());
                if (received && !valid && carry.trim()) throw Error("the archive returned no valid rows");
                return collected();
            } catch (error) {
                failure = error;
                if (control.stopped || rows.length || unique.size) {
                    error.stopped = Boolean(control.stopped);
                    error.partial = collected();
                    throw error;
                }
            } finally {
                clearTimeout(timer);
                abort();
                if (control.abort === abort) delete control.abort;
            }
        }
    }
    throw failure;
}
