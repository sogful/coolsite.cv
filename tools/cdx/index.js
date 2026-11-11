const persistkeys = ['format', 'limittype', 'limitval', 'limitenabled', 'matchtype', 'dedupechk', 'skip404chk',
    'datefrom', 'dateto', 'mimefilter', 'statusfilter'];

function element(cls) {return document.querySelector('.' + cls)}
function allelements(cls) {return Array.from(document.getElementsByClassName(cls))}

function savesettings() {
    let o = {};
    persistkeys.forEach(k => {
        let val;
        if (k === "limitenabled" || k === "dedupechk" || k === "skip404chk") val = element(k).checked;
        else val = element(k).value;
        o[k] = val;
    });
    localStorage.setItem("iadl_settings", JSON.stringify(o));
}

function loadsettings() {
    let o = {};
    try { o = JSON.parse(localStorage.getItem("iadl_settings") || '{}'); } catch { }
    persistkeys.forEach(k => {
        let val = o[k];
        if (val != null) {
            if (k === "limitenabled" || k === "dedupechk" || k === "skip404chk")
                element(k).checked = !!val;
            else element(k).value = val;
        }
    });
}

const lastresultscap = 20000;

function savelastrun(entries) {
    try {
        let total = 0;
        for (const e of entries) total += (e.data ? e.data.length : 0);
        if (total > lastresultscap) {
            localStorage.removeItem("iadl_lastrun");
            return;
        }
        localStorage.setItem("iadl_domaintext", element('domainfield').value);
        localStorage.setItem("iadl_lastrun", JSON.stringify(entries));
    } catch { }
}

function loadlastrun() {
    let text = "";
    try { text = localStorage.getItem("iadl_domaintext") || ""; } catch { }
    if (text) element('domainfield').value = text;

    let entries = null;
    try { entries = JSON.parse(localStorage.getItem("iadl_lastrun") || "null"); } catch { }
    if (!entries || !entries.length) return;

    const progressRoot = element('progress');
    const output = element('outputrow');
    progressRoot.replaceChildren();
    if (entries.length === 1) {
        const row = document.createElement('div');
        row.className = 'progressline';
        filldonerow(row, entries[0].domain, entries[0].data, false);
        progressRoot.appendChild(row);
        showpreviewtable(entries[0].data, output);
    } else {
        entries.forEach(e => {
            const line = document.createElement('div');
            line.className = 'progressline';
            filldonerow(line, e.domain, e.data, true);
            progressRoot.appendChild(line);
        });
    }
}

function downloadBlob(content, filename, mimetype) {
    const type = mimetype || "text/plain";
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {type}));
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function setprogress(progress, msg) {
    if (typeof progress === "function") progress(msg);
    else progress.textContent = msg;
}

function gottaskipbadpages(code) {
    if (!element('skip404chk').checked) return false;
    const n = parseInt(String(code), 10);
    if (!Number.isFinite(n)) return false;
    return n === 404 || n === 410;
}

const defaulttitle = document.title;
function alldone() {
    new Audio("/assets/audio/nekoarc.mp3").play().catch(() => {});
    const prev = document.title;
    document.title = "finished!!";
    setTimeout(() => {document.title = prev || defaulttitle}, 2000);
}

/*//////////////////////////////////////////////////////////////////////*/

function normalizeurlline(raw) {
    let v = String(raw || "").trim();
    if (!v) return "";
    v = v.replace(/^\s*([a-z]+:)?\/\/+/i, "");
    v = v.replace(/^([^\/]*)/, (m) => m.toLowerCase());
    return v;
}
function parseurllist(text) {
    const lines = String(text || "").split(/\r?\n/);
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        const n = normalizeurlline(lines[i]);
        if (n) out.push(n);
    }
    return out;
}

function updatelimitcontrols() {
    const enabled = element('limitenabled').checked;
    element('limittype').disabled = !enabled;
    element('limitval').disabled = !enabled;
}

/*//////////////////////////////////////////////////////////////////////*/

// NO FUN, I SAID!
function escapetext(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;",
        ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[c]);
}

function encodedurl(input) {
    try {return encodeURIComponent(input)}
    catch {return input}
}

