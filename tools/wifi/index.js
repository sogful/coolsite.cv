const $ = s => document.querySelector(s);
const paramfields = Array.from(document.querySelectorAll("[data-param]"));
const status = $("#status"), resultcount = $("#resultcount");
const resultwrap = $("#resultwrap"), resultbar = $("#resultbar");
const table = $("#resultstable");

const cols = [
    ["netid", "bssid"], ["ssid", "ssid"], ["encryption", "encryption"],
    ["channel", "ch"], ["firsttime", "first seen"], ["lastupdt", "last seen"],
    ["trilat", "lat"], ["trilong", "long"], ["city", "city"],
    ["region", "region"], ["country", "country"], ["road", "road"],
];

let rows = [];
let searchAfter = null;
let lastParams = null;

/*//////////////////////////////////////////////////////////////////////*/

function loadtoken() { return localStorage.getItem("wigle_token") || ""; }
function savetokenui() {
    const tok = loadtoken();
    $("#tokeninput").hidden = !!tok;
    $("#savetoken").hidden = !!tok;
    $("#tokensaved").hidden = !tok;
    $("#cleartoken").hidden = !tok;
}
$("#savetoken").addEventListener("click", () => {
    const v = $("#tokeninput").value.trim();
    if (!v) return;
    localStorage.setItem("wigle_token", v);
    $("#tokeninput").value = "";
    savetokenui();
});
$("#cleartoken").addEventListener("click", () => {
    localStorage.removeItem("wigle_token");
    savetokenui();
});
savetokenui();

/*//////////////////////////////////////////////////////////////////////*/

function loadfields() {
    let o = {};
    try { o = JSON.parse(localStorage.getItem("wigle_fields") || "{}"); } catch {}
    paramfields.forEach(el => {
        const k = el.dataset.param;
        if (!(k in o)) return;
        if (el.type === "checkbox") el.checked = !!o[k];
        else el.value = o[k];
    });
}
function savefields() {
    const o = {};
    paramfields.forEach(el => {
        o[el.dataset.param] = el.type === "checkbox" ? el.checked : el.value;
    });
    localStorage.setItem("wigle_fields", JSON.stringify(o));
}
paramfields.forEach(el => el.addEventListener("change", savefields));
loadfields();

$("#resetbtn").addEventListener("click", () => {
    paramfields.forEach(el => {
        if (el.type === "checkbox") el.checked = false;
        else if (el.tagName === "SELECT") el.value = "";
        else if (el.dataset.param === "resultsPerPage") el.value = "100";
        else el.value = "";
    });
    savefields();
});

/*//////////////////////////////////////////////////////////////////////*/

function buildparams() {
    const p = new URLSearchParams();
    paramfields.forEach(el => {
        const k = el.dataset.param;
        if (el.type === "checkbox") { if (el.checked) p.set(k, "true"); return; }
        const v = el.value.trim();
        if (v) p.set(k, v);
    });
    return p;
}

async function wigleFetch(params) {
    const token = loadtoken();
    const url = "https://api.wigle.net/api/v2/network/search?" + params.toString();
    const headers = {Authorization: "Basic " + token};

    try {
        const r = await fetch(url, {headers});
        if (r.ok) return await r.json();
        if (r.status !== 0) {
            const body = await r.text().catch(() => "");
            throw new Error("HTTP " + r.status + (body ? (" - " + body.slice(0, 200)) : ""));
        }
    } catch (e) {}

    const proxied = "https://cors.coolsite.cv/?url=" + encodeURIComponent(url);
    const r2 = await fetch(proxied, {headers});
    if (!r2.ok) throw new Error("proxy HTTP " + r2.status);
    return await r2.json();
}

function fmt(v) { return v === null || v === undefined || v === "" ? "" : String(v); }

function renderrows() {
    let html = "<tr>" + cols.map(c => "<th>" + c[1] + "</th>").join("") + "</tr>";
    for (const row of rows) {
        html += "<tr>" + cols.map(c => "<td>" + fmt(row[c[0]]).replace(/[&<>]/g, ch =>
            ({"&": "&amp;", "<": "&lt;", ">": "&gt;"})[ch]) + "</td>").join("") + "</tr>";
    }
    table.innerHTML = html;
    resultwrap.hidden = rows.length === 0;
    resultbar.hidden = rows.length === 0;
    resultcount.textContent = rows.length + " result" + (rows.length === 1 ? "" : "s") +
        (searchAfter ? " (more available)" : "");
    $("#loadmore").disabled = !searchAfter;
}

async function runsearch(more) {
    if (!loadtoken()) { status.textContent = "save an api token first"; return; }
    const params = more ? new URLSearchParams(lastParams) : buildparams();
    if (more && searchAfter) params.set("searchAfter", searchAfter);
    if (!more) { rows = []; searchAfter = null; }
    lastParams = params;

    $("#runbtn").disabled = true; $("#loadmore").disabled = true;
    status.textContent = "searching...";
    try {
        const data = await wigleFetch(params);
        if (!data.success) throw new Error(data.message || "wigle api returned an error");
        rows = rows.concat(data.results || []);
        searchAfter = data.search_after || null;
        status.textContent = "total matches on wigle: " + fmt(data.totalResults);
        renderrows();
    } catch (e) {
        status.textContent = "error: " + (e && e.message ? e.message : String(e));
    } finally {
        $("#runbtn").disabled = false;
        $("#loadmore").disabled = !searchAfter;
    }
}

$("#searchform").addEventListener("submit", e => { e.preventDefault(); runsearch(false); });
$("#loadmore").addEventListener("click", () => runsearch(true));

$("#downloadcsv").addEventListener("click", () => {
    const header = cols.map(c => c[1]).join(",");
    const lines = rows.map(row => cols.map(c => {
        const v = fmt(row[c[0]]).replace(/"/g, '""');
        return '"' + v + '"';
    }).join(","));
    const csv = [header].concat(lines).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"}));
    a.download = "wigle-search.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