function normalizededupe(url) {
    try {
        if (!/^[a-z]+:\/\//i.test(url)) url = "http://" + url;
        let u = new URL(url);
        let hostname = u.hostname.replace(/^(www\d*\.)/i, "");
        let pathname = u.pathname.replace(/\/+$/, "");
        return hostname.toLowerCase() + pathname;
    } catch {
        return url.replace(/^https?:\/\//i,"").replace(/^www\d*\./i,"").replace(/\/+$/,"").toLowerCase();
    }
}
function builddaterange(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits;
}

function buildcdxurl(domain) {
    let url = "https://web.archive.org/cdx/search/cdx?url="
        + encodedurl(domain)
        + "&output=txt"
        + "&matchType=" + encodedurl(element('matchtype').value)
        + "&fl=timestamp,original,mimetype,statuscode,length";

    const from = builddaterange(element('datefrom').value);
    const to = builddaterange(element('dateto').value);
    if (from) url += "&from=" + encodedurl(from);
    if (to) url += "&to=" + encodedurl(to);

    const mimes = String(element('mimefilter').value || "").split(",").map(s => s.trim()).filter(Boolean);
    if (mimes.length) {
        const pattern = mimes.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        url += "&filter=" + encodedurl("mimetype:(" + pattern + ")");
    }
    const statuses = String(element('statusfilter').value || "").split(",").map(s => s.trim()).filter(Boolean);
    if (statuses.length) {
        const pattern = statuses.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        url += "&filter=" + encodedurl("statuscode:(" + pattern + ")");
    }

    let limittype = element('limittype').value;
    let limit = parseInt(element('limitval').value) || 5000;
    if (element('limitenabled').checked) {
        if (limittype === "slow") {
            url += "&limit=" + limit;
        } else if (limittype === "fast") {
            url += "&fastLatest=" + limit;
        }
    }
    return url;
}

function parsedatarows(lines) {
    const dedupeenabled = element('dedupechk').checked;
    const hardlimit = element('limitenabled').checked ? (parseInt(element('limitval').value) || 5000) : Infinity;
    let data = [];
    let dedupemap = dedupeenabled ? new Map() : null;

    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(/\s+/);
        if (parts.length < 5) continue;
        let original = parts[1];
        if (gottaskipbadpages(parts[3])) continue;

        if (dedupeenabled) {
            let timestamp = parts[0];
            let norm = normalizededupe(original);
            let prev = dedupemap.get(norm);
            if (!prev || prev[0] < timestamp) dedupemap.set(norm, parts);
        } else {
            data.push(parts);
            if (data.length >= hardlimit) break;
        }
    }
    if (dedupeenabled) {
        data = Array.from(dedupemap.values());
        if (Number.isFinite(hardlimit) && data.length > hardlimit) data = data.slice(0, hardlimit);
    }
    return data;
}

function sleep(ms) {return new Promise(r => setTimeout(r, ms))}

const cdxroutes = [
    {key: "direct", build: u => u},
    {key: "proxy", build: u => "https://cors.coolsite.cv/?url=" + encodeURIComponent(u)},
    {key: "codetabs", build: u => "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(u)}
];

function waybackurl(parts) {
    let date = parts[0], origurl = parts[1], mimetype = parts[2];
    let prefix = mimetype === "text/html" ? "if_" : "im_";
    return "https://web.archive.org/web/" + date + prefix + "/" + origurl;
}

async function fetchcdxrowsstream(baseurl, progress, control) {
    const retriesperroute = 1;
    const sweeps = 5;
    const responsetimeout = 25000;
    const streamtimeout = 1200000;
    const dedupeenabled = element('dedupechk').checked;
    const hardlimit = element('limitenabled').checked ? (parseInt(element('limitval').value) || 5000) : Infinity;
    let lasterror = null;

    for (let sweep = 0; sweep < sweeps; sweep++) {
      for (let a = 0; a < cdxroutes.length; a++) {
        const route = cdxroutes[a].key;
        const target = cdxroutes[a].build(baseurl);

        for (let attempt = 0; attempt <= retriesperroute; attempt++) {
            if (control && control.stopped) throw Object.assign(new Error("stopped"), {stopped: true, partial: []});
            const controller = new AbortController();
            let timeout = setTimeout(() => controller.abort(), responsetimeout);
            try {
                setprogress(progress, "trying via " + route + (attempt ? " (retry " + attempt + ")" : "")
                    + (sweep ? " [pass " + (sweep + 1) + "]" : "") + "..");
                const resp = await fetch(target, {method: "GET", cache: "no-store", signal: controller.signal});
                clearTimeout(timeout);
                if (!resp.ok) {
                    const e = new Error(route + " HTTP " + resp.status);
                    e.status = resp.status;
                    throw e;
                }
                timeout = setTimeout(() => controller.abort(), streamtimeout);
                setprogress(progress, "beginning to stream data, this might take a while..");
                if (!resp.body) {
                    const fallbacktxt = await resp.text();
                    return parsedatarows((fallbacktxt || "").replace(/\r/g, "").split("\n"));
                }

                const totalbytes = parseInt(resp.headers.get("content-length") || "0", 10) || 0;
                const reader = resp.body.getReader();
                const decoder = new TextDecoder();
                let processedbytes = 0;
                let carry = "";
                let data = [];
                let dedupemap = dedupeenabled ? new Map() : null;
                let stop = false;

                while (!stop) {
                    if (control && control.stopped) {
                        stop = true;
                        try { await reader.cancel(); } catch { }
                        break;
                    }
                    const {done, value} = await reader.read();
                    if (done) break;
                    processedbytes += value.byteLength;
                    carry += decoder.decode(value, {stream: true});
                    const lines = carry.split(/\r?\n/);
                    carry = lines.pop() || "";

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        const parts = line.split(/\s+/);
                        if (parts.length < 5) continue;
                        const original = parts[1];
                        if (gottaskipbadpages(parts[3])) continue;

                        if (dedupeenabled) {
                            const timestamp = parts[0];
                            const norm = normalizededupe(original);
                            const prev = dedupemap.get(norm);
                            if (!prev || prev[0] < timestamp) dedupemap.set(norm, parts);
                        } else {
                            data.push(parts);
                            if (data.length >= hardlimit) {
                                stop = true;
                                break;
                            }
                        }
                    }

                    const mbdone = (processedbytes / (1024 * 1024)).toFixed(1);
                    const rowcount = dedupeenabled ? dedupemap.size : data.length;
                    if (totalbytes > 0) {
                        const mbtotal = (totalbytes / (1024 * 1024)).toFixed(1);
                        setprogress(progress, `streaming ${mbdone}/${mbtotal} MB.. (${rowcount} rows)`);
                    } else {
                        setprogress(progress, `streaming ${mbdone} MB.. (${rowcount} rows)`);
                    }
                }

                if (carry && !stop) {
                    const line = carry.trim();
                    if (line) {
                        const parts = line.split(/\s+/);
                        if (parts.length >= 5) {
                            const original = parts[1];
                            if (!gottaskipbadpages(parts[3])) {
                                if (dedupeenabled) {
                                    const timestamp = parts[0];
                                    const norm = normalizededupe(original);
                                    const prev = dedupemap.get(norm);
                                    if (!prev || prev[0] < timestamp) dedupemap.set(norm, parts);
                                } else if (data.length < hardlimit) {
                                    data.push(parts);
                                }
                            }
                        }
                    }
                }
                if (dedupeenabled) {
                    data = Array.from(dedupemap.values());
                    if (Number.isFinite(hardlimit) && data.length > hardlimit) data = data.slice(0, hardlimit);
                }
                return data;
            } catch (e) {
                lasterror = e;
                if (attempt < retriesperroute) {
                    await sleep(300 + Math.floor(Math.random() * 250));
                }
            } finally {clearTimeout(timeout)}
        }
      }
      if (sweep < sweeps - 1) {
          const wait = 3000 * (sweep + 1) + Math.floor(Math.random() * 1000);
          setprogress(progress, "every route is down or throttled right now, waiting " + Math.round(wait / 1000) + "s before trying everything again..");
          await sleep(wait);
      }
    }
    throw lasterror || new Error("all routes failed");
}

function exportbuilder(data, domain) {
    let fmt = element('format').value;
    let downloadcontent = "";
    let downloadfilename = "";
    let mime = "text/plain;charset=utf-8";

    if (fmt === "archivesonly") {
        let out = data.map(waybackurl).filter(Boolean).join("\n");
        downloadcontent = out;
        downloadfilename = "archive of " + domain + ".txt";
    }
    else if (fmt === "archiveinfo") {
        let out = ["date,url,mimetype,responsecode,size"];
        for (let i = 0; i < data.length; i++) {
            let [date, urlx, rowmime, code, len] = data[i];
            let dstr = date.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
                '$1/$2/$3 $4:$5:$6');
            let size = parseInt(len) || 0;
            let sizekb = size > 0 ? (size / 1024).toFixed(3) : "";
            out.push(`"${dstr}","${urlx}","${rowmime}",${code},"${sizekb}kb"`);
        }
        downloadcontent = out.join("\n");
        downloadfilename = domain + ".csv";
        mime = "text/csv;charset=utf-8";
    }
    else if (fmt === "linksonly") {
        let out = data.map(parts => parts[1]).filter(Boolean).join("\n");
        downloadcontent = out;
        downloadfilename = domain + ".txt";
    }
    return { content: downloadcontent, filename: downloadfilename, mime };
}

function filldonerow(rowEl, domain, data, withUrlPrefix) {
    rowEl.textContent = "";
    const n = data && data.length ? data.length : 0;
    const label = withUrlPrefix ? `(${domain}) done! (${n} results)` : `done! (${n} results)`;
    rowEl.appendChild(document.createTextNode(label));
    if (n > 0) {
        const exp = exportbuilder(data, domain);
        rowEl.appendChild(document.createTextNode(" "));
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "download";
        btn.addEventListener("click", () => downloadBlob(exp.content, exp.filename, exp.mime));
        rowEl.appendChild(btn);
    }
}

function showpreviewtable(data, output) {
    if (!data || data.length === 0) {
        output.innerHTML = '<div class="notable">no results :(</div>';
        return;
    }

    const showarchivelinks = element('format').value !== "linksonly";
    let tlines = data.slice(0, 1000);
    let maxdate = 4, maxurl = 3, maxmime = 8, maxcode = 4, maxsize = 4;
    for (let i = 0; i < tlines.length; i++) {
        let parts = tlines[i];
        if (parts.length < 5) continue;
        let [date, link, mime, code, len] = parts;
        let displaylink = showarchivelinks ? waybackurl(parts) : link;
        let dstr = date.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
            '$1/$2/$3 $4:$5:$6');
        maxdate = Math.max(maxdate, dstr.length);
        maxurl = Math.max(maxurl, displaylink.length);
        maxmime = Math.max(maxmime, mime.length);
        maxcode = Math.max(maxcode, code.length);
        maxsize = Math.max(maxsize, len.length);
    }
    const slack = 2;
    const nonurlch = (maxdate + maxmime + maxcode + maxsize + (slack * 4));
    const urlch = 100;
    const esttablepx = (nonurlch + urlch + 22) * 7;
    const availablepx = Math.max(320, output.clientWidth || (window.innerWidth - 40));
    const partcount = Math.max(1, Math.floor(availablepx / esttablepx));
    const rowsperpart = Math.max(1, Math.ceil(tlines.length / partcount));

    function rendertable(rows) {
        let tbl = `<table class="cdxtable">
  <colgroup>
    <col style="width:${maxdate + slack}ch">
    <col style="width:${urlch}ch">
    <col style="width:${maxmime + slack}ch">
    <col style="width:${maxcode + slack}ch">
    <col style="width:${maxsize + slack}ch">
  </colgroup>
  <tr><th>latest archive date</th><th class="url-col">${showarchivelinks ? "archive url" : "full url"}</th><th>mimetype</th><th>response code</th><th>size in bytes</th></tr>
`;
        for (let i = 0; i < rows.length; i++) {
            let parts = rows[i];
            if (parts.length < 5) continue;
            let [date, link, mime, code, len] = parts;
            let displaylink = showarchivelinks ? waybackurl(parts) : link;
            let dstr = date.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
                '$1/$2/$3 $4:$5:$6');
            tbl += `<tr>
      <td>${escapetext(dstr)}</td>
      <td class="url-col"><a href="${escapetext(displaylink)}" target="_blank">${escapetext(displaylink)}</a></td>
      <td>${escapetext(mime)}</td>
      <td>${escapetext(code)}</td>
      <td>${escapetext(len)}</td>
    </tr>`;
        }
        tbl += "</table>";
        return tbl;
    }

    let partshtml = "";
    for (let i = 0; i < tlines.length; i += rowsperpart) {
        partshtml += rendertable(tlines.slice(i, i + rowsperpart));
    }
    output.innerHTML = "<div class='preview-grid'>" + partshtml + "</div>";
}

/*//////////////////////////////////////////////////////////////////////*/

persistkeys.forEach(k => {
    allelements(k).forEach(el => {
        el.addEventListener('change', savesettings);
        el.addEventListener('input', savesettings);
    });
});
loadsettings();
loadlastrun();
updatelimitcontrols();
element('limitenabled').addEventListener('change', updatelimitcontrols);

element('domainfield').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    e.target.form.requestSubmit();
});

function bettererrorformat(msg) {
    if (/failed to fetch|cors|networkerror/i.test(msg)) return "all routes failed :( ie has been basically non-functional for some people, try running this page in incognito!";
    return "error: " + msg;
}

function armstopbtn(control) {
    const btn = element('stopbtn');
    btn.disabled = false;
    btn.textContent = "stop";
    btn.style.display = "";
    const handler = () => {
        control.stopped = true;
        btn.disabled = true;
        btn.textContent = "stopping..";
    };
    btn.addEventListener('click', handler);
    return () => {
        btn.removeEventListener('click', handler);
        btn.style.display = "none";
    };
}

document.querySelector('.domaininputrow').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const progressRoot = element('progress');
    const output = element('outputrow');
    progressRoot.replaceChildren();
    output.innerHTML = "";

    const urls = parseurllist(element('domainfield').value);
    if (urls.length === 0) {
        progressRoot.textContent = "paste the links above, dummy";
        return;
    }

    const runresults = [];

    if (urls.length === 1) {
        const domain = urls[0];
        const cdxUrl = buildcdxurl(domain);
        const control = {stopped: false};
        const disarm = armstopbtn(control);
        try {
            const data = await fetchcdxrowsstream(cdxUrl, progressRoot, control);
            disarm();
            progressRoot.replaceChildren();
            const row = document.createElement('div');
            row.className = 'progressline';
            filldonerow(row, domain, data, false);
            progressRoot.appendChild(row);
            showpreviewtable(data, output);
            runresults.push({domain, data});
        } catch (e) {
            disarm();
            if (e && e.stopped) {
                const data = e.partial || [];
                progressRoot.replaceChildren();
                const row = document.createElement('div');
                row.className = 'progressline';
                filldonerow(row, domain, data, false);
                progressRoot.appendChild(row);
                showpreviewtable(data, output);
                runresults.push({domain, data});
            } else {
                const msg = (e && e.message) ? e.message : String(e);
                progressRoot.textContent = bettererrorformat(msg);
                showpreviewtable([], output);
            }
        }
    } else {
        for (let i = 0; i < urls.length; i++) {
            const domain = urls[i];
            const line = document.createElement('div');
            line.className = 'progressline';
            progressRoot.appendChild(line);
            const cdxUrl = buildcdxurl(domain);
            const control = {stopped: false};
            const disarm = armstopbtn(control);
            try {
                const data = await fetchcdxrowsstream(cdxUrl, (m) => {
                    line.textContent = '(' + domain + ') ' + m;
                }, control);
                disarm();
                filldonerow(line, domain, data, true);
                runresults.push({domain, data});
            } catch (e) {
                disarm();
                if (e && e.stopped) {
                    const data = e.partial || [];
                    filldonerow(line, domain, data, true);
                    runresults.push({domain, data});
                    break;
                } else {
                    const msg = (e && e.message) ? e.message : String(e);
                    line.textContent = '(' + domain + ') ' + bettererrorformat(msg);
                }
            }
        }
    }
    if (runresults.length) savelastrun(runresults);
    alldone();
});
