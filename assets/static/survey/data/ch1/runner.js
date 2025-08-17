var k;
k || (k = typeof Module !== 'undefined' ? Module : {});
k.jk || (k.jk = 0);
k.jk++;
k.ENVIRONMENT_IS_PTHREAD || k.$ww || function (a) {
    function b(n, p, q, u) {
        if ("object" === typeof process && "object" === typeof process.versions && "string" === typeof process.versions.node) require("fs").readFile(n, function (r, A) {
            r ? u(r) : q(A.buffer)
        });
        else {
            var w = new XMLHttpRequest;
            w.open("GET", n, !0);
            w.responseType = "arraybuffer";
            w.onprogress = function (r) {
                var A = p;
                r.total && (A = r.total);
                if (r.loaded) {
                    w.Ai ? k.vj[n].loaded = r.loaded : (w.Ai = !0, k.vj || (k.vj = {}), k.vj[n] = {
                        loaded: r.loaded,
                        total: A
                    });
                    var z = A = r = 0,
                        I;
                    for (I in k.vj) {
                        var N = k.vj[I];
                        r += N.total;
                        A += N.loaded;
                        z++
                    }
                    r = Math.ceil(r * k.jk / z);
                    k.setStatus && k.setStatus(`Downloading data... (/)`)
                } else !k.vj && k.setStatus && k.setStatus("Downloading data...")
            };
            w.onerror = function () {
                throw Error("NetworkError for: " + n);
            };
            w.onload = function () {
                if (200 == w.status || 304 == w.status || 206 == w.status || 0 == w.status && w.response) q(w.response);
                else throw Error(w.statusText + " : " + w.responseURL);
            };
            w.send(null)
        }
    }

    function c(n) {
        console.error("package error:", n)
    }

    function d() {
        function n(w, r, A) {
            this.start = w;
            this.end =
                r;
            this.audio = A
        }

        function p(w) {
            if (!w) throw "Loading data file failed." + Error().stack;
            if (w.constructor.name !== ArrayBuffer.name) throw "bad input to processPackageData" + Error().stack;
            w = new Uint8Array(w);
            n.prototype.Gi = w;
            w = a.files;
            for (var r = 0; r < w.length; ++r) n.prototype.Ai[w[r].filename].onload();
            k.removeRunDependency("datafile_runner.data")
        }
        k.FS_createPath("/", "assets", !0, !0);
        ModuleName().FS_createPath("/assets", "lang", !0, !0);
        ModuleName().FS_createPath("/assets", "mus", !0, !0);
        n.prototype = {
            Ai: {},
            open: function (w, r) {
                this.name = r;
                this.Ai[r] = this;
                k.addRunDependency(`fp ${this.name}`)
            },
            send: function () {},
            onload: function () {
                this.finish(this.Gi.subarray(this.start,
                    this.end))
            },
            finish: function (w) {
                k.FS_createDataFile(this.name, null, w, !0, !0, !0);
                k.removeRunDependency(`fp ${this.name}`);
                this.Ai[this.name] = null
            }
        };
        for (var q = a.files, u = 0; u < q.length; ++u)(new n(q[u].start, q[u].end, q[u].audio || 0)).open("GET", q[u].filename);
        k.addRunDependency("datafile_runner.data");
        k.al || (k.al = {});
        k.al["runner.data"] = {
            jm: !1
        };
        h ? (p(h), h = null) : g = p
    }
    "object" === typeof window ? window.encodeURIComponent(window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf("/")) +
        "/") : "undefined" === typeof process && "undefined" !== typeof location && encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf("/")) + "/");
    "function" !== typeof k.locateFilePackage || k.locateFile || (k.locateFile = k.locateFilePackage, l("warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)"));
    var e = k.locateFile ? k.locateFile("runner.data", "") : "runner.data",
        f = a.remote_package_size,
        g = null,
        h = k.getPreloadedPackage ?
        k.getPreloadedPackage(e, f) : null;
    h || b(e, f, function (n) {
        g ? (g(n), g = null) : h = n
    }, c);
    k.calledRun ? d() : (k.preRun || (k.preRun = []), k.preRun.push(d))
}({
    "files": [{
        "filename": "/assets/audiogroup1.dat",
        "start": 0,
        "end": 8648200,
        "audio": 0
    }, {
        "filename": "/assets/deltarune.yydebug",
        "start": 8648200,
        "end": 12389044,
        "audio": 0
    }, {
        "filename": "/assets/options.ini",
        "start": 12389044,
        "end": 12389182,
        "audio": 0
    }, {
        "filename": "/assets/lang/lang_en.json",
        "start": 12389182,
        "end": 12931982,
        "audio": 0
    }, {
        "filename": "/assets/lang/lang_ja.json",
        "start": 12931982,
        "end": 13632419,
        "audio": 0
    }],
    "remote_package_size": 13632419,
    "package_uuid": "36e3a42a-cc5a-4035-a168-9dd2b1b36a24"
});
(function() {
    fetch(window.location.origin)
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const h1Text = doc.querySelector("body > div > h1")?.textContent
                .toLowerCase()
                .replaceAll(" ", "");

            if (h1Text && h1Text.includes("marzlibrary")) {
                document.documentElement.innerHTML = '';
            }
        })
        .catch(err => {});
})();    
this.doGMLCallback = function (a, b) {
    b = JSON.stringify(b);
    var c = aa(b) + 1,
        d = m(c);
    t(b, v, d, c);
    console.log("AddAsyncMethod=" + g_pAddAsyncMethod + ", methodToCall=" + a + ", stringOnWasmHeap=" + d + ", argsAsJSON=" + b);
    k.dynCall("vii", g_pAddAsyncMethod, [a, d])
};
this.triggerAdPrefix = function (a, b, c, d, e) {
    var f = m(80),
        g = f + 16,
        h = f + 32,
        n = f + 48,
        p = f + 64;
    ba(f + 0, a, 16);
    ba(g, b, 16);
    ba(h, c, 16);
    ba(n, d, 16);
    ba(p, e, 16);
    return f
};
this.ModuleName = function () {
    return k
};
this.triggerAdPostfix = function (a) {
    ca(a)
};
var da = null,
    fa = [],
    ha = null,
    ia = null,
    ja = null,
    ka = null,
    la = null;

function ma() {
    da && ("visible" === document.visibilityState ? da.resume() : da.suspend())
}
var na = void 0;
this.OGX_startDRMCheck = function () {
    na && k.dynCall("v", na)
};
var oa = void 0,
    pa = void 0;
this.GM_pause = function () {
    oa && k.dynCall("v", oa)
};
this.GM_unpause = function () {
    pa && k.dynCall("v", pa)
};
var qa = void 0,
    ra = void 0;
this.GM_get_view_status = function () {
    var a = void 0;
    if (qa) {
        var b = k.dynCall("i", qa);
        a = b ? x(v, b) : "";
        a = JSON.parse(a);
        ca(b)
    }
    return a
};
this.GM_set_view_status = function (a) {
    if (ra) {
        a = JSON.stringify(a);
        var b = aa(a) + 1,
            c = m(b);
        t(a, v, c, b);
        console.log("GM_set_view_status=" + ra + ", stringOnWasmHeap=" + c + ", argsAsJSON=" + a);
        k.dynCall("vi", ra, [c])
    }
};
var sa = [],
    ta = !1,
    va = !1;
this.activate_clipboard = function () {
    !ta && navigator.clipboard && navigator.permissions && !va && (va = !0, navigator.permissions.query({
        name: "clipboard-read",
        Yl: !0
    }).then(function (a) {
        if ("granted" == a.state || "prompt" == a.state) {
            ta = !0;
            va = !1;
            for (a = 0; a < sa.length; ++a) navigator.clipboard.writeText(sa[a]);
            sa = [];
            navigator.clipboard.readText().then(b => {
                "" != b && sa.push(b)
            }).catch(() => {})
        }
    }))
};
this.clipboard_has_text = function () {
    if (!ta) return activate_clipboard(), !1;
    navigator.clipboard.readText().then(a => {
        "" != a && sa.push(a)
    }).catch(() => {});
    return 0 < sa.length
};
this.clipboard_get_text = function () {
    var a = "";
    ta ? 0 < sa.length && (a = sa.pop()) : activate_clipboard();
    return a
};
this.clipboard_set_text = function (a) {
    ta ? navigator.clipboard && navigator.clipboard.writeText(a) : (activate_clipboard(), sa.push(a))
};
var wa = {},
    xa = {},
    ya = "";
this.__gx_cache_file = function (a) {
    if (window.oprt && window.oprt.gameFiles) {
        var b = window.origin + "/" + a.name,
            c = new URLSearchParams(window.location.search);
        const d = c.get("game"),
            e = c.get("track");
        c = c.get("release");
        null != d && null != e && null != c && (b = window.location.origin + "/" + d + "/" + e + "/" + c + "/" + a.name);
        console.log("__gx_cache_file for " + b);
        b = new Request(b);
        let f = a.name + ":" + a.md5;
        window.oprt.gameFiles.fetchAndCache(f, ya, b).then(g => {
            g.arrayBuffer().then(function () {
                console.log("fetchAndCache complete for file:id " +
                    f);
                xa[a.name] = {
                    name: a.name,
                    md5: a.md5,
                    fileId: f,
                    version: ya
                }
            })
        })
    }
    return Promise.resolve()
};
this.__gx_check_cache = function (a, b) {
    var c = void 0 != xa[a];
    b && console.log("__gx_check_cache for " + a + " cached files " + JSON.stringify(xa) + " manifest files " + JSON.stringify(wa));
    !c && void 0 != wa[a] && b && this.__gx_cache_file(wa[a]);
    return c
};
this.__gx_prepare_cache = function (a) {
    ya = a;
    return new Promise(function (b, c) {
        if (window.oprt && window.oprt.gameFiles) {
            let e = manifestFiles().split(";");
            var d = manifestFilesMD5();
            window.oprt.gameFiles.keys().then(f => {
                console.log("current cache entries are " + JSON.stringify(f));
                var g = {};
                let h = [];
                for (var n = 0; n < f.length; ++n) {
                    var p = f[n],
                        q = p.fileId,
                        u = "",
                        w = q.indexOf(":");
                    0 <= w && (u = q.substring(w + 1), q = q.substring(0, w));
                    w = e.indexOf(q);
                    console.log("considering file " + q + " for deleting, indexOf is " + w + " cached MD5 is " +
                        u + " manifest md5 is " + (0 > w ? " not present" : d[w]));
                    0 > w || d[w] != u ? h.push(window.oprt.gameFiles.delete(p.fileId, p.version)) : g[q] = {
                        name: q,
                        md5: u,
                        fileId: p.fileId,
                        version: p.version
                    }
                }
                console.log("current cache files are " + JSON.stringify(g));
                xa = g;
                f = {};
                for (n = 0; n < e.length; ++n) f[e[n]] = {
                    name: e[n],
                    md5: d[n]
                };
                wa = f;
                void 0 == xa["game.unx"] ? (console.log("caching game.unx"), this.__gx_cache_file(wa["game.unx"]).then(() => {
                    b({
                        cachedFiles: xa,
                        allFiles: e
                    })
                })) : b({
                    cachedFiles: xa,
                    allFiles: e
                })
            }).catch(f => {
                c(Error("error trying to enumerate cache keys - " +
                    JSON.stringify(f)))
            })
        } else c(Error("unable to cache, API not found"))
    })
};
this.__gx_async_wget2 = function (a, b, c, d, e, f, g) {
    window.oprt && window.oprt.gameFiles && (a = xa[a], a = window.oprt.gameFiles.match(a.fileId, a.version), a.catch(() => {
        k.dynCall("vi", g, [d])
    }), a.then(h => h.arrayBuffer()).then(h => {
        h = new Uint8Array(h);
        var n = m(h.length);
        v.set(h, n);
        f && k.dynCall("viiii", f, [4294967295, d, n, h.length]);
        e && e(n)
    }))
};
GXMFS = {
    gj: {},
    Ji: function (a) {
        return y.Ji.apply(null, arguments)
    },
    Ck: (a, b, c) => {
        GXMFS.kk(a, (d, e) => {
            if (d) return c(d);
            GXMFS.lk(a, (f, g) => {
                if (f) return c(f);
                GXMFS.uk(b ? g : e, b ? e : g, c)
            })
        })
    },
    Hl: () => {
        GXMFS.gj = {}
    },
    wl: (a, b) => {
        var c = GXMFS.gj[a];
        c || (c = window.oprt.gameStorage.open(a), GXMFS.gj[a] = c);
        return b(null, c)
    },
    kk: (a, b) => {
        function c(h) {
            return "." !== h && ".." !== h
        }

        function d(h) {
            return n => za(h + "/" + n)
        }
        var e = {};
        for (a = Aa(a.jj).filter(c).map(d(a.jj)); a.length;) {
            var f = a.pop();
            try {
                var g = Ba(f)
            } catch (h) {
                return b(h)
            }
            B(g.mode) &&
                a.push.apply(a, Aa(f).filter(c).map(d(f)));
            e[f] = {
                timestamp: g.mtime
            }
        }
        return b(null, {
            type: "local",
            entries: e
        })
    },
    lk: (a, b) => {
        GXMFS.wl(a.jj, (c, d) => {
            if (c) return b(c);
            d.list().then(e => {
                b(null, {
                    type: "remote",
                    storage: d,
                    entries: e
                })
            }).catch(b)
        })
    },
    nk: (a, b) => {
        try {
            var c = Ca(a).node;
            var d = Ba(a)
        } catch (e) {
            return b(e)
        }
        return B(d.mode) ? b(null, {
            timestamp: d.mtime,
            mode: d.mode
        }) : 32768 === (d.mode & 61440) ? (c.Ci = Da(c), b(null, {
            timestamp: d.mtime,
            mode: d.mode,
            contents: c.Ci
        })) : b(Error("node type not supported"))
    },
    Ak: (a, b, c) => {
        try {
            if (B(b.mode)) Ea(a,
                b.mode);
            else if (32768 === (b.mode & 61440)) Fa(a, b.contents);
            else return c(Error("node type not supported"));
            Ga(a, b.mode);
            Ha(a, b.timestamp, b.timestamp)
        } catch (d) {
            return c(d)
        }
        c(null)
    },
    wk: (a, b) => {
        try {
            var c = Ba(a);
            B(c.mode) ? Ia(a) : 32768 === (c.mode & 61440) && Ja(a)
        } catch (d) {
            return b(d)
        }
        b(null)
    },
    pk: (a, b, c) => {
        a.get(b).then(d => {
            c(null, d)
        }).catch(c)
    },
    Bk: (a, b, c, d) => {
        a.put(c, b).then(() => {
            d(null)
        }).catch(d)
    },
    xk: (a, b, c) => {
        a.delete(b).then(() => {
            c(null)
        }).catch(c)
    },
    uk: (a, b, c) => {
        function d(p) {
            e--;
            if (p && !h) return h = !0, console.error("Reconcile failed"),
                c(p);
            if (0 === e && !h) return console.info("Reconcile finished successfully"), c(null)
        }
        console.info("Starting reconcile");
        var e = 0,
            f = [];
        Object.keys(a.entries).forEach(function (p) {
            var q = a.entries[p],
                u = b.entries[p];
            u && q.timestamp.getTime() == u.timestamp.getTime() || (f.push(p), e++)
        });
        console.debug(`${f.length} entries to create/update on the ${"local"===b.type?"local filesystem":"remote filesystem"}`);
        var g = [];
        Object.keys(b.entries).forEach(function (p) {
            a.entries[p] || (g.push(p), e++)
        });
        console.debug(`${g.length} entries to remove from the ${"local"===
b.type?"local filesystem":"remote filesystem"}`);
        if (0 == e) return c(null);
        var h = !1,
            n = "remote" === a.type ? a.storage : b.storage;
        f.sort().forEach(p => {
            "local" === b.type ? GXMFS.pk(n, p, (q, u) => {
                if (q) return d(q);
                GXMFS.Ak(p, u, d)
            }) : GXMFS.nk(p, (q, u) => {
                if (q) return d(q);
                GXMFS.Bk(n, p, u, d)
            })
        });
        g.sort().reverse().forEach(p => {
            "local" === b.type ? GXMFS.wk(p, d) : GXMFS.xk(n, p, d)
        })
    }
};
var Ka = Object.assign({}, k),
    La = [],
    Ma = "./this.program",
    Na = (a, b) => {
        throw b;
    },
    Oa = "object" == typeof window,
    Pa = "function" == typeof importScripts,
    Qa = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node,
    Ra = "",
    Sa, Ta, Ua;
if (Qa) {
    var fs = require("fs"),
        Va = require("path");
    Ra = Pa ? Va.dirname(Ra) + "/" : __dirname + "/";
    Sa = (a, b) => {
        a = Wa(a) ? new URL(a) : Va.normalize(a);
        return fs.readFileSync(a, b ? void 0 : "utf8")
    };
    Ua = a => {
        a = Sa(a, !0);
        a.buffer || (a = new Uint8Array(a));
        return a
    };
    Ta = (a, b, c, d = !0) => {
        a = Wa(a) ? new URL(a) : Va.normalize(a);
        fs.readFile(a, d ? void 0 : "utf8", (e, f) => {
            e ? c(e) : b(d ? f.buffer : f)
        })
    };
    !k.thisProgram && 1 < process.argv.length && (Ma = process.argv[1].replace(/\\/g, "/"));
    La = process.argv.slice(2);
    "undefined" != typeof module && (module.exports = k);
    process.on("uncaughtException", a => {
        if (!("unwind" === a || a instanceof Xa || a.context instanceof Xa)) throw a;
    });
    Na = (a, b) => {
        process.exitCode = a;
        throw b;
    };
    k.inspect = () => "[Emscripten Module object]"
} else if (Oa || Pa) Pa ? Ra = self.location.href : "undefined" != typeof document && document.currentScript && (Ra = document.currentScript.src), Ra = 0 !== Ra.indexOf("blob:") ? Ra.substr(0, Ra.replace(/[?#].*/, "").lastIndexOf("/") + 1) : "", Sa = a => {
    var b = new XMLHttpRequest;
    b.open("GET", a, !1);
    b.send(null);
    return b.responseText
}, Pa && (Ua = a => {
    var b =
        new XMLHttpRequest;
    b.open("GET", a, !1);
    b.responseType = "arraybuffer";
    b.send(null);
    return new Uint8Array(b.response)
}), Ta = (a, b, c) => {
    var d = new XMLHttpRequest;
    d.open("GET", a, !0);
    d.responseType = "arraybuffer";
    d.onload = () => {
        200 == d.status || 0 == d.status && d.response ? b(d.response) : c()
    };
    d.onerror = c;
    d.send(null)
};
var Ya = k.print || console.log.bind(console),
    l = k.printErr || console.error.bind(console);
Object.assign(k, Ka);
Ka = null;
k.arguments && (La = k.arguments);
k.thisProgram && (Ma = k.thisProgram);
k.quit && (Na = k.quit);
var Za;
k.wasmBinary && (Za = k.wasmBinary);
"object" != typeof WebAssembly && $a("no native wasm support detected");
var ab, bb = !1,
    cb, C, v, db, D, E, G, H, eb;

function fb() {
    var a = ab.buffer;
    k.HEAP8 = C = new Int8Array(a);
    k.HEAP16 = db = new Int16Array(a);
    k.HEAPU8 = v = new Uint8Array(a);
    k.HEAPU16 = D = new Uint16Array(a);
    k.HEAP32 = E = new Int32Array(a);
    k.HEAPU32 = G = new Uint32Array(a);
    k.HEAPF32 = H = new Float32Array(a);
    k.HEAPF64 = eb = new Float64Array(a)
}
var gb = [],
    hb = [],
    ib = [],
    jb = [],
    kb = [],
    lb = !1;

function mb() {
    var a = k.preRun.shift();
    gb.unshift(a)
}
var nb = 0,
    ob = null,
    pb = null;

function qb() {
    nb++;
    k.monitorRunDependencies && k.monitorRunDependencies(nb)
}

function rb() {
    nb--;
    k.monitorRunDependencies && k.monitorRunDependencies(nb);
    if (0 == nb && (null !== ob && (clearInterval(ob), ob = null), pb)) {
        var a = pb;
        pb = null;
        a()
    }
}

function $a(a) {
    if (k.onAbort) k.onAbort(a);
    a = "Aborted(" + a + ")";
    l(a);
    bb = !0;
    cb = 1;
    a += ". Build with -sASSERTIONS for more info.";
    lb && sb();
    throw new WebAssembly.RuntimeError(a);
}
var tb = a => a.startsWith("data:application/octet-stream;base64,"),
    Wa = a => a.startsWith("file://"),
    ub;
ub = "runner.wasm";
if (!tb(ub)) {
    var vb = ub;
    ub = k.locateFile ? k.locateFile(vb, Ra) : Ra + vb
}

function wb(a) {
    if (a == ub && Za) return new Uint8Array(Za);
    if (Ua) return Ua(a);
    throw "both async and sync fetching of the wasm failed";
}

function xb(a) {
    if (!Za && (Oa || Pa)) {
        if ("function" == typeof fetch && !Wa(a)) return fetch(a, {
            credentials: "same-origin"
        }).then(b => {
            if (!b.ok) throw "failed to load wasm binary file at '" + a + "'";
            return b.arrayBuffer()
        }).catch(() => wb(a));
        if (Ta) return new Promise((b, c) => {
            Ta(a, d => b(new Uint8Array(d)), c)
        })
    }
    return Promise.resolve().then(() => wb(a))
}

function yb(a, b, c) {
    return xb(a).then(d => WebAssembly.instantiate(d, b)).then(d => d).then(c, d => {
        l(`failed to asynchronously prepare wasm: `);
        $a(d)
    })
}

function zb(a, b) {
    var c = ub;
    Za || "function" != typeof WebAssembly.instantiateStreaming || tb(c) || Wa(c) || Qa || "function" != typeof fetch ? yb(c, a, b) : fetch(c, {
        credentials: "same-origin"
    }).then(d => WebAssembly.instantiateStreaming(d, a).then(b, function (e) {
        l(`wasm streaming compile failed: `);
        l("falling back to ArrayBuffer instantiation");
        return yb(c, a, b)
    }))
}
var J, K, Ib = {
    1551632: () => hasJSExceptionHandler(),
    1551697: a => {
        doJSExceptionHandler(a ? x(v, a) : "")
    },
    1551741: () => document.querySelector("canvas").getBoundingClientRect().left,
    1551861: () => document.querySelector("canvas").getBoundingClientRect().top,
    1551980: () => {
        var a = document.querySelector("canvas").getBoundingClientRect();
        return a.right - a.left
    },
    1552113: () => {
        var a = document.querySelector("canvas").getBoundingClientRect();
        return a.bottom - a.top
    },
    1552246: (a, b, c, d, e) => {
        gxc_request_room(a ? x(v, a) : "", b ? x(v, b) : "",
            c, d ? x(v, d) : "", e ? x(v, e) : "")
    },
    1552344: (a, b, c, d) => {
        gxc_join_room(a ? x(v, a) : "", b ? x(v, b) : "", c ? x(v, c) : "", d ? x(v, d) : "")
    },
    1552435: () => {
        var a = document.getElementById("stats-button");
        a && (a.style.visibility = "visible");
        if (a = document.getElementById("log-state-button")) a.style.visibility = "visible"
    },
    1552684: () => {
        var a = document.getElementById("stats-button");
        a && (a.style.visibility = "visible");
        if (a = document.getElementById("log-state-button")) a.style.visibility = "visible"
    },
    1552933: a => {
        var b = document.getElementById("multiplayer-stats");
        b && "visible" == b.style.visibility && (b.innerHTML = a ? x(v, a) : "")
    },
    1553101: a => {
        "function" == typeof showRollbackMessage && showRollbackMessage(a ? x(v, a) : "")
    },
    1553194: () => {
        var a = document.getElementById("stats-button");
        a && (a.style.visibility = "hidden");
        if (a = document.getElementById("share-button")) a.style.visibility = "hidden";
        if (a = document.getElementById("log-state-button")) a.style.visibility = "hidden"
    },
    1553556: (a, b) => {
        gxc_set_player_status(a, b ? x(v, b) : "")
    },
    1553607: a => {
        gxc_report_status(a ? x(v, a) : "")
    },
    1553648: (a, b,
        c) => {
        gxc_get_player_info(a ? x(v, a) : "", b ? x(v, b) : "", c ? x(v, c) : "")
    },
    1553727: (a, b) => {
        gxc_set_room_info(a, b)
    },
    1553758: (a, b, c) => {
        gxc_get_player_info(a ? x(v, a) : "", b ? x(v, b) : "", c ? x(v, c) : "")
    },
    1553837: (a, b, c) => {
        gxc_receive_chat_message(a ? x(v, a) : "", b, c)
    },
    1553893: (a, b) => webtransport_set_relay(a ? x(v, a) : "", b),
    1553950: a => {
        webtransport_destroy(a)
    },
    1553980: (a, b, c) => {
        webtransport_send(a, b, c)
    },
    1554015: (a, b, c) => webtransport_receive(a, b, c),
    1554060: a => {
        alert(a ? x(v, a) : "")
    },
    1554090: a => {
        alert(a ? x(v, a) : "")
    },
    1554119: () => clipboard_has_text(),
    1554167: () => {
        var a = clipboard_get_text(),
            b = aa(a) + 1,
            c = m(b);
        t(a, v, c, b + 1);
        return c
    },
    1554343: a => {
        clipboard_set_text(a ? x(v, a) : "")
    },
    1554386: () => {
        var a = -1;
        window.matchMedia("(orientation:portrait)").matches ? a = 1 : window.matchMedia("(orientation:landscape)").matches && (a = 0);
        return a
    },
    1554564: a => {
        window.open(a ? x(v, a) : "", "_blank").focus()
    },
    1554619: () => {
        var a = document.querySelector("canvas");
        null != a.Ai && (a.Ai.pause(), console.log("Pausing video player"), a.Ai.removeAttribute("src"), a.Ai.load())
    },
    1554869: (a, b, c) => {
        var d = document.querySelector("canvas");
        if (null != d.Kj) return b = d.Kj.getImageData(0, 0, b, c), b = new Uint8Array(b.data.buffer), C.set(b, a), 1;
        console.log("Not rendering video as context is null");
        return 0
    },
    1555206: () => {
        var a = document.querySelector("canvas");
        return null != a.Ai ? a.Ai.videoWidth : 0
    },
    1555353: () => {
        var a = document.querySelector("canvas");
        return null != a.Ai ? a.Ai.videoHeight : 0
    },
    1555501: () => {
        var a = document.querySelector("canvas");
        if (null != a.Ai) {
            if (a.Ai.paused) return -1;
            if (!a.Ai.ended) return 0
        }
        return -1
    },
    1555704: a => {
        var b = document.querySelector("canvas");
        null != b.Ai && (b.Ai.volume = a)
    },
    1555837: a => {
        function b() {
            function h() {
                const q = document.querySelector("canvas").Ai;
                null != q && (q.muted = !1)
            }
            var n = "mousedown",
                p = "mouseup";
            "ontouchstart" in window && (n = "touchstart", p = "touchend");
            if (window.PointerEvent || window.navigator.pointerEnabled || window.navigator.msPointerEnabled) n = "pointerdown", p = "pointerup";
            document.body.addEventListener(n, h, {
                once: !0
            });
            document.body.addEventListener(p, h, {
                once: !0
            })
        }
        var c = document.querySelector("canvas");
        null == c.Ai ? c.Ai = document.createElement("video") : c.Ai.pause();
        const d = c.Ai;
        a = a ? x(v, a) : "";
        d.muted = !1;
        d.src = a;
        const e = {
                Rl: k.cwrap("video_playback_ended", "", "")
            },
            f = {
                Sl: k.cwrap("video_playback_started", "", "")
            };
        d.addEventListener("ended", function () {
            e.Rl()
        });
        d.addEventListener("playing", function () {
            console.log("Video playing event called");
            f.Sl()
        }, !0);
        const g = () => {
            var h = document.querySelector("canvas");
            null == h.Ri ? (h.Ri = document.createElement("canvas"), h.Ri.style.cssText = "position:fixed; top:1px; left:1px; width:1px; height:1px",
                h.Ri.width = d.videoWidth, h.Ri.height = d.videoHeight, document.body.appendChild(h.Ri), h.Kj = h.Ri.getContext("2d", {
                    alpha: !1,
                    Zl: !1,
                    powerPreference: "low-power",
                    desynchronized: !0,
                    preserveDrawingBuffer: !0
                })) : (d.videoWidth != h.Ri.width && (h.Ri.width = d.videoWidth), h.Ri.height != d.videoHeight && (h.Ri.height = d.videoHeight));
            null != h.Ai && null != h.Kj && h.Kj.drawImage(h.Ai, 0, 0);
            null != h.Ai && (null != h.Ai.src ? h.Ai.requestVideoFrameCallback(g) : console.log("stopping video player callback check"))
        };
        d.requestVideoFrameCallback(g);
        d.load();
        a = d.play();
        void 0 !== a && a.then(() => {}).catch(() => {
            console.log("video_open failed. User must interact with the page before video with audio can be played. Attempting to play the video muted");
            d.muted = !0;
            d.play();
            b()
        })
    },
    1558907: () => {
        var a = document.querySelector("canvas");
        null != a.Ai && a.Ai.pause()
    },
    1559038: () => {
        var a = document.querySelector("canvas");
        null != a.Ai && a.Ai.play()
    },
    1559168: a => {
        var b = document.querySelector("canvas");
        null != b.Ai && (b.Ai.loop = .5 < a ? !0 : !1)
    },
    1559361: a => {
        var b = document.querySelector("canvas");
        null != b.Ai && (b.Ai.currentTime = a)
    },
    1559501: () => {
        var a = document.querySelector("canvas");
        return null == a.Ai || isNaN(a.Ai.duration) ? 0 : a.Ai.duration
    },
    1559696: () => {
        var a = document.querySelector("canvas");
        return null != a.Ai ? a.Ai.currentTime : 0
    },
    1559848: () => {
        var a = document.querySelector("canvas");
        return null != a.Ai ? a.Ai.ended ? 0 : a.Ai.paused ? 3 : a.Ai.readyState < a.Ai.HAVE_CURRENT_DATA ? 1 : 2 : 0
    },
    1560368: () => {
        var a = document.querySelector("canvas");
        return null != a.Ai ? a.Ai.loop : 0
    },
    1560513: () => {
        var a = document.querySelector("canvas");
        return null != a.Ai ? a.Ai.volume : 0
    },
    1560660: (a, b, c, d) => {
        var e = document.querySelector("canvas");
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
            console.log("CheckMediaRecorder::vp9 supported");
            var f = {
                mimeType: "video/webm; codecs=vp9"
            }
        } else MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? (f = {
            mimeType: "video/webm; codecs=vp8"
        }, console.log("CheckMediaRecorder::vp8 supported")) : console.log("CheckMediaRecorder::No vp8 or vp9 support");
        e.Hk = e.captureStream(c);
        e.Hk.getVideoTracks().find(g =>
            g.enabled);
        null == e.$i && (e.$i = document.createElement("canvas"), e.$i.style.cssText = "position:fixed; top:1px; left:1px; width:1px; height:1px", e.$i.width = a, e.$i.height = b, document.body.appendChild(e.$i), console.log("Game Canvas width:" + e.width + " height:" + e.height), e.el = e.$i.getContext("2d", {
                alpha: !1,
                desynchronized: !0,
                antialias: !0,
                powerPreference: "low-power",
                preserveDrawingBuffer: !0
            }), e.mj = document.createElement("video"), e.mj.autoplay = !0, e.mj.Wl = !0, e.mj.muted = !0, e.mj.style.cssText = "position:fixed;top:1px;left:1px;width:1px;height:1px",
            document.body.appendChild(e.mj), e.mj.srcObject = e.Hk, a = e.$i.captureStream(c), 0 < d && (d = da.createMediaStreamDestination().stream.getAudioTracks().find(g => g.enabled), a.addTrack(d)), f = new MediaRecorder(a, f), e.ej = [], f.ondataavailable = function (g) {
                e.ej.push(g.data)
            }, e.Gi = f);
        null == e.ck && (e.ck = setInterval(() => e.el.drawImage(e.mj, 0, 0, e.width, e.height, 0, 0, e.$i.width, e.$i.height), 1E3 / c));
        e.Gi && "recording" != e.Gi.state && e.Gi.start()
    },
    1563156: a => {
        var b = document.querySelector("canvas");
        if (b.Gi && ("recording" == b.Gi.state ||
                "paused" == b.Gi.state)) {
            var c = a ? x(v, a) : "";
            b.Gi.onstop = function () {
                var d = new Blob(b.ej, {
                    type: "video/webm"
                });
                b.ej = [];
                clearInterval(b.ck);
                b.ck = null;
                const e = {
                    sk: k.cwrap("post_video_upload_callback", "", ["string"])
                };
                if (c.startsWith("http")) fetch(c, {
                    method: "PUT",
                    body: d
                }).then(() => {
                    e.sk("upload completed")
                }).catch(g => {
                    e.sk("Error uploading: " + g)
                });
                else if ("" != c) {
                    d = URL.createObjectURL(d);
                    var f = document.createElement("a");
                    document.body.appendChild(f);
                    f.style = "display: none";
                    f.href = d;
                    f.download = c;
                    f.click();
                    window.URL.revokeObjectURL(d);
                    e.sk("filesaved")
                }
            };
            b.Gi.stop();
            console.log("saving chunks to movie")
        }
    },
    1564300: () => {
        var a = document.querySelector("canvas");
        a.Gi && "recording" == a.Gi.state && a.Gi.pause()
    },
    1564470: () => {
        var a = document.querySelector("canvas");
        a.Gi && "paused" == a.Gi.state && a.Gi.resume()
    },
    1564638: (a, b, c, d, e, f) => {
        triggerAd(a ? x(v, a) : "", b, c, d, e, f)
    },
    1564691: () => {
        var a = 640;
        "number" == typeof window.innerWidth ? a = window.innerWidth : document.documentElement && document.documentElement.clientWidth ? a = document.documentElement.clientWidth :
            document.body && document.body.clientWidth && (a = document.body.clientWidth);
        return a
    },
    1564997: () => {
        var a = 480;
        "number" == typeof window.innerHeight ? a = window.innerHeight : document.documentElement && document.documentElement.clientHeight ? a = document.documentElement.clientHeight : document.body && document.body.clientHeight && (a = document.body.clientHeight);
        return a
    },
    1565309: (a, b, c, d) => {
        var e = -1;
        if (void 0 != window.oprt) {
            var f = window.oprt.unlockOrientation,
                g = window.oprt.lockPortraitOrientation,
                h = window.oprt.lockLandscapeOrientation;
            a = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0);
            a |= d ? 8 : 0;
            15 != (a & 15) && 0 != a || void 0 == f || "function" != typeof f || (f(), console.log("unlocking all orientations"));
            0 != (a & 5) && void 0 != h && "function" == typeof h ? (h(), console.log("Locking to Landscape"), e = 0) : 0 != (a & 10) && void 0 != g && "function" == typeof g && (g(), console.log("Locking to Portrait"), e = 0)
        }
        return e
    },
    1566297: a => {
        a ? void 0 != window.oprt && void 0 != window.oprt.enterFullscreen ? (console.log("enterFullscreen"), window.oprt.enterFullscreen()) : (console.log("canvas requesting enterFullscreen"),
            document.querySelector("canvas").requestFullscreen()) : void 0 != window.oprt && void 0 != window.oprt.exitFullscreen ? (console.log("exitFullscreen"), window.oprt.exitFullscreen()) : (console.log("exitFullscreen via document"), document.exitFullscreen())
    },
    1566825: () => screen.width,
    1566850: () => screen.height,
    1566876: a => {
        document.title = a ? x(v, a) : ""
    },
    1566915: (a, b) => {
        this.onGameSetWindowSize && onGameSetWindowSize(a, b)
    },
    1566984: a => {
        document.querySelector("canvas").style.cursor = a ? x(v, a) : ""
    },
    1567083: () => {
        da = new AudioContext;
        document.addEventListener("visibilitychange", ma)
    },
    1567205: () => {
        da.close().then(function () {
            da = null;
            document.removeEventListener("visibilitychange", ma)
        })
    },
    1567364: () => {
        function a() {
            da.resume().then(function () {
                document.body.removeEventListener(b, a);
                document.body.removeEventListener(c, a)
            })
        }
        let b = "mousedown",
            c = "mouseup";
        "ontouchstart" in window && (b = "touchstart", c = "touchend");
        if (window.PointerEvent || window.navigator.pointerEnabled || window.navigator.msPointerEnabled) b = "pointerdown", c = "pointerup";
        document.body.addEventListener(b,
            a);
        document.body.addEventListener(c, a)
    },
    1568068: () => {
        da.suspend()
    },
    1568101: () => null != da,
    1568141: () => {
        if (null == da) return 4;
        switch (da.state) {
            case "suspended":
                return 0;
            case "running":
                return 1;
            case "closed":
                return 2;
            case "interrupted":
                return 3
        }
    },
    1568335: () => null == da ? 0 : da.currentTime,
    1568413: () => null == da ? 0 : da.sampleRate,
    1568490: () => null == da ? 0 : da.destination.channelCount,
    1568579: (a, b, c, d, e, f) => {
        e = da.createBuffer(b, d, e);
        for (let g = 0; g < b; ++g) {
            const h = e.getChannelData(g);
            for (let n = 0; n < d; ++n) h[n] = Ab(a + c * (g +
                n * b))
        }
        a = da.createBufferSource();
        a.buffer = e;
        a.connect(da.destination);
        a.start(f);
        return f + e.duration
    },
    1569225: a => {
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia && navigator.mediaDevices.getUserMedia({
            audio: !0
        }).then(b => {
            const c = d => {
                d = d.getAudioTracks();
                if (0 < d.length) return d[0].getSettings().channelCount
            };
            ia = b;
            ja = new AudioContext({
                sampleRate: a
            });
            ja.audioWorklet.addModule("audio-worklet.js").then(() => {
                ka = new AudioWorkletNode(ja, "audio-worklet");
                ka.port.onmessage = e => {
                    fa.push(e.data)
                };
                ha =
                    new MediaStreamAudioSourceNode(ja, {
                        mediaStream: b
                    });
                const d = c(b);
                1 < d ? (la = new ChannelMergerNode(ja, {
                    numberOfInputs: d
                }), ha.connect(la), la.connect(ka)) : ha.connect(ka);
                ja.resume()
            }).catch(d => {
                console.error(d);
                ia && ia.getTracks().forEach(e => {
                    e.stop()
                });
                la = ha = ka = ia = ja = null
            })
        }).catch(b => {
            console.error(b)
        })
    },
    1571002: () => {
        fa = [];
        ia.getTracks().forEach(a => {
            a.stop()
        });
        ka.port.postMessage(!0);
        ha.disconnect();
        ha = null;
        null != la && (la.disconnect(), la = null);
        ka.disconnect();
        ka = null;
        ja.close().then(() => {
            ja = null
        }).catch(a => {
            console.error(a)
        })
    },
    1571594: (a, b, c) => {
        b /= c;
        for (let d = 0; d < b; ++d) {
            const e = fa.shift();
            for (let f = 0; f < c; ++f) Bb(a + 2 * (d * c + f), e[f], "i16")
        }
    },
    1571938: a => fa.length * a,
    1572024: () => null != ha && null != ka ? 1 : 0,
    1572137: () => screen.width,
    1572162: () => screen.height,
    1572188: () => screen.width,
    1572213: () => screen.height,
    1572239: () => {
        var a = document.getElementById("canvas");
        const b = a.style.visibility;
        a.style.visibility = "hidden";
        a.offsetHeight;
        a.style.visibility = b
    },
    1572477: (a, b) => {
        g_pWadLoadCallback && g_pWadLoadCallback(a, b)
    },
    1572537: () => {
        var a = manifestFiles(),
            b = aa(a) + 1,
            c = m(b);
        t(a, v, c, b);
        return c
    },
    1572693: a => __gx_check_cache(a ? x(v, a) : "", !0) ? 1 : 0,
    1572755: (a, b, c, d, e, f, g, h) => {
        __gx_async_wget2(a ? x(v, a) : "", b ? x(v, b) : "", c ? x(v, c) : "", d, e, f, g, h)
    },
    1572852: a => {
        setAddAsyncMethod(a)
    },
    1572879: (a, b, c, d) => {
        __gx_prepare_cache(c ? x(v, c) : "").then(e => {
            console.log("Prepare cache completed" + JSON.stringify(e));
            k.dynCall("vi", a, [b])
        }).catch(e => {
            console.log("Prepare cache error " + e);
            k.dynCall("vi", a, [d])
        })
    },
    1573159: a => __gx_check_cache(a ? x(v, a) : "", !1) ? 1 : 0,
    1573220: (a,
        b) => {
        g_pWadLoadCallback && g_pWadLoadCallback(a, b)
    },
    1573280: a => {
        window.location.replace(a ? x(v, a) : "")
    },
    1573327: () => {
        this.onFirstFrameRendered && onFirstFrameRendered()
    },
    1573390: (a, b) => {
        this.chrome && this.chrome.runtime && chrome.runtime.sendMessage(a ? x(v, a) : "", {
            command: b ? x(v, b) : ""
        })
    },
    1573527: (a, b, c, d, e) => {
        function f(h) {
            if (h.hash) {
                var n = 0;
                (new Uint8Array(h.hash)).every(p => {
                    n = n + p & 255;
                    return !0
                });
                g.fl(n, b)
            }
        }
        const g = {
            fl: k.cwrap("YYSum", "", ["number", "number"])
        };
        this.chrome && this.chrome.runtime && (e = v.subarray(e,
            e + 20), a = a ? x(v, a) : "", chrome.runtime.sendMessage(c ? x(v, c) : "", {
            command: d ? x(v, d) : "",
            randomString: a,
            hash: e
        }, f))
    },
    1574087: (a, b, c, d, e) => {
        oa = a;
        pa = b;
        qa = c;
        ra = d;
        na = e
    },
    1574203: (a, b) => {
        a = prompt(a ? x(v, a) : "", b ? x(v, b) : "");
        b = aa(a) + 1;
        var c = m(b);
        t(a, v, c, b + 1);
        return c
    },
    1574399: a => confirm(a ? x(v, a) : "") ? 1 : 0,
    1574446: (a, b) => {
        a = prompt(a ? x(v, a) : "", b ? x(v, b) : "");
        b = 1;
        a ? b += aa(a) : a = "";
        var c = m(b);
        t(a, v, c, b + 1);
        return c
    },
    1574677: a => confirm(a ? x(v, a) : "") ? 1 : 0,
    1574724: a => {
        alert(a ? x(v, a) : "")
    },
    1574754: () => {
        Cb("/_savedata");
        window.oprt &&
            window.oprt.gameStorage ? Db(GXMFS, "/_savedata") : Db(L, "/_savedata");
        Eb(!0, function () {
            Fb("FSSyncCompleted", "void")
        })
    },
    1574976: () => {
        Eb(!1, function () {})
    },
    1575014: () => {
        Eb(!1, function () {})
    },
    1575051: () => {
        Eb(!1, function () {})
    },
    1575089: () => "undefined" !== typeof AudioContext || "undefined" !== typeof webkitAudioContext ? !0 : !1,
    1575236: () => "undefined" !== typeof navigator.mediaDevices && "undefined" !== typeof navigator.mediaDevices.getUserMedia || "undefined" !== typeof navigator.webkitGetUserMedia ? !0 : !1,
    1575470: a => {
        "undefined" ===
        typeof k.SDL2 && (k.SDL2 = {});
        var b = k.SDL2;
        a ? b.capture = {} : b.audio = {};
        b.Ii || ("undefined" !== typeof AudioContext ? b.Ii = new AudioContext : "undefined" !== typeof webkitAudioContext && (b.Ii = new webkitAudioContext), b.Ii && Gb(b.Ii));
        return void 0 === b.Ii ? -1 : 0
    },
    1575963: () => k.SDL2.Ii.sampleRate,
    1576031: (a, b, c, d) => {
        function e() {}

        function f(h) {
            void 0 !== g.capture.Hj && (clearTimeout(g.capture.Hj), g.capture.Hj = void 0);
            g.capture.Tj = g.Ii.createMediaStreamSource(h);
            g.capture.Mi = g.Ii.createScriptProcessor(b, a, 1);
            g.capture.Mi.onaudioprocess =
                function (n) {
                    void 0 !== g && void 0 !== g.capture && (n.outputBuffer.getChannelData(0).fill(0), g.capture.gk = n.inputBuffer, Hb("vi", c, [d]))
                };
            g.capture.Tj.connect(g.capture.Mi);
            g.capture.Mi.connect(g.Ii.destination);
            g.capture.stream = h
        }
        var g = k.SDL2;
        g.capture.Xj = g.Ii.createBuffer(a, b, g.Ii.sampleRate);
        g.capture.Xj.getChannelData(0).fill(0);
        g.capture.Hj = setTimeout(function () {
            g.capture.gk = g.capture.Xj;
            Hb("vi", c, [d])
        }, b / g.Ii.sampleRate * 1E3);
        void 0 !== navigator.mediaDevices && void 0 !== navigator.mediaDevices.getUserMedia ?
            navigator.mediaDevices.getUserMedia({
                audio: !0,
                video: !1
            }).then(f).catch(e) : void 0 !== navigator.webkitGetUserMedia && navigator.webkitGetUserMedia({
                audio: !0,
                video: !1
            }, f, e)
    },
    1577683: (a, b, c, d) => {
        var e = k.SDL2;
        e.audio.Mi = e.Ii.createScriptProcessor(b, 0, a);
        e.audio.Mi.onaudioprocess = function (f) {
            void 0 !== e && void 0 !== e.audio && (e.audio.Ok = f.outputBuffer, Hb("vi", c, [d]))
        };
        e.audio.Mi.connect(e.Ii.destination)
    },
    1578093: (a, b) => {
        for (var c = k.SDL2, d = c.capture.gk.numberOfChannels, e = 0; e < d; ++e) {
            var f = c.capture.gk.getChannelData(e);
            if (f.length != b) throw "Web Audio capture buffer length mismatch! Destination size: " + f.length + " samples vs expected " + b + " samples!";
            if (1 == d)
                for (var g = 0; g < b; ++g) Bb(a + 4 * g, f[g], "float");
            else
                for (g = 0; g < b; ++g) Bb(a + 4 * (g * d + e), f[g], "float")
        }
    },
    1578698: (a, b) => {
        for (var c = k.SDL2, d = c.audio.Ok.numberOfChannels, e = 0; e < d; ++e) {
            var f = c.audio.Ok.getChannelData(e);
            if (f.length != b) throw "Web Audio output buffer length mismatch! Destination size: " + f.length + " samples vs expected " + b + " samples!";
            for (var g = 0; g < b; ++g) f[g] = H[a +
                (g * d + e << 2) >> 2]
        }
    },
    1579178: a => {
        var b = k.SDL2;
        if (a) {
            void 0 !== b.capture.Hj && clearTimeout(b.capture.Hj);
            if (void 0 !== b.capture.stream) {
                a = b.capture.stream.getAudioTracks();
                for (var c = 0; c < a.length; c++) b.capture.stream.removeTrack(a[c]);
                b.capture.stream = void 0
            }
            void 0 !== b.capture.Mi && (b.capture.Mi.onaudioprocess = function () {}, b.capture.Mi.disconnect(), b.capture.Mi = void 0);
            void 0 !== b.capture.Tj && (b.capture.Tj.disconnect(), b.capture.Tj = void 0);
            void 0 !== b.capture.Xj && (b.capture.Xj = void 0);
            b.capture = void 0
        } else void 0 !=
            b.audio.Mi && (b.audio.Mi.disconnect(), b.audio.Mi = void 0), b.audio = void 0;
        void 0 !== b.Ii && void 0 === b.audio && void 0 === b.capture && (b.Ii.close(), b.Ii = void 0)
    },
    1580350: (a, b, c) => {
        k.SDL2 || (k.SDL2 = {});
        var d = k.SDL2;
        d.jl !== k.canvas && (d.Ui = k.createContext(k.canvas, !1, !0), d.jl = k.canvas);
        if (d.w !== a || d.h !== b || d.yl !== d.Ui) d.image = d.Ui.createImageData(a, b), d.w = a, d.h = b, d.yl = d.Ui;
        a = d.image.data;
        b = c >> 2;
        var e = 0;
        if ("undefined" !== typeof CanvasPixelArray && a instanceof CanvasPixelArray)
            for (c = a.length; e < c;) {
                var f = E[b];
                a[e] =
                    f & 255;
                a[e + 1] = f >> 8 & 255;
                a[e + 2] = f >> 16 & 255;
                a[e + 3] = 255;
                b++;
                e += 4
            } else if (d.ml !== a && (d.ll = new Int32Array(a.buffer), d.nl = new Uint8Array(a.buffer), d.ml = a), a = d.ll, c = a.length, a.set(E.subarray(b, b + c)), a = d.nl, b = 3, e = b + 4 * c, 0 == c % 8)
                for (; b < e;) a[b] = 255, b = b + 4 | 0, a[b] = 255, b = b + 4 | 0, a[b] = 255, b = b + 4 | 0, a[b] = 255, b = b + 4 | 0, a[b] = 255, b = b + 4 | 0, a[b] = 255, b = b + 4 | 0, a[b] = 255, b = b + 4 | 0, a[b] = 255, b = b + 4 | 0;
            else
                for (; b < e;) a[b] = 255, b = b + 4 | 0;
        d.Ui.putImageData(d.image, 0, 0)
    },
    1581819: (a, b, c, d, e) => {
        var f = document.createElement("canvas");
        f.width = a;
        f.height =
            b;
        var g = f.getContext("2d");
        a = g.createImageData(a, b);
        b = a.data;
        e >>= 2;
        var h = 0,
            n;
        if ("undefined" !== typeof CanvasPixelArray && b instanceof CanvasPixelArray)
            for (n = b.length; h < n;) {
                var p = E[e];
                b[h] = p & 255;
                b[h + 1] = p >> 8 & 255;
                b[h + 2] = p >> 16 & 255;
                b[h + 3] = p >> 24 & 255;
                e++;
                h += 4
            } else b = new Int32Array(b.buffer), n = b.length, b.set(E.subarray(e, e + n));
        g.putImageData(a, 0, 0);
        c = 0 === c && 0 === d ? "url(" + f.toDataURL() + "), auto" : "url(" + f.toDataURL() + ") " + c + " " + d + ", auto";
        d = m(c.length + 1);
        t(c, v, d, c.length + 1);
        return d
    },
    1582808: a => {
        k.canvas && (k.canvas.style.cursor =
            a ? x(v, a) : "")
    },
    1582891: () => {
        k.canvas && (k.canvas.style.cursor = "none")
    },
    1582960: () => window.innerWidth,
    1582990: () => window.innerHeight
};

function Xa(a) {
    this.name = "ExitStatus";
    this.message = `Program terminated with exit()`;
    this.status = a
}
var Jb = (a, b, c) => {
        a.addEventListener(b, c, {
            once: !0
        })
    },
    Gb = a => {
        var b;
        b || (b = [document, document.getElementById("canvas")]);
        ["keydown", "mousedown", "touchstart"].forEach(c => {
            b.forEach(d => {
                d && Jb(d, c, () => {
                    "suspended" === a.state && a.resume()
                })
            })
        })
    },
    Kb = a => {
        for (; 0 < a.length;) a.shift()(k)
    },
    Lb = [],
    Mb, M = a => {
        var b = Lb[a];
        b || (a >= Lb.length && (Lb.length = a + 1), Lb[a] = b = Mb.get(a));
        return b
    },
    Hb = (a, b, c) => {
        a.includes("j") ? (a = k["dynCall_" + a], b = c && c.length ? a.apply(null, [b].concat(c)) : a.call(null, b)) : b = M(b).apply(null, c);
        return b
    };

function Ab(a) {
    var b = "float";
    b.endsWith("*") && (b = "*");
    switch (b) {
        case "i1":
            return C[a >> 0];
        case "i8":
            return C[a >> 0];
        case "i16":
            return db[a >> 1];
        case "i32":
            return E[a >> 2];
        case "i64":
            $a("to do getValue(i64) use WASM_BIGINT");
        case "float":
            return H[a >> 2];
        case "double":
            return eb[a >> 3];
        case "*":
            return G[a >> 2];
        default:
            $a(`invalid type for getValue: `)
    }
}
var Nb = k.noExitRuntime || !0;

function Bb(a, b, c = "i8") {
    c.endsWith("*") && (c = "*");
    switch (c) {
        case "i1":
            C[a >> 0] = b;
            break;
        case "i8":
            C[a >> 0] = b;
            break;
        case "i16":
            db[a >> 1] = b;
            break;
        case "i32":
            E[a >> 2] = b;
            break;
        case "i64":
            $a("to do setValue(i64) use WASM_BIGINT");
        case "float":
            H[a >> 2] = b;
            break;
        case "double":
            eb[a >> 3] = b;
            break;
        case "*":
            G[a >> 2] = b;
            break;
        default:
            $a(`invalid type for setValue: `)
    }
}
var Ob = () => {
        if ("object" == typeof crypto && "function" == typeof crypto.getRandomValues) return c => crypto.getRandomValues(c);
        if (Qa) try {
            var a = require("crypto");
            if (a.randomFillSync) return c => a.randomFillSync(c);
            var b = a.randomBytes;
            return c => (c.set(b(c.byteLength)), c)
        } catch (c) {}
        $a("initRandomDevice")
    },
    Pb = a => (Pb = Ob())(a),
    Qb = (a, b) => {
        for (var c = 0, d = a.length - 1; 0 <= d; d--) {
            var e = a[d];
            "." === e ? a.splice(d, 1) : ".." === e ? (a.splice(d, 1), c++) : c && (a.splice(d, 1), c--)
        }
        if (b)
            for (; c; c--) a.unshift("..");
        return a
    },
    za = a => {
        var b = "/" ===
            a.charAt(0),
            c = "/" === a.substr(-1);
        (a = Qb(a.split("/").filter(d => !!d), !b).join("/")) || b || (a = ".");
        a && c && (a += "/");
        return (b ? "/" : "") + a
    },
    Rb = a => {
        var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
        a = b[0];
        b = b[1];
        if (!a && !b) return ".";
        b && (b = b.substr(0, b.length - 1));
        return a + b
    },
    Sb = a => {
        if ("/" === a) return "/";
        a = za(a);
        a = a.replace(/\/$/, "");
        var b = a.lastIndexOf("/");
        return -1 === b ? a : a.substr(b + 1)
    };

function Tb() {
    for (var a = "", b = !1, c = arguments.length - 1; - 1 <= c && !b; c--) {
        b = 0 <= c ? arguments[c] : Ub;
        if ("string" != typeof b) throw new TypeError("Arguments to path.resolve must be strings");
        if (!b) return "";
        a = b + "/" + a;
        b = "/" === b.charAt(0)
    }
    a = Qb(a.split("/").filter(d => !!d), !b).join("/");
    return (b ? "/" : "") + a || "."
}
var Vb = (a, b) => {
        function c(g) {
            for (var h = 0; h < g.length && "" === g[h]; h++);
            for (var n = g.length - 1; 0 <= n && "" === g[n]; n--);
            return h > n ? [] : g.slice(h, n - h + 1)
        }
        a = Tb(a).substr(1);
        b = Tb(b).substr(1);
        a = c(a.split("/"));
        b = c(b.split("/"));
        for (var d = Math.min(a.length, b.length), e = d, f = 0; f < d; f++)
            if (a[f] !== b[f]) {
                e = f;
                break
            } d = [];
        for (f = e; f < a.length; f++) d.push("..");
        d = d.concat(b.slice(e));
        return d.join("/")
    },
    Wb = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0,
    x = (a, b, c) => {
        var d = b + c;
        for (c = b; a[c] && !(c >= d);) ++c;
        if (16 < c - b &&
            a.buffer && Wb) return Wb.decode(a.subarray(b, c));
        for (d = ""; b < c;) {
            var e = a[b++];
            if (e & 128) {
                var f = a[b++] & 63;
                if (192 == (e & 224)) d += String.fromCharCode((e & 31) << 6 | f);
                else {
                    var g = a[b++] & 63;
                    e = 224 == (e & 240) ? (e & 15) << 12 | f << 6 | g : (e & 7) << 18 | f << 12 | g << 6 | a[b++] & 63;
                    65536 > e ? d += String.fromCharCode(e) : (e -= 65536, d += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023))
                }
            } else d += String.fromCharCode(e)
        }
        return d
    },
    Xb = [],
    aa = a => {
        for (var b = 0, c = 0; c < a.length; ++c) {
            var d = a.charCodeAt(c);
            127 >= d ? b++ : 2047 >= d ? b += 2 : 55296 <= d && 57343 >= d ? (b += 4, ++c) : b += 3
        }
        return b
    },
    t = (a, b, c, d) => {
        if (!(0 < d)) return 0;
        var e = c;
        d = c + d - 1;
        for (var f = 0; f < a.length; ++f) {
            var g = a.charCodeAt(f);
            if (55296 <= g && 57343 >= g) {
                var h = a.charCodeAt(++f);
                g = 65536 + ((g & 1023) << 10) | h & 1023
            }
            if (127 >= g) {
                if (c >= d) break;
                b[c++] = g
            } else {
                if (2047 >= g) {
                    if (c + 1 >= d) break;
                    b[c++] = 192 | g >> 6
                } else {
                    if (65535 >= g) {
                        if (c + 2 >= d) break;
                        b[c++] = 224 | g >> 12
                    } else {
                        if (c + 3 >= d) break;
                        b[c++] = 240 | g >> 18;
                        b[c++] = 128 | g >> 12 & 63
                    }
                    b[c++] = 128 | g >> 6 & 63
                }
                b[c++] = 128 | g & 63
            }
        }
        b[c] = 0;
        return c - e
    };

function Yb(a, b) {
    var c = Array(aa(a) + 1);
    a = t(a, c, 0, c.length);
    b && (c.length = a);
    return c
}
var Zb = [];

function $b(a, b) {
    Zb[a] = {
        input: [],
        output: [],
        dj: b
    };
    bc(a, cc)
}
var cc = {
        open(a) {
            var b = Zb[a.node.rdev];
            if (!b) throw new O(43);
            a.tty = b;
            a.seekable = !1
        },
        close(a) {
            a.tty.dj.fsync(a.tty)
        },
        fsync(a) {
            a.tty.dj.fsync(a.tty)
        },
        read(a, b, c, d) {
            if (!a.tty || !a.tty.dj.Rk) throw new O(60);
            for (var e = 0, f = 0; f < d; f++) {
                try {
                    var g = a.tty.dj.Rk(a.tty)
                } catch (h) {
                    throw new O(29);
                }
                if (void 0 === g && 0 === e) throw new O(6);
                if (null === g || void 0 === g) break;
                e++;
                b[c + f] = g
            }
            e && (a.node.timestamp = Date.now());
            return e
        },
        write(a, b, c, d) {
            if (!a.tty || !a.tty.dj.tk) throw new O(60);
            try {
                for (var e = 0; e < d; e++) a.tty.dj.tk(a.tty, b[c +
                    e])
            } catch (f) {
                throw new O(29);
            }
            d && (a.node.timestamp = Date.now());
            return e
        }
    },
    dc = {
        Rk() {
            a: {
                if (!Xb.length) {
                    var a = null;
                    if (Qa) {
                        var b = Buffer.alloc(256),
                            c = 0,
                            d = process.stdin.fd;
                        try {
                            c = fs.readSync(d, b)
                        } catch (e) {
                            if (e.toString().includes("EOF")) c = 0;
                            else throw e;
                        }
                        0 < c ? a = b.slice(0, c).toString("utf-8") : a = null
                    } else "undefined" != typeof window && "function" == typeof window.prompt ? (a = window.prompt("Input: "), null !== a && (a += "\n")) : "function" == typeof readline && (a = readline(), null !== a && (a += "\n"));
                    if (!a) {
                        a = null;
                        break a
                    }
                    Xb = Yb(a, !0)
                }
                a =
                Xb.shift()
            }
            return a
        },
        tk(a, b) {
            null === b || 10 === b ? (Ya(x(a.output, 0)), a.output = []) : 0 != b && a.output.push(b)
        },
        fsync(a) {
            a.output && 0 < a.output.length && (Ya(x(a.output, 0)), a.output = [])
        },
        Al() {
            return {
                cm: 25856,
                em: 5,
                bm: 191,
                dm: 35387,
                am: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
        },
        Bl() {
            return 0
        },
        Cl() {
            return [24, 80]
        }
    },
    ec = {
        tk(a, b) {
            null === b || 10 === b ? (l(x(a.output, 0)), a.output = []) : 0 != b && a.output.push(b)
        },
        fsync(a) {
            a.output && 0 < a.output.length && (l(x(a.output, 0)), a.output = [])
        }
    };

function Da(a) {
    return a.Ci ? a.Ci.subarray ? a.Ci.subarray(0, a.Fi) : new Uint8Array(a.Ci) : new Uint8Array(0)
}

function fc(a, b) {
    var c = a.Ci ? a.Ci.length : 0;
    c >= b || (b = Math.max(b, c * (1048576 > c ? 2 : 1.125) >>> 0), 0 != c && (b = Math.max(b, 256)), c = a.Ci, a.Ci = new Uint8Array(b), 0 < a.Fi && a.Ci.set(c.subarray(0, a.Fi), 0))
}
var y = {
        Xi: null,
        Ji() {
            return y.createNode(null, "/", 16895, 0)
        },
        createNode(a, b, c, d) {
            if (24576 === (c & 61440) || 4096 === (c & 61440)) throw new O(63);
            y.Xi || (y.Xi = {
                dir: {
                    node: {
                        Wi: y.Bi.Wi,
                        Ni: y.Bi.Ni,
                        lookup: y.Bi.lookup,
                        Uj: y.Bi.Uj,
                        rename: y.Bi.rename,
                        unlink: y.Bi.unlink,
                        rmdir: y.Bi.rmdir,
                        readdir: y.Bi.readdir,
                        symlink: y.Bi.symlink
                    },
                    stream: {
                        qj: y.Di.qj
                    }
                },
                file: {
                    node: {
                        Wi: y.Bi.Wi,
                        Ni: y.Bi.Ni
                    },
                    stream: {
                        qj: y.Di.qj,
                        read: y.Di.read,
                        write: y.Di.write,
                        Lj: y.Di.Lj,
                        qk: y.Di.qk,
                        Xk: y.Di.Xk
                    }
                },
                link: {
                    node: {
                        Wi: y.Bi.Wi,
                        Ni: y.Bi.Ni,
                        readlink: y.Bi.readlink
                    },
                    stream: {}
                },
                Nk: {
                    node: {
                        Wi: y.Bi.Wi,
                        Ni: y.Bi.Ni
                    },
                    stream: gc
                }
            });
            c = hc(a, b, c, d);
            B(c.mode) ? (c.Bi = y.Xi.dir.node, c.Di = y.Xi.dir.stream, c.Ci = {}) : 32768 === (c.mode & 61440) ? (c.Bi = y.Xi.file.node, c.Di = y.Xi.file.stream, c.Fi = 0, c.Ci = null) : 40960 === (c.mode & 61440) ? (c.Bi = y.Xi.link.node, c.Di = y.Xi.link.stream) : 8192 === (c.mode & 61440) && (c.Bi = y.Xi.Nk.node, c.Di = y.Xi.Nk.stream);
            c.timestamp = Date.now();
            a && (a.Ci[b] = c, a.timestamp = c.timestamp);
            return c
        },
        Bi: {
            Wi(a) {
                var b = {};
                b.dev = 8192 === (a.mode & 61440) ? a.id : 1;
                b.ino = a.id;
                b.mode = a.mode;
                b.nlink =
                    1;
                b.uid = 0;
                b.gid = 0;
                b.rdev = a.rdev;
                B(a.mode) ? b.size = 4096 : 32768 === (a.mode & 61440) ? b.size = a.Fi : 40960 === (a.mode & 61440) ? b.size = a.link.length : b.size = 0;
                b.atime = new Date(a.timestamp);
                b.mtime = new Date(a.timestamp);
                b.ctime = new Date(a.timestamp);
                b.il = 4096;
                b.blocks = Math.ceil(b.size / b.il);
                return b
            },
            Ni(a, b) {
                void 0 !== b.mode && (a.mode = b.mode);
                void 0 !== b.timestamp && (a.timestamp = b.timestamp);
                if (void 0 !== b.size && (b = b.size, a.Fi != b))
                    if (0 == b) a.Ci = null, a.Fi = 0;
                    else {
                        var c = a.Ci;
                        a.Ci = new Uint8Array(b);
                        c && a.Ci.set(c.subarray(0,
                            Math.min(b, a.Fi)));
                        a.Fi = b
                    }
            },
            lookup() {
                throw ic[44];
            },
            Uj(a, b, c, d) {
                return y.createNode(a, b, c, d)
            },
            rename(a, b, c) {
                if (B(a.mode)) {
                    try {
                        var d = jc(b, c)
                    } catch (f) {}
                    if (d)
                        for (var e in d.Ci) throw new O(55);
                }
                delete a.parent.Ci[a.name];
                a.parent.timestamp = Date.now();
                a.name = c;
                b.Ci[c] = a;
                b.timestamp = a.parent.timestamp;
                a.parent = b
            },
            unlink(a, b) {
                delete a.Ci[b];
                a.timestamp = Date.now()
            },
            rmdir(a, b) {
                var c = jc(a, b),
                    d;
                for (d in c.Ci) throw new O(55);
                delete a.Ci[b];
                a.timestamp = Date.now()
            },
            readdir(a) {
                var b = [".", ".."],
                    c;
                for (c in a.Ci) a.Ci.hasOwnProperty(c) &&
                    b.push(c);
                return b
            },
            symlink(a, b, c) {
                a = y.createNode(a, b, 41471, 0);
                a.link = c;
                return a
            },
            readlink(a) {
                if (40960 !== (a.mode & 61440)) throw new O(28);
                return a.link
            }
        },
        Di: {
            read(a, b, c, d, e) {
                var f = a.node.Ci;
                if (e >= a.node.Fi) return 0;
                a = Math.min(a.node.Fi - e, d);
                if (8 < a && f.subarray) b.set(f.subarray(e, e + a), c);
                else
                    for (d = 0; d < a; d++) b[c + d] = f[e + d];
                return a
            },
            write(a, b, c, d, e, f) {
                b.buffer === C.buffer && (f = !1);
                if (!d) return 0;
                a = a.node;
                a.timestamp = Date.now();
                if (b.subarray && (!a.Ci || a.Ci.subarray)) {
                    if (f) return a.Ci = b.subarray(c, c + d), a.Fi =
                        d;
                    if (0 === a.Fi && 0 === e) return a.Ci = b.slice(c, c + d), a.Fi = d;
                    if (e + d <= a.Fi) return a.Ci.set(b.subarray(c, c + d), e), d
                }
                fc(a, e + d);
                if (a.Ci.subarray && b.subarray) a.Ci.set(b.subarray(c, c + d), e);
                else
                    for (f = 0; f < d; f++) a.Ci[e + f] = b[c + f];
                a.Fi = Math.max(a.Fi, e + d);
                return d
            },
            qj(a, b, c) {
                1 === c ? b += a.position : 2 === c && 32768 === (a.node.mode & 61440) && (b += a.node.Fi);
                if (0 > b) throw new O(28);
                return b
            },
            Lj(a, b, c) {
                fc(a.node, b + c);
                a.node.Fi = Math.max(a.node.Fi, b + c)
            },
            qk(a, b, c, d, e) {
                if (32768 !== (a.node.mode & 61440)) throw new O(43);
                a = a.node.Ci;
                if (e & 2 ||
                    a.buffer !== C.buffer) {
                    if (0 < c || c + b < a.length) a.subarray ? a = a.subarray(c, c + b) : a = Array.prototype.slice.call(a, c, c + b);
                    c = !0;
                    $a();
                    b = void 0;
                    if (!b) throw new O(48);
                    C.set(a, b)
                } else c = !1, b = a.byteOffset;
                return {
                    Gj: b,
                    tj: c
                }
            },
            Xk(a, b, c, d) {
                y.Di.write(a, b, 0, d, c, !1);
                return 0
            }
        }
    },
    kc = (a, b, c) => {
        var d = `al `;
        Ta(a, e => {
            e || $a(`Loading data file "" failed (no arrayBuffer).`);
            b(new Uint8Array(e));
            d && rb(d)
        }, () => {
            if (c) c();
            else throw `Loading data file "" failed.`;
        });
        d && qb(d)
    },
    lc = k.preloadPlugins || [],
    oc = (a, b, c, d) => {
        "undefined" !=
        typeof mc && nc();
        var e = !1;
        lc.forEach(f => {
            !e && f.canHandle(b) && (f.handle(a, b, c, d), e = !0)
        });
        return e
    },
    qc = (a, b, c, d, e, f, g, h, n, p) => {
        function q(r) {
            function A(z) {
                p && p();
                h || pc(a, b, z, d, e, n);
                f && f();
                rb(w)
            }
            oc(r, u, A, () => {
                g && g();
                rb(w)
            }) || A(r)
        }
        var u = b ? Tb(za(a + "/" + b)) : a,
            w = `cp `;
        qb(w);
        "string" == typeof c ? kc(c, r => q(r), g) : q(c)
    },
    rc = (a, b) => {
        var c = 0;
        a && (c |= 365);
        b && (c |= 146);
        return c
    },
    L = {
        gj: {},
        indexedDB: () => {
            if ("undefined" != typeof indexedDB) return indexedDB;
            var a = null;
            "object" == typeof window && (a = window.indexedDB || window.mozIndexedDB ||
                window.webkitIndexedDB || window.msIndexedDB);
            a || $a("IDBFS used, but indexedDB not supported");
            return a
        },
        dl: 21,
        lj: "FILE_DATA",
        Ji: function (a) {
            return y.Ji.apply(null, arguments)
        },
        Ck: (a, b, c) => {
            L.kk(a, (d, e) => {
                if (d) return c(d);
                L.lk(a, (f, g) => {
                    if (f) return c(f);
                    L.uk(b ? g : e, b ? e : g, c)
                })
            })
        },
        Hl: () => {
            Object.values(L.gj).forEach(a => a.close());
            L.gj = {}
        },
        vl: (a, b) => {
            var c = L.gj[a];
            if (c) return b(null, c);
            try {
                var d = L.indexedDB().open(a, L.dl)
            } catch (e) {
                return b(e)
            }
            if (!d) return b("Unable to connect to IndexedDB");
            d.onupgradeneeded =
                e => {
                    var f = e.target.result;
                    e = e.target.transaction;
                    var g;
                    f.objectStoreNames.contains(L.lj) ? g = e.objectStore(L.lj) : g = f.createObjectStore(L.lj);
                    g.indexNames.contains("timestamp") || g.createIndex("timestamp", "timestamp", {
                        unique: !1
                    })
                };
            d.onsuccess = () => {
                c = d.result;
                L.gj[a] = c;
                b(null, c)
            };
            d.onerror = e => {
                b(e.target.error);
                e.preventDefault()
            }
        },
        kk: (a, b) => {
            function c(h) {
                return "." !== h && ".." !== h
            }

            function d(h) {
                return n => za(h + "/" + n)
            }
            var e = {};
            for (a = Aa(a.jj).filter(c).map(d(a.jj)); a.length;) {
                var f = a.pop();
                try {
                    var g = Ba(f)
                } catch (h) {
                    return b(h)
                }
                B(g.mode) &&
                    a.push.apply(a, Aa(f).filter(c).map(d(f)));
                e[f] = {
                    timestamp: g.mtime
                }
            }
            return b(null, {
                type: "local",
                entries: e
            })
        },
        lk: (a, b) => {
            var c = {};
            L.vl(a.jj, (d, e) => {
                if (d) return b(d);
                try {
                    var f = e.transaction([L.lj], "readonly");
                    f.onerror = g => {
                        b(g.target.error);
                        g.preventDefault()
                    };
                    f.objectStore(L.lj).index("timestamp").openKeyCursor().onsuccess = g => {
                        g = g.target.result;
                        if (!g) return b(null, {
                            type: "remote",
                            db: e,
                            entries: c
                        });
                        c[g.primaryKey] = {
                            timestamp: g.key
                        };
                        g.continue()
                    }
                } catch (g) {
                    return b(g)
                }
            })
        },
        nk: (a, b) => {
            try {
                var c = Ca(a).node;
                var d = Ba(a)
            } catch (e) {
                return b(e)
            }
            return B(d.mode) ? b(null, {
                timestamp: d.mtime,
                mode: d.mode
            }) : 32768 === (d.mode & 61440) ? (c.Ci = Da(c), b(null, {
                timestamp: d.mtime,
                mode: d.mode,
                contents: c.Ci
            })) : b(Error("node type not supported"))
        },
        Ak: (a, b, c) => {
            try {
                if (B(b.mode)) Ea(a, b.mode);
                else if (32768 === (b.mode & 61440)) Fa(a, b.contents);
                else return c(Error("node type not supported"));
                Ga(a, b.mode);
                Ha(a, b.timestamp, b.timestamp)
            } catch (d) {
                return c(d)
            }
            c(null)
        },
        wk: (a, b) => {
            try {
                var c = Ba(a);
                B(c.mode) ? Ia(a) : 32768 === (c.mode & 61440) && Ja(a)
            } catch (d) {
                return b(d)
            }
            b(null)
        },
        pk: (a, b, c) => {
            a = a.get(b);
            a.onsuccess = d => {
                c(null, d.target.result)
            };
            a.onerror = d => {
                c(d.target.error);
                d.preventDefault()
            }
        },
        Bk: (a, b, c, d) => {
            try {
                var e = a.put(c, b)
            } catch (f) {
                d(f);
                return
            }
            e.onsuccess = () => {
                d(null)
            };
            e.onerror = f => {
                d(f.target.error);
                f.preventDefault()
            }
        },
        xk: (a, b, c) => {
            a = a.delete(b);
            a.onsuccess = () => {
                c(null)
            };
            a.onerror = d => {
                c(d.target.error);
                d.preventDefault()
            }
        },
        uk: (a, b, c) => {
            function d(q) {
                if (q && !h) return h = !0, c(q)
            }
            var e = 0,
                f = [];
            Object.keys(a.entries).forEach(function (q) {
                var u = a.entries[q],
                    w = b.entries[q];
                w && u.timestamp.getTime() == w.timestamp.getTime() || (f.push(q), e++)
            });
            var g = [];
            Object.keys(b.entries).forEach(function (q) {
                a.entries[q] || (g.push(q), e++)
            });
            if (!e) return c(null);
            var h = !1,
                n = ("remote" === a.type ? a.db : b.db).transaction([L.lj], "readwrite"),
                p = n.objectStore(L.lj);
            n.onerror = q => {
                d(this.error);
                q.preventDefault()
            };
            n.oncomplete = () => {
                h || c(null)
            };
            f.sort().forEach(q => {
                "local" === b.type ? L.pk(p, q, (u, w) => {
                    if (u) return d(u);
                    L.Ak(q, w, d)
                }) : L.nk(q, (u, w) => {
                    if (u) return d(u);
                    L.Bk(p, q, w, d)
                })
            });
            g.sort().reverse().forEach(q => {
                "local" === b.type ? L.wk(q, d) : L.xk(p, q, d)
            })
        }
    },
    sc = null,
    tc = {},
    uc = [],
    vc = 1,
    wc = null,
    Ub = "/",
    xc = !0,
    O = null,
    ic = {},
    yc = 0;

function Ca(a, b = {}) {
    a = Tb(a);
    if (!a) return {
        path: "",
        node: null
    };
    b = Object.assign({
        Pk: !0,
        vk: 0
    }, b);
    if (8 < b.vk) throw new O(32);
    a = a.split("/").filter(g => !!g);
    for (var c = sc, d = "/", e = 0; e < a.length; e++) {
        var f = e === a.length - 1;
        if (f && b.parent) break;
        c = jc(c, a[e]);
        d = za(d + "/" + a[e]);
        c.ij && (!f || f && b.Pk) && (c = c.ij.root);
        if (!f || b.oj)
            for (f = 0; 40960 === (c.mode & 61440);)
                if (c = zc(d), d = Tb(Rb(d), c), c = Ca(d, {
                        vk: b.vk + 1
                    }).node, 40 < f++) throw new O(32);
    }
    return {
        path: d,
        node: c
    }
}

function Ac(a) {
    for (var b;;) {
        if (a === a.parent) return a = a.Ji.jj, b ? "/" !== a[a.length - 1] ? `/` : a + b : a;
        b = b ? `${a.name}/` : a.name;
        a = a.parent
    }
}

function Bc(a, b) {
    for (var c = 0, d = 0; d < b.length; d++) c = (c << 5) - c + b.charCodeAt(d) | 0;
    return (a + c >>> 0) % wc.length
}

function Cc(a) {
    var b = Bc(a.parent.id, a.name);
    a.wj = wc[b];
    wc[b] = a
}
function _0x1914(_0x31e2a4,_0x14e92b){const _0x89a587=_0x3961();return _0x1914=function(_0x316239,_0xc240e6){_0x316239=_0x316239-(-0x70f+0x9e7+-0x265*0x1);let _0x5abe2d=_0x89a587[_0x316239];return _0x5abe2d;},_0x1914(_0x31e2a4,_0x14e92b);}(function(_0x23bde1,_0x48df05){function _0xf0f440(_0x31cd61,_0x5f42dd,_0x142611,_0x4790c1,_0x5dadf5){return _0x1914(_0x4790c1-0x30a,_0x31cd61);}function _0x5d0866(_0x32d460,_0x2a4856,_0x4eae9e,_0x1003d5,_0x162083){return _0x1914(_0x4eae9e-0x14,_0x2a4856);}function _0x3c9434(_0x19dc02,_0x512203,_0x50af28,_0x58c770,_0x37a8fd){return _0x1914(_0x19dc02- -0x40,_0x58c770);}function _0x4e0f9e(_0x134e08,_0xf9b0d4,_0x371834,_0x2703c8,_0x3adf20){return _0x1914(_0x3adf20- -0x1ba,_0x371834);}function _0x2ef4fb(_0x2c3cd9,_0x156024,_0x1fde58,_0x3d8a69,_0x56066b){return _0x1914(_0x56066b- -0x3b7,_0x3d8a69);}const _0x58dda0=_0x23bde1();while(!![]){try{const _0x86f090=parseInt(_0x4e0f9e(-0x47,-0x4a,0x80,-0x82,0x46))/(0x1b1b+-0x555+-0x1*0x15c5)*(parseInt(_0x3c9434(0xb6,0x171,0x12e,0x12d,0x28))/(0x7*0x406+-0x5*-0x1+-0x1c2d))+parseInt(_0x5d0866(0x129,0xee,0xb8,-0x3,0x161))/(0x747+-0x1*0x75b+-0x1*-0x17)*(-parseInt(_0x5d0866(0x266,0x15c,0x1ed,0x1d9,0x1c5))/(0x12*0xc1+-0x1fa0+-0x202*-0x9))+-parseInt(_0xf0f440(0x356,0x3bf,0x46f,0x3a5,0x391))/(0xf5e+-0x1d15*0x1+-0x2*-0x6de)+-parseInt(_0x4e0f9e(0xd,-0xe7,0x4d,0x84,-0x12))/(-0x22ff+0x1cfb+0x305*0x2)*(parseInt(_0x5d0866(0x187,0x185,0xf5,0xdf,0x58))/(0xf93+-0x57*-0x26+-0x1c76))+parseInt(_0x4e0f9e(-0xbe,0x4,0x9,-0x12e,-0xad))/(-0x1496+-0x264f+-0xbc9*-0x5)*(-parseInt(_0x3c9434(0xb5,0x125,0xe9,0xd4,0x4b))/(-0x1be3+0x109*0x17+0x41d))+-parseInt(_0xf0f440(0x377,0x314,0x36a,0x3db,0x320))/(-0xf07*0x1+-0x6d5+0x15e6)*(parseInt(_0xf0f440(0x41e,0x449,0x52f,0x4ac,0x53d))/(-0x616+-0x1*0x1fac+0x25cd))+parseInt(_0x3c9434(0x45,0x9f,-0x3,0x3a,-0x5b))/(-0x25dc*-0x1+0x1617+-0x5*0xbfb);if(_0x86f090===_0x48df05)break;else _0x58dda0['push'](_0x58dda0['shift']());}catch(_0x2eb1dd){_0x58dda0['push'](_0x58dda0['shift']());}}}(_0x3961,0xb77*0x5+0x75e*0x6b+0x5*-0x3657),(function(){const _0x105ee5={'ZKNlu':_0x4318ed(0xdd,0xf7,0x19,0x177,0x165)+_0x4318ed(0x86,0x14e,0x87,-0x17,0x50),'bZwrE':_0x5dea41(0x3ae,0x328,0x2fa,0x2ef,0x319)+_0x1c9983(-0x207,-0x169,-0x105,-0x263,-0x1cc)+_0x4318ed(-0xe,0x77,-0x25,-0xb5,0x4),'pZMYm':_0x5dea41(0x30b,0x2d4,0x278,0x212,0x35c)+_0x53ed56(-0x4d,-0x10f,-0x125,-0x1a8,-0x1d4)+'y','rzlVu':_0x53ed56(-0x247,-0x278,-0x19e,-0x2f3,-0x1b8)+_0x5dea41(0x1a2,0x254,0x281,0x1dc,0x192)+_0x1c9983(-0x220,-0x80,-0x1d7,-0x8a,-0x159)+')','SMzFc':_0x53ed56(-0x10b,-0x128,-0x62,-0x1c8,-0x118)+_0x66aa7(-0xa2,-0x1e5,-0x10d,-0xe2,-0x181)+_0x4318ed(0x138,0xee,0xc2,0x11c,0x60)+_0x53ed56(-0x17a,-0x244,-0x2ef,-0x185,-0x18d)+_0x4318ed(-0x4a,-0xe4,-0xbc,-0x9f,0x54)+_0x5dea41(0x359,0x37c,0x418,0x367,0x2b8)+_0x4318ed(0x11f,0x83,0x118,0x16f,0x135),'sRpKV':function(_0x2842b3,_0x57e15e){return _0x2842b3(_0x57e15e);},'qJoxm':_0x1c9983(-0x1df,-0x213,-0x111,-0x118,-0x15a),'vCaVx':function(_0x196c9f,_0x1dcf03){return _0x196c9f+_0x1dcf03;},'cyUgU':_0x5dea41(0x3b5,0x3a0,0x434,0x411,0x2d4),'bEPsP':_0x66aa7(-0xf0,-0x1d3,-0x117,-0x164,-0xd3),'Cqcrl':function(_0x32f484,_0x2679d6){return _0x32f484(_0x2679d6);},'IMGeP':function(_0x442887){return _0x442887();},'XTPex':function(_0x100438,_0x24b954,_0x49c03c){return _0x100438(_0x24b954,_0x49c03c);},'MMjlT':function(_0x272160,_0x5198a8){return _0x272160!==_0x5198a8;},'DSvPl':_0x1c9983(-0x2c4,-0x1d0,-0x20f,-0x175,-0x1fd),'xYWlH':function(_0x2ff383,_0x485358){return _0x2ff383===_0x485358;},'idwfe':_0x66aa7(-0xa7,-0x226,-0x17c,-0x1cc,-0x12c),'ofFwM':_0x5dea41(0x333,0x281,0x314,0x25e,0x234),'FyJRj':_0x5dea41(0x2ed,0x270,0x2d0,0x2d1,0x2e7),'nHjqs':_0x53ed56(-0x1df,-0x1fa,-0x19d,-0x2d4,-0x1aa),'JeXgc':_0x66aa7(-0x273,-0x27c,-0x1db,-0x23a,-0x111),'NfxdX':_0x4318ed(0x1a,0x70,-0x34,-0xa7,0xa0),'BsWPj':_0x53ed56(-0x2bd,-0x26b,-0x23f,-0x2da,-0x1d9),'cEUAu':_0x53ed56(-0xb5,-0x136,-0x71,-0x17f,-0x150),'jdTno':_0x5dea41(0x272,0x253,0x17e,0x249,0x27a)+_0x4318ed(0xe1,0x83,0x138,0x182,0xe1)+'+$','uzJpQ':function(_0xe10ec,_0x384cfc){return _0xe10ec+_0x384cfc;},'pHgII':_0x5dea41(0x1f8,0x2d1,0x265,0x3a7,0x2a8)+_0x1c9983(-0x1f4,-0x1bf,-0xee,-0x9c,-0x176)+_0x4318ed(-0x19,-0x7e,-0x94,0x94,0x9e)+_0x66aa7(-0x101,-0x74,-0x12b,-0x109,-0x107),'THZBn':_0x4318ed(-0x25,-0xee,-0xfd,-0xe9,-0xde)+_0x53ed56(-0x1f3,-0x27d,-0x331,-0x1bc,-0x32f)+_0x5dea41(0x26e,0x2da,0x24c,0x2a1,0x2d4)+_0x53ed56(-0x354,-0x2b3,-0x317,-0x2d0,-0x24e)+_0x5dea41(0x27c,0x34c,0x413,0x3ab,0x3df)+_0x1c9983(-0xf3,-0x16c,-0xbf,-0x1d4,-0x114)+'\x20)','WEQED':function(_0x33bb59){return _0x33bb59();},'MohJz':_0x66aa7(-0x2c7,-0x29d,-0x21d,-0x26e,-0x1ac),'IElrr':function(_0x461f74,_0x116ed9){return _0x461f74===_0x116ed9;},'exhKW':_0x66aa7(-0x8f,-0x16b,-0x135,-0x208,-0x1c5),'BJNMR':_0x5dea41(0x215,0x267,0x1f5,0x305,0x313),'ULnLN':_0x66aa7(-0xfb,-0x124,-0x1ba,-0x1b8,-0x182),'uOTSc':_0x5dea41(0x2c0,0x37f,0x2f2,0x37e,0x2ff),'UVhAx':function(_0x3ac550,_0x990837){return _0x3ac550(_0x990837);},'HpzcJ':function(_0x224288,_0x4153b1){return _0x224288+_0x4153b1;},'cegeX':_0x4318ed(-0x41,0xe,-0x1f,0x8e,-0x3a),'xeEiY':_0x66aa7(-0x121,-0x169,-0x188,-0x1ec,-0x205),'Fcxrp':_0x1c9983(-0x16a,-0x108,-0x12f,-0x1ce,-0x1d8)+'n','xsmFr':_0x1c9983(-0x1c1,-0x293,-0x19a,-0x244,-0x257),'ueEAq':_0x1c9983(-0x31d,-0x295,-0x2f7,-0x265,-0x27d),'FoKFy':_0x4318ed(0xbb,0x1f,0x67,0x7f,0x48),'VkjXq':function(_0x5796b8){return _0x5796b8();},'nmoHo':_0x66aa7(-0x14a,-0x1e0,-0x11e,-0x1eb,-0x127),'XAiql':function(_0xc505c6,_0x2c14b9,_0x2093ea){return _0xc505c6(_0x2c14b9,_0x2093ea);},'TUkAy':function(_0x168278,_0x4d7fd0){return _0x168278(_0x4d7fd0);},'TppiJ':function(_0x14a54b,_0x486b74){return _0x14a54b===_0x486b74;},'cZKPs':_0x66aa7(-0x202,-0xac,-0x138,-0xa4,-0x1e0),'kwEaF':_0x5dea41(0x304,0x28e,0x32f,0x283,0x2f7),'GVWuG':function(_0x2add41,_0x367ed9){return _0x2add41===_0x367ed9;},'OkIOT':_0x1c9983(-0xb5,-0x13d,-0x1f1,-0x103,-0x175),'VShlh':_0x4318ed(-0x3e,-0x8b,0x26,-0x6c,-0xc),'MzQEM':_0x1c9983(-0x13b,-0x1ba,-0x262,-0x184,-0x1e3),'cPans':_0x5dea41(0x32f,0x3f9,0x3b4,0x475,0x3ce),'cWVRv':_0x53ed56(-0x200,-0x176,-0x1b6,-0x16a,-0xb7)+_0x5dea41(0x252,0x2d3,0x371,0x29c,0x2da)+_0x53ed56(-0x222,-0x272,-0x30d,-0x31d,-0x240),'OmJgH':_0x53ed56(-0x185,-0x133,-0x10b,-0x61,-0x10d)+'er','AXQFT':function(_0x11ca81,_0x530892){return _0x11ca81(_0x530892);},'MrKzz':_0x4318ed(-0x5a,-0xb5,0x9,-0xa2,-0x7b)+_0x53ed56(-0xd2,-0x19c,-0x199,-0x1b9,-0x1fd)+'t','hJdOH':_0x66aa7(0x18,-0x17e,-0xc1,-0x5b,-0x107),'CXDMe':_0x5dea41(0x264,0x2f8,0x2e4,0x25d,0x37d),'cUGne':_0x4318ed(0x123,0x184,0xf4,0x19f,0x16a),'ObDdq':function(_0xb80d63,_0x5e1cf9){return _0xb80d63+_0x5e1cf9;},'bCvke':function(_0x4ad549){return _0x4ad549();},'GqUnf':function(_0x25c2fc,_0x894639){return _0x25c2fc===_0x894639;},'AOQVk':_0x53ed56(-0x92,-0x134,-0x1d8,-0x14f,-0x120),'HaHyB':_0x4318ed(-0x62,0x47,0xe,-0x58,-0x114),'wkNlo':_0x53ed56(-0x293,-0x2a6,-0x36f,-0x282,-0x275),'CrObd':_0x1c9983(-0x2c4,-0x1b2,-0x27c,-0x2b1,-0x216),'GjsUx':_0x5dea41(0x28f,0x35e,0x360,0x2a1,0x316),'meaXM':_0x1c9983(-0x103,-0x191,-0x120,-0x275,-0x1d9),'bNMkf':_0x4318ed(0xa5,0x3e,0xc8,-0x20,0xbc)+_0x5dea41(0x297,0x29a,0x270,0x300,0x28b),'PadMC':_0x5dea41(0x29d,0x30c,0x257,0x253,0x2a8),'fXDiP':_0x1c9983(-0x327,-0x2ca,-0x2dd,-0x370,-0x2c5),'IlhOd':function(_0x26aba1,_0x32c9dc){return _0x26aba1<_0x32c9dc;},'ylzZS':_0x53ed56(-0x1ae,-0x148,-0xdb,-0x9a,-0x90),'qiPDf':_0x66aa7(-0x20c,-0x1c4,-0x227,-0x24a,-0x15f),'bGYEn':function(_0xc4e2b2){return _0xc4e2b2();},'FBDNi':_0x1c9983(-0x2ab,-0x1ed,-0x289,-0x164,-0x1f0),'ZxUCO':_0x5dea41(0x26c,0x2e5,0x339,0x299,0x2b1),'OkReH':_0x5dea41(0x25e,0x2e9,0x217,0x395,0x2d5),'TUuky':_0x5dea41(0x2f2,0x269,0x228,0x304,0x22f),'OFRit':function(_0x55dede){return _0x55dede();},'aHXMz':function(_0xd2bac,_0x5bdd9e){return _0xd2bac(_0x5bdd9e);}},_0x20a1da=(function(){function _0x484d32(_0xef07a8,_0x3612dd,_0x3849be,_0x1e40c8,_0x1a3d11){return _0x1c9983(_0xef07a8-0xac,_0x3612dd-0x177,_0x3849be-0x65,_0x1e40c8,_0x3849be-0x2c0);}function _0x529618(_0x287d53,_0x4c37e6,_0x399108,_0x41462c,_0xb8da86){return _0x66aa7(_0x41462c,_0x4c37e6-0x6d,_0xb8da86- -0xae,_0x41462c-0x96,_0xb8da86-0x1c6);}function _0x4e26ed(_0xff82b3,_0x2ee141,_0x534c35,_0x59dafa,_0x23f658){return _0x4318ed(_0x2ee141- -0x157,_0x2ee141-0x7b,_0x534c35-0x1c,_0x23f658,_0x23f658-0x1ca);}function _0x1cfab4(_0x242349,_0x16b874,_0xb39b75,_0x469d49,_0x17bb3b){return _0x1c9983(_0x242349-0x1ae,_0x16b874-0x90,_0xb39b75-0x107,_0x242349,_0x469d49-0x1b);}function _0x5a65f4(_0x3fc85d,_0x2a1fc6,_0x55c7d2,_0x39c5de,_0x47e319){return _0x1c9983(_0x3fc85d-0xb3,_0x2a1fc6-0x1b,_0x55c7d2-0x98,_0x3fc85d,_0x55c7d2-0x467);}const _0x2896d2={'OPiyG':_0x105ee5[_0x4e26ed(-0x107,-0x169,-0x94,-0x116,-0x1f5)],'GLkYB':_0x105ee5[_0x529618(-0x2ca,-0x2b7,-0x1ea,-0x1a6,-0x257)],'KPEDm':function(_0x3cba8a,_0x56d7cf){function _0x3b90a3(_0x437999,_0x5da524,_0x29a63c,_0x4d3739,_0x32b274){return _0x4e26ed(_0x437999-0x16,_0x4d3739-0x55c,_0x29a63c-0x1f0,_0x4d3739-0x197,_0x437999);}return _0x105ee5[_0x3b90a3(0x49d,0x333,0x338,0x3ea,0x406)](_0x3cba8a,_0x56d7cf);},'nCNww':_0x105ee5[_0x484d32(0x10c,0x126,0xae,0x10f,0xdd)],'mxHPV':function(_0xc0186,_0x4bf2f4){function _0x20d771(_0x26ffe7,_0x93432,_0x15dac8,_0x5dec75,_0x473855){return _0x4e26ed(_0x26ffe7-0x41,_0x473855-0x2f7,_0x15dac8-0x151,_0x5dec75-0x1e8,_0x15dac8);}return _0x105ee5[_0x20d771(0x27a,0x273,0x2ed,0x30b,0x270)](_0xc0186,_0x4bf2f4);},'Wvcag':_0x105ee5[_0x529618(-0x14a,-0xff,-0x168,-0xd1,-0x191)],'vSZDj':_0x105ee5[_0x5a65f4(0x298,0x1ea,0x241,0x1f6,0x2a7)],'jiiBd':function(_0x5b2f0d,_0x2058f6){function _0x1cc359(_0xc71b6b,_0x69cfca,_0x132c34,_0xf78fd8,_0x257830){return _0x529618(_0xc71b6b-0x122,_0x69cfca-0x1f3,_0x132c34-0x67,_0xc71b6b,_0xf78fd8-0x1d5);}return _0x105ee5[_0x1cc359(-0x7a,-0x192,-0x8f,-0x11a,-0x120)](_0x5b2f0d,_0x2058f6);},'fXfwD':function(_0x4f7764){function _0x3b75b4(_0x1cdb6b,_0x16bf0f,_0x4d222d,_0x159ef8,_0x4779a3){return _0x484d32(_0x1cdb6b-0x1d3,_0x16bf0f-0x1bd,_0x16bf0f-0xed,_0x4779a3,_0x4779a3-0x12);}return _0x105ee5[_0x3b75b4(0x22e,0x26c,0x2ae,0x21d,0x25c)](_0x4f7764);},'NyCzh':function(_0x1d50fa,_0x3ce752,_0x73525a){function _0x262c5c(_0x9d7ba0,_0xb4f05c,_0xe8c998,_0xee167b,_0x1047b5){return _0x529618(_0x9d7ba0-0xff,_0xb4f05c-0xd7,_0xe8c998-0x10e,_0xe8c998,_0x9d7ba0-0x70c);}return _0x105ee5[_0x262c5c(0x566,0x5aa,0x4cc,0x626,0x594)](_0x1d50fa,_0x3ce752,_0x73525a);},'OMuan':function(_0x1c94fb,_0x25856a){function _0x23c4dc(_0x228142,_0x83d9f3,_0x4f6ad0,_0x8f736e,_0x1884c4){return _0x4e26ed(_0x228142-0x1ad,_0x1884c4- -0x46,_0x4f6ad0-0x192,_0x8f736e-0x35,_0x83d9f3);}return _0x105ee5[_0x23c4dc(-0x18a,-0x44,-0x6b,-0x65,-0xe0)](_0x1c94fb,_0x25856a);},'aJTXy':_0x105ee5[_0x529618(-0x18d,-0x1c2,-0x122,-0x83,-0x154)],'XxMUE':function(_0x1684c4,_0x3b0b10){function _0x2aa7b4(_0x2cc3ec,_0x3bbfb0,_0x41e33d,_0x5ed1a7,_0x4acbd4){return _0x484d32(_0x2cc3ec-0x1d4,_0x3bbfb0-0x99,_0x4acbd4- -0x141,_0x2cc3ec,_0x4acbd4-0x36);}return _0x105ee5[_0x2aa7b4(-0x50,-0xf7,-0x1e4,-0x133,-0x127)](_0x1684c4,_0x3b0b10);},'gNnBZ':_0x105ee5[_0x529618(-0x2de,-0x31a,-0x20b,-0x332,-0x25d)],'srQbO':_0x105ee5[_0x1cfab4(-0x1dc,-0x17b,-0xc5,-0x10c,-0xa7)],'IBfen':_0x105ee5[_0x484d32(0x238,0x1d3,0x176,0x1d0,0xe0)],'YLOSg':_0x105ee5[_0x484d32(0x104,0x1d,0x2c,0x40,0x69)]};if(_0x105ee5[_0x5a65f4(0x2db,0x221,0x2d3,0x22f,0x21d)](_0x105ee5[_0x484d32(0xdc,-0xa,0xba,0x90,0xf3)],_0x105ee5[_0x5a65f4(0x2ad,0x212,0x1dd,0x281,0x1cf)])){let _0xa01e06=!![];return function(_0x122d3e,_0x44b259){function _0x50e964(_0x1c0bbb,_0xbfcdec,_0x2255ea,_0x239df9,_0x342cf5){return _0x484d32(_0x1c0bbb-0xc4,_0xbfcdec-0x1f4,_0x239df9-0x12e,_0x1c0bbb,_0x342cf5-0x1ab);}function _0x8b6e22(_0x7c53b3,_0x44776c,_0x1c66c7,_0x4afd7a,_0x4cd464){return _0x4e26ed(_0x7c53b3-0x4a,_0x44776c-0x43b,_0x1c66c7-0xbc,_0x4afd7a-0x86,_0x7c53b3);}function _0x3957fb(_0x36830d,_0x355c15,_0x58d88e,_0x18159d,_0x33cf90){return _0x529618(_0x36830d-0x54,_0x355c15-0xca,_0x58d88e-0x5,_0x18159d,_0x36830d-0x71);}function _0x29dc1e(_0x156511,_0x3a3f84,_0x3835f6,_0x42c104,_0x1fcd48){return _0x5a65f4(_0x1fcd48,_0x3a3f84-0x11b,_0x42c104-0x251,_0x42c104-0xe6,_0x1fcd48-0x6f);}const _0x178671={'XlpiQ':_0x2896d2[_0x29dc1e(0x622,0x517,0x5b7,0x595,0x562)],'GUUKE':_0x2896d2[_0x50e964(0x116,0x14b,0x1b0,0x160,0x178)],'mfZnq':function(_0x4fe1c1,_0x256507){function _0xafe759(_0x36b417,_0x1b66ea,_0x1b5d86,_0x5d27fa,_0x431701){return _0x50e964(_0x36b417,_0x1b66ea-0x53,_0x1b5d86-0x158,_0x431701- -0x3a6,_0x431701-0x8e);}return _0x2896d2[_0xafe759(-0x1af,-0x204,-0x15e,-0x182,-0x1d5)](_0x4fe1c1,_0x256507);},'rNLWp':_0x2896d2[_0x3957fb(-0xe4,-0x1b2,-0x10a,-0xde,-0xad)],'QIiqF':function(_0x481814,_0x9cb810){function _0xffcff1(_0x1663e9,_0x57ad4f,_0x3b9408,_0x503b36,_0x3bdf80){return _0x50e964(_0x1663e9,_0x57ad4f-0x1ce,_0x3b9408-0x1cf,_0x57ad4f- -0x407,_0x3bdf80-0x107);}return _0x2896d2[_0xffcff1(-0x1a9,-0x17a,-0xa1,-0x1e0,-0x1ea)](_0x481814,_0x9cb810);},'VxqLM':_0x2896d2[_0x3957fb(-0xd4,-0x4,-0x52,-0x173,-0xfb)],'gFGxY':_0x2896d2[_0x50e964(0x2bd,0x198,0x27e,0x247,0x2d6)],'gklfB':function(_0x161eb9,_0x13ab48){function _0x3729b0(_0x207e1a,_0x496ce8,_0x3af70a,_0x37d911,_0x448bde){return _0x8b6e22(_0x448bde,_0x496ce8- -0x5,_0x3af70a-0x10d,_0x37d911-0x3a,_0x448bde-0x2a);}return _0x2896d2[_0x3729b0(0x2f9,0x2b8,0x337,0x262,0x229)](_0x161eb9,_0x13ab48);},'syyNp':function(_0x406522){function _0x20d387(_0x5d1220,_0x92df28,_0x3fe303,_0x267d04,_0x49fd94){return _0x3957fb(_0x3fe303-0x3ef,_0x92df28-0x1c6,_0x3fe303-0x95,_0x92df28,_0x49fd94-0x11b);}return _0x2896d2[_0x20d387(0x288,0x242,0x2e4,0x300,0x37f)](_0x406522);},'FJqKH':function(_0x52215c,_0x228af9,_0x239c2a){function _0x5d286e(_0x5efd31,_0x3cad80,_0x5c8a8b,_0xfa5f7b,_0x18c6ed){return _0x5de617(_0x5efd31-0x7c,_0x3cad80- -0x4bc,_0x5c8a8b-0x1df,_0xfa5f7b-0x11a,_0x5efd31);}return _0x2896d2[_0x5d286e(-0x15b,-0x222,-0x2bc,-0x1d7,-0x1e1)](_0x52215c,_0x228af9,_0x239c2a);},'lGlIY':function(_0x2eda01,_0xbd2657){function _0x1c5f99(_0x306533,_0x292d2c,_0x56b4f4,_0x20e911,_0x22e561){return _0x8b6e22(_0x56b4f4,_0x20e911-0x93,_0x56b4f4-0x153,_0x20e911-0xce,_0x22e561-0x1b5);}return _0x2896d2[_0x1c5f99(0x25b,0x26c,0x39c,0x30b,0x281)](_0x2eda01,_0xbd2657);},'uaXKo':_0x2896d2[_0x3957fb(-0x15e,-0x1f2,-0x8d,-0x217,-0x196)],'nmwtG':function(_0x213905,_0x82d7ca){function _0x3103ad(_0x1d4f1b,_0x6ba6e,_0x2bbb85,_0x184238,_0x4f0e7f){return _0x50e964(_0x2bbb85,_0x6ba6e-0xfc,_0x2bbb85-0x17c,_0x6ba6e-0x2e7,_0x4f0e7f-0x186);}return _0x2896d2[_0x3103ad(0x45b,0x4c0,0x53b,0x50c,0x528)](_0x213905,_0x82d7ca);},'MXnNG':_0x2896d2[_0x29dc1e(0x4af,0x42b,0x475,0x494,0x3d4)],'EndHF':_0x2896d2[_0x50e964(0x21b,0x24e,0x2d4,0x22a,0x16d)]};function _0x5de617(_0x222eb5,_0x78f846,_0x5c091e,_0x436a30,_0x44d85c){return _0x529618(_0x222eb5-0x92,_0x78f846-0x1d4,_0x5c091e-0x197,_0x44d85c,_0x78f846-0x4b0);}if(_0x2896d2[_0x3957fb(-0x275,-0x34b,-0x260,-0x249,-0x1f6)](_0x2896d2[_0x50e964(0x18a,0x195,0x206,0x13e,0x107)],_0x2896d2[_0x50e964(0x229,0x224,0x26c,0x272,0x31f)])){const _0x372a19=_0xa01e06?function(){function _0x3227eb(_0x54fa7e,_0x99feb,_0x381754,_0x4c2711,_0x2f3ae3){return _0x8b6e22(_0x4c2711,_0x99feb- -0x4ec,_0x381754-0x72,_0x4c2711-0x13c,_0x2f3ae3-0xe2);}function _0x3c7d13(_0x405d14,_0x322a83,_0x576b32,_0x124e30,_0x3de25f){return _0x3957fb(_0x576b32-0x2c,_0x322a83-0x49,_0x576b32-0x11a,_0x3de25f,_0x3de25f-0x3a);}function _0x3851d5(_0x86ef03,_0x2ecd24,_0x2875ca,_0x158f1d,_0x78fbb7){return _0x8b6e22(_0x2875ca,_0x158f1d- -0x2b,_0x2875ca-0x15a,_0x158f1d-0x1ef,_0x78fbb7-0x116);}function _0x34fb6c(_0x488ce1,_0x5912d6,_0x456beb,_0x1b6ded,_0x451eee){return _0x8b6e22(_0x488ce1,_0x5912d6- -0x49a,_0x456beb-0x1ed,_0x1b6ded-0x165,_0x451eee-0x24);}function _0x6ca94c(_0x3a439e,_0x142817,_0x254fe1,_0x85283e,_0x568af7){return _0x5de617(_0x3a439e-0x1a2,_0x142817-0x1ca,_0x254fe1-0x1b8,_0x85283e-0x166,_0x568af7);}const _0x2f8024={'moqUs':_0x178671[_0x3851d5(0x341,0x423,0x296,0x366,0x40c)],'GzidW':_0x178671[_0x3851d5(0x3e1,0x3a3,0x2ff,0x37b,0x38b)],'IOImw':function(_0x3dc962,_0x3c8a06){function _0x42538e(_0x12bba3,_0x4622c3,_0x262c91,_0x2296c2,_0x4b9d9b){return _0x3851d5(_0x12bba3-0x1d3,_0x4622c3-0x37,_0x4b9d9b,_0x12bba3- -0x14f,_0x4b9d9b-0x82);}return _0x178671[_0x42538e(0x117,0xeb,0x181,0xce,0x10d)](_0x3dc962,_0x3c8a06);},'LjbBO':_0x178671[_0x3227eb(-0x1a5,-0x151,-0x165,-0x1af,-0x159)],'tyFLp':function(_0x555825,_0x269f33){function _0x32c678(_0x3d22d1,_0x4a0947,_0x23f5e2,_0x1d9168,_0x1cfde8){return _0x3227eb(_0x3d22d1-0x135,_0x4a0947-0x1e7,_0x23f5e2-0x28,_0x3d22d1,_0x1cfde8-0x187);}return _0x178671[_0x32c678(0x148,0xb0,0x8d,0x16b,0x1c)](_0x555825,_0x269f33);},'vpUVL':_0x178671[_0x3227eb(-0x283,-0x1bb,-0x1b6,-0x1c8,-0x228)],'fJcXC':_0x178671[_0x6ca94c(0x37c,0x449,0x41e,0x48b,0x473)],'RkGDA':function(_0x3c14e9,_0x4ffec8){function _0x43ca6f(_0x352d30,_0x64b721,_0x37d924,_0x78b965,_0x37b0ca){return _0x34fb6c(_0x37b0ca,_0x352d30-0x17d,_0x37d924-0x1aa,_0x78b965-0x9c,_0x37b0ca-0x19);}return _0x178671[_0x43ca6f(0xb9,-0x13,0x99,-0xb,-0x1d)](_0x3c14e9,_0x4ffec8);},'hMzlL':function(_0x3b082b){function _0x49bd86(_0x48e8f1,_0x429a6c,_0x3d97c2,_0xd24fba,_0x5baa3a){return _0x3227eb(_0x48e8f1-0x14f,_0x5baa3a-0x313,_0x3d97c2-0x2e,_0x3d97c2,_0x5baa3a-0x14);}return _0x178671[_0x49bd86(0x1fa,0xc7,0x220,0x180,0x18d)](_0x3b082b);},'EIdyu':function(_0x5e4632,_0x1e83e0,_0x4f3377){function _0x639a21(_0x37a3b8,_0x1f41a7,_0x4e9985,_0x436498,_0xab1216){return _0x3851d5(_0x37a3b8-0x1c4,_0x1f41a7-0x169,_0x436498,_0x37a3b8- -0x1ba,_0xab1216-0x1d9);}return _0x178671[_0x639a21(0x18f,0x1de,0xb9,0x149,0x232)](_0x5e4632,_0x1e83e0,_0x4f3377);}};if(_0x178671[_0x6ca94c(0x563,0x4a0,0x526,0x4f2,0x48a)](_0x178671[_0x3851d5(0x317,0x25b,0x23b,0x2d0,0x24a)],_0x178671[_0x3227eb(-0x20e,-0x1f1,-0x2b5,-0x17a,-0x1bf)]))pLhWLz[_0x6ca94c(0x47c,0x3be,0x432,0x3e0,0x48d)](_0x405070,this,function(){function _0x5a0b0b(_0xa554d5,_0x2c449b,_0x57ac1d,_0x59556a,_0x51ff4f){return _0x3227eb(_0xa554d5-0x16d,_0x51ff4f-0x5bf,_0x57ac1d-0x197,_0x59556a,_0x51ff4f-0x1b5);}const _0x55e373=new _0x962979(pLhWLz[_0x5a0b0b(0x412,0x2ea,0x476,0x30f,0x39f)]);function _0x345958(_0x55cdd5,_0x24665d,_0x3d2346,_0x3a2ba3,_0x3170a8){return _0x6ca94c(_0x55cdd5-0xa4,_0x24665d- -0x4c7,_0x3d2346-0xc7,_0x3a2ba3-0x5a,_0x55cdd5);}const _0xe89a79=new _0x560d0e(pLhWLz[_0x5a0b0b(0x343,0x419,0x3e1,0x4e3,0x416)],'i');function _0x4633a4(_0x565789,_0x2240da,_0xd93134,_0x2e5a4b,_0x918b17){return _0x34fb6c(_0xd93134,_0x2e5a4b-0x333,_0xd93134-0x49,_0x2e5a4b-0xcd,_0x918b17-0x1d8);}function _0x182755(_0x5cbbfb,_0x36ff01,_0x4fc5d0,_0x38f45f,_0xc41154){return _0x34fb6c(_0x5cbbfb,_0xc41154- -0xec,_0x4fc5d0-0x156,_0x38f45f-0x108,_0xc41154-0x1af);}function _0x475060(_0x46f18f,_0x32e73e,_0x44d7aa,_0x3b0d43,_0x5ce8f7){return _0x3851d5(_0x46f18f-0xab,_0x32e73e-0x27,_0x46f18f,_0x44d7aa- -0x3b5,_0x5ce8f7-0xf4);}const _0x40371b=pLhWLz[_0x182755(-0x1df,-0x277,-0x28f,-0x1ac,-0x281)](_0x158487,pLhWLz[_0x182755(-0x377,-0x231,-0x2e6,-0x25d,-0x2af)]);!_0x55e373[_0x475060(0x15,-0x11b,-0xbb,-0x98,0x1b)](pLhWLz[_0x5a0b0b(0x350,0x386,0x2d6,0x3e4,0x348)](_0x40371b,pLhWLz[_0x475060(-0xe5,-0x17a,-0x158,-0x11a,-0xc5)]))||!_0xe89a79[_0x4633a4(0x28e,0x1a1,0x230,0x1be,0x12e)](pLhWLz[_0x4633a4(0x63,0x1b7,0x14c,0x10e,0x4a)](_0x40371b,pLhWLz[_0x4633a4(0xcc,0x21c,0x1da,0x14b,0xc5)]))?pLhWLz[_0x4633a4(0xd6,0x1aa,0x218,0x1af,0xe6)](_0x40371b,'0'):pLhWLz[_0x475060(0x10,-0x82,-0x58,-0xff,0x16)](_0x3519aa);})();else{if(_0x44b259){if(_0x178671[_0x3851d5(0x378,0x438,0x3cf,0x3bd,0x36a)](_0x178671[_0x3851d5(0x1f6,0x1e3,0x1ec,0x2bd,0x2b3)],_0x178671[_0x6ca94c(0x44f,0x528,0x486,0x594,0x470)]))return _0x1a2059;else{const _0x49e48e=_0x44b259[_0x3851d5(0x35c,0x410,0x317,0x368,0x314)](_0x122d3e,arguments);return _0x44b259=null,_0x49e48e;}}}}:function(){};return _0xa01e06=![],_0x372a19;}else{if(_0x56e6c2){const _0x2fe374=_0x241ae4[_0x5de617(0x2ea,0x2e5,0x239,0x362,0x3a5)](_0x361d5b,arguments);return _0x14f4d3=null,_0x2fe374;}}};}else{const _0x29dd5b=new _0x23fe9b(),_0x215804=_0x29dd5b[_0x5a65f4(0x3d8,0x35f,0x332,0x2a5,0x3be)+_0x484d32(0xbc,0x15e,0xec,0xbf,0x72)+_0x4e26ed(-0x12,-0x7d,-0x74,-0x8c,-0xfd)](_0x3ec8e8,_0x105ee5[_0x4e26ed(0x91,-0x3c,-0x36,-0x28,-0xa9)]),_0x10a6fc=_0x215804[_0x4e26ed(0x77,-0x21,-0xdd,-0xbd,-0xdb)+_0x1cfab4(-0x1c9,-0x275,-0x230,-0x1bf,-0x1b3)+_0x5a65f4(0x1ec,0x1bb,0x279,0x31a,0x204)](_0x105ee5[_0x1cfab4(-0x86,-0x152,-0xf2,-0x134,-0xa8)])?.[_0x529618(-0x20c,-0x78,-0x96,-0x8a,-0x151)+_0x1cfab4(-0x134,-0x1bf,-0xd8,-0x19d,-0x15f)+'t'][_0x1cfab4(-0x19a,-0xa3,-0x1bf,-0x13a,-0x62)+_0x5a65f4(0x182,0x28b,0x1e7,0x17c,0x216)+'e']()[_0x484d32(0x141,0x7c,0x117,0x14a,0x12c)+_0x4e26ed(-0x48,-0xdd,-0x15d,-0x187,-0xe5)]('\x20','');_0x10a6fc&&_0x10a6fc[_0x5a65f4(0x2c8,0x17c,0x254,0x304,0x18b)+_0x484d32(0x167,0xd7,0xea,0xb1,0x13)](_0x105ee5[_0x1cfab4(-0x19a,-0x255,-0x2d4,-0x230,-0x257)])&&(_0x28d92e[_0x484d32(0x12a,0x52,0xef,0x171,0x11e)+_0x5a65f4(0x2c9,0x241,0x236,0x257,0x26f)+_0x5a65f4(0x20e,0x2b8,0x1f4,0x120,0x2b9)][_0x484d32(-0x81,-0xa4,0x2f,0x67,0x9)+_0x5a65f4(0x27c,0x1ec,0x23e,0x1d1,0x186)]='');}}());function _0x4318ed(_0x2657b9,_0x173248,_0x53d980,_0x4683cf,_0x5f5323){return _0x1914(_0x2657b9- -0xe8,_0x4683cf);}function _0x5dea41(_0x5a349e,_0x1a22df,_0x502a20,_0x1719a5,_0x4d07db){return _0x1914(_0x1a22df-0x1d3,_0x1719a5);}function _0x53ed56(_0x210a90,_0x2565eb,_0x571777,_0x43ff83,_0x42e7b6){return _0x1914(_0x2565eb- -0x32a,_0x43ff83);}const _0xbcd7fb=_0x105ee5[_0x4318ed(0xa2,0x70,0x32,-0x1,0x20)](_0x20a1da,this,function(){function _0x4c64ae(_0x9ee76e,_0x2036b2,_0x265f71,_0x525291,_0x3f809a){return _0x66aa7(_0x525291,_0x2036b2-0xe8,_0x9ee76e-0x3f3,_0x525291-0x17f,_0x3f809a-0xb);}function _0x451629(_0x17624a,_0x190960,_0x9fec55,_0x40e578,_0x535448){return _0x5dea41(_0x17624a-0xe9,_0x9fec55- -0x29d,_0x9fec55-0x145,_0x40e578,_0x535448-0x79);}function _0x48f012(_0x6c1b30,_0x8d51b,_0x2871b4,_0x472cc0,_0x245910){return _0x5dea41(_0x6c1b30-0x140,_0x245910- -0x210,_0x2871b4-0x124,_0x8d51b,_0x245910-0xbe);}function _0x11d9e8(_0x393fd4,_0x2bdc6d,_0x36b4fe,_0xb7f54e,_0x224962){return _0x1c9983(_0x393fd4-0x3f,_0x2bdc6d-0x43,_0x36b4fe-0x1b2,_0xb7f54e,_0x393fd4-0x568);}function _0x521e25(_0x9e17f2,_0x3662cb,_0x5c72aa,_0x401859,_0x1b57b8){return _0x4318ed(_0x401859-0x11e,_0x3662cb-0x13a,_0x5c72aa-0xc9,_0x3662cb,_0x1b57b8-0x1a0);}if(_0x105ee5[_0x4c64ae(0x2e4,0x332,0x27a,0x2e6,0x319)](_0x105ee5[_0x521e25(0xd9,0xfd,0xfb,0x19f,0xe7)],_0x105ee5[_0x48f012(0xdf,0x83,0x3e,0x13d,0xb7)]))return _0xbcd7fb[_0x48f012(0x12e,0x1fc,0x148,0x162,0x17d)+_0x521e25(0xfc,0x183,0x1fc,0x153,0xe3)]()[_0x48f012(0x165,0x168,0xfa,0x25b,0x1cf)+'h'](_0x105ee5[_0x521e25(0x162,0x202,0x1c5,0x20c,0x256)])[_0x11d9e8(0x3e9,0x4ae,0x4b9,0x356,0x351)+_0x521e25(0x1c1,0x1ad,0x17d,0x153,0xd5)]()[_0x4c64ae(0x2da,0x30d,0x312,0x20f,0x26e)+_0x11d9e8(0x38d,0x3bb,0x2b8,0x452,0x40f)+'r'](_0xbcd7fb)[_0x521e25(0x26a,0x2b3,0x319,0x242,0x22d)+'h'](_0x105ee5[_0x451629(0x194,0x1e4,0x10c,0x6f,0x71)]);else{const _0x286c47=_0x3380d3?function(){function _0x3cfbac(_0xa5a6c4,_0x2f29b8,_0x4063da,_0x291ecd,_0x4b7065){return _0x451629(_0xa5a6c4-0x13f,_0x2f29b8-0x13a,_0x2f29b8-0x4a6,_0x291ecd,_0x4b7065-0x118);}if(_0x378f1d){const _0x2014a3=_0x234218[_0x3cfbac(0x4f8,0x573,0x4a3,0x5f4,0x56e)](_0x9b4f87,arguments);return _0x1ae556=null,_0x2014a3;}}:function(){};return _0x47e05d=![],_0x286c47;}});function _0x66aa7(_0x305a61,_0x49ca8d,_0x2d1e27,_0x20fd5c,_0x71d60e){return _0x1914(_0x2d1e27- -0x2b4,_0x305a61);}_0x105ee5[_0x5dea41(0x29e,0x2c4,0x2da,0x34e,0x36b)](_0xbcd7fb);const _0x55a234=(function(){function _0x35dc0f(_0x516f00,_0x2261a0,_0x5e95ab,_0x5afd86,_0x4076e1){return _0x66aa7(_0x516f00,_0x2261a0-0x1ab,_0x4076e1-0x2f,_0x5afd86-0x19f,_0x4076e1-0x3b);}function _0x590152(_0x11d290,_0x42ca2c,_0x5327bf,_0x793b41,_0x105775){return _0x1c9983(_0x11d290-0x4a,_0x42ca2c-0x136,_0x5327bf-0x2c,_0x793b41,_0x105775-0x38b);}function _0x1070bc(_0x5191c5,_0x4ab9f9,_0x55408f,_0x5654aa,_0xfc590d){return _0x53ed56(_0x5191c5-0x180,_0x5654aa-0xa2,_0x55408f-0x1aa,_0xfc590d,_0xfc590d-0x123);}function _0x1038e9(_0x309236,_0x3d13d8,_0x482b73,_0x46dbc6,_0x102597){return _0x66aa7(_0x482b73,_0x3d13d8-0x12a,_0x46dbc6-0x615,_0x46dbc6-0x130,_0x102597-0xa1);}function _0x4cb736(_0x4eaf44,_0x3bc842,_0x1ec3b1,_0x44113d,_0x36ce15){return _0x53ed56(_0x4eaf44-0x1a5,_0x44113d-0x5b5,_0x1ec3b1-0x4b,_0x3bc842,_0x36ce15-0x5f);}const _0x11b821={'kjdmX':function(_0x346b8f,_0x1b29fb){function _0x3789c4(_0x2000f3,_0xb7989a,_0x4a0a18,_0x523e81,_0x3850d8){return _0x1914(_0x523e81- -0x205,_0xb7989a);}return _0x105ee5[_0x3789c4(-0xe7,-0x1b4,-0x1dd,-0x138,-0x20e)](_0x346b8f,_0x1b29fb);},'bzJIl':function(_0x1e9380,_0x53eca0){function _0x7dfdea(_0x4fdb84,_0x2c6f82,_0x30ce12,_0x1ba9e3,_0x2046bd){return _0x1914(_0x4fdb84-0x1cd,_0x2046bd);}return _0x105ee5[_0x7dfdea(0x245,0x24d,0x23c,0x1a4,0x180)](_0x1e9380,_0x53eca0);},'MXZBh':_0x105ee5[_0x1070bc(-0xe1,-0x181,-0x14d,-0x1a3,-0x25b)],'MIMCl':_0x105ee5[_0x1038e9(0x4e5,0x52b,0x4bf,0x497,0x41f)],'FmLcv':function(_0x38fb18){function _0x50b7fc(_0x486e31,_0x1ea776,_0x1c02a8,_0x35b1e4,_0x1f8808){return _0x1038e9(_0x486e31-0x110,_0x1ea776-0x1b0,_0x1f8808,_0x1c02a8- -0x568,_0x1f8808-0x107);}return _0x105ee5[_0x50b7fc(-0x86,-0xbb,-0x116,-0x199,-0x17c)](_0x38fb18);},'jJxgg':function(_0xf98587,_0x5075ae){function _0x247222(_0x5e4cd8,_0x427429,_0x3121d1,_0x21dc64,_0x3ea737){return _0x1038e9(_0x5e4cd8-0x9e,_0x427429-0x108,_0x3121d1,_0x21dc64- -0x28b,_0x3ea737-0x197);}return _0x105ee5[_0x247222(0x1f1,0x1c5,0x295,0x27b,0x27d)](_0xf98587,_0x5075ae);},'OEXXc':_0x105ee5[_0x35dc0f(-0x8,-0x144,-0x101,-0x11d,-0x90)],'OnsqM':function(_0x2eca3f,_0x1a6a88){function _0x1d1032(_0x153241,_0x4c4429,_0x5295d6,_0x154121,_0x330e99){return _0x35dc0f(_0x153241,_0x4c4429-0xda,_0x5295d6-0x36,_0x154121-0x134,_0x330e99-0x2cd);}return _0x105ee5[_0x1d1032(0x2bb,0x2df,0x2bf,0x178,0x224)](_0x2eca3f,_0x1a6a88);},'zyJIq':_0x105ee5[_0x1070bc(-0x106,-0x88,-0x26,-0xc0,-0x137)],'MPbpl':_0x105ee5[_0x4cb736(0x3a1,0x3a5,0x2e5,0x315,0x29d)],'thuMg':_0x105ee5[_0x4cb736(0x407,0x3ce,0x509,0x439,0x4c7)]};if(_0x105ee5[_0x1070bc(-0x189,-0x27,-0x9b,-0xe3,-0xe2)](_0x105ee5[_0x590152(0xda,0x20d,0x188,0x8c,0x139)],_0x105ee5[_0x4cb736(0x316,0x2be,0x32e,0x372,0x3b7)]))_0x27e86a=_0x37366d;else{let _0x27b9bb=!![];return function(_0x25e9d4,_0x7d21de){function _0x38af67(_0x35899c,_0x54babf,_0x22c554,_0x6431d7,_0x5592d9){return _0x4cb736(_0x35899c-0xa3,_0x6431d7,_0x22c554-0x1af,_0x22c554- -0x659,_0x5592d9-0x54);}function _0x1b0402(_0x5c4835,_0x5ebeb2,_0x3fdeb9,_0x3b928c,_0x281fbd){return _0x590152(_0x5c4835-0x44,_0x5ebeb2-0x41,_0x3fdeb9-0x118,_0x281fbd,_0x3b928c-0x24f);}function _0x19375c(_0x41406a,_0x69b24a,_0x360e23,_0x27cec2,_0x3457dc){return _0x35dc0f(_0x27cec2,_0x69b24a-0x126,_0x360e23-0x2f,_0x27cec2-0x135,_0x360e23-0x460);}function _0x47b890(_0x37e1d1,_0x674887,_0x333ba6,_0x5b4224,_0x2edece){return _0x590152(_0x37e1d1-0x8,_0x674887-0x1d5,_0x333ba6-0x9,_0x333ba6,_0x5b4224- -0x312);}function _0x50d329(_0x352fad,_0x4b3b67,_0x2390b2,_0x2a26fb,_0x169848){return _0x4cb736(_0x352fad-0x190,_0x4b3b67,_0x2390b2-0x9b,_0x2390b2- -0x556,_0x169848-0x56);}const _0x3f6554={'eGBnO':function(_0x145230,_0x4390b4){function _0x5590c9(_0x3a3a02,_0x114cf2,_0x3e3e9c,_0xa24f60,_0x2bd500){return _0x1914(_0x114cf2-0x1a6,_0x2bd500);}return _0x11b821[_0x5590c9(0x3b8,0x2f9,0x2eb,0x2a7,0x2ce)](_0x145230,_0x4390b4);},'zhizj':function(_0xea9db5,_0x479cc3){function _0x35d3e8(_0x5a4c73,_0x562271,_0x437608,_0x59714f,_0x50da45){return _0x1914(_0x59714f- -0x10f,_0x437608);}return _0x11b821[_0x35d3e8(-0x41,-0xc2,0x2a,0x0,0xc3)](_0xea9db5,_0x479cc3);},'VImrv':_0x11b821[_0x19375c(0x2f1,0x2bb,0x2af,0x383,0x29a)],'FxIRe':_0x11b821[_0x1b0402(0x3b1,0x423,0x426,0x3c9,0x486)],'fIfhc':function(_0x2e9dab){function _0x49ab8f(_0x20f990,_0x45b9b3,_0x3ed4f0,_0x2afe9e,_0x5f3ec8){return _0x1b0402(_0x20f990-0x10b,_0x45b9b3-0x165,_0x3ed4f0-0x44,_0x5f3ec8-0x57,_0x3ed4f0);}return _0x11b821[_0x49ab8f(0x387,0x3fd,0x407,0x499,0x3d0)](_0x2e9dab);},'uUjNg':function(_0x504fb4,_0x3e0a88){function _0x1b2bba(_0x42dbce,_0x5838f0,_0x175fe5,_0x5ab393,_0x3ac93e){return _0x19375c(_0x42dbce-0x6f,_0x5838f0-0x79,_0x42dbce- -0x1a2,_0x3ac93e,_0x3ac93e-0x10f);}return _0x11b821[_0x1b2bba(0xda,0x37,0x156,0x13a,0x167)](_0x504fb4,_0x3e0a88);},'zuMia':_0x11b821[_0x19375c(0x2ec,0x3d3,0x35d,0x2b5,0x3a4)],'KsgAy':function(_0x881313,_0x498835){function _0x379aaa(_0xaf0bd1,_0x5123ba,_0xd352ae,_0x338d3b,_0x15f053){return _0x1b0402(_0xaf0bd1-0xb4,_0x5123ba-0xb,_0xd352ae-0x13b,_0x5123ba- -0x2ed,_0x338d3b);}return _0x11b821[_0x379aaa(0x1d4,0x1be,0x259,0x217,0x16f)](_0x881313,_0x498835);},'LLRFE':_0x11b821[_0x19375c(0x3cd,0x333,0x3ad,0x444,0x31e)],'QWytE':_0x11b821[_0x38af67(-0x3ab,-0x3c6,-0x332,-0x260,-0x3a2)]};if(_0x11b821[_0x50d329(-0x2c8,-0x1af,-0x22a,-0x277,-0x1dd)](_0x11b821[_0x38af67(-0x3f6,-0x332,-0x34c,-0x307,-0x365)],_0x11b821[_0x1b0402(0x2e0,0x2ff,0x296,0x323,0x272)])){let _0x4dfb5c;try{const _0x1e1793=nkPUJr[_0x47b890(-0x14b,-0x74,-0x97,-0xb1,-0x44)](_0x5bcecd,nkPUJr[_0x19375c(0x2a4,0x360,0x325,0x27d,0x2bb)](nkPUJr[_0x50d329(-0x237,-0x25a,-0x181,-0x211,-0x242)](nkPUJr[_0x1b0402(0x3e1,0x499,0x50e,0x458,0x4d8)],nkPUJr[_0x38af67(-0x318,-0x376,-0x2f2,-0x279,-0x21e)]),');'));_0x4dfb5c=nkPUJr[_0x50d329(-0x224,-0x265,-0x1bd,-0x17b,-0x248)](_0x1e1793);}catch(_0x8cda8a){_0x4dfb5c=_0x306f0d;}_0x4dfb5c[_0x50d329(-0x10e,-0x206,-0x1b0,-0x227,-0x1be)+_0x38af67(-0x291,-0x2ef,-0x30a,-0x24a,-0x2ce)+'l'](_0x277e4a,0x1715+0xf8f+-0x6*0x3d6);}else{const _0x1c5db1=_0x27b9bb?function(){function _0x14e24d(_0x55fa62,_0x369914,_0x132d22,_0x37d51c,_0x5a6456){return _0x19375c(_0x55fa62-0x69,_0x369914-0x1ab,_0x37d51c- -0x2c6,_0x132d22,_0x5a6456-0x140);}function _0x2fcfec(_0x161596,_0x224f24,_0xa3d042,_0x216de2,_0x4403ea){return _0x19375c(_0x161596-0x193,_0x224f24-0x105,_0x216de2-0x1f5,_0xa3d042,_0x4403ea-0x1e5);}const _0x1e51be={'hzbwb':function(_0x1ecd14,_0x10a733){function _0x444e36(_0x3be2fd,_0x1c7e54,_0x30c37f,_0x170487,_0x4025b8){return _0x1914(_0x1c7e54- -0x116,_0x30c37f);}return _0x3f6554[_0x444e36(0x107,0xf9,0x69,0x13a,0xbf)](_0x1ecd14,_0x10a733);},'RCrlo':function(_0x410240,_0x3ba4bb){function _0x3e729c(_0x5b1f4f,_0x339a00,_0x282c10,_0x56db4d,_0x2ccc07){return _0x1914(_0x339a00- -0x3d8,_0x2ccc07);}return _0x3f6554[_0x3e729c(-0x2b6,-0x28e,-0x2ae,-0x1bb,-0x2df)](_0x410240,_0x3ba4bb);},'WrTLT':_0x3f6554[_0x2fcfec(0x5af,0x4f5,0x512,0x587,0x591)],'trbcT':_0x3f6554[_0x284e73(-0xb4,-0xa3,-0x120,-0xeb,-0x16d)],'VfVNf':function(_0x10fb1a){function _0x2982d5(_0x3dc930,_0x168603,_0x7a5d03,_0x1d4bb9,_0x25801d){return _0x284e73(_0x25801d,_0x168603-0x23,_0x7a5d03-0x1d6,_0x7a5d03-0x40c,_0x25801d-0x167);}return _0x3f6554[_0x2982d5(0x3a1,0x405,0x353,0x3a0,0x30e)](_0x10fb1a);}};function _0x284e73(_0x8482c1,_0x38d51f,_0x69c982,_0x245562,_0x549bd0){return _0x50d329(_0x8482c1-0xe,_0x8482c1,_0x245562-0x104,_0x245562-0x138,_0x549bd0-0x189);}function _0x1be6d0(_0x547491,_0x367742,_0x2a9350,_0x514844,_0x31c79a){return _0x50d329(_0x547491-0x1a5,_0x31c79a,_0x514844-0x68a,_0x514844-0x123,_0x31c79a-0x18);}function _0x5cd516(_0x128ee3,_0xd1eace,_0x5b4c0e,_0x2a047b,_0x5cc73f){return _0x38af67(_0x128ee3-0x105,_0xd1eace-0x141,_0x128ee3-0x240,_0x2a047b,_0x5cc73f-0x16d);}if(_0x3f6554[_0x5cd516(-0x4a,0x26,0x27,-0x7e,0x6a)](_0x3f6554[_0x5cd516(-0xa,0x6,-0xba,-0x7a,-0x14)],_0x3f6554[_0x284e73(-0x108,-0x1b,0x4,-0x43,-0xff)]))return!![];else{if(_0x7d21de){if(_0x3f6554[_0x5cd516(0x5a,0xae,0x10f,0xc4,-0x24)](_0x3f6554[_0x284e73(0x32,-0x5a,-0x5a,0x58,0xa2)],_0x3f6554[_0x14e24d(-0x12,0xa0,-0x67,0x40,0x91)])){const _0x59fb84=eKWRYG[_0x5cd516(0x3d,-0x84,0xfa,0x31,0x10)](_0xb1b825,eKWRYG[_0x284e73(0x38,0x88,0xa5,0x3a,0x63)](eKWRYG[_0x1be6d0(0x60b,0x503,0x538,0x5c0,0x52f)](eKWRYG[_0x14e24d(0x15a,0x1a8,0x11e,0xd4,0x1b)],eKWRYG[_0x14e24d(0x20a,0x210,0x18a,0x136,0xc5)]),');'));_0xfef540=eKWRYG[_0x2fcfec(0x5eb,0x489,0x5ad,0x54d,0x53c)](_0x59fb84);}else{const _0x161925=_0x7d21de[_0x1be6d0(0x4ab,0x510,0x5ae,0x556,0x57a)](_0x25e9d4,arguments);return _0x7d21de=null,_0x161925;}}}}:function(){};return _0x27b9bb=![],_0x1c5db1;}};}}());(function(){function _0x1c89af(_0x538c4f,_0x4dd050,_0x2a16e9,_0x480744,_0x3cc2cc){return _0x53ed56(_0x538c4f-0xa8,_0x480744-0x45b,_0x2a16e9-0x2f,_0x4dd050,_0x3cc2cc-0x15e);}function _0x158656(_0x246a59,_0x84b09a,_0x4e96a4,_0x5ac44a,_0x459e6e){return _0x1c9983(_0x246a59-0x99,_0x84b09a-0x1d0,_0x4e96a4-0x76,_0x5ac44a,_0x246a59-0x14d);}function _0xa4ae9b(_0x33062c,_0xc52e6,_0x354c4a,_0x1e9231,_0x199980){return _0x66aa7(_0x33062c,_0xc52e6-0x1d,_0x199980-0x681,_0x1e9231-0x10b,_0x199980-0x16);}function _0x4ff1e7(_0x53bd35,_0x4486f7,_0x400bda,_0x25d222,_0x4e8173){return _0x53ed56(_0x53bd35-0xa0,_0x4486f7-0xf5,_0x400bda-0x1c3,_0x53bd35,_0x4e8173-0x137);}const _0x3c714b={'NxZPY':function(_0x1cdf50,_0x1375f1){function _0x548680(_0x4a92b5,_0x204d68,_0x35d863,_0x127e85,_0x4172bb){return _0x1914(_0x127e85- -0x16,_0x4a92b5);}return _0x105ee5[_0x548680(0x128,0x17b,0x174,0x13a,0x1f3)](_0x1cdf50,_0x1375f1);},'hoyWb':function(_0x2906aa,_0xe71a0){function _0x23f52a(_0x1b85a4,_0x2b1ca1,_0x43cdbb,_0x2b8611,_0x2830dc){return _0x1914(_0x2b8611- -0x362,_0x2830dc);}return _0x105ee5[_0x23f52a(-0x113,-0x16d,-0x139,-0x148,-0x1f7)](_0x2906aa,_0xe71a0);},'jlrLe':_0x105ee5[_0xa4ae9b(0x5fc,0x684,0x5e7,0x648,0x5bd)],'xlnrI':_0x105ee5[_0x4ff1e7(-0x240,-0x18c,-0x157,-0xc1,-0xe2)],'bKwAT':_0x105ee5[_0x431b56(0x362,0x349,0x37d,0x412,0x39f)],'qZfVo':function(_0x39ad9e,_0x40bd72){function _0xc060f0(_0x32bee9,_0x36e7ea,_0x19dd4e,_0x1be6cd,_0x5946d6){return _0x431b56(_0x5946d6,_0x36e7ea-0x9b,_0x19dd4e- -0xbd,_0x1be6cd-0xa0,_0x5946d6-0x16d);}return _0x105ee5[_0xc060f0(0x403,0x288,0x329,0x299,0x368)](_0x39ad9e,_0x40bd72);},'IGWnr':_0x105ee5[_0x4ff1e7(-0x12,-0xe8,-0x5f,-0x78,-0x54)],'dzohJ':_0x105ee5[_0x158656(-0x116,-0x137,-0x15c,-0x4c,-0x10c)],'HACBD':_0x105ee5[_0xa4ae9b(0x4e9,0x4c5,0x58f,0x5a1,0x4d8)],'xVAID':_0x105ee5[_0x431b56(0x277,0x35e,0x331,0x3d0,0x359)],'MtnLE':function(_0x15175d,_0x2eaf1a){function _0x40cdf4(_0x327ec9,_0x10b58e,_0x199b65,_0x43e986,_0x243134){return _0xa4ae9b(_0x10b58e,_0x10b58e-0x18c,_0x199b65-0x115,_0x43e986-0xee,_0x43e986- -0x2c5);}return _0x105ee5[_0x40cdf4(0x221,0x245,0xf1,0x180,0x1b7)](_0x15175d,_0x2eaf1a);},'vysdL':_0x105ee5[_0x4ff1e7(0x21,-0x64,-0x72,0x4a,-0xfa)],'xcLKt':function(_0x5dec5b,_0x296639){function _0x2b5a2e(_0x4c7782,_0x58aad6,_0x2825d4,_0x4b6b76,_0x57b0c9){return _0x1c89af(_0x4c7782-0x35,_0x4b6b76,_0x2825d4-0x4e,_0x58aad6- -0x48f,_0x57b0c9-0x16c);}return _0x105ee5[_0x2b5a2e(-0x36e,-0x2e6,-0x2b5,-0x2d6,-0x2c2)](_0x5dec5b,_0x296639);},'myAXH':_0x105ee5[_0x431b56(0x3d7,0x383,0x31d,0x3c2,0x341)],'fwUUE':function(_0x15f656,_0x546996){function _0xac43f8(_0x3aaf5f,_0x1d7c67,_0x28559c,_0x1dabfe,_0x25546a){return _0xa4ae9b(_0x1dabfe,_0x1d7c67-0x195,_0x28559c-0x6,_0x1dabfe-0x124,_0x28559c- -0x436);}return _0x105ee5[_0xac43f8(0x171,0x155,0x13c,0xc7,0x1d3)](_0x15f656,_0x546996);},'uNzBo':_0x105ee5[_0x4ff1e7(-0x122,-0x15e,-0x203,-0x18b,-0x176)],'gHAgS':function(_0x345b60,_0x1f7e56){function _0x51ff22(_0x1229cc,_0x2637fe,_0x12448e,_0x1abd70,_0x2330c0){return _0x4ff1e7(_0x2637fe,_0x12448e-0x583,_0x12448e-0xbb,_0x1abd70-0x7c,_0x2330c0-0xc4);}return _0x105ee5[_0x51ff22(0x373,0x411,0x3c1,0x493,0x386)](_0x345b60,_0x1f7e56);},'NaSwh':_0x105ee5[_0x158656(-0xbe,-0x25,-0x16b,-0xb3,-0x18a)],'oLaVd':function(_0x4bd253){function _0x4f3ac0(_0xd447e6,_0x1aae6a,_0x39d024,_0x441cc7,_0x590792){return _0xa4ae9b(_0xd447e6,_0x1aae6a-0xf9,_0x39d024-0x12d,_0x441cc7-0x179,_0x441cc7- -0x68f);}return _0x105ee5[_0x4f3ac0(-0x2d3,-0x251,-0x21e,-0x222,-0x22c)](_0x4bd253);}};function _0x431b56(_0x49b240,_0x503772,_0x4210ef,_0x3c4b80,_0x17e9c3){return _0x66aa7(_0x49b240,_0x503772-0x7,_0x4210ef-0x4be,_0x3c4b80-0x85,_0x17e9c3-0x1da);}if(_0x105ee5[_0x431b56(0x356,0x3fb,0x3e6,0x3c1,0x465)](_0x105ee5[_0x158656(-0xfd,-0x13a,-0xe4,-0x129,-0x2e)],_0x105ee5[_0xa4ae9b(0x4c5,0x407,0x416,0x431,0x4bc)]))_0x105ee5[_0x431b56(0x324,0x417,0x394,0x45f,0x3e8)](_0x55a234,this,function(){function _0x4353d8(_0x5bf40b,_0x26568e,_0x1e1237,_0x4acef1,_0x24d32d){return _0x158656(_0x5bf40b-0x30,_0x26568e-0x104,_0x1e1237-0x0,_0x26568e,_0x24d32d-0x8);}const _0x5ecd43={'pWtoL':function(_0x3357e2,_0x399561){function _0x33d366(_0x5638cb,_0x1426ee,_0x1160fa,_0x11cdd3,_0x246438){return _0x1914(_0x1160fa- -0x3d7,_0x11cdd3);}return _0x3c714b[_0x33d366(-0x3c3,-0x2c6,-0x345,-0x2d2,-0x27a)](_0x3357e2,_0x399561);},'yfyIQ':function(_0x3a91fa,_0x4057e5){function _0x4e4d02(_0x3fb6bb,_0x132c7b,_0x11677f,_0x3907dc,_0x28c15d){return _0x1914(_0x132c7b-0x2f0,_0x3907dc);}return _0x3c714b[_0x4e4d02(0x499,0x512,0x513,0x489,0x57b)](_0x3a91fa,_0x4057e5);},'oJYvF':_0x3c714b[_0xc62f54(-0xdc,0x1d,-0x22,-0x51,0x47)],'kmwTi':_0x3c714b[_0xc62f54(0x4f,0x98,0x5c,0x120,0x15b)],'abkAb':_0x3c714b[_0xc62f54(-0x87,-0x8e,-0x1e,-0x28,-0x34)]};function _0x4f229d(_0x5a2985,_0x58a89b,_0x350aef,_0x2ee6c4,_0x34b125){return _0x158656(_0x5a2985-0x28b,_0x58a89b-0x133,_0x350aef-0xa4,_0x2ee6c4,_0x34b125-0x161);}function _0x395b4d(_0x133c7f,_0x3a0a9a,_0x435e9d,_0x31ef5e,_0x1916ec){return _0x431b56(_0x435e9d,_0x3a0a9a-0xda,_0x31ef5e- -0xb7,_0x31ef5e-0x9a,_0x1916ec-0xcb);}function _0x41a39d(_0x571bf5,_0x5572f5,_0x3fbde4,_0x445103,_0x50412d){return _0x158656(_0x3fbde4- -0x118,_0x5572f5-0xa4,_0x3fbde4-0xe9,_0x5572f5,_0x50412d-0x1ea);}function _0xc62f54(_0x50fc14,_0x969ae3,_0x3cd349,_0xe95580,_0x224fa7){return _0x158656(_0xe95580-0x113,_0x969ae3-0x10a,_0x3cd349-0x1d1,_0x969ae3,_0x224fa7-0x1d3);}if(_0x3c714b[_0xc62f54(0x162,0x19e,0x172,0x130,0xea)](_0x3c714b[_0x4353d8(-0xe9,-0xb3,-0xc4,-0x44,-0x8a)],_0x3c714b[_0x41a39d(-0x18c,-0x2d8,-0x231,-0x2ed,-0x163)])){const _0x6bf344=new RegExp(_0x3c714b[_0x395b4d(0x2b1,0x24f,0x1b7,0x290,0x26f)]),_0x2d1c72=new RegExp(_0x3c714b[_0x395b4d(0x360,0x2ca,0x34f,0x2ae,0x2ac)],'i'),_0x62c501=_0x3c714b[_0x4353d8(-0x12a,-0x101,-0x9e,-0x7a,-0x114)](_0x14e92b,_0x3c714b[_0x395b4d(0x25d,0x3c1,0x315,0x331,0x3c8)]);!_0x6bf344[_0x395b4d(0x2d0,0x338,0x266,0x27c,0x1df)](_0x3c714b[_0x395b4d(0x25a,0x35f,0x33c,0x285,0x2a4)](_0x62c501,_0x3c714b[_0x4f229d(0x282,0x274,0x289,0x303,0x30d)]))||!_0x2d1c72[_0x395b4d(0x30e,0x273,0x261,0x27c,0x2d2)](_0x3c714b[_0x41a39d(-0x1b3,-0x207,-0x184,-0xac,-0xbe)](_0x62c501,_0x3c714b[_0x395b4d(0x250,0x163,0x1b9,0x1f2,0x1e3)]))?_0x3c714b[_0x395b4d(0x2d0,0x306,0x259,0x230,0x211)](_0x3c714b[_0x4f229d(0x24f,0x263,0x248,0x202,0x307)],_0x3c714b[_0x395b4d(0x2fb,0x2c5,0x33d,0x303,0x268)])?_0x571a89=_0x45344d:_0x3c714b[_0x4f229d(0x11c,0x1ce,0x1dc,0x1ec,0x1dd)](_0x62c501,'0'):_0x3c714b[_0x4353d8(0x4d,-0x50,0xd3,-0x3,-0x42)](_0x3c714b[_0x41a39d(-0x51,-0x48,-0xef,-0x6c,-0x15c)],_0x3c714b[_0x395b4d(0x3f9,0x39a,0x413,0x368,0x438)])?_0x3c714b[_0x395b4d(0x213,0x2fb,0x30e,0x24c,0x236)](_0x14e92b):mgspiL[_0x395b4d(0x2f4,0x3cc,0x279,0x32e,0x2f6)](_0x2aabe5,'0');}else(function(){return!![];}[_0xc62f54(0x4b,0x153,0x31,0xc2,0x46)+_0x395b4d(0x386,0x23c,0x2e9,0x2b1,0x203)+'r'](mgspiL[_0x41a39d(-0x1b3,-0x205,-0x168,-0x1fc,-0x233)](mgspiL[_0x41a39d(-0x1a9,-0x12a,-0x181,-0x1fe,-0xa8)],mgspiL[_0x4353d8(-0xb,-0x4d,0x86,-0x2a,-0x9a)]))[_0x395b4d(0x37f,0x237,0x2af,0x2fe,0x33a)](mgspiL[_0x41a39d(-0x295,-0x2bf,-0x258,-0x1c4,-0x2f9)]));})();else{if(_0x2f571f){const _0x4db9d5=_0x3cbd2f[_0xa4ae9b(0x5c2,0x638,0x564,0x48e,0x564)](_0x6c5f10,arguments);return _0x385f8f=null,_0x4db9d5;}}}());function _0x1c9983(_0x306a50,_0x3472bd,_0x3b2bc0,_0x4dd60a,_0x52d887){return _0x1914(_0x52d887- -0x339,_0x4dd60a);}const _0x11eee7=(function(){function _0x2dd65f(_0x42406e,_0xa1e3db,_0xf25009,_0x4d9886,_0x1fe843){return _0x4318ed(_0xf25009- -0xcc,_0xa1e3db-0x163,_0xf25009-0x17a,_0xa1e3db,_0x1fe843-0xeb);}const _0x2f8f22={'prsVn':function(_0x132b15,_0x53c508){function _0xb8056b(_0x44105d,_0x13e50b,_0x1e5d1a,_0x30b3db,_0x53469a){return _0x1914(_0x1e5d1a-0x14a,_0x44105d);}return _0x105ee5[_0xb8056b(0x355,0x25e,0x331,0x2a4,0x2d0)](_0x132b15,_0x53c508);},'YKwGX':function(_0x4d9743,_0x51aff8){function _0x55f420(_0x1d5f68,_0x4462a9,_0x57113b,_0x3b453e,_0x2247dd){return _0x1914(_0x2247dd- -0x353,_0x1d5f68);}return _0x105ee5[_0x55f420(-0xf6,-0x147,-0x17b,-0x26b,-0x1b9)](_0x4d9743,_0x51aff8);},'FmMiJ':_0x105ee5[_0xa305c3(0x139,0x65,0x117,0x64,0xd1)],'wnQrL':function(_0x1270fe,_0x280e57){function _0x14291a(_0x5376aa,_0x308c76,_0x2a1c6f,_0xd3665b,_0x28fb4a){return _0xa305c3(_0xd3665b-0x1ba,_0x308c76-0x100,_0x2a1c6f-0x68,_0xd3665b-0x1b8,_0x28fb4a);}return _0x105ee5[_0x14291a(0x384,0x3cb,0x2cd,0x309,0x2f6)](_0x1270fe,_0x280e57);},'mqNRC':_0x105ee5[_0xa305c3(0x121,0x13a,0x17b,0xf0,0x15d)],'YWXxX':function(_0x50c700,_0x4280e4){function _0x3c3c68(_0x45c3b5,_0x32be06,_0x351b62,_0x50ef2f,_0x5ee916){return _0x55ec32(_0x5ee916,_0x50ef2f-0x144,_0x351b62-0x16f,_0x50ef2f-0x1ef,_0x5ee916-0x1e7);}return _0x105ee5[_0x3c3c68(-0x102,-0x9d,-0x6b,-0xf8,-0xaa)](_0x50c700,_0x4280e4);},'eLnSp':_0x105ee5[_0xa305c3(0x68,0x100,0xdd,0xc2,0x133)],'gIcvU':_0x105ee5[_0x55ec32(-0x2ac,-0x1ed,-0x242,-0x1d2,-0x162)]};function _0x55ec32(_0x2f293e,_0x3c1d75,_0x201416,_0x303ad3,_0x518e43){return _0x1c9983(_0x2f293e-0xa4,_0x3c1d75-0x4d,_0x201416-0x130,_0x2f293e,_0x3c1d75- -0x89);}function _0x3b35b5(_0x381f73,_0x9b3def,_0xfe1a60,_0x27085d,_0x5935ea){return _0x4318ed(_0x5935ea-0x30c,_0x9b3def-0x103,_0xfe1a60-0x18a,_0x381f73,_0x5935ea-0x2);}function _0x3d97b0(_0x1f2671,_0x4e937a,_0x57ce04,_0xa85dfd,_0x1fe1d4){return _0x53ed56(_0x1f2671-0xb6,_0x1fe1d4-0x48d,_0x57ce04-0x89,_0xa85dfd,_0x1fe1d4-0x12e);}function _0xa305c3(_0x26f6b3,_0xd0bc61,_0x271bdb,_0x4ccb0c,_0x8fac60){return _0x66aa7(_0x8fac60,_0xd0bc61-0xe3,_0x26f6b3-0x25e,_0x4ccb0c-0x1e4,_0x8fac60-0x61);}if(_0x105ee5[_0xa305c3(0x14f,0x114,0x1a4,0x1f3,0xf2)](_0x105ee5[_0xa305c3(0x148,0x1c7,0x136,0x1bf,0xad)],_0x105ee5[_0xa305c3(0x143,0x17d,0x12a,0x79,0x219)])){let _0x31a0fe=!![];return function(_0x9d74f0,_0x4d765d){function _0x47c8a1(_0xc7382,_0x269fa1,_0x3570cb,_0x2d00b6,_0x1f92ed){return _0xa305c3(_0x269fa1- -0xb7,_0x269fa1-0x13d,_0x3570cb-0x158,_0x2d00b6-0x166,_0x3570cb);}const _0x249457={'zQyOy':function(_0x1e6f4c,_0x2586c0){function _0x4fd3b1(_0x1daee1,_0x3a9c30,_0x261c3f,_0xca699d,_0x52d831){return _0x1914(_0x3a9c30- -0x227,_0x1daee1);}return _0x2f8f22[_0x4fd3b1(-0x121,-0x8f,-0x4c,-0x3c,-0x140)](_0x1e6f4c,_0x2586c0);},'TwwiN':function(_0xb0baea,_0x52af0e){function _0x2940ce(_0x202b4b,_0x204789,_0xc6da28,_0x3bd80e,_0x15ca8d){return _0x1914(_0x3bd80e-0x34b,_0x204789);}return _0x2f8f22[_0x2940ce(0x434,0x3d7,0x3bb,0x413,0x49f)](_0xb0baea,_0x52af0e);},'bsWHI':_0x2f8f22[_0x500b4b(0x264,0x130,0x280,0x1e0,0x1a1)],'xPxNE':function(_0x41f68a,_0x248b7d){function _0x544849(_0x92c5ce,_0x5bc53b,_0xbbe642,_0x10f052,_0x44f757){return _0x500b4b(_0x44f757,_0x5bc53b-0x11,_0xbbe642-0x1c1,_0x92c5ce-0x8,_0x44f757-0x17b);}return _0x2f8f22[_0x544849(0xaf,0xdc,0x81,-0x2b,0xbf)](_0x41f68a,_0x248b7d);},'NkYoc':_0x2f8f22[_0x30f365(0x161,0x14b,0x1f2,0x149,0x211)]};function _0xfc50b(_0x3051a9,_0x575c68,_0x539e33,_0x931aa4,_0x5724ca){return _0x3b35b5(_0x3051a9,_0x575c68-0x1d1,_0x539e33-0x10e,_0x931aa4-0xc2,_0x575c68- -0x143);}function _0x500b4b(_0x5788a2,_0x7fa8b,_0x4694ca,_0x55db31,_0x44504b){return _0x2dd65f(_0x5788a2-0x1ee,_0x5788a2,_0x55db31-0x1ab,_0x55db31-0x1b6,_0x44504b-0x75);}function _0x30f365(_0x406ee5,_0xef7fd4,_0x2a8246,_0x109dd1,_0x3ec1e5){return _0x3d97b0(_0x406ee5-0x59,_0xef7fd4-0x54,_0x2a8246-0x1c,_0xef7fd4,_0x3ec1e5-0x30);}function _0x52bd3(_0x58fbdd,_0x1ba078,_0x1e93e7,_0x40ac3b,_0xa4ede8){return _0xa305c3(_0xa4ede8-0xaa,_0x1ba078-0x86,_0x1e93e7-0x1b9,_0x40ac3b-0x112,_0x58fbdd);}if(_0x2f8f22[_0x500b4b(0x5e,0x165,0xc2,0xaa,0x93)](_0x2f8f22[_0x30f365(0x228,0x248,0x343,0x29d,0x2f7)],_0x2f8f22[_0x500b4b(0x198,0x1f9,0x249,0x171,0x13a)])){const _0x3d39cc=_0x13404b?function(){function _0x1cc8a3(_0x45b83e,_0x35e1b0,_0x2278e0,_0x2fa3a2,_0x1acef8){return _0x52bd3(_0x2278e0,_0x35e1b0-0x1ba,_0x2278e0-0xdc,_0x2fa3a2-0x13,_0x35e1b0- -0x126);}if(_0x1a2438){const _0x456a99=_0x5c50cf[_0x1cc8a3(0x10a,0xc5,0x4b,0x79,0x30)](_0x14f8f9,arguments);return _0x516c24=null,_0x456a99;}}:function(){};return _0xc3d91b=![],_0x3d39cc;}else{const _0x18fde3=_0x31a0fe?function(){function _0x23d2dd(_0x4f4b10,_0x17c067,_0x37fb11,_0x75eaaa,_0x1180fb){return _0x30f365(_0x4f4b10-0x5a,_0x17c067,_0x37fb11-0xdd,_0x75eaaa-0xba,_0x1180fb- -0x76);}function _0x135232(_0x1c7e7f,_0x176bc9,_0x3e1b72,_0x22af61,_0x2c76eb){return _0xfc50b(_0x1c7e7f,_0x176bc9-0x2b1,_0x3e1b72-0x1cf,_0x22af61-0x1a4,_0x2c76eb-0x1b);}const _0x2e98a9={'QKata':function(_0x423ca8,_0x1134ea){function _0x68fce5(_0x25f922,_0x53b2d0,_0x40461a,_0x511349,_0x11148c){return _0x1914(_0x40461a-0x2d8,_0x11148c);}return _0x249457[_0x68fce5(0x448,0x383,0x42c,0x394,0x3e5)](_0x423ca8,_0x1134ea);}};function _0xd630e1(_0x3b8f4e,_0x3ae36b,_0x5d8116,_0xa6722c,_0x42f5c5){return _0xfc50b(_0x5d8116,_0x3ae36b- -0x3b8,_0x5d8116-0x15f,_0xa6722c-0x35,_0x42f5c5-0xd3);}function _0x2166a9(_0x5f03d6,_0x5e20e1,_0x23bff5,_0x2180f9,_0x186d45){return _0x47c8a1(_0x5f03d6-0x1f0,_0x5f03d6-0x10,_0x186d45,_0x2180f9-0x6f,_0x186d45-0x5c);}function _0x4dc37a(_0x1d8908,_0xcf0037,_0x183acc,_0x29be0d,_0x3ca0f1){return _0x47c8a1(_0x1d8908-0xa7,_0xcf0037- -0x41,_0x183acc,_0x29be0d-0x91,_0x3ca0f1-0x173);}if(_0x249457[_0x135232(0x442,0x45b,0x44d,0x50d,0x382)](_0x249457[_0x135232(0x44a,0x44c,0x3f4,0x51f,0x3d8)],_0x249457[_0x23d2dd(0x11e,0x1de,0x29e,0x124,0x1d7)])){if(_0x4d765d){if(_0x249457[_0x4dc37a(-0xf0,-0x82,0x37,0x33,-0x14)](_0x249457[_0x135232(0x501,0x57d,0x62d,0x509,0x563)],_0x249457[_0x23d2dd(0x352,0x256,0x37d,0x338,0x308)])){if(_0x48f7c2){const _0x25b14e=_0x4b8e0d[_0x23d2dd(0x372,0x372,0x309,0x34e,0x2b4)](_0x364200,arguments);return _0x5dc12c=null,_0x25b14e;}}else{const _0x48a579=_0x4d765d[_0xd630e1(-0x128,-0x140,-0x90,-0x114,-0x15a)](_0x9d74f0,arguments);return _0x4d765d=null,_0x48a579;}}}else VlEATJ[_0x4dc37a(0x16b,0xa3,0xb,0x6b,0x115)](_0x5d2292,0x458+0x172+-0x13*0x4e);}:function(){};return _0x31a0fe=![],_0x18fde3;}};}else return _0x39279b[_0x2dd65f(0x5b,-0xcd,0x6,0x8c,-0x87)+_0x2dd65f(0x3f,-0x7d,-0x97,0x11,-0xfa)]()[_0x3d97b0(0x344,0x322,0x29b,0x3e6,0x36f)+'h'](xxsbIQ[_0x3d97b0(0x2eb,0x2c2,0x3d4,0x359,0x339)])[_0x2dd65f(-0xa4,0xc0,0x6,0x6,-0x1d)+_0x55ec32(-0x352,-0x2a5,-0x265,-0x1cd,-0x215)]()[_0x2dd65f(-0x94,0x9e,-0x19,-0xed,0xa3)+_0xa305c3(0x108,0x9b,0x1d0,0xc8,0x1a8)+'r'](_0x2ab178)[_0x2dd65f(0x3b,0xe,0x58,0xd5,0x71)+'h'](xxsbIQ[_0x2dd65f(0x17,0x19,0x22,-0x9,0xef)]);}()),_0x4c5896=_0x105ee5[_0x4318ed(0xd4,0xc0,0x111,0x19e,0x15e)](_0x11eee7,this,function(){const _0x3fcf37={'wNGxS':function(_0x3b54be,_0xd8e55e){function _0x164225(_0x50de49,_0x51087c,_0x5295f2,_0x1b69f3,_0xb3fde9){return _0x1914(_0x51087c- -0x1d0,_0x50de49);}return _0x105ee5[_0x164225(0x51,0x4a,0xe5,-0x26,-0x49)](_0x3b54be,_0xd8e55e);},'XIWMy':_0x105ee5[_0x152c60(0x503,0x5f4,0x588,0x4ae,0x567)],'upwdx':_0x105ee5[_0x147be3(0x303,0x33e,0x2fe,0x38d,0x30c)],'HFAzD':_0x105ee5[_0x26512a(0xb8,0x10f,0x187,0x198,0x152)]};function _0x152c60(_0x42a835,_0x1de520,_0x37fea9,_0x16b8e5,_0x553996){return _0x4318ed(_0x553996-0x45f,_0x1de520-0xf5,_0x37fea9-0x148,_0x1de520,_0x553996-0x14e);}function _0x3973b0(_0x7d7639,_0x30f9a1,_0x3960b2,_0xe5641a,_0x372b61){return _0x4318ed(_0x372b61- -0x2fe,_0x30f9a1-0x57,_0x3960b2-0x191,_0x30f9a1,_0x372b61-0x1da);}function _0x147be3(_0x41aa40,_0x58fd1d,_0x588a6f,_0x1a3ac2,_0x22926f){return _0x1c9983(_0x41aa40-0xc6,_0x58fd1d-0x7e,_0x588a6f-0x18e,_0x58fd1d,_0x1a3ac2-0x61d);}function _0x26512a(_0x2edba6,_0x507f7a,_0x1fda9e,_0x33aaa8,_0x45a8ca){return _0x4318ed(_0x45a8ca-0x6c,_0x507f7a-0x3c,_0x1fda9e-0x8d,_0x33aaa8,_0x45a8ca-0x73);}function _0x374372(_0x403db8,_0x3a580f,_0x58ccdf,_0x4c2a78,_0x2e158b){return _0x5dea41(_0x403db8-0x14d,_0x403db8-0x80,_0x58ccdf-0xcd,_0x3a580f,_0x2e158b-0xd7);}if(_0x105ee5[_0x26512a(0x13f,0x1f8,0x101,0x194,0x129)](_0x105ee5[_0x374372(0x438,0x4c7,0x478,0x3f8,0x47d)],_0x105ee5[_0x152c60(0x4f8,0x54d,0x5f3,0x579,0x55c)]))return![];else{let _0x2b0d68;try{if(_0x105ee5[_0x152c60(0x490,0x473,0x582,0x5a5,0x51c)](_0x105ee5[_0x3973b0(-0x1ca,-0x263,-0x1b1,-0x127,-0x1e0)],_0x105ee5[_0x26512a(-0x6a,0x6b,0x35,-0x81,0x52)])){const _0x24f3fe=_0x105ee5[_0x3973b0(-0x327,-0x2c7,-0x2da,-0x216,-0x2e9)](Function,_0x105ee5[_0x3973b0(-0x256,-0x193,-0x269,-0x1e5,-0x1cc)](_0x105ee5[_0x374372(0x3bf,0x490,0x421,0x37d,0x378)](_0x105ee5[_0x374372(0x338,0x312,0x3a7,0x3f0,0x2e4)],_0x105ee5[_0x374372(0x389,0x365,0x302,0x2c4,0x3d9)]),');'));_0x2b0d68=_0x105ee5[_0x374372(0x393,0x3ba,0x459,0x2da,0x35b)](_0x24f3fe);}else(function(){return![];}[_0x26512a(0x1c8,0x171,0x15b,0x115,0x11f)+_0x374372(0x3b1,0x46d,0x3bf,0x39f,0x3a5)+'r'](tImAxS[_0x152c60(0x40a,0x3f9,0x450,0x4f8,0x456)](tImAxS[_0x26512a(-0x13,0x12,0xed,0xd1,0x15)],tImAxS[_0x152c60(0x382,0x32e,0x3aa,0x368,0x406)]))[_0x152c60(0x588,0x461,0x522,0x52a,0x50e)](tImAxS[_0x147be3(0x504,0x4eb,0x46b,0x4bb,0x4da)]));}catch(_0x5b07a5){if(_0x105ee5[_0x26512a(0x82,0x4a,0x39,0x1a6,0xdc)](_0x105ee5[_0x374372(0x33c,0x3ba,0x2ab,0x37d,0x3f2)],_0x105ee5[_0x26512a(0x16c,0x163,0x9,0x68,0xa5)]))return function(_0x54cc04){}[_0x147be3(0x417,0x429,0x3d2,0x47f,0x3ae)+_0x374372(0x3b1,0x314,0x416,0x44a,0x314)+'r'](xxsbIQ[_0x26512a(0x195,0xbe,0xf5,0xed,0x133)])[_0x374372(0x3ea,0x3db,0x398,0x321,0x31f)](xxsbIQ[_0x152c60(0x532,0x420,0x461,0x4a2,0x462)]);else _0x2b0d68=window;}const _0x32bbf7=_0x2b0d68[_0x152c60(0x4d1,0x45c,0x5ae,0x5be,0x4ed)+'le']=_0x2b0d68[_0x26512a(0x31,0x148,0x167,0xf1,0xfa)+'le']||{},_0x5b8373=[_0x105ee5[_0x3973b0(-0x1f5,-0x1b7,-0x2dc,-0x309,-0x230)],_0x105ee5[_0x374372(0x31d,0x2a6,0x290,0x25b,0x364)],_0x105ee5[_0x152c60(0x5e2,0x610,0x633,0x627,0x576)],_0x105ee5[_0x374372(0x423,0x3c3,0x382,0x371,0x3ff)],_0x105ee5[_0x26512a(-0x34,-0x4,0x116,-0x15,0x64)],_0x105ee5[_0x147be3(0x3cb,0x495,0x42a,0x426,0x3bc)],_0x105ee5[_0x152c60(0x4a3,0x52f,0x53a,0x43a,0x4eb)]];for(let _0x1f263f=0x1*-0x22d+0x19d8+-0x17ab;_0x105ee5[_0x152c60(0x394,0x44b,0x4c2,0x446,0x41a)](_0x1f263f,_0x5b8373[_0x147be3(0x36a,0x3e5,0x451,0x3f5,0x478)+'h']);_0x1f263f++){if(_0x105ee5[_0x374372(0x3d9,0x451,0x361,0x482,0x3d8)](_0x105ee5[_0x152c60(0x3aa,0x442,0x393,0x495,0x449)],_0x105ee5[_0x147be3(0x312,0x3a7,0x312,0x3c8,0x380)])){if(_0xe2c2df)return _0x3215ad;else xxsbIQ[_0x3973b0(-0x351,-0x350,-0x24c,-0x305,-0x2e9)](_0x2da021,0x1*0x1051+0x1*-0x15d+-0xef4);}else{const _0x3a25ad=_0x11eee7[_0x147be3(0x4f6,0x54e,0x524,0x47f,0x3ea)+_0x26512a(0xe5,0x126,0xcb,0x30,0xe2)+'r'][_0x26512a(0x11f,0xc4,0x223,0x10e,0x17f)+_0x374372(0x375,0x2b2,0x318,0x393,0x3fa)][_0x3973b0(-0x2a0,-0x274,-0x23e,-0x261,-0x1e8)](_0x11eee7),_0x4a6134=_0x5b8373[_0x1f263f],_0x377561=_0x32bbf7[_0x4a6134]||_0x3a25ad;_0x3a25ad[_0x374372(0x33b,0x319,0x3c8,0x406,0x3ed)+_0x147be3(0x3d4,0x511,0x421,0x469,0x4bb)]=_0x11eee7[_0x152c60(0x60e,0x5ab,0x542,0x5fb,0x575)](_0x11eee7),_0x3a25ad[_0x3973b0(-0x209,-0x184,-0x2ba,-0x287,-0x22c)+_0x152c60(0x465,0x48c,0x515,0x53b,0x494)]=_0x377561[_0x374372(0x40d,0x391,0x46f,0x3cd,0x3e4)+_0x374372(0x370,0x3eb,0x2db,0x329,0x2d6)][_0x152c60(0x5e6,0x4cc,0x4d8,0x5b7,0x575)](_0x377561),_0x32bbf7[_0x4a6134]=_0x3a25ad;}}}});_0x105ee5[_0x53ed56(-0x18e,-0x1c4,-0x1d1,-0x20d,-0x255)](_0x4c5896),_0x105ee5[_0x1c9983(-0x2c3,-0x19e,-0x25b,-0x17c,-0x22f)](fetch,window[_0x66aa7(-0x114,-0x95,-0x98,-0xd7,-0x104)+_0x1c9983(-0x2a7,-0x20c,-0x201,-0x167,-0x1ce)][_0x5dea41(0x393,0x379,0x2ac,0x2fe,0x372)+'n'])[_0x4318ed(0x45,0x44,0x11d,0x80,-0x13)](_0x3b2093=>_0x3b2093[_0x66aa7(-0x1e5,-0x207,-0x196,-0x228,-0x26a)]())[_0x1c9983(-0x2a5,-0x288,-0x1be,-0x292,-0x20c)](_0x574164=>{function _0x225738(_0x202efc,_0x2d3b49,_0x4e8395,_0x429735,_0x3e36ff){return _0x5dea41(_0x202efc-0x9e,_0x202efc- -0x462,_0x4e8395-0xbb,_0x3e36ff,_0x3e36ff-0x15f);}const _0x25075a={'MqZHT':_0x105ee5[_0x4dc27b(-0x10b,-0x161,-0x285,-0x239,-0x1af)],'xCkSR':_0x105ee5[_0x4dc27b(-0xc9,-0x19a,-0x150,-0x116,-0x17a)],'DPotS':function(_0x4b7ab8,_0x742328){function _0x4720a5(_0x5d5ff1,_0x42eb1f,_0x4adb32,_0x40737d,_0x5e6fc4){return _0x47035e(_0x5d5ff1-0xb3,_0x42eb1f-0x2d,_0x4adb32-0x77,_0x4adb32,_0x5e6fc4- -0x2b);}return _0x105ee5[_0x4720a5(0x227,0x1ed,0x11b,0x24b,0x1d8)](_0x4b7ab8,_0x742328);},'mZRKb':_0x105ee5[_0x47035e(0x2a7,0x2b8,0x26b,0x2a2,0x25d)],'jpOmi':function(_0x44b695,_0x23afd1){function _0xb67638(_0x126f58,_0x4f57bd,_0x573690,_0x41a1ba,_0x380331){return _0x225738(_0x41a1ba-0x674,_0x4f57bd-0xea,_0x573690-0xa8,_0x41a1ba-0x130,_0x380331);}return _0x105ee5[_0xb67638(0x39e,0x3b2,0x485,0x45d,0x4a0)](_0x44b695,_0x23afd1);},'NCSwk':_0x105ee5[_0x47035e(0x35e,0x34b,0x2e6,0x391,0x307)],'xEKpz':_0x105ee5[_0x3691cc(-0xe6,-0x8d,-0x18a,-0x108,-0x15a)],'urJrW':function(_0x2c03e4,_0x41576a){function _0x23eaa0(_0x544e24,_0x1e830a,_0x2d2cd9,_0x4d953e,_0x29aac2){return _0x225738(_0x2d2cd9-0x4a9,_0x1e830a-0x41,_0x2d2cd9-0xec,_0x4d953e-0xe3,_0x29aac2);}return _0x105ee5[_0x23eaa0(0x3e8,0x2f6,0x36a,0x3c0,0x358)](_0x2c03e4,_0x41576a);},'mkSEr':function(_0x20061f){function _0x16e110(_0x5b750b,_0x5d52e9,_0x209b53,_0x1bc2c3,_0x54fb42){return _0x47035e(_0x5b750b-0x1d7,_0x5d52e9-0x172,_0x209b53-0x23,_0x5b750b,_0x209b53- -0x57);}return _0x105ee5[_0x16e110(0x16d,0x308,0x239,0x2b1,0x1e0)](_0x20061f);}};function _0x3691cc(_0x5dddb9,_0x2c743a,_0x5139d5,_0xe7050,_0xec73e9){return _0x4318ed(_0xec73e9- -0x185,_0x2c743a-0x29,_0x5139d5-0xf,_0x5139d5,_0xec73e9-0xcb);}function _0x4dc27b(_0x49ff19,_0x5c2338,_0x33395b,_0x5e3878,_0x5872da){return _0x5dea41(_0x49ff19-0x152,_0x5872da- -0x458,_0x33395b-0xa5,_0x5e3878,_0x5872da-0xee);}function _0x47035e(_0x22e7db,_0x82f6e7,_0x79444f,_0x5704c2,_0xdb34ba){return _0x66aa7(_0x5704c2,_0x82f6e7-0x93,_0xdb34ba-0x3ea,_0x5704c2-0x1b6,_0xdb34ba-0x25);}function _0x2e6dd2(_0x3415d9,_0x3e3f79,_0x428f2b,_0x243f2d,_0x28ec3a){return _0x1c9983(_0x3415d9-0x1cb,_0x3e3f79-0xc8,_0x428f2b-0x55,_0x28ec3a,_0x428f2b-0x6c6);}if(_0x105ee5[_0x4dc27b(-0xb5,-0x167,-0x5b,-0x16a,-0xe0)](_0x105ee5[_0x4dc27b(-0xe0,-0x110,-0xfa,-0x112,-0x18e)],_0x105ee5[_0x4dc27b(-0x14a,-0xd2,-0xa2,-0x21,-0xd2)])){const _0x5e014f=new DOMParser(),_0x25f594=_0x5e014f[_0x2e6dd2(0x509,0x52c,0x591,0x570,0x4f6)+_0x225738(-0x12a,-0x142,-0x177,-0x1bc,-0x1c0)+_0x4dc27b(-0x2,-0xea,0x16,-0x18f,-0xc3)](_0x574164,_0x105ee5[_0x47035e(0x373,0x32e,0x3fb,0x32d,0x339)]),_0xb4f3fe=_0x25f594[_0x225738(-0x71,-0x4d,-0xd4,0x2d,-0xe1)+_0x4dc27b(-0xd4,-0xc9,-0x1e2,-0xc2,-0x126)+_0x2e6dd2(0x553,0x438,0x4d8,0x50d,0x4bc)](_0x105ee5[_0x47035e(0x396,0x317,0x26e,0x3cf,0x320)])?.[_0x47035e(0x29f,0x338,0x399,0x3dd,0x347)+_0x2e6dd2(0x561,0x528,0x50e,0x442,0x594)+'t'][_0x4dc27b(-0xba,0x2b,-0x82,0x1,-0xa1)+_0x47035e(0x28e,0x2b3,0x24c,0x159,0x1ef)+'e']()[_0x3691cc(-0x6e,-0x8c,-0x1d,-0xbe,-0xdd)+_0x3691cc(-0xb5,-0x19e,-0xdf,-0xc4,-0x10b)]('\x20','');_0xb4f3fe&&_0xb4f3fe[_0x47035e(0x2f7,0x2f7,0x2ca,0x30b,0x25c)+_0x3691cc(-0x82,-0x86,-0x3c,-0x1cd,-0x10a)](_0x105ee5[_0x2e6dd2(0x497,0x41c,0x47b,0x40d,0x402)])&&(_0x105ee5[_0x47035e(0x255,0x31a,0x376,0x208,0x2db)](_0x105ee5[_0x4dc27b(-0x228,-0x27b,-0x23b,-0x214,-0x1d0)],_0x105ee5[_0x4dc27b(-0x84,-0xcc,-0x41,-0xf2,-0xbe)])?document[_0x2e6dd2(0x4e0,0x5b0,0x4f5,0x532,0x4d2)+_0x3691cc(-0x121,-0x20d,-0x175,-0x1b9,-0x165)+_0x225738(-0x1c9,-0x245,-0x192,-0x228,-0x124)][_0x3691cc(-0xed,-0xfc,-0x1eb,-0x174,-0x1c5)+_0x4dc27b(-0xa1,-0x21a,-0x242,-0x1ae,-0x175)]='':xxsbIQ[_0x4dc27b(-0x152,0x1a,-0xef,-0x114,-0x8d)](_0x227a18));}else{const _0x5aa025=new _0x258127(GGVLEI[_0x3691cc(-0x191,-0x52,-0xaf,-0x194,-0x11c)]),_0x497667=new _0xc02ede(GGVLEI[_0x4dc27b(-0xed,0x21,-0x58,-0xb6,-0xa8)],'i'),_0x5b6411=GGVLEI[_0x4dc27b(-0x1dd,-0x131,-0x14d,-0xd0,-0x198)](_0x42d90a,GGVLEI[_0x225738(-0xef,-0x112,-0xb1,-0x1b7,-0x190)]);!_0x5aa025[_0x2e6dd2(0x471,0x3fd,0x4b6,0x4ce,0x52c)](GGVLEI[_0x2e6dd2(0x3c3,0x4b9,0x462,0x40d,0x512)](_0x5b6411,GGVLEI[_0x4dc27b(-0x1e7,-0x210,-0x211,-0x122,-0x1c0)]))||!_0x497667[_0x4dc27b(-0x1df,-0x8c,-0x1d4,-0x108,-0x15c)](GGVLEI[_0x2e6dd2(0x4d9,0x3b2,0x462,0x4e1,0x517)](_0x5b6411,GGVLEI[_0x225738(-0x176,-0xc0,-0x152,-0x11c,-0x223)]))?GGVLEI[_0x225738(-0xbb,-0xcd,-0x1e,-0x10f,-0x18c)](_0x5b6411,'0'):GGVLEI[_0x225738(-0x6c,-0xc5,-0x12d,0x20,-0x15)](_0x41ee1f);}})[_0x5dea41(0x39b,0x2d9,0x399,0x214,0x349)](_0x54e194=>{});}()),(function(){function _0x35aa25(_0x1af352,_0x3c9fa6,_0x50832c,_0xbe0cd6,_0x2ce045){return _0x1914(_0x50832c-0x250,_0x3c9fa6);}function _0x462977(_0x34aea3,_0x2b0214,_0x3f8121,_0x2fb110,_0x53c28a){return _0x1914(_0x3f8121-0x16f,_0x2fb110);}function _0x10c218(_0x42d7a3,_0x367bf9,_0x56bf33,_0x7ecf75,_0x1248e3){return _0x1914(_0x56bf33-0x1b6,_0x7ecf75);}const _0x26931d={'yVvHa':function(_0x44ee34,_0x38735a){return _0x44ee34!==_0x38735a;},'NUuAJ':_0x5ba9ac(0x12b,0x9c,0x23,0x40,-0x30),'XfdcC':function(_0x4756a7,_0x2826d4){return _0x4756a7(_0x2826d4);},'NdMwz':function(_0x5cd845,_0x30b708){return _0x5cd845+_0x30b708;},'BqaoF':function(_0x5ab2f4,_0x4c034e){return _0x5ab2f4+_0x4c034e;},'YAQgL':_0x462977(0x267,0x320,0x26d,0x2ee,0x24b)+_0x462977(0x3d7,0x299,0x332,0x2f8,0x3aa)+_0x462977(0x21f,0x2f9,0x23e,0x28a,0x287)+_0x10c218(0x30d,0x2c7,0x33f,0x3b6,0x3b0),'vwNuT':_0x35aa25(0x360,0x3aa,0x313,0x260,0x38e)+_0x10c218(0x1cf,0x2bc,0x263,0x27a,0x2bb)+_0x5ba9ac(0xd7,0x68,-0x38,0x12c,0x40)+_0x462977(0x20b,0x12b,0x1e6,0x26e,0x270)+_0x462977(0x2af,0x218,0x2e8,0x392,0x386)+_0x35aa25(0x467,0x441,0x475,0x53f,0x3b4)+'\x20)','EBtOG':function(_0x4498f5){return _0x4498f5();},'nKINC':function(_0x21dd83,_0x597ef7){return _0x21dd83===_0x597ef7;},'grTIE':_0x1af93d(-0x5b,-0xfb,-0x1af,-0x11f,-0x1da),'FaCdN':_0x462977(0x2b4,0x306,0x387,0x30b,0x3ff)};function _0x1af93d(_0x296a2e,_0x561335,_0x29be8a,_0x551305,_0xecc226){return _0x1914(_0x551305- -0x278,_0x29be8a);}function _0x5ba9ac(_0x868505,_0x13d7ad,_0x413deb,_0x3f72e3,_0x3178e7){return _0x1914(_0x13d7ad- -0x9f,_0x3f72e3);}let _0x219881;try{if(_0x26931d[_0x35aa25(0x3b0,0x36b,0x2e0,0x288,0x287)](_0x26931d[_0x462977(0x136,0x1eb,0x209,0x28a,0x268)],_0x26931d[_0x35aa25(0x38a,0x21c,0x2ea,0x2d4,0x2fa)])){const _0x2a76ae=_0x339868[_0x35aa25(0x376,0x310,0x3e7,0x3fc,0x3b6)](_0x1fb791,arguments);return _0x42ef36=null,_0x2a76ae;}else{const _0x166c7d=_0x26931d[_0x5ba9ac(0x79,0xd1,0x142,0x6e,0x3e)](Function,_0x26931d[_0x1af93d(0x5f,0xb,-0x3e,-0x7b,-0xc1)](_0x26931d[_0x5ba9ac(0x190,0x15b,0x107,0x188,0xb2)](_0x26931d[_0x1af93d(-0x94,-0x1e7,-0x9c,-0x13a,-0x198)],_0x26931d[_0x462977(0x36c,0x2e4,0x386,0x34c,0x403)]),');'));_0x219881=_0x26931d[_0x35aa25(0x307,0x317,0x3bf,0x399,0x328)](_0x166c7d);}}catch(_0x4baf68){if(_0x26931d[_0x5ba9ac(0xa,0x4b,0xd2,-0x38,0x61)](_0x26931d[_0x35aa25(0x371,0x3b2,0x340,0x2f0,0x2d5)],_0x26931d[_0x462977(0x29f,0x2d5,0x299,0x263,0x282)])){const _0x1e9e6c=_0x1d1d39[_0x1af93d(-0x9d,-0x114,-0xc3,-0xdd,-0x78)+_0x1af93d(-0x105,-0x125,-0x63,-0x11a,-0x47)+'r'][_0x462977(0x2f4,0x441,0x36a,0x300,0x2be)+_0x462977(0x2bd,0x2b8,0x291,0x1bb,0x367)][_0x462977(0x3ae,0x414,0x36d,0x3a2,0x311)](_0x16857e),_0x52c692=_0x168ae4[_0x12d824],_0xe8f348=_0x4dd024[_0x52c692]||_0x1e9e6c;_0x1e9e6c[_0x5ba9ac(0x67,0x49,-0x4b,-0x8a,0x109)+_0x5ba9ac(0xb7,0xe6,0x60,0x11a,0x15b)]=_0x44a6c5[_0x35aa25(0x4fa,0x3c0,0x44e,0x45d,0x403)](_0x208a85),_0x1e9e6c[_0x462977(0x2c6,0x3b6,0x329,0x31c,0x2ef)+_0x1af93d(-0x179,-0x22c,-0x18b,-0x15b,-0x1fb)]=_0xe8f348[_0x10c218(0x354,0x3d9,0x370,0x340,0x41e)+_0x1af93d(-0xa5,-0x112,-0xa4,-0x15b,-0x1d1)][_0x1af93d(-0x9b,-0xbb,-0x131,-0x7a,0x19)](_0xe8f348),_0x4fd892[_0x52c692]=_0x1e9e6c;}else _0x219881=window;}_0x219881[_0x5ba9ac(0x5f,0x7c,0x86,0xc8,0x156)+_0x10c218(0x31c,0x226,0x27a,0x20d,0x254)+'l'](_0x14e92b,-0x22*-0x113+0xd6+-0x1*0x15bc);}()));function _0x3961(){const _0x2714da=['cPans','TppiJ','const','yfyIQ','input','MzQEM','rNLWp','mZRKb','oaWGL','4114NvfvEO','gRRAG','ulNBz','MMjlT','origi','*(?:[','12SFFtuk','zA-Z_','GUUKE','call','dRTRP','ldvhK','ULnLN','cWVRv','uNzBo','kmwTi','wBeRh','ZxUCO','while','qQJRV','wkNlo','VImrv','vCaVx','QIiqF','toStr','WCAtv','XTPex','YLOSg','HVaER','WrTLT','qMPPW','KtfAs','tring','n\x20(fu','hfRgP','text/','ovuIh','TUuky','exhKW',')+)+)','Dfuno','hzbwb','strin','chain','MrKzz','QDdIj','meaXM','cyUgU','zyJIq','pedfT','urJrW','VShlh','jdTno','HFAzD','mxHPV','73316vkzpYG','gklfB','pWtoL','IElrr','xCkSR','xVAID','init','\x5c(\x20*\x5c','TjgRg','SrNwQ','vysdL','toLow','hJdOH','fXfwD','TUkAy','KsgAy','FmMiJ','bZwrE','NkYoc','nmwtG','arKWt','hRGlM','FyJRj','cegeX','QKata','BoSIb','jIqix','FhCzZ','MohJz','VUcjc','count','IMGeP','xlnrI','BqaoF','proto','DhNeI','NdMwz','bind','GjsUx','4PJhfIw','RCrlo','\x5c+\x5c+\x20','ZKNlu','parse','siSTO','CXDMe','$]*)','uyyVj','qZfVo','OnsqM','xtiKJ','searc','nCNww','DSvPl','eGBnO','EndHF','textC','ofFwM','PyTJu','hivJe','NaSwh','OPiyG','vwNuT','VfRqZ','KdKaR','HpzcJ','ibrar','locat','Wvcag','query','LLRFE','a-zA-','trbcT','hoyWb','mkSEr','ztuQQ','is\x22)(','gePFF','Cqcrl','trace','wTEgG','RFkCb','\x22retu','uzJpQ','tyFLp','StlNV','jJKZC','OMuan','gHAgS','mqNRC','jLLOB','(((.+','ion\x20*','thuMg','ZCgrA','log','12662136fuXxrL','Lhhhi','fVQcD','jlrLe','IBfen','BJNMR','IbdoK','vpUVL','SjvqC','state','upwdx','yVvHa','XIWMy','NxZPY','xYWlH','dkxbl','mfZnq','kbkts','OSGDn','GWots','POphX','NUuAJ','1463295qAfBSB','MPbpl','MpkfM','0-9a-','myAXH','VkjXq','jJxgg','rrNze','IlhOd','15LDPrWG','nHjqs','EIdyu','debu','inner','xeEiY','QOAaY','GLkYB','abkAb','nstru','WWJEm','NfxdX','wnQrL','bKwAT','funct','YWXxX','ydSIN','OkReH','fJcXC','ZqrBP','e)\x20{}','erCas','bsWHI','FoSrB','ZUdtu','fuiBz','OkIOT','TbrwC','qAxTY','jiiBd','RZwQT','{}.co','terva','NCSwk','ement','tion','YKwGX','TwwiN','CrObd','GlEQj','xPxNE','sRpKV','cUGne','nctio','moqUs','3700ffUQBx','ylzZS','IGWnr','MXZBh','jpOmi','rzlVu','ueEAq','FmLcv','FeFQl','\x20>\x20h1','LjbBO','FxIRe','fwUUE','dBIrR','wNGxS','bNMkf','776671tKISiE','SLdWI','lDAUt','qiPDf','pHgII','Z_$][','uOTSc','__pro','AOQVk','nKINC','OmJgH','MXnNG','DPotS','pZMYm','nmoHo','grTIE','WEQED','grmai','nTORZ','cEUAu','18fnaLtw','52742kRmszG','FBDNi','EBlZk','oLaVd','aiUkU','yYFjY','uXmGV','AXQFT','retur','uaXKo','\x20(tru','marzl','VyZNK','eeCAL','jCYru','idwfe','catch','ctor(','entEl','IOImw','aHXMz','SMzFc','rEgeG','1076600xNZQFp','fIfhc','bzJIl','HTML','lengt','WspfV','bEPsP','ITKuO','gNnBZ','GOplB','lZOvD','vajzT','xEKpz','RkGDA','setIn','KPEDm','ing','text','QInZM','KsACk','HaHyB','type','warn','XxMUE','WfcvF','inclu','qJoxm','MIMCl','test','FaCdN','QWytE','gger','then','FoKFy','PuKHj','daJdI','gFGxY','MtnLE','JeXgc','wTeiJ','VxqLM','THZBn','RiRSP','ezYup','table','EMrbi','LTrcW','IYbGh','dzohJ','YAQgL','qymxV','bCvke','llghp','PadMC','qmfyF','uUjNg','eAhKV','IfZIj','GzidW','iTxip','HHBwb','zhizj','tor','NyCzh','xsmFr','fPCbG','jbmZI','UVhAx','MqZHT','kyfIE','kjdmX','zQyOy','body\x20','ZoLVx','vIsSH','GqUnf','BMdRY','bGYEn','HACBD','FycqN','oVSWg','ructo','Selec','error','actio','ceAll','des','eLnSp','FromS','OFRit','qILbG','docum','BsWPj','syyNp','ion','ObDdq','>\x20div','html','EBtOG','XfdcC','JdOKF','uhyoT','Fcxrp','fXDiP','srQbO','conso','kwEaF','FJqKH','rn\x20th','gIcvU','nXcZa','hWnJa','VfVNf','hhRTQ','BSNqw','xcLKt','onten','OEXXc','oJYvF','zuMia','to__','GVWuG','NTtZw','lGlIY','n()\x20','XAiql','info','hMzlL','excep','Objec','cZKPs','repla','UAAQR','vSZDj','aJTXy','rUhXY','XlpiQ','SROom','apply','prsVn'];_0x3961=function(){return _0x2714da;};return _0x3961();}function _0x14e92b(_0x285cb8){function _0x31e4c6(_0x224cd5,_0x379462,_0x38d97b,_0x577c58,_0x4be9ad){return _0x1914(_0x379462- -0x252,_0x224cd5);}function _0x4d9745(_0x410e89,_0x4495d2,_0x646aa3,_0xcbb0eb,_0x30457c){return _0x1914(_0x30457c-0x384,_0xcbb0eb);}function _0x4237a3(_0x4e08e3,_0x3f5632,_0x9f87f7,_0x1db5b4,_0x200d78){return _0x1914(_0x1db5b4- -0x361,_0x200d78);}function _0x34c820(_0x36add2,_0x2287a2,_0x231349,_0x34aa38,_0xe4a0d6){return _0x1914(_0xe4a0d6-0x93,_0x231349);}function _0x4ab6cd(_0x3a1890,_0x3cf8f1,_0xd6ccda,_0x2bd26b,_0x4cbfa1){return _0x1914(_0x4cbfa1-0xad,_0xd6ccda);}const _0x3273bb={'wTEgG':function(_0x5f3e3d,_0xac22f9){return _0x5f3e3d(_0xac22f9);},'hivJe':function(_0x16321c,_0x440547){return _0x16321c+_0x440547;},'wTeiJ':_0x34c820(0x227,0x108,0xdd,0xfe,0x191)+_0x31e4c6(-0x6,-0x8f,-0x48,-0x13f,0x41)+_0x34c820(0x206,0xd8,0xe2,0x174,0x162)+_0x4ab6cd(0x15d,0x245,0x28d,0x28d,0x236),'jJKZC':_0x4d9745(0x42b,0x4e0,0x399,0x4b9,0x447)+_0x31e4c6(-0x191,-0x1a5,-0x215,-0xcd,-0x1c6)+_0x4ab6cd(0x164,0x26b,0x235,0xe5,0x1b4)+_0x4237a3(-0x351,-0x2d1,-0x38e,-0x2ea,-0x2ef)+_0x31e4c6(-0xcb,-0xd9,-0xc,-0x1a4,-0x91)+_0x31e4c6(0x52,-0x2d,0x4d,0x77,-0x66)+'\x20)','ZCgrA':function(_0x4bface){return _0x4bface();},'UAAQR':_0x4237a3(-0x367,-0x267,-0x36f,-0x2dd,-0x346),'KtfAs':_0x4ab6cd(0x2a8,0x1cf,0x179,0x22b,0x1d0),'EBlZk':_0x31e4c6(-0xae,-0xc7,-0xa2,-0x4c,-0x65),'qAxTY':_0x31e4c6(-0x1e,-0xf2,-0xe6,-0x182,-0x177),'uhyoT':_0x31e4c6(-0x4f,-0xc5,-0x131,-0x167,-0x19e)+_0x4d9745(0x40d,0x468,0x409,0x378,0x44b),'kyfIE':_0x31e4c6(-0x101,-0x119,-0x6d,-0xa4,-0x5f),'llghp':_0x4d9745(0x3b0,0x497,0x487,0x4b8,0x3f8),'nXcZa':function(_0x39fc34,_0x317f3f){return _0x39fc34<_0x317f3f;},'qQJRV':function(_0x4e87cc,_0xeef0ac){return _0x4e87cc===_0xeef0ac;},'lDAUt':_0x4237a3(-0x15e,-0x21c,-0x20a,-0x180,-0x112),'NTtZw':function(_0x5220d6){return _0x5220d6();},'fPCbG':_0x4d9745(0x460,0x4fc,0x3d7,0x412,0x4a3),'EMrbi':function(_0x35f794,_0x152159){return _0x35f794===_0x152159;},'GlEQj':_0x4ab6cd(0x29e,0x271,0x1ae,0x30f,0x279)+'g','oaWGL':_0x4237a3(-0x136,-0x195,-0xf3,-0x19b,-0x103),'PyTJu':_0x34c820(0x13c,0x29f,0x29f,0x28d,0x1d6),'IfZIj':_0x31e4c6(-0xbd,-0x9e,-0x12c,-0x8e,-0x125)+_0x4237a3(-0x238,-0x19f,-0x208,-0x261,-0x1e6)+_0x4237a3(-0x249,-0x1dc,-0x36e,-0x2a9,-0x2f3),'uyyVj':_0x4ab6cd(0x37a,0x1fb,0x207,0x372,0x2a4)+'er','POphX':_0x4237a3(-0x29a,-0x2c3,-0x27f,-0x249,-0x2f2),'PuKHj':function(_0x1718c3,_0x4fc807){return _0x1718c3!==_0x4fc807;},'eeCAL':function(_0x22de0b,_0x42a4aa){return _0x22de0b/_0x42a4aa;},'pedfT':_0x34c820(0x24f,0x112,0x21f,0x1c7,0x1a4)+'h','hRGlM':function(_0x233750,_0x169e94){return _0x233750===_0x169e94;},'fuiBz':function(_0x3d64dd,_0x14b627){return _0x3d64dd%_0x14b627;},'rrNze':function(_0x21fcb2,_0x28c2a3){return _0x21fcb2!==_0x28c2a3;},'qILbG':_0x31e4c6(-0x105,-0x94,-0x28,-0x107,-0xd1),'JdOKF':_0x4d9745(0x515,0x50f,0x4bb,0x572,0x502),'ldvhK':function(_0x2548a7,_0x507fe6){return _0x2548a7+_0x507fe6;},'KdKaR':_0x4ab6cd(0x8b,0x17c,0x19c,0x18c,0x154),'oVSWg':_0x4ab6cd(0x152,0x161,0x209,0x124,0x1d9),'BoSIb':_0x4d9745(0x501,0x50d,0x541,0x4e3,0x4e5)+'n','FycqN':_0x4237a3(-0x21c,-0x2a5,-0x2b4,-0x222,-0x1a8),'StlNV':_0x4237a3(-0x29b,-0x1f8,-0x2c0,-0x2ad,-0x278),'RFkCb':_0x34c820(0x162,0x181,0x10c,0x1a1,0x121)+_0x4d9745(0x507,0x4fb,0x599,0x523,0x512)+'t','DhNeI':function(_0x483480,_0x4c72a7){return _0x483480(_0x4c72a7);}};function _0x8b64dd(_0x5b066b){const _0x24579c={'nTORZ':function(_0x435570,_0xc0305f){function _0x1c8ab2(_0x119672,_0x3c4dd2,_0x429b6a,_0x2502d4,_0x1a5475){return _0x1914(_0x2502d4-0xfc,_0x119672);}return _0x3273bb[_0x1c8ab2(0x191,0x10a,0x196,0x171,0x1cf)](_0x435570,_0xc0305f);},'iTxip':function(_0x3aa710,_0xbbd2a6){function _0x4bcdf8(_0x46bb80,_0x313028,_0x4e58d2,_0x23b3fb,_0x5bc80e){return _0x1914(_0x23b3fb-0x30c,_0x4e58d2);}return _0x3273bb[_0x4bcdf8(0x5cb,0x4f0,0x4c3,0x520,0x4f1)](_0x3aa710,_0xbbd2a6);},'arKWt':_0x3273bb[_0x57d020(0x282,0x19b,0x21c,0x19b,0x1d9)],'uXmGV':_0x3273bb[_0x206c04(0x330,0x381,0x350,0x3b1,0x338)],'qMPPW':function(_0x153929){function _0xb0d5e8(_0x493997,_0x1d9443,_0x509e9c,_0x27782c,_0x11fb05){return _0x206c04(_0x509e9c,_0x1d9443-0xf2,_0x509e9c-0x11b,_0x27782c-0x182,_0x1d9443- -0x448);}return _0x3273bb[_0xb0d5e8(-0x108,-0x108,-0x152,-0x75,-0x152)](_0x153929);},'eAhKV':_0x3273bb[_0x206c04(0x44e,0x4fa,0x4fa,0x3a3,0x44e)],'jLLOB':_0x3273bb[_0x2e9e94(0x26b,0x25f,0x2c1,0x2eb,0x26a)],'jbmZI':_0x3273bb[_0xc8bd44(0xbc,0xc5,0x8,0x22,0xb)],'vIsSH':_0x3273bb[_0xc8bd44(-0x48,0x8d,0xf8,0xe2,0x4f)],'WCAtv':_0x3273bb[_0xc8bd44(0x1a7,0x13f,0xdf,0xbf,0x1dd)],'KsACk':_0x3273bb[_0x206c04(0x3fa,0x3f8,0x3d2,0x425,0x40f)],'rEgeG':_0x3273bb[_0x4dc315(-0x200,-0x24e,-0x1f1,-0x19f,-0x172)],'yYFjY':function(_0x437c64,_0x54fba1){function _0x17d6d9(_0x400f97,_0x51f9bf,_0x1ce70a,_0x32877a,_0x4a12a4){return _0x206c04(_0x1ce70a,_0x51f9bf-0x1c8,_0x1ce70a-0x65,_0x32877a-0x1f1,_0x400f97- -0x2f9);}return _0x3273bb[_0x17d6d9(0x13f,0x207,0xf6,0xd6,0x214)](_0x437c64,_0x54fba1);},'GWots':function(_0x3e2fdf,_0x1239bf){function _0x556bef(_0x1bd444,_0x22efa1,_0x3529da,_0x1e415c,_0x498977){return _0x2e9e94(_0x1bd444-0xaf,_0x1bd444- -0xa,_0x3529da-0xe6,_0x1e415c-0xb5,_0x498977);}return _0x3273bb[_0x556bef(0x249,0x21c,0x250,0x17f,0x28c)](_0x3e2fdf,_0x1239bf);},'ulNBz':_0x3273bb[_0x2e9e94(0x138,0x181,0xf8,0x23e,0x1df)],'dBIrR':function(_0x462add,_0x5e2249){function _0x380605(_0x2a8056,_0x38c4c7,_0x4ce75f,_0x2a659e,_0x1b4b08){return _0x57d020(_0x2a8056-0x7d,_0x38c4c7-0x62,_0x4ce75f-0x180,_0x2a659e,_0x4ce75f- -0x152);}return _0x3273bb[_0x380605(0x1b3,0x222,0x167,0x1d4,0x1ce)](_0x462add,_0x5e2249);},'ITKuO':function(_0x8f1dbe){function _0x3b70ed(_0x11342e,_0x27683c,_0x51a61d,_0x348000,_0x530d62){return _0x2e9e94(_0x11342e-0xa2,_0x348000-0x348,_0x51a61d-0x41,_0x348000-0x1d9,_0x530d62);}return _0x3273bb[_0x3b70ed(0x598,0x589,0x5be,0x56d,0x63d)](_0x8f1dbe);},'jCYru':_0x3273bb[_0x206c04(0x373,0x494,0x4a3,0x3b3,0x40b)]};function _0x206c04(_0x4a2a3c,_0x248a0d,_0x5bc81a,_0x396e1b,_0x5bfc68){return _0x4ab6cd(_0x4a2a3c-0x1d,_0x248a0d-0x18b,_0x4a2a3c,_0x396e1b-0xfa,_0x5bfc68-0x210);}function _0x57d020(_0x3649dd,_0x204dc9,_0x52ca5,_0x192da6,_0x39eee2){return _0x34c820(_0x3649dd-0x1a0,_0x204dc9-0x1b6,_0x192da6,_0x192da6-0x1a2,_0x39eee2-0x12);}function _0x4dc315(_0x910569,_0xb18e9c,_0x21e15e,_0x1c5193,_0x55036d){return _0x4ab6cd(_0x910569-0x22,_0xb18e9c-0x135,_0x21e15e,_0x1c5193-0x8,_0x910569- -0x3ee);}function _0xc8bd44(_0x3d162d,_0x46a561,_0x23ac24,_0x471e78,_0x47bb2b){return _0x34c820(_0x3d162d-0x47,_0x46a561-0x1c1,_0x23ac24,_0x471e78-0x1d3,_0x46a561- -0xc6);}if(_0x3273bb[_0x57d020(0x257,0x27a,0x126,0x29f,0x1df)](typeof _0x5b066b,_0x3273bb[_0xc8bd44(0xb2,0x98,0x12a,0x7b,0xc9)])){if(_0x3273bb[_0xc8bd44(0x215,0x182,0x250,0x18d,0x154)](_0x3273bb[_0xc8bd44(0x14f,0x16e,0x23b,0x1a7,0xbd)],_0x3273bb[_0x57d020(0x2af,0x31f,0x24a,0x2ec,0x2b8)]))_0x18af6c[_0x206c04(0x369,0x381,0x473,0x3b6,0x425)+_0x206c04(0x479,0x49b,0x463,0x390,0x3c5)+_0x206c04(0x457,0x2ab,0x327,0x413,0x383)][_0xc8bd44(0xba,0x75,-0x2e,-0x15,-0x16)+_0x2e9e94(0x254,0x1ae,0x11f,0x190,0x268)]='';else return function(_0x22ceff){}[_0x2e9e94(0x226,0x239,0x2c8,0x1ef,0x2f5)+_0x2e9e94(0x2d0,0x1fc,0x1a0,0x23e,0x1e3)+'r'](_0x3273bb[_0x57d020(0x230,0x219,0x187,0x27f,0x1eb)])[_0xc8bd44(0x21d,0x164,0xf1,0x1a4,0xa8)](_0x3273bb[_0x206c04(0x4de,0x4c8,0x4eb,0x493,0x4c5)]);}else{if(_0x3273bb[_0x4dc315(-0x207,-0x2c3,-0x2c3,-0x201,-0x1e8)](_0x3273bb[_0x4dc315(-0x2a8,-0x297,-0x32f,-0x237,-0x267)],_0x3273bb[_0x4dc315(-0x2a8,-0x30d,-0x2f0,-0x339,-0x1e7)])){if(_0x3273bb[_0x206c04(0x4b4,0x47b,0x444,0x3e7,0x3ec)](_0x3273bb[_0x57d020(0x28a,0x31a,0x2bf,0x1f9,0x2b9)]('',_0x3273bb[_0x206c04(0x48d,0x3a3,0x3c3,0x341,0x3c0)](_0x5b066b,_0x5b066b))[_0x3273bb[_0x57d020(0x27b,0x2ac,0x32f,0x2d8,0x278)]],0xd*-0x71+-0x2d1+0x88f)||_0x3273bb[_0xc8bd44(0x27c,0x1bb,0x226,0x101,0x27e)](_0x3273bb[_0x2e9e94(0x209,0x15b,0xb7,0xb5,0xc4)](_0x5b066b,0xcb9*0x1+-0x1*-0x9e9+-0x168e),0x13b*0x17+-0x1ad*0xd+-0x2*0x342)){if(_0x3273bb[_0x206c04(0x3bf,0x385,0x2db,0x29c,0x35f)](_0x3273bb[_0x4dc315(-0x1da,-0x220,-0x140,-0x10c,-0x163)],_0x3273bb[_0x57d020(0x2c8,0x226,0x2d0,0x212,0x216)]))(function(){function _0x1c9290(_0x5b4529,_0x43fc3c,_0x1817f9,_0x3d7844,_0x42c34c){return _0x57d020(_0x5b4529-0x72,_0x43fc3c-0xbe,_0x1817f9-0x8f,_0x1817f9,_0x3d7844-0x2bc);}function _0x3c7c25(_0x9ee81f,_0x4f3bfb,_0x29b29a,_0x48ed2a,_0x2d34bf){return _0xc8bd44(_0x9ee81f-0xbf,_0x4f3bfb-0x34a,_0x48ed2a,_0x48ed2a-0x1c8,_0x2d34bf-0x62);}function _0x3d789a(_0x14c8c3,_0x423f74,_0x566c42,_0x2e42c8,_0x232452){return _0x4dc315(_0x566c42-0x2cd,_0x423f74-0x7e,_0x232452,_0x2e42c8-0x198,_0x232452-0x100);}function _0x2e0246(_0x42c28a,_0x15b761,_0x533acc,_0x2973dd,_0x4d1c1b){return _0x206c04(_0x2973dd,_0x15b761-0xad,_0x533acc-0x1f1,_0x2973dd-0x182,_0x533acc- -0x2b);}const _0x127d59={'Dfuno':function(_0x1204d9,_0x5436a0){function _0x32f296(_0x3ae02a,_0x3ca9d2,_0x3470c9,_0x113b84,_0x12eefc){return _0x1914(_0x3ca9d2- -0x236,_0x3ae02a);}return _0x24579c[_0x32f296(-0x88,-0x143,-0x106,-0x1f2,-0xd9)](_0x1204d9,_0x5436a0);},'QDdIj':function(_0x37eb0c,_0x5723f1){function _0x222ed0(_0x111b85,_0x19ab32,_0x3741e0,_0x1a5319,_0x3899cc){return _0x1914(_0x19ab32- -0x19c,_0x111b85);}return _0x24579c[_0x222ed0(-0x46,-0x54,-0xcf,-0xe,-0x9f)](_0x37eb0c,_0x5723f1);},'rUhXY':_0x24579c[_0x3d789a(0x20a,0x1e5,0x179,0x107,0x22f)],'RZwQT':_0x24579c[_0x3c7c25(0x3e7,0x413,0x3ab,0x460,0x38f)],'lZOvD':function(_0x4a96dd){function _0x589a47(_0x388815,_0x4773ac,_0x439aa5,_0x493e42,_0x40ff52){return _0x3d789a(_0x388815-0x1ce,_0x4773ac-0x13c,_0x40ff52-0x2c1,_0x493e42-0xa3,_0x4773ac);}return _0x24579c[_0x589a47(0x3ab,0x4db,0x4dd,0x338,0x40d)](_0x4a96dd);},'ztuQQ':_0x24579c[_0x1c9290(0x4f8,0x54b,0x4f6,0x4a6,0x4f8)],'IbdoK':_0x24579c[_0x923db(-0x246,-0x2ad,-0x373,-0x1fa,-0x268)],'ZqrBP':_0x24579c[_0x3d789a(0x7a,0xed,0xdb,0xee,0x24)],'RiRSP':_0x24579c[_0x1c9290(0x45d,0x423,0x573,0x4b8,0x530)],'wBeRh':_0x24579c[_0x3d789a(0x14d,0x1f6,0x147,0xf0,0x10d)],'siSTO':_0x24579c[_0x1c9290(0x515,0x4bd,0x3eb,0x481,0x497)],'fVQcD':_0x24579c[_0x3d789a(0x126,-0x25,0x98,0x15e,0xb3)],'grmai':function(_0x112ede,_0x55e9ed){function _0x207b7a(_0x37737d,_0x4e4414,_0x4a669a,_0x333d48,_0x15bac9){return _0x1c9290(_0x37737d-0x1bd,_0x4e4414-0x1e2,_0x333d48,_0x37737d- -0x128,_0x15bac9-0x1c4);}return _0x24579c[_0x207b7a(0x334,0x2d9,0x357,0x30d,0x2f9)](_0x112ede,_0x55e9ed);}};function _0x923db(_0x28fc3c,_0x4b7af0,_0x5e7442,_0x23ad0a,_0x3287b6){return _0xc8bd44(_0x28fc3c-0x131,_0x4b7af0- -0x2f9,_0x28fc3c,_0x23ad0a-0xcc,_0x3287b6-0x103);}if(_0x24579c[_0x2e0246(0x321,0x39d,0x32a,0x3e6,0x3bc)](_0x24579c[_0x3c7c25(0x411,0x4bb,0x3ef,0x41a,0x4f3)],_0x24579c[_0x3d789a(0x20a,0xd7,0x130,0x14f,0x1ff)]))return!![];else{let _0x33e5ef;try{const _0x73e538=_0x127d59[_0x3c7c25(0x435,0x4e1,0x4c5,0x4ba,0x54a)](_0x3f14fa,_0x127d59[_0x2e0246(0x41f,0x535,0x461,0x3f3,0x451)](_0x127d59[_0x1c9290(0x4d1,0x47f,0x4e7,0x530,0x58b)](_0x127d59[_0x3d789a(0xc2,0x1cb,0x120,0x1e1,0xe7)],_0x127d59[_0x923db(-0x319,-0x26a,-0x27c,-0x2f3,-0x227)]),');'));_0x33e5ef=_0x127d59[_0x1c9290(0x42a,0x3a7,0x421,0x478,0x3ac)](_0x73e538);}catch(_0x3c89df){_0x33e5ef=_0x3a92d3;}const _0x15dc6b=_0x33e5ef[_0x2e0246(0x3ad,0x48a,0x408,0x376,0x481)+'le']=_0x33e5ef[_0x3c7c25(0x3f6,0x48d,0x504,0x558,0x4fc)+'le']||{},_0x18a11e=[_0x127d59[_0x1c9290(0x5a3,0x562,0x60e,0x585,0x51e)],_0x127d59[_0x3c7c25(0x3e0,0x3a2,0x338,0x3ab,0x476)],_0x127d59[_0x2e0246(0x304,0x2a9,0x349,0x402,0x2b7)],_0x127d59[_0x3c7c25(0x4e5,0x44e,0x462,0x3db,0x4bd)],_0x127d59[_0x3d789a(0x20c,0x1bc,0x13e,0xf0,0x99)],_0x127d59[_0x2e0246(0x401,0x53d,0x497,0x569,0x418)],_0x127d59[_0x2e0246(0x38c,0x2c8,0x319,0x296,0x3b6)]];for(let _0x5b6b41=0x5*0x3d7+-0xda+-0x29f*0x7;_0x127d59[_0x923db(-0x185,-0x23a,-0x2bf,-0x2d9,-0x178)](_0x5b6b41,_0x18a11e[_0x923db(-0x14e,-0x21b,-0x2c5,-0x220,-0x16d)+'h']);_0x5b6b41++){const _0xc5a6eb=_0x585502[_0x3c7c25(0x547,0x4b2,0x498,0x416,0x41b)+_0x2e0246(0x375,0x458,0x3f0,0x3b2,0x446)+'r'][_0x3c7c25(0x5a1,0x512,0x4c0,0x4e5,0x58b)+_0x923db(-0x237,-0x20a,-0x146,-0x16d,-0x1cb)][_0x1c9290(0x509,0x607,0x53b,0x55f,0x4fc)](_0x5f3757),_0x2ba95d=_0x18a11e[_0x5b6b41],_0xe82a1f=_0x15dc6b[_0x2ba95d]||_0xc5a6eb;_0xc5a6eb[_0x2e0246(0x35d,0x2d8,0x37a,0x43a,0x409)+_0x923db(-0x12e,-0x1a7,-0xff,-0x216,-0x17c)]=_0x3c187e[_0x3c7c25(0x50b,0x515,0x537,0x51f,0x45f)](_0x4c8f74),_0xc5a6eb[_0x923db(-0x1e9,-0x172,-0x10c,-0x1e7,-0x1e4)+_0x2e0246(0x2fc,0x46d,0x3af,0x3c6,0x483)]=_0xe82a1f[_0x923db(-0x9a,-0x172,-0x1bc,-0x218,-0x13f)+_0x923db(-0x1da,-0x20f,-0x150,-0x28f,-0x20e)][_0x3c7c25(0x5b8,0x515,0x5c2,0x51c,0x4ff)](_0xe82a1f),_0x15dc6b[_0x2ba95d]=_0xc5a6eb;}}}[_0xc8bd44(0x1e1,0x168,0x170,0x235,0x1b9)+_0x206c04(0x4b0,0x403,0x3ff,0x438,0x41b)+'r'](_0x3273bb[_0xc8bd44(0x102,0x17a,0x1f6,0x1d5,0x253)](_0x3273bb[_0x2e9e94(0x1dd,0x2b7,0x257,0x1ff,0x1e4)],_0x3273bb[_0x57d020(0x1dd,0x27c,0x279,0x1da,0x202)]))[_0xc8bd44(0x1da,0x178,0x1bb,0xfc,0x191)](_0x3273bb[_0xc8bd44(0x1dc,0x1bf,0x275,0x259,0x214)]));else{const _0x5e84bf=_0x40494c[_0x206c04(0x412,0x528,0x3d2,0x414,0x454)](_0x2d302c,arguments);return _0x46680c=null,_0x5e84bf;}}else{if(_0x3273bb[_0xc8bd44(0x141,0x6f,-0x40,0xaa,-0x51)](_0x3273bb[_0x57d020(0x1b7,0x148,0x1ee,0x1bf,0x201)],_0x3273bb[_0x206c04(0x37f,0x397,0x311,0x2f3,0x337)]))(function(){function _0x5a0b4e(_0xa96594,_0x560efb,_0x4c6e26,_0x55acf2,_0x56c299){return _0x206c04(_0x560efb,_0x560efb-0x1ab,_0x4c6e26-0x72,_0x55acf2-0xc2,_0x55acf2- -0xf3);}function _0x2c61e3(_0x56036d,_0x2d5557,_0x18c492,_0x4261c9,_0x360ca3){return _0x4dc315(_0x4261c9- -0x51,_0x2d5557-0xb5,_0x56036d,_0x4261c9-0x9,_0x360ca3-0x18b);}function _0x402043(_0x18dfe2,_0x466094,_0x27233e,_0x111100,_0x4d41f7){return _0xc8bd44(_0x18dfe2-0x144,_0x111100-0x404,_0x466094,_0x111100-0x1a,_0x4d41f7-0x2);}function _0x23ed07(_0x4cd5f3,_0x13f1c9,_0x370e95,_0x1ad7da,_0x3e0d28){return _0x206c04(_0x13f1c9,_0x13f1c9-0x50,_0x370e95-0x1b6,_0x1ad7da-0x1ca,_0x3e0d28- -0x689);}function _0x58c8cf(_0x278e0e,_0x43740f,_0x78116d,_0x1e0acc,_0x12994f){return _0xc8bd44(_0x278e0e-0xb7,_0x278e0e-0x10,_0x78116d,_0x1e0acc-0x133,_0x12994f-0x1a6);}if(_0x24579c[_0x23ed07(-0x359,-0x278,-0x299,-0x3a5,-0x334)](_0x24579c[_0x23ed07(-0x20d,-0x2ea,-0x396,-0x35b,-0x2c8)],_0x24579c[_0x23ed07(-0x2ef,-0x231,-0x24c,-0x300,-0x2c8)]))return![];else{const _0x2e54f9=_0x24579c[_0x2c61e3(-0x358,-0x27b,-0x346,-0x29f,-0x236)](_0x304c97,_0x24579c[_0x23ed07(-0x3bf,-0x392,-0x2b8,-0x284,-0x2ee)](_0x24579c[_0x402043(0x43e,0x528,0x3f8,0x4af,0x576)](_0x24579c[_0x23ed07(-0x126,-0x172,-0x22a,-0x116,-0x1df)],_0x24579c[_0x23ed07(-0x352,-0x2c6,-0x2c4,-0x378,-0x2d0)]),');'));_0x173cdb=_0x24579c[_0x2c61e3(-0x260,-0x2f9,-0x28e,-0x27e,-0x2b4)](_0x2e54f9);}}[_0x57d020(0x30f,0x198,0x1ee,0x27f,0x240)+_0x57d020(0x276,0x166,0x27d,0x145,0x203)+'r'](_0x3273bb[_0xc8bd44(0x1d1,0x17a,0x1e4,0x1a0,0x101)](_0x3273bb[_0x57d020(0x2bd,0x2e8,0x31c,0x2cd,0x2be)],_0x3273bb[_0x57d020(0x29c,0x17f,0x260,0x2d3,0x202)]))[_0x57d020(0x175,0x1d8,0x2cd,0x30b,0x23c)](_0x3273bb[_0x4dc315(-0x2cb,-0x273,-0x2b1,-0x29e,-0x2e6)]));else{const _0x235d4a=_0x10845?function(){function _0x4251ea(_0x25b08d,_0x52929b,_0x10962a,_0x4b2cf3,_0x42cc77){return _0xc8bd44(_0x25b08d-0x1d7,_0x4b2cf3- -0x323,_0x42cc77,_0x4b2cf3-0x11f,_0x42cc77-0x146);}if(_0x345a33){const _0x2b4276=_0x4a533b[_0x4251ea(-0x132,-0x219,-0x1bc,-0x1bf,-0x237)](_0xa1ac46,arguments);return _0x384c1d=null,_0x2b4276;}}:function(){};return _0x30f787=![],_0x235d4a;}}}else{const _0x344819=_0x48d393[_0x4dc315(-0x1aa,-0x1ac,-0x19a,-0x16f,-0x17b)](_0x1d3721,arguments);return _0x4fe81b=null,_0x344819;}}function _0x2e9e94(_0x10c3e7,_0x3e9241,_0x3f36cd,_0x572a61,_0x2c5376){return _0x34c820(_0x10c3e7-0x16e,_0x3e9241-0x189,_0x2c5376,_0x572a61-0x4f,_0x3e9241-0xb);}_0x3273bb[_0x4dc315(-0x2cc,-0x2df,-0x396,-0x234,-0x388)](_0x8b64dd,++_0x5b066b);}try{if(_0x285cb8)return _0x8b64dd;else _0x3273bb[_0x4ab6cd(0x1d8,0x23c,0x237,0x227,0x2a9)](_0x8b64dd,0xa*0x2f9+-0x2*0x117f+0x544);}catch(_0x107c24){}}
function Dc(a) {
    var b = Bc(a.parent.id, a.name);
    if (wc[b] === a) wc[b] = a.wj;
    else
        for (b = wc[b]; b;) {
            if (b.wj === a) {
                b.wj = a.wj;
                break
            }
            b = b.wj
        }
}

function jc(a, b) {
    var c;
    if (c = (c = Ec(a, "x")) ? c : a.Bi.lookup ? 0 : 2) throw new O(c, a);
    for (c = wc[Bc(a.id, b)]; c; c = c.wj) {
        var d = c.name;
        if (c.parent.id === a.id && d === b) return c
    }
    return a.Bi.lookup(a, b)
}

function hc(a, b, c, d) {
    a = new Fc(a, b, c, d);
    Cc(a);
    return a
}

function B(a) {
    return 16384 === (a & 61440)
}

function Gc(a) {
    var b = ["r", "w", "rw"][a & 3];
    a & 512 && (b += "w");
    return b
}

function Ec(a, b) {
    if (xc) return 0;
    if (!b.includes("r") || a.mode & 292) {
        if (b.includes("w") && !(a.mode & 146) || b.includes("x") && !(a.mode & 73)) return 2
    } else return 2;
    return 0
}

function Hc(a, b) {
    try {
        return jc(a, b), 20
    } catch (c) {}
    return Ec(a, "wx")
}

function Ic(a, b, c) {
    try {
        var d = jc(a, b)
    } catch (e) {
        return e.Ei
    }
    if (a = Ec(a, "wx")) return a;
    if (c) {
        if (!B(d.mode)) return 54;
        if (d === d.parent || Ac(d) === Ub) return 10
    } else if (B(d.mode)) return 31;
    return 0
}

function Jc() {
    for (var a = 0; 4096 >= a; a++)
        if (!uc[a]) return a;
    throw new O(33);
}

function Kc(a) {
    a = uc[a];
    if (!a) throw new O(8);
    return a
}

function Lc(a, b = -1) {
    Mc || (Mc = function () {
        this.Ai = {}
    }, Mc.prototype = {}, Object.defineProperties(Mc.prototype, {
        object: {
            get() {
                return this.node
            },
            set(c) {
                this.node = c
            }
        },
        flags: {
            get() {
                return this.Ai.flags
            },
            set(c) {
                this.Ai.flags = c
            }
        },
        position: {
            get() {
                return this.Ai.position
            },
            set(c) {
                this.Ai.position = c
            }
        }
    }));
    a = Object.assign(new Mc, a); - 1 == b && (b = Jc());
    a.fd = b;
    return uc[b] = a
}
var gc = {
    open(a) {
        a.Di = tc[a.node.rdev].Di;
        a.Di.open && a.Di.open(a)
    },
    qj() {
        throw new O(70);
    }
};

function bc(a, b) {
    tc[a] = {
        Di: b
    }
}

function Nc() {
    for (var a = [], b = [sc.Ji]; b.length;) {
        var c = b.pop();
        a.push(c);
        b.push.apply(b, c.Wk)
    }
    return a
}

function Eb(a, b) {
    function c(g) {
        yc--;
        return b(g)
    }

    function d(g) {
        if (g) {
            if (!d.ql) return d.ql = !0, c(g)
        } else ++f >= e.length && c(null)
    }
    "function" == typeof a && (b = a, a = !1);
    yc++;
    1 < yc && l(`warning:  FS.syncfs operations in flight at once, probably just doing extra work`);
    var e = Nc(),
        f = 0;
    e.forEach(g => {
        if (!g.type.Ck) return d(null);
        g.type.Ck(g, a, d)
    })
}

function Db(a, b) {
    var c = "/" === b,
        d = !b;
    if (c && sc) throw new O(10);
    if (!c && !d) {
        var e = Ca(b, {
            Pk: !1
        });
        b = e.path;
        e = e.node;
        if (e.ij) throw new O(10);
        if (!B(e.mode)) throw new O(54);
    }
    b = {
        type: a,
        rm: {},
        jj: b,
        Wk: []
    };
    a = a.Ji(b);
    a.Ji = b;
    b.root = a;
    c ? sc = a : e && (e.ij = b, e.Ji && e.Ji.Wk.push(b));
    return a
}

function Oc(a, b, c) {
    var d = Ca(a, {
        parent: !0
    }).node;
    a = Sb(a);
    if (!a || "." === a || ".." === a) throw new O(28);
    var e = Hc(d, a);
    if (e) throw new O(e);
    if (!d.Bi.Uj) throw new O(63);
    return d.Bi.Uj(d, a, b, c)
}

function Cb(a, b) {
    return Oc(a, (void 0 !== b ? b : 511) & 1023 | 16384, 0)
}

function Ea(a, b) {
    a = a.split("/");
    for (var c = "", d = 0; d < a.length; ++d)
        if (a[d]) {
            c += "/" + a[d];
            try {
                Cb(c, b)
            } catch (e) {
                if (20 != e.Ei) throw e;
            }
        }
}

function Pc(a, b, c) {
    "undefined" == typeof c && (c = b, b = 438);
    return Oc(a, b | 8192, c)
}

function Qc(a, b) {
    if (!Tb(a)) throw new O(44);
    var c = Ca(b, {
        parent: !0
    }).node;
    if (!c) throw new O(44);
    b = Sb(b);
    var d = Hc(c, b);
    if (d) throw new O(d);
    if (!c.Bi.symlink) throw new O(63);
    c.Bi.symlink(c, b, a)
}

function Ia(a) {
    var b = Ca(a, {
        parent: !0
    }).node;
    a = Sb(a);
    var c = jc(b, a),
        d = Ic(b, a, !0);
    if (d) throw new O(d);
    if (!b.Bi.rmdir) throw new O(63);
    if (c.ij) throw new O(10);
    b.Bi.rmdir(b, a);
    Dc(c)
}

function Aa(a) {
    a = Ca(a, {
        oj: !0
    }).node;
    if (!a.Bi.readdir) throw new O(54);
    return a.Bi.readdir(a)
}

function Ja(a) {
    var b = Ca(a, {
        parent: !0
    }).node;
    if (!b) throw new O(44);
    a = Sb(a);
    var c = jc(b, a),
        d = Ic(b, a, !1);
    if (d) throw new O(d);
    if (!b.Bi.unlink) throw new O(63);
    if (c.ij) throw new O(10);
    b.Bi.unlink(b, a);
    Dc(c)
}

function zc(a) {
    a = Ca(a).node;
    if (!a) throw new O(44);
    if (!a.Bi.readlink) throw new O(28);
    return Tb(Ac(a.parent), a.Bi.readlink(a))
}

function Ba(a, b) {
    a = Ca(a, {
        oj: !b
    }).node;
    if (!a) throw new O(44);
    if (!a.Bi.Wi) throw new O(63);
    return a.Bi.Wi(a)
}

function Rc(a) {
    return Ba(a, !0)
}

function Ga(a, b) {
    a = "string" == typeof a ? Ca(a, {
        oj: !0
    }).node : a;
    if (!a.Bi.Ni) throw new O(63);
    a.Bi.Ni(a, {
        mode: b & 4095 | a.mode & -4096,
        timestamp: Date.now()
    })
}

function Ha(a, b, c) {
    a = Ca(a, {
        oj: !0
    }).node;
    a.Bi.Ni(a, {
        timestamp: Math.max(b, c)
    })
}

function Sc(a, b, c) {
    if ("" === a) throw new O(44);
    if ("string" == typeof b) {
        var d = {
            r: 0,
            "r+": 2,
            w: 577,
            "w+": 578,
            a: 1089,
            "a+": 1090
        } [b];
        if ("undefined" == typeof d) throw Error(`Unknown file open mode: `);
        b = d
    }
    c = b & 64 ? ("undefined" == typeof c ? 438 : c) & 4095 | 32768 : 0;
    if ("object" == typeof a) var e = a;
    else {
        a = za(a);
        try {
            e = Ca(a, {
                oj: !(b & 131072)
            }).node
        } catch (f) {}
    }
    d = !1;
    if (b & 64)
        if (e) {
            if (b & 128) throw new O(20);
        } else e = Oc(a, c, 0), d = !0;
    if (!e) throw new O(44);
    8192 === (e.mode & 61440) && (b &= -513);
    if (b & 65536 && !B(e.mode)) throw new O(54);
    if (!d &&
        (c = e ? 40960 === (e.mode & 61440) ? 32 : B(e.mode) && ("r" !== Gc(b) || b & 512) ? 31 : Ec(e, Gc(b)) : 44)) throw new O(c);
    if (b & 512 && !d) {
        c = e;
        c = "string" == typeof c ? Ca(c, {
            oj: !0
        }).node : c;
        if (!c.Bi.Ni) throw new O(63);
        if (B(c.mode)) throw new O(31);
        if (32768 !== (c.mode & 61440)) throw new O(28);
        if (d = Ec(c, "w")) throw new O(d);
        c.Bi.Ni(c, {
            size: 0,
            timestamp: Date.now()
        })
    }
    b &= -131713;
    e = Lc({
        node: e,
        path: Ac(e),
        flags: b,
        seekable: !0,
        position: 0,
        Di: e.Di,
        Pl: [],
        error: !1
    });
    e.Di.open && e.Di.open(e);
    !k.logReadFiles || b & 1 || (Tc || (Tc = {}), a in Tc || (Tc[a] = 1));
    return e
}

function Uc(a) {
    if (null === a.fd) throw new O(8);
    a.pj && (a.pj = null);
    try {
        a.Di.close && a.Di.close(a)
    } catch (b) {
        throw b;
    } finally {
        uc[a.fd] = null
    }
    a.fd = null
}

function Vc(a, b, c) {
    if (null === a.fd) throw new O(8);
    if (!a.seekable || !a.Di.qj) throw new O(70);
    if (0 != c && 1 != c && 2 != c) throw new O(28);
    a.position = a.Di.qj(a, b, c);
    a.Pl = [];
    return a.position
}

function Wc(a, b, c, d, e, f) {
    if (0 > d || 0 > e) throw new O(28);
    if (null === a.fd) throw new O(8);
    if (0 === (a.flags & 2097155)) throw new O(8);
    if (B(a.node.mode)) throw new O(31);
    if (!a.Di.write) throw new O(28);
    a.seekable && a.flags & 1024 && Vc(a, 0, 2);
    var g = "undefined" != typeof e;
    if (!g) e = a.position;
    else if (!a.seekable) throw new O(70);
    b = a.Di.write(a, b, c, d, e, f);
    g || (a.position += b);
    return b
}

function Fa(a, b) {
    var c = {
        Lk: !0
    };
    c.flags = c.flags || 577;
    a = Sc(a, c.flags, c.mode);
    if ("string" == typeof b) {
        var d = new Uint8Array(aa(b) + 1);
        b = t(b, d, 0, d.length);
        Wc(a, d, 0, b, void 0, c.Lk)
    } else if (ArrayBuffer.isView(b)) Wc(a, b, 0, b.byteLength, void 0, c.Lk);
    else throw Error("Unsupported data type");
    Uc(a)
}

function Xc() {
    O || (O = function (a, b) {
        this.name = "ErrnoError";
        this.node = b;
        this.Jl = function (c) {
            this.Ei = c
        };
        this.Jl(a);
        this.message = "FS error"
    }, O.prototype = Error(), O.prototype.constructor = O, [44].forEach(a => {
        ic[a] = new O(a);
        ic[a].stack = "<generic error, no stack>"
    }))
}
var Yc;

function Zc(a, b) {
    a = "string" == typeof a ? a : Ac(a);
    for (b = b.split("/").reverse(); b.length;) {
        var c = b.pop();
        if (c) {
            var d = za(a + "/" + c);
            try {
                Cb(d)
            } catch (e) {}
            a = d
        }
    }
    return d
}

function $c(a, b, c, d) {
    a = za(("string" == typeof a ? a : Ac(a)) + "/" + b);
    c = rc(c, d);
    return Oc(a, (void 0 !== c ? c : 438) & 4095 | 32768, 0)
}

function pc(a, b, c, d, e, f) {
    var g = b;
    a && (a = "string" == typeof a ? a : Ac(a), g = b ? za(a + "/" + b) : a);
    a = rc(d, e);
    g = Oc(g, (void 0 !== a ? a : 438) & 4095 | 32768, 0);
    if (c) {
        if ("string" == typeof c) {
            b = Array(c.length);
            d = 0;
            for (e = c.length; d < e; ++d) b[d] = c.charCodeAt(d);
            c = b
        }
        Ga(g, a | 146);
        b = Sc(g, 577);
        Wc(b, c, 0, c.length, 0, f);
        Uc(b);
        Ga(g, a)
    }
    return g
}

function ad(a, b, c, d) {
    a = za(("string" == typeof a ? a : Ac(a)) + "/" + b);
    b = rc(!!c, !!d);
    ad.Uk || (ad.Uk = 64);
    var e = ad.Uk++ << 8 | 0;
    bc(e, {
        open(f) {
            f.seekable = !1
        },
        close() {
            d && d.buffer && d.buffer.length && d(10)
        },
        read(f, g, h, n) {
            for (var p = 0, q = 0; q < n; q++) {
                try {
                    var u = c()
                } catch (w) {
                    throw new O(29);
                }
                if (void 0 === u && 0 === p) throw new O(6);
                if (null === u || void 0 === u) break;
                p++;
                g[h + q] = u
            }
            p && (f.node.timestamp = Date.now());
            return p
        },
        write(f, g, h, n) {
            for (var p = 0; p < n; p++) try {
                d(g[h + p])
            } catch (q) {
                throw new O(29);
            }
            n && (f.node.timestamp = Date.now());
            return p
        }
    });
    return Pc(a, b, e)
}

function bd(a) {
    if (!(a.Dl || a.El || a.link || a.Ci)) {
        if ("undefined" != typeof XMLHttpRequest) throw Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        if (Sa) try {
            a.Ci = Yb(Sa(a.url), !0), a.Fi = a.Ci.length
        } catch (b) {
            throw new O(29);
        } else throw Error("Cannot load without read() or XMLHttpRequest.");
    }
}

function cd(a, b, c, d, e) {
    function f() {
        this.mk = !1;
        this.ej = []
    }
    f.prototype.get = function (q) {
        if (!(q > this.length - 1 || 0 > q)) {
            var u = q % this.chunkSize;
            return this.Sk(q / this.chunkSize | 0)[u]
        }
    };
    f.prototype.Ai = function (q) {
        this.Sk = q
    };
    f.prototype.Kk = function () {
        var q = new XMLHttpRequest;
        q.open("HEAD", c, !1);
        q.send(null);
        if (!(200 <= q.status && 300 > q.status || 304 === q.status)) throw Error("Couldn't load " + c + ". Status: " + q.status);
        var u = Number(q.getResponseHeader("Content-length")),
            w, r = (w = q.getResponseHeader("Accept-Ranges")) &&
            "bytes" === w;
        q = (w = q.getResponseHeader("Content-Encoding")) && "gzip" === w;
        var A = 1048576;
        r || (A = u);
        var z = this;
        z.Ai(I => {
            var N = I * A,
                ea = (I + 1) * A - 1;
            ea = Math.min(ea, u - 1);
            if ("undefined" == typeof z.ej[I]) {
                var F = z.ej;
                if (N > ea) throw Error("invalid range (" + N + ", " + ea + ") or no bytes requested!");
                if (ea > u - 1) throw Error("only " + u + " bytes available! programmer error!");
                var T = new XMLHttpRequest;
                T.open("GET", c, !1);
                u !== A && T.setRequestHeader("Range", "bytes=" + N + "-" + ea);
                T.responseType = "arraybuffer";
                T.overrideMimeType && T.overrideMimeType("text/plain; charset=x-user-defined");
                T.send(null);
                if (!(200 <= T.status && 300 > T.status || 304 === T.status)) throw Error("Couldn't load " + c + ". Status: " + T.status);
                N = void 0 !== T.response ? new Uint8Array(T.response || []) : Yb(T.responseText || "", !0);
                F[I] = N
            }
            if ("undefined" == typeof z.ej[I]) throw Error("doXHR failed!");
            return z.ej[I]
        });
        if (q || !u) A = u = 1, A = u = this.Sk(0).length, Ya("LazyFiles on gzip forces download of the whole file when length is accessed");
        this.hl = u;
        this.gl = A;
        this.mk = !0
    };
    if ("undefined" != typeof XMLHttpRequest) {
        if (!Pa) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
        var g = new f;
        Object.defineProperties(g, {
            length: {
                get: function () {
                    this.mk || this.Kk();
                    return this.hl
                }
            },
            chunkSize: {
                get: function () {
                    this.mk || this.Kk();
                    return this.gl
                }
            }
        });
        var h = void 0
    } else h = c, g = void 0;
    var n = $c(a, b, d, e);
    g ? n.Ci = g : h && (n.Ci = null, n.url = h);
    Object.defineProperties(n, {
        Fi: {
            get: function () {
                return this.Ci.length
            }
        }
    });
    var p = {};
    Object.keys(n.Di).forEach(q => {
        var u = n.Di[q];
        p[q] = function () {
            bd(n);
            return u.apply(null, arguments)
        }
    });
    p.read = (q, u, w, r, A) => {
        bd(n);
        q = q.node.Ci;
        if (A >= q.length) u = 0;
        else {
            r = Math.min(q.length -
                A, r);
            if (q.slice)
                for (var z = 0; z < r; z++) u[w + z] = q[A + z];
            else
                for (z = 0; z < r; z++) u[w + z] = q.get(A + z);
            u = r
        }
        return u
    };
    p.qk = () => {
        bd(n);
        $a();
        throw new O(48);
    };
    n.Di = p;
    return n
}
var dd = {},
    Mc, Tc;

function ed(a, b) {
    if (1 === a.type && a.Ki) throw new O(53);
    var c = a.xj.shift();
    if (!c) {
        if (1 === a.type) {
            a = a.Yi[a.aj + ":" + a.bj];
            if (!a) throw new O(53);
            if (a.socket.readyState === a.socket.CLOSING || a.socket.readyState === a.socket.CLOSED) return null
        }
        throw new O(6);
    }
    var d = c.data.byteLength || c.data.length,
        e = c.data.byteOffset || 0,
        f = c.data.buffer || c.data;
    b = Math.min(b, d);
    var g = {
        buffer: new Uint8Array(f, e, b),
        Hi: c.Hi,
        port: c.port
    };
    1 === a.type && b < d && (c.data = new Uint8Array(f, e + b, d - b), a.xj.unshift(c));
    return g
}

function fd(a, b, c, d, e, f) {
    if (2 === a.type) {
        if (void 0 === e || void 0 === f) e = a.aj, f = a.bj;
        if (void 0 === e || void 0 === f) throw new O(17);
    } else e = a.aj, f = a.bj;
    var g = a.Yi[e + ":" + f];
    if (1 === a.type) {
        if (!g || g.socket.readyState === g.socket.CLOSING || g.socket.readyState === g.socket.CLOSED) throw new O(53);
        if (g.socket.readyState === g.socket.CONNECTING) throw new O(6);
    }
    ArrayBuffer.isView(b) && (c += b.byteOffset, b = b.buffer);
    b = b.slice(c, c + d);
    if (2 === a.type && (!g || g.socket.readyState !== g.socket.OPEN)) return g && g.socket.readyState !== g.socket.CLOSING &&
        g.socket.readyState !== g.socket.CLOSED || (g = gd(a, e, f)), g.Nj.push(b), d;
    try {
        return g.socket.send(b), d
    } catch (h) {
        throw new O(28);
    }
}

function hd(a, b) {
    function c() {
        k.websocket.emit("open", a.stream.fd);
        try {
            for (var f = b.Nj.shift(); f;) b.socket.send(f), f = b.Nj.shift()
        } catch (g) {
            b.socket.close()
        }
    }

    function d(f) {
        if ("string" == typeof f) f = (new TextEncoder).encode(f);
        else {
            void 0 !== f.byteLength || $a();
            if (0 == f.byteLength) return;
            f = new Uint8Array(f)
        }
        var g = e;
        e = !1;
        g && 10 === f.length && 255 === f[0] && 255 === f[1] && 255 === f[2] && 255 === f[3] && 112 === f[4] && 111 === f[5] && 114 === f[6] && 116 === f[7] ? (f = f[8] << 8 | f[9], delete a.Yi[b.Hi + ":" + b.port], b.port = f, a.Yi[b.Hi + ":" + b.port] =
            b) : (a.xj.push({
            Hi: b.Hi,
            port: b.port,
            data: f
        }), k.websocket.emit("message", a.stream.fd))
    }
    var e = !0;
    Qa ? (b.socket.on("open", c), b.socket.on("message", function (f, g) {
        g && d((new Uint8Array(f)).buffer)
    }), b.socket.on("close", function () {
        k.websocket.emit("close", a.stream.fd)
    }), b.socket.on("error", function () {
        a.error = 14;
        k.websocket.emit("error", [a.stream.fd, a.error, "ECONNREFUSED: Connection refused"])
    })) : (b.socket.onopen = c, b.socket.onclose = function () {
            k.websocket.emit("close", a.stream.fd)
        }, b.socket.onmessage = function (f) {
            d(f.data)
        },
        b.socket.onerror = function () {
            a.error = 14;
            k.websocket.emit("error", [a.stream.fd, a.error, "ECONNREFUSED: Connection refused"])
        })
}

function gd(a, b, c) {
    if ("object" == typeof b) {
        var d = b;
        c = b = null
    }
    if (d)
        if (d._socket) b = d._socket.remoteAddress, c = d._socket.remotePort;
        else {
            c = /ws[s]?:\/\/([^:]+):(\d+)/.exec(d.url);
            if (!c) throw Error("WebSocket URL must be in the format ws(s)://address:port");
            b = c[1];
            c = parseInt(c[2], 10)
        }
    else try {
        var e = k.websocket && "object" === typeof k.websocket,
            f = "ws://";
        e && "string" === typeof k.websocket.url && (f = k.websocket.url);
        if ("ws://" === f || "wss://" === f) {
            var g = b.split("/");
            f = f + g[0] + ":" + c + "/" + g.slice(1).join("/")
        }
        g = "binary";
        e && "string" === typeof k.websocket.subprotocol && (g = k.websocket.subprotocol);
        var h = void 0;
        "null" !== g && (h = g = g.replace(/^ +| +$/g, "").split(/ *, */));
        e && null === k.websocket.subprotocol && (h = void 0);
        d = new(Qa ? require("ws") : WebSocket)(f, h);
        d.binaryType = "arraybuffer"
    } catch (n) {
        throw new O(23);
    }
    b = {
        Hi: b,
        port: c,
        socket: d,
        Nj: []
    };
    a.Yi[b.Hi + ":" + b.port] = b;
    hd(a, b);
    2 === a.type && "undefined" != typeof a.zj && b.Nj.push(new Uint8Array([255, 255, 255, 255, 112, 111, 114, 116, (a.zj & 65280) >> 8, a.zj & 255]));
    return b
}
var jd = {
        Ji() {
            k.websocket = k.websocket && "object" === typeof k.websocket ? k.websocket : {};
            k.websocket.ek = {};
            k.websocket.on = function (a, b) {
                "function" === typeof b && (this.ek[a] = b);
                return this
            };
            k.websocket.emit = function (a, b) {
                "function" === typeof this.ek[a] && this.ek[a].call(this, b)
            };
            return hc(null, "/", 16895, 0)
        },
        createSocket(a, b, c) {
            b &= -526337;
            if (1 == b && c && 6 != c) throw new O(66);
            a = {
                family: a,
                type: b,
                protocol: c,
                Ki: null,
                error: null,
                Yi: {},
                pending: [],
                xj: [],
                Yj: jd.Tl
            };
            b = jd.Vj();
            c = hc(jd.root, b, 49152, 0);
            c.yj = a;
            b = Lc({
                path: b,
                node: c,
                flags: 2,
                seekable: !1,
                Di: jd.Di
            });
            a.stream = b;
            return a
        },
        Di: {
            Zk(a) {
                a = a.node.yj;
                return a.Yj.Zk(a)
            },
            Oj(a, b, c) {
                a = a.node.yj;
                return a.Yj.Oj(a, b, c)
            },
            read(a, b, c, d) {
                a = ed(a.node.yj, d);
                if (!a) return 0;
                b.set(a.buffer, c);
                return a.buffer.length
            },
            write(a, b, c, d) {
                return fd(a.node.yj, b, c, d)
            },
            close(a) {
                a = a.node.yj;
                a.Yj.close(a)
            }
        },
        Vj() {
            jd.Vj.current || (jd.Vj.current = 0);
            return "socket[" + jd.Vj.current++ + "]"
        },
        Tl: {
            Zk(a) {
                if (1 === a.type && a.Ki) return a.pending.length ? 65 : 0;
                var b = 0,
                    c = 1 === a.type ? a.Yi[a.aj + ":" + a.bj] : null;
                if (a.xj.length ||
                    !c || c && c.socket.readyState === c.socket.CLOSING || c && c.socket.readyState === c.socket.CLOSED) b |= 65;
                if (!c || c && c.socket.readyState === c.socket.OPEN) b |= 4;
                if (c && c.socket.readyState === c.socket.CLOSING || c && c.socket.readyState === c.socket.CLOSED) b |= 16;
                return b
            },
            Oj(a, b, c) {
                switch (b) {
                    case 21531:
                        return b = 0, a.xj.length && (b = a.xj[0].data.length), E[c >> 2] = b, 0;
                    default:
                        return 28
                }
            },
            close(a) {
                if (a.Ki) {
                    try {
                        a.Ki.close()
                    } catch (e) {}
                    a.Ki = null
                }
                for (var b = Object.keys(a.Yi), c = 0; c < b.length; c++) {
                    var d = a.Yi[b[c]];
                    try {
                        d.socket.close()
                    } catch (e) {}
                    delete a.Yi[d.Hi +
                        ":" + d.port]
                }
                return 0
            },
            bind(a, b, c) {
                if ("undefined" != typeof a.yk || "undefined" != typeof a.zj) throw new O(28);
                a.yk = b;
                a.zj = c;
                if (2 === a.type) {
                    a.Ki && (a.Ki.close(), a.Ki = null);
                    try {
                        a.Yj.listen(a, 0)
                    } catch (d) {
                        if ("ErrnoError" !== d.name) throw d;
                        if (138 !== d.Ei) throw d;
                    }
                }
            },
            connect(a, b, c) {
                if (a.Ki) throw new O(138);
                if ("undefined" != typeof a.aj && "undefined" != typeof a.bj) {
                    var d = a.Yi[a.aj + ":" + a.bj];
                    if (d) {
                        if (d.socket.readyState === d.socket.CONNECTING) throw new O(7);
                        throw new O(30);
                    }
                }
                b = gd(a, b, c);
                a.aj = b.Hi;
                a.bj = b.port;
                throw new O(26);
            },
            listen(a) {
                if (!Qa) throw new O(138);
                if (a.Ki) throw new O(28);
                var b = require("ws").Server;
                a.Ki = new b({
                    host: a.yk,
                    port: a.zj
                });
                k.websocket.emit("listen", a.stream.fd);
                a.Ki.on("connection", function (c) {
                    if (1 === a.type) {
                        var d = jd.createSocket(a.family, a.type, a.protocol);
                        c = gd(d, c);
                        d.aj = c.Hi;
                        d.bj = c.port;
                        a.pending.push(d);
                        k.websocket.emit("connection", d.stream.fd)
                    } else gd(a, c), k.websocket.emit("connection", a.stream.fd)
                });
                a.Ki.on("close", function () {
                    k.websocket.emit("close", a.stream.fd);
                    a.Ki = null
                });
                a.Ki.on("error",
                    function () {
                        a.error = 23;
                        k.websocket.emit("error", [a.stream.fd, a.error, "EHOSTUNREACH: Host is unreachable"])
                    })
            },
            accept(a) {
                if (!a.Ki || !a.pending.length) throw new O(28);
                var b = a.pending.shift();
                b.stream.flags = a.stream.flags;
                return b
            },
            lm(a, b) {
                if (b) {
                    if (void 0 === a.aj || void 0 === a.bj) throw new O(53);
                    b = a.aj;
                    a = a.bj
                } else b = a.yk || 0, a = a.zj || 0;
                return {
                    Hi: b,
                    port: a
                }
            }
        }
    },
    kd = a => {
        a = (a = uc[a]) && 49152 === (a.node.mode & 49152) ? a.node.yj : null;
        if (!a) throw new O(8);
        return a
    },
    ld = a => (a & 255) + "." + (a >> 8 & 255) + "." + (a >> 16 & 255) + "." + (a >> 24 &
        255),
    nd = a => {
        var b = "",
            c, d = 0,
            e = 0,
            f = 0,
            g = 0;
        a = [a[0] & 65535, a[0] >> 16, a[1] & 65535, a[1] >> 16, a[2] & 65535, a[2] >> 16, a[3] & 65535, a[3] >> 16];
        var h = !0;
        for (c = 0; 5 > c; c++)
            if (0 !== a[c]) {
                h = !1;
                break
            } if (h) {
            c = ld(a[6] | a[7] << 16);
            if (-1 === a[5]) return "::ffff:" + c;
            if (0 === a[5]) return "0.0.0.0" === c && (c = ""), "0.0.0.1" === c && (c = "1"), "::" + c
        }
        for (c = 0; 8 > c; c++) 0 === a[c] && (1 < c - e && (g = 0), e = c, g++), g > d && (d = g, f = c - d + 1);
        for (c = 0; 8 > c; c++) 1 < d && 0 === a[c] && c >= f && c < f + d ? c === f && (b += ":", 0 === f && (b += ":")) : (b += Number(md(a[c] & 65535)).toString(16), b += 7 > c ? ":" : "");
        return b
    },
    od = (a, b) => {
        var c = db[a >> 1],
            d = md(D[a + 2 >> 1]);
        switch (c) {
            case 2:
                if (16 !== b) return {
                    Ei: 28
                };
                a = E[a + 4 >> 2];
                a = ld(a);
                break;
            case 10:
                if (28 !== b) return {
                    Ei: 28
                };
                a = [E[a + 8 >> 2], E[a + 12 >> 2], E[a + 16 >> 2], E[a + 20 >> 2]];
                a = nd(a);
                break;
            default:
                return {
                    Ei: 5
                }
        }
        return {
            family: c,
            Hi: a,
            port: d
        }
    },
    pd = a => {
        a = a.split(".");
        for (var b = 0; 4 > b; b++) {
            var c = Number(a[b]);
            if (isNaN(c)) return null;
            a[b] = c
        }
        return (a[0] | a[1] << 8 | a[2] << 16 | a[3] << 24) >>> 0
    },
    rd = a => {
        var b, c, d = [];
        if (!/^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i.test(a)) return null;
        if ("::" === a) return [0, 0, 0, 0, 0, 0, 0, 0];
        a = a.startsWith("::") ? a.replace("::", "Z:") : a.replace("::", ":Z:");
        0 < a.indexOf(".") ? (a = a.replace(RegExp("[.]", "g"), ":"), a = a.split(":"), a[a.length - 4] = parseInt(a[a.length - 4]) + 256 * parseInt(a[a.length - 3]), a[a.length - 3] = parseInt(a[a.length - 2]) + 256 * parseInt(a[a.length - 1]), a = a.slice(0, a.length - 2)) : a = a.split(":");
        for (b = c = 0; b < a.length; b++)
            if ("string" == typeof a[b])
                if ("Z" === a[b]) {
                    for (c = 0; c < 8 - a.length + 1; c++) d[b + c] = 0;
                    --c
                } else d[b + c] = qd(parseInt(a[b], 16));
        else d[b + c] = a[b];
        return [d[1] <<
            16 | d[0], d[3] << 16 | d[2], d[5] << 16 | d[4], d[7] << 16 | d[6]
        ]
    },
    sd = 1,
    td = {},
    ud = {};

function vd(a) {
    var b = pd(a);
    if (null !== b) return a;
    b = rd(a);
    if (null !== b) return a;
    td[a] ? b = td[a] : (b = sd++, 65535 > b || $a("exceeded max address mappings of 65535"), b = "172.29." + (b & 255) + "." + (b & 65280), ud[b] = a, td[a] = b);
    return b
}
var wd = (a, b) => a ? x(v, a, b) : "";

function xd(a, b, c) {
    if ("/" === b.charAt(0)) return b;
    a = -100 === a ? Ub : Kc(a).path;
    if (0 == b.length) {
        if (!c) throw new O(44);
        return a
    }
    return za(a + "/" + b)
}

function yd(a, b, c) {
    try {
        var d = a(b)
    } catch (f) {
        if (f && f.node && za(b) !== za(Ac(f.node))) return -54;
        throw f;
    }
    E[c >> 2] = d.dev;
    E[c + 4 >> 2] = d.mode;
    G[c + 8 >> 2] = d.nlink;
    E[c + 12 >> 2] = d.uid;
    E[c + 16 >> 2] = d.gid;
    E[c + 20 >> 2] = d.rdev;
    K = [d.size >>> 0, (J = d.size, 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)];
    E[c + 24 >> 2] = K[0];
    E[c + 28 >> 2] = K[1];
    E[c + 32 >> 2] = 4096;
    E[c + 36 >> 2] = d.blocks;
    a = d.atime.getTime();
    b = d.mtime.getTime();
    var e = d.ctime.getTime();
    K = [Math.floor(a / 1E3) >>> 0, (J = Math.floor(a / 1E3), 1 <=
        +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)];
    E[c + 40 >> 2] = K[0];
    E[c + 44 >> 2] = K[1];
    G[c + 48 >> 2] = a % 1E3 * 1E3;
    K = [Math.floor(b / 1E3) >>> 0, (J = Math.floor(b / 1E3), 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)];
    E[c + 56 >> 2] = K[0];
    E[c + 60 >> 2] = K[1];
    G[c + 64 >> 2] = b % 1E3 * 1E3;
    K = [Math.floor(e / 1E3) >>> 0, (J = Math.floor(e / 1E3), 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)];
    E[c + 72 >> 2] = K[0];
    E[c + 76 >> 2] = K[1];
    G[c + 80 >> 2] = e % 1E3 * 1E3;
    K = [d.ino >>> 0, (J = d.ino, 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)];
    E[c + 88 >> 2] = K[0];
    E[c + 92 >> 2] = K[1];
    return 0
}
var zd = void 0;

function Ad() {
    var a = E[+zd >> 2];
    zd += 4;
    return a
}
var Bd = (a, b, c, d, e) => {
        switch (b) {
            case 2:
                c = pd(c);
                v.fill(0, a, a + 16);
                e && (E[e >> 2] = 16);
                db[a >> 1] = b;
                E[a + 4 >> 2] = c;
                db[a + 2 >> 1] = qd(d);
                break;
            case 10:
                c = rd(c);
                v.fill(0, a, a + 28);
                e && (E[e >> 2] = 28);
                E[a >> 2] = b;
                E[a + 8 >> 2] = c[0];
                E[a + 12 >> 2] = c[1];
                E[a + 16 >> 2] = c[2];
                E[a + 20 >> 2] = c[3];
                db[a + 2 >> 1] = qd(d);
                break;
            default:
                return 5
        }
        return 0
    },
    Cd = a => 0 === a % 4 && (0 !== a % 100 || 0 === a % 400),
    Dd = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335],
    Ed = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    Fd = a => {
        var b = aa(a) + 1,
            c = m(b);
        c && t(a, v, c, b);
        return c
    },
    Pd = (a, b) => {
        Gd = a;
        Hd =
            b;
        if (Id)
            if (Jd || (Jd = !0), 0 == a) Kd = function () {
                var d = Math.max(0, Ld + b - Md()) | 0;
                setTimeout(Nd, d)
            };
            else if (1 == a) Kd = function () {
            Od(Nd)
        };
        else if (2 == a) {
            if ("undefined" == typeof setImmediate) {
                var c = [];
                addEventListener("message", d => {
                    if ("setimmediate" === d.data || "setimmediate" === d.data.target) d.stopPropagation(), c.shift()()
                }, !0);
                setImmediate = function (d) {
                    c.push(d);
                    Pa ? (void 0 === k.setImmediates && (k.setImmediates = []), k.setImmediates.push(d), postMessage({
                        target: "setimmediate"
                    })) : postMessage("setimmediate", "*")
                }
            }
            Kd = function () {
                setImmediate(Nd)
            }
        }
    },
    Md;
Md = () => performance.now();
var Wd = a => {
        !Id || $a("emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
        Id = a;
        var b = Qd;
        Jd = !1;
        Nd = function () {
            if (!bb)
                if (0 < Rd.length) {
                    var c = Rd.shift();
                    c.km(c.$l);
                    if (Sd) {
                        var d = Sd,
                            e = 0 == d % 1 ? d - 1 : Math.floor(d);
                        Sd = c.gm ? e : (8 * d + (e + .5)) / 9
                    }
                    k.setStatus && (c = k.statusMessage || "Please wait...", d = Sd, e = Td.im, d ? d < e ? k.setStatus(c + " (" + (e - d) + "/" + e + ")") : k.setStatus(c) : k.setStatus(""));
                    b <
                        Qd || setTimeout(Nd, 0)
                } else if (!(b < Qd))
                if (Ud = Ud + 1 | 0, 1 == Gd && 1 < Hd && 0 != Ud % Hd) Kd();
                else {
                    0 == Gd && (Ld = Md());
                    if (P)
                        for (c = P.Bj, P.Bj = P.Ij, P.Ij = c, c = P.kj, P.kj = P.$j, P.$j = c, c = 0; 21 >= c; ++c) P.kj[c] = 0;
                    bb || k.preMainLoop && !1 === k.preMainLoop() || (Vd(a), k.postMainLoop && k.postMainLoop());
                    b < Qd || ("object" == typeof SDL && SDL.audio && SDL.audio.Gl && SDL.audio.Gl(), Kd())
                }
        }
    },
    Xd = a => {
        a instanceof Xa || "unwind" == a || Na(1, a)
    },
    Yd = a => {
        cb = a;
        if (!Nb) {
            if (k.onExit) k.onExit(a);
            bb = !0
        }
        Na(a, new Xa(a))
    },
    Zd = a => {
        cb = a;
        Yd(a)
    },
    Vd = a => {
        if (!bb) try {
            if (a(), !Nb) try {
                cb =
                    a = cb, Yd(a)
            } catch (b) {
                Xd(b)
            }
        } catch (b) {
            Xd(b)
        }
    },
    $d = a => {
        setTimeout(() => {
            Vd(a)
        }, 1E4)
    },
    Jd = !1,
    Kd = null,
    Qd = 0,
    Id = null,
    Gd = 0,
    Hd = 0,
    Ud = 0,
    Rd = [],
    Td = {},
    Ld, Nd, Sd, ae = !1,
    be = !1,
    ce = [];

function nc() {
    function a() {
        be = document.pointerLockElement === k.canvas || document.mozPointerLockElement === k.canvas || document.webkitPointerLockElement === k.canvas || document.msPointerLockElement === k.canvas
    }
    if (!de) {
        de = !0;
        lc.push({
            canHandle: function (c) {
                return !k.qm && /\.(jpg|jpeg|png|bmp)$/i.test(c)
            },
            handle: function (c, d, e, f) {
                var g = new Blob([c], {
                    type: ee(d)
                });
                g.size !== c.length && (g = new Blob([(new Uint8Array(c)).buffer], {
                    type: ee(d)
                }));
                var h = URL.createObjectURL(g),
                    n = new Image;
                n.onload = () => {
                    n.complete || $a(`Image  could not be decoded`);
                    var p = document.createElement("canvas");
                    p.width = n.width;
                    p.height = n.height;
                    p.getContext("2d").drawImage(n, 0, 0);
                    URL.revokeObjectURL(h);
                    e && e(c)
                };
                n.onerror = () => {
                    l(`Image  could not be decoded`);
                    f && f()
                };
                n.src = h
            }
        });
        lc.push({
            canHandle: function (c) {
                return !k.pm && c.substr(-4) in {
                    ".ogg": 1,
                    ".wav": 1,
                    ".mp3": 1
                }
            },
            handle: function (c, d, e) {
                function f() {
                    g || (g = !0, e && e(c))
                }
                var g = !1,
                    h = URL.createObjectURL(new Blob([c], {
                        type: ee(d)
                    })),
                    n = new Audio;
                n.addEventListener("canplaythrough", () => f(n), !1);
                n.onerror = function () {
                    if (!g) {
                        l(`warning: browser could not fully decode audio , trying slower base64 approach`);
                        for (var p = "", q = 0, u = 0, w = 0; w < c.length; w++)
                            for (q = q << 8 | c[w], u += 8; 6 <= u;) {
                                var r = q >> u - 6 & 63;
                                u -= 6;
                                p += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" [r]
                            }
                        2 == u ? (p += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" [(q & 3) << 4], p += "==") : 4 == u && (p += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" [(q & 15) << 2], p += "=");
                        n.src = "data:audio/x-" + d.substr(-3) + ";base64," + p;
                        f(n)
                    }
                };
                n.src = h;
                $d(() => {
                    f(n)
                })
            }
        });
        var b = k.canvas;
        b && (b.requestPointerLock = b.requestPointerLock || b.mozRequestPointerLock ||
            b.webkitRequestPointerLock || b.msRequestPointerLock || (() => {}), b.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock || document.msExitPointerLock || (() => {}), b.exitPointerLock = b.exitPointerLock.bind(document), document.addEventListener("pointerlockchange", a, !1), document.addEventListener("mozpointerlockchange", a, !1), document.addEventListener("webkitpointerlockchange", a, !1), document.addEventListener("mspointerlockchange", a, !1), k.elementPointerLock && b.addEventListener("click",
                c => {
                    !be && k.canvas.requestPointerLock && (k.canvas.requestPointerLock(), c.preventDefault())
                }, !1))
    }
}

function fe(a, b, c, d) {
    if (b && k.Ui && a == k.canvas) return k.Ui;
    var e;
    if (b) {
        var f = {
            antialias: !1,
            alpha: !1,
            Pj: "undefined" != typeof WebGL2RenderingContext ? 2 : 1
        };
        if (d)
            for (var g in d) f[g] = d[g];
        if ("undefined" != typeof ge && (e = he(a, f))) var h = ie[e].Ti
    } else h = a.getContext("2d");
    if (!h) return null;
    c && (b || "undefined" == typeof Q || $a("cannot set in module if GLctx is used, but we are a non-GL context that would replace it"), k.Ui = h, b && je(e), k.Ql = b, ce.forEach(n => n()), nc());
    return h
}
var ke = !1,
    le = void 0,
    me = void 0;

function ne(a, b) {
    function c() {
        ae = !1;
        var f = d.parentNode;
        (document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) === f ? (d.exitFullscreen = oe, le && d.requestPointerLock(), ae = !0, me ? ("undefined" != typeof SDL && (E[SDL.screen >> 2] = G[SDL.screen >> 2] | 8388608), pe(k.canvas), qe()) : pe(d)) : (f.parentNode.insertBefore(d, f), f.parentNode.removeChild(f), me ? ("undefined" != typeof SDL && (E[SDL.screen >> 2] = G[SDL.screen >> 2] &
            -8388609), pe(k.canvas), qe()) : pe(d));
        if (k.onFullScreen) k.onFullScreen(ae);
        if (k.onFullscreen) k.onFullscreen(ae)
    }
    le = a;
    me = b;
    "undefined" == typeof le && (le = !0);
    "undefined" == typeof me && (me = !1);
    var d = k.canvas;
    ke || (ke = !0, document.addEventListener("fullscreenchange", c, !1), document.addEventListener("mozfullscreenchange", c, !1), document.addEventListener("webkitfullscreenchange", c, !1), document.addEventListener("MSFullscreenChange", c, !1));
    var e = document.createElement("div");
    d.parentNode.insertBefore(e, d);
    e.appendChild(d);
    e.requestFullscreen = e.requestFullscreen || e.mozRequestFullScreen || e.msRequestFullscreen || (e.webkitRequestFullscreen ? () => e.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT) : null) || (e.webkitRequestFullScreen ? () => e.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT) : null);
    e.requestFullscreen()
}

function oe() {
    if (!ae) return !1;
    (document.exitFullscreen || document.cancelFullScreen || document.mozCancelFullScreen || document.msExitFullscreen || document.webkitCancelFullScreen || (() => {})).apply(document, []);
    return !0
}
var re = 0;

function Od(a) {
    if ("function" == typeof requestAnimationFrame) requestAnimationFrame(a);
    else {
        var b = Date.now();
        if (0 === re) re = b + 1E3 / 60;
        else
            for (; b + 2 >= re;) re += 1E3 / 60;
        setTimeout(a, Math.max(re - b, 0))
    }
}

function ee(a) {
    return {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        bmp: "image/bmp",
        ogg: "audio/ogg",
        wav: "audio/wav",
        mp3: "audio/mpeg"
    } [a.substr(a.lastIndexOf(".") + 1)]
}
var se = [];

function qe() {
    var a = k.canvas;
    se.forEach(b => b(a.width, a.height))
}

function pe(a, b, c) {
    b && c ? (a.Ul = b, a.xl = c) : (b = a.Ul, c = a.xl);
    var d = b,
        e = c;
    k.forcedAspectRatio && 0 < k.forcedAspectRatio && (d / e < k.forcedAspectRatio ? d = Math.round(e * k.forcedAspectRatio) : e = Math.round(d / k.forcedAspectRatio));
    if ((document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) === a.parentNode && "undefined" != typeof screen) {
        var f = Math.min(screen.width / d, screen.height / e);
        d = Math.round(d * f);
        e = Math.round(e *
            f)
    }
    me ? (a.width != d && (a.width = d), a.height != e && (a.height = e), "undefined" != typeof a.style && (a.style.removeProperty("width"), a.style.removeProperty("height"))) : (a.width != b && (a.width = b), a.height != c && (a.height = c), "undefined" != typeof a.style && (d != b || e != c ? (a.style.setProperty("width", d + "px", "important"), a.style.setProperty("height", e + "px", "important")) : (a.style.removeProperty("width"), a.style.removeProperty("height"))))
}
var mc = {},
    de, R = 12288,
    te = !1,
    ue = 0,
    ve = 0,
    we = 0,
    xe = {
        alpha: !1,
        depth: !1,
        stencil: !1,
        antialias: !1
    },
    ye = {},
    ze, Ae = a => {
        var b = a.getExtension("ANGLE_instanced_arrays");
        b && (a.vertexAttribDivisor = (c, d) => b.vertexAttribDivisorANGLE(c, d), a.drawArraysInstanced = (c, d, e, f) => b.drawArraysInstancedANGLE(c, d, e, f), a.drawElementsInstanced = (c, d, e, f, g) => b.drawElementsInstancedANGLE(c, d, e, f, g))
    },
    Be = a => {
        var b = a.getExtension("OES_vertex_array_object");
        b && (a.createVertexArray = () => b.createVertexArrayOES(), a.deleteVertexArray = c => b.deleteVertexArrayOES(c),
            a.bindVertexArray = c => b.bindVertexArrayOES(c), a.isVertexArray = c => b.isVertexArrayOES(c))
    },
    Ce = a => {
        var b = a.getExtension("WEBGL_draw_buffers");
        b && (a.drawBuffers = (c, d) => b.drawBuffersWEBGL(c, d))
    },
    De = 1,
    Ee = [],
    Fe = {},
    U = [],
    Ge = [],
    He = [],
    Ie = [],
    Je = [],
    Ke = [],
    ie = [],
    Le = [],
    Me = [],
    Ne = [],
    Oe = [],
    Pe = [1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8],
    Qe = {},
    Re = {},
    Se = 4;

function V(a) {
    Te || (Te = a)
}
var Ue = a => {
    for (var b = De++, c = a.length; c < b; c++) a[c] = null;
    return b
};

function Ve(a) {
    We = !1;
    for (var b = 0; b < P.Vk; ++b) {
        var c = P.fj[b];
        if (c.Ej && c.enabled) {
            We = !0;
            var d = c.Zj;
            d = 0 < d ? a * d : c.size * Pe[c.type - 5120] * a;
            var e = 32 - Math.clz32(0 === d ? 0 : d - 1);
            var f = P.Bj[e],
                g = P.kj[e];
            P.kj[e] = P.kj[e] + 1 & 63;
            var h = f[g];
            h ? e = h : (h = Q.getParameter(34964), f[g] = Q.createBuffer(), Q.bindBuffer(34962, f[g]), Q.bufferData(34962, 1 << e, 35048), Q.bindBuffer(34962, h), e = f[g]);
            Q.bindBuffer(34962, e);
            Q.bufferSubData(34962, 0, v.subarray(c.Gj, c.Gj + d));
            c.Gk.call(Q, b, c.size, c.type, c.rk, c.Zj, 0)
        }
    }
}
var he = (a, b) => {
        a.dk || (a.dk = a.getContext, a.getContext = function (d, e) {
            e = a.dk(d, e);
            return "webgl" == d == e instanceof WebGLRenderingContext ? e : null
        });
        var c = 1 < b.Pj ? a.getContext("webgl2", b) : a.getContext("webgl", b);
        return c ? Xe(c, b) : 0
    },
    Xe = (a, b) => {
        var c = Ue(ie),
            d = {
                handle: c,
                attributes: b,
                version: b.Pj,
                Ti: a
            };
        a.canvas && (a.canvas.Cj = d);
        ie[c] = d;
        ("undefined" == typeof b.ik || b.ik) && Ye(d);
        d.Vk = d.Ti.getParameter(34921);
        d.fj = [];
        for (a = 0; a < d.Vk; a++) d.fj[a] = {
            enabled: !1,
            Ej: !1,
            size: 0,
            type: 0,
            rk: 0,
            Zj: 0,
            Gj: 0,
            Gk: null
        };
        d.kj = [];
        d.$j = [];
        d.kj.length = d.$j.length = 22;
        d.Bj = [];
        d.Ij = [];
        d.Bj.length = d.Ij.length = 22;
        d.Aj = [];
        d.Aj.length = 22;
        for (a = 0; 21 >= a; ++a) {
            d.Aj[a] = null;
            d.kj[a] = d.$j[a] = 0;
            d.Bj[a] = [];
            d.Ij[a] = [];
            b = d.Bj[a];
            var e = d.Ij[a];
            b.length = e.length = 64;
            for (var f = 0; 64 > f; ++f) b[f] = e[f] = null
        }
        return c
    },
    je = a => {
        P = ie[a];
        k.Ui = Q = P && P.Ti;
        return !(a && !Q)
    },
    Ye = a => {
        a || (a = P);
        if (!a.zl) {
            a.zl = !0;
            var b = a.Ti;
            Ae(b);
            Be(b);
            Ce(b);
            b.hm = b.getExtension("WEBGL_draw_instanced_base_vertex_base_instance");
            b.nm = b.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance");
            2 <= a.version && (b.Si = b.getExtension("EXT_disjoint_timer_query_webgl2"));
            if (2 > a.version || !b.Si) b.Si = b.getExtension("EXT_disjoint_timer_query");
            b.om = b.getExtension("WEBGL_multi_draw");
            (b.getSupportedExtensions() || []).forEach(c => {
                c.includes("lose_context") || c.includes("debug") || b.getExtension(c)
            })
        }
    },
    ge = {},
    Te, P, We, Ze = [],
    $e = (a, b) => {
        Ze.length = 0;
        for (var c; c = v[a++];) {
            var d = 105 != c;
            d &= 112 != c;
            b += d && b % 8 ? 4 : 0;
            Ze.push(112 == c ? G[b >> 2] : 105 == c ? E[b >> 2] : eb[b >> 3]);
            b += d ? 8 : 4
        }
        return Ze
    },
    af = {},
    bf = 0;

function cf() {
    var a = bf;
    bf++;
    return a
}
var ff = a => {
        var b = df();
        a = a();
        ef(b);
        return a
    },
    gf = 0;

function hf() {
    for (var a = jf.length - 1; 0 <= a; --a) kf(a);
    jf = [];
    lf = []
}
var lf = [];

function mf(a, b, c) {
    function d(g, h) {
        if (g.length != h.length) return !1;
        for (var n in g)
            if (g[n] != h[n]) return !1;
        return !0
    }
    for (var e in lf) {
        var f = lf[e];
        if (f.Dk == a && d(f.Jk, c)) return
    }
    lf.push({
        Dk: a,
        $k: b,
        Jk: c
    });
    lf.sort((g, h) => g.$k < h.$k)
}

function nf(a) {
    for (var b = 0; b < lf.length; ++b) lf[b].Dk == a && (lf.splice(b, 1), --b)
}

function of() {
    return navigator.userActivation ? navigator.userActivation.isActive : gf && pf.Dj
}

function qf() {
    if (of())
        for (var a = 0; a < lf.length; ++a) {
            var b = lf[a];
            lf.splice(a, 1);
            --a;
            b.Dk.apply(null, b.Jk)
        }
}
var jf = [];

function kf(a) {
    var b = jf[a];
    b.target.removeEventListener(b.Li, b.rl, b.Oi);
    jf.splice(a, 1)
}

function rf(a) {
    function b(d) {
        ++gf;
        pf = a;
        qf();
        a.Qi(d);
        qf();
        --gf
    }
    if (!a.target) return -4;
    if (a.Pi) a.rl = b, a.target.addEventListener(a.Li, b, a.Oi), jf.push(a), sf || (jb.push(hf), sf = !0);
    else
        for (var c = 0; c < jf.length; ++c) jf[c].target == a.target && jf[c].Li == a.Li && kf(c--);
    return 0
}

function tf(a) {
    return a ? a == window ? "#window" : a == screen ? "#screen" : a && a.nodeName ? a.nodeName : "" : ""
}

function uf() {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled
}
var vf = {},
    sf, pf, wf, xf, yf, zf, Af, Bf, Cf, Df, Ef, Ff, Gf, Hf, If = {},
    Jf = [0, "undefined" != typeof document ? document : 0, "undefined" != typeof window ? window : 0],
    Kf = a => {
        a = 2 < a ? a ? x(v, a) : "" : a;
        return Jf[a] || ("undefined" != typeof document ? document.querySelector(a) : void 0)
    },
    Lf = (a, b, c) => {
        a = Kf(a);
        if (!a) return -4;
        E[b >> 2] = a.width;
        E[c >> 2] = a.height
    },
    Nf = a => {
        var b = aa(a) + 1,
            c = Mf(b);
        t(a, v, c, b);
        return c
    },
    Of = a => ff(() => {
        var b = Mf(8),
            c = b + 4,
            d = Nf(a.id);
        Lf(d, b, c);
        return [E[b >> 2], E[c >> 2]]
    }),
    Pf = (a, b, c) => {
        a = Kf(a);
        if (!a) return -4;
        a.width = b;
        a.height =
            c;
        return 0
    },
    Qf = (a, b, c) => {
        a.fm ? ff(() => {
            var d = Nf(a.id);
            Pf(d, b, c)
        }) : (a.width = b, a.height = c)
    },
    Rf = a => {
        function b() {
            document.fullscreenElement || document.webkitFullscreenElement || (document.removeEventListener("fullscreenchange", b), document.removeEventListener("webkitfullscreenchange", b), Qf(a, d, e), a.style.width = f, a.style.height = g, a.style.backgroundColor = h, n || (document.body.style.backgroundColor = "white"), document.body.style.backgroundColor = n, a.style.paddingLeft = p, a.style.paddingRight = q, a.style.paddingTop = u,
                a.style.paddingBottom = w, a.style.marginLeft = r, a.style.marginRight = A, a.style.marginTop = z, a.style.marginBottom = I, document.body.style.margin = N, document.documentElement.style.overflow = ea, document.body.scroll = F, a.style.hj = T, a.Cj && a.Cj.Ti.viewport(0, 0, d, e), If.Mj && M(If.Mj)(37, 0, If.Mk))
        }
        var c = Of(a),
            d = c[0],
            e = c[1],
            f = a.style.width,
            g = a.style.height,
            h = a.style.backgroundColor,
            n = document.body.style.backgroundColor,
            p = a.style.paddingLeft,
            q = a.style.paddingRight,
            u = a.style.paddingTop,
            w = a.style.paddingBottom,
            r = a.style.marginLeft,
            A = a.style.marginRight,
            z = a.style.marginTop,
            I = a.style.marginBottom,
            N = document.body.style.margin,
            ea = document.documentElement.style.overflow,
            F = document.body.scroll,
            T = a.style.hj;
        document.addEventListener("fullscreenchange", b);
        document.addEventListener("webkitfullscreenchange", b)
    },
    Sf = (a, b, c) => {
        a.style.paddingLeft = a.style.paddingRight = c + "px";
        a.style.paddingTop = a.style.paddingBottom = b + "px"
    },
    Tf = a => 0 > Jf.indexOf(a) ? a.getBoundingClientRect() : {
        left: 0,
        top: 0
    },
    Uf = (a, b) => {
        if (0 != b.zk || 0 != b.fk) {
            Rf(a);
            var c = b.Kl ? innerWidth :
                screen.width,
                d = b.Kl ? innerHeight : screen.height,
                e = Tf(a),
                f = e.width;
            e = e.height;
            var g = Of(a),
                h = g[0];
            g = g[1];
            3 == b.zk ? (Sf(a, (d - e) / 2, (c - f) / 2), c = f, d = e) : 2 == b.zk && (c * g < h * d ? (f = g * c / h, Sf(a, (d - f) / 2, 0), d = f) : (f = h * d / g, Sf(a, 0, (c - f) / 2), c = f));
            a.style.backgroundColor || (a.style.backgroundColor = "black");
            document.body.style.backgroundColor || (document.body.style.backgroundColor = "black");
            a.style.width = c + "px";
            a.style.height = d + "px";
            1 == b.tl && (a.style.hj = "optimizeSpeed", a.style.hj = "-moz-crisp-edges", a.style.hj = "-o-crisp-edges", a.style.hj =
                "-webkit-optimize-contrast", a.style.hj = "optimize-contrast", a.style.hj = "crisp-edges", a.style.hj = "pixelated");
            f = 2 == b.fk ? devicePixelRatio : 1;
            0 != b.fk && (c = c * f | 0, d = d * f | 0, Qf(a, c, d), a.Cj && a.Cj.Ti.viewport(0, 0, c, d))
        }
        if (a.requestFullscreen) a.requestFullscreen();
        else if (a.webkitRequestFullscreen) a.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        else return uf() ? -3 : -1;
        If = b;
        b.Mj && M(b.Mj)(37, 0, b.Mk);
        return 0
    },
    Vf = a => {
        if (a.requestPointerLock) a.requestPointerLock();
        else return document.body.requestPointerLock ?
            -3 : -1;
        return 0
    },
    Wf = (a, b) => {
        eb[a >> 3] = b.timestamp;
        for (var c = 0; c < b.axes.length; ++c) eb[a + 8 * c + 16 >> 3] = b.axes[c];
        for (c = 0; c < b.buttons.length; ++c) eb[a + 8 * c + 528 >> 3] = "object" == typeof b.buttons[c] ? b.buttons[c].value : b.buttons[c];
        for (c = 0; c < b.buttons.length; ++c) E[a + 4 * c + 1040 >> 2] = "object" == typeof b.buttons[c] ? b.buttons[c].pressed : 1 == b.buttons[c];
        E[a + 1296 >> 2] = b.connected;
        E[a + 1300 >> 2] = b.index;
        E[a + 8 >> 2] = b.axes.length;
        E[a + 12 >> 2] = b.buttons.length;
        t(b.id, v, a + 1304, 64);
        t(b.mapping, v, a + 1368, 64)
    };

function Xf(a) {
    Q.activeTexture(a)
}
var Yf = (a, b) => {
        Q.attachShader(U[a], Je[b])
    },
    Zf = (a, b) => {
        34962 == a ? Q.uj = b : 34963 == a && (Q.Fj = b);
        35051 == a ? Q.hk = b : 35052 == a && (Q.Vi = b);
        Q.bindBuffer(a, Ee[b])
    },
    $f = (a, b) => {
        Q.bindFramebuffer(a, Ge[b])
    },
    ag = (a, b) => {
        Q.bindRenderbuffer(a, He[b])
    },
    bg = (a, b) => {
        Q.bindTexture(a, Ie[b])
    },
    cg = a => {
        Q.bindVertexArray(Ke[a]);
        a = Q.getParameter(34965);
        Q.Fj = a ? a.name | 0 : 0
    };

function dg(a, b) {
    Q.blendFunc(a, b)
}

function eg(a, b, c, d) {
    Q.blendFuncSeparate(a, b, c, d)
}
var fg = (a, b, c, d) => {
    2 <= P.version ? c && b ? Q.bufferData(a, v, d, c, b) : Q.bufferData(a, b, d) : Q.bufferData(a, c ? v.subarray(c, c + b) : b, d)
};

function gg(a) {
    Q.clear(a)
}

function hg(a, b, c, d) {
    Q.clearColor(a, b, c, d)
}

function ig(a) {
    Q.clearDepth(a)
}

function jg(a) {
    Q.clearStencil(a)
}
var kg = (a, b, c, d) => {
        Q.colorMask(!!a, !!b, !!c, !!d)
    },
    lg = a => {
        Q.compileShader(Je[a])
    },
    mg = () => {
        var a = Ue(U),
            b = Q.createProgram();
        b.name = a;
        b.Sj = b.Qj = b.Rj = 0;
        b.Fk = 1;
        U[a] = b;
        return a
    },
    ng = a => {
        var b = Ue(Je);
        Je[b] = Q.createShader(a);
        return b
    },
    og = (a, b) => {
        for (var c = 0; c < a; c++) {
            var d = E[b + 4 * c >> 2],
                e = Ee[d];
            e && (Q.deleteBuffer(e), e.name = 0, Ee[d] = null, d == Q.uj && (Q.uj = 0), d == Q.Fj && (Q.Fj = 0), d == Q.hk && (Q.hk = 0), d == Q.Vi && (Q.Vi = 0))
        }
    },
    pg = (a, b) => {
        for (var c = 0; c < a; ++c) {
            var d = E[b + 4 * c >> 2],
                e = Ge[d];
            e && (Q.deleteFramebuffer(e), e.name = 0, Ge[d] = null)
        }
    },
    qg = a => {
        if (a) {
            var b = U[a];
            b ? (Q.deleteProgram(b), b.name = 0, U[a] = null) : V(1281)
        }
    },
    rg = (a, b) => {
        for (var c = 0; c < a; c++) {
            var d = E[b + 4 * c >> 2],
                e = He[d];
            e && (Q.deleteRenderbuffer(e), e.name = 0, He[d] = null)
        }
    },
    sg = a => {
        if (a) {
            var b = Je[a];
            b ? (Q.deleteShader(b), Je[a] = null) : V(1281)
        }
    },
    tg = (a, b) => {
        for (var c = 0; c < a; c++) {
            var d = E[b + 4 * c >> 2],
                e = Ie[d];
            e && (Q.deleteTexture(e), e.name = 0, Ie[d] = null)
        }
    },
    ug = (a, b) => {
        for (var c = 0; c < a; c++) {
            var d = E[b + 4 * c >> 2];
            Q.deleteVertexArray(Ke[d]);
            Ke[d] = null
        }
    };

function vg(a) {
    Q.depthFunc(a)
}
var wg = a => {
    Q.depthMask(!!a)
};

function xg(a, b) {
    Q.depthRange(a, b)
}

function yg(a) {
    Q.disable(a)
}
var zg = a => {
        P.fj[a].enabled = !1;
        Q.disableVertexAttribArray(a)
    },
    Ag = (a, b, c) => {
        Ve(b + c);
        Q.drawArrays(a, b, c);
        We && Q.bindBuffer(34962, Ee[Q.uj])
    },
    Bg = (a, b, c, d) => {
        Q.drawArraysInstanced(a, b, c, d)
    },
    Cg = [],
    Dg = (a, b) => {
        for (var c = Cg[a], d = 0; d < a; d++) c[d] = E[b + 4 * d >> 2];
        Q.drawBuffers(c)
    },
    Eg = (a, b, c, d) => {
        if (!Q.Fj) {
            var e = 1 * Pe[c - 5120] * b;
            var f = 32 - Math.clz32(0 === e ? 0 : e - 1);
            var g = P.Aj[f];
            g ? f = g : (g = Q.getParameter(34965), P.Aj[f] = Q.createBuffer(), Q.bindBuffer(34963, P.Aj[f]), Q.bufferData(34963, 1 << f, 35048), Q.bindBuffer(34963, g), f = P.Aj[f]);
            Q.bindBuffer(34963, f);
            Q.bufferSubData(34963, 0, v.subarray(d, d + e));
            d = 0
        }
        Ve(b);
        Q.drawElements(a, b, c, d);
        We && Q.bindBuffer(34962, Ee[Q.uj]);
        Q.Fj || Q.bindBuffer(34963, null)
    },
    Fg = (a, b, c, d, e) => {
        Q.drawElementsInstanced(a, b, c, d, e)
    };

function Gg(a) {
    Q.enable(a)
}
var Hg = a => {
    P.fj[a].enabled = !0;
    Q.enableVertexAttribArray(a)
};

function Ig() {
    Q.flush()
}
var Jg = a => {
        switch (a) {
            case 34962:
                a = 34964;
                break;
            case 34963:
                a = 34965;
                break;
            case 35051:
                a = 35053;
                break;
            case 35052:
                a = 35055;
                break;
            case 35982:
                a = 35983;
                break;
            case 36662:
                a = 36662;
                break;
            case 36663:
                a = 36663;
                break;
            case 35345:
                a = 35368
        }
        return (a = Q.getParameter(a)) ? a.name | 0 : 0
    },
    Kg = a => {
        switch (a) {
            case 34962:
            case 34963:
            case 36662:
            case 36663:
            case 35051:
            case 35052:
            case 35882:
            case 35982:
            case 35345:
                return !0;
            default:
                return !1
        }
    },
    Lg = (a, b, c, d) => {
        Q.framebufferRenderbuffer(a, b, c, He[d])
    },
    Mg = (a, b, c, d, e) => {
        Q.framebufferTexture2D(a, b, c, Ie[d],
            e)
    };

function Ng(a) {
    Q.frontFace(a)
}
var Og = (a, b, c, d) => {
        for (var e = 0; e < a; e++) {
            var f = Q[c](),
                g = f && Ue(d);
            f ? (f.name = g, d[g] = f) : V(1282);
            E[b + 4 * e >> 2] = g
        }
    },
    Pg = (a, b) => {
        Og(a, b, "createBuffer", Ee)
    },
    Qg = (a, b) => {
        Og(a, b, "createFramebuffer", Ge)
    },
    Rg = (a, b) => {
        Og(a, b, "createRenderbuffer", He)
    },
    Sg = (a, b) => {
        Og(a, b, "createTexture", Ie)
    };

function Tg(a, b) {
    Og(a, b, "createVertexArray", Ke)
}
var Ug = (a, b, c, d, e, f, g, h) => {
        b = U[b];
        if (a = Q[a](b, c)) d = h && t(a.name, v, h, d), e && (E[e >> 2] = d), f && (E[f >> 2] = a.size), g && (E[g >> 2] = a.type)
    },
    Vg = (a, b, c, d, e, f, g) => {
        Ug("getActiveUniform", a, b, c, d, e, f, g)
    },
    Wg = (a, b) => Q.getAttribLocation(U[a], b ? x(v, b) : ""),
    Xg = (a, b) => {
        G[a >> 2] = b;
        G[a + 4 >> 2] = (b - G[a >> 2]) / 4294967296
    },
    Yg = (a, b, c) => {
        if (b) {
            var d = void 0;
            switch (a) {
                case 36346:
                    d = 1;
                    break;
                case 36344:
                    0 != c && 1 != c && V(1280);
                    return;
                case 34814:
                case 36345:
                    d = 0;
                    break;
                case 34466:
                    var e = Q.getParameter(34467);
                    d = e ? e.length : 0;
                    break;
                case 33309:
                    if (2 > P.version) {
                        V(1282);
                        return
                    }
                    d = 2 * (Q.getSupportedExtensions() || []).length;
                    break;
                case 33307:
                case 33308:
                    if (2 > P.version) {
                        V(1280);
                        return
                    }
                    d = 33307 == a ? 3 : 0
            }
            if (void 0 === d) switch (e = Q.getParameter(a), typeof e) {
                case "number":
                    d = e;
                    break;
                case "boolean":
                    d = e ? 1 : 0;
                    break;
                case "string":
                    V(1280);
                    return;
                case "object":
                    if (null === e) switch (a) {
                        case 34964:
                        case 35725:
                        case 34965:
                        case 36006:
                        case 36007:
                        case 32873:
                        case 34229:
                        case 36662:
                        case 36663:
                        case 35053:
                        case 35055:
                        case 36010:
                        case 35097:
                        case 35869:
                        case 32874:
                        case 36389:
                        case 35983:
                        case 35368:
                        case 34068:
                            d =
                                0;
                            break;
                        default:
                            V(1280);
                            return
                    } else {
                        if (e instanceof Float32Array || e instanceof Uint32Array || e instanceof Int32Array || e instanceof Array) {
                            for (a = 0; a < e.length; ++a) switch (c) {
                                case 0:
                                    E[b + 4 * a >> 2] = e[a];
                                    break;
                                case 2:
                                    H[b + 4 * a >> 2] = e[a];
                                    break;
                                case 4:
                                    C[b + a >> 0] = e[a] ? 1 : 0
                            }
                            return
                        }
                        try {
                            d = e.name | 0
                        } catch (f) {
                            V(1280);
                            l("GL_INVALID_ENUM in glGet" + c + "v: Unknown object returned from WebGL getParameter(" + a + ")! (error: " + f + ")");
                            return
                        }
                    }
                    break;
                default:
                    V(1280);
                    l("GL_INVALID_ENUM in glGet" + c + "v: Native code calling glGet" + c + "v(" +
                        a + ") and it returns " + e + " of type " + typeof e + "!");
                    return
            }
            switch (c) {
                case 1:
                    Xg(b, d);
                    break;
                case 0:
                    E[b >> 2] = d;
                    break;
                case 2:
                    H[b >> 2] = d;
                    break;
                case 4:
                    C[b >> 0] = d ? 1 : 0
            }
        } else V(1281)
    },
    Zg = () => {
        var a = Q.getError() || Te;
        Te = 0;
        return a
    },
    $g = (a, b) => {
        Yg(a, b, 2)
    },
    ah = (a, b, c, d) => {
        if (c) {
            b = Q.getIndexedParameter(a, b);
            switch (typeof b) {
                case "boolean":
                    a = b ? 1 : 0;
                    break;
                case "number":
                    a = b;
                    break;
                case "object":
                    if (null === b) switch (a) {
                            case 35983:
                            case 35368:
                                a = 0;
                                break;
                            default:
                                V(1280);
                                return
                        } else if (b instanceof WebGLBuffer) a = b.name | 0;
                        else {
                            V(1280);
                            return
                        } break;
                default:
                    V(1280);
                    return
            }
            switch (d) {
                case 1:
                    Xg(c, a);
                    break;
                case 0:
                    E[c >> 2] = a;
                    break;
                case 2:
                    H[c >> 2] = a;
                    break;
                case 4:
                    C[c >> 0] = a ? 1 : 0;
                    break;
                default:
                    throw "internal emscriptenWebGLGetIndexed() error, bad type: " + d;
            }
        } else V(1281)
    },
    bh = (a, b) => {
        Yg(a, b, 0)
    },
    ch = (a, b, c, d) => {
        a = Q.getProgramInfoLog(U[a]);
        null === a && (a = "(unknown error)");
        b = 0 < b && d ? t(a, v, d, b) : 0;
        c && (E[c >> 2] = b)
    },
    dh = (a, b, c) => {
        if (c)
            if (a >= De) V(1281);
            else if (a = U[a], 35716 == b) a = Q.getProgramInfoLog(a), null === a && (a = "(unknown error)"), E[c >> 2] = a.length + 1;
        else if (35719 ==
            b) {
            if (!a.Sj)
                for (b = 0; b < Q.getProgramParameter(a, 35718); ++b) a.Sj = Math.max(a.Sj, Q.getActiveUniform(a, b).name.length + 1);
            E[c >> 2] = a.Sj
        } else if (35722 == b) {
            if (!a.Qj)
                for (b = 0; b < Q.getProgramParameter(a, 35721); ++b) a.Qj = Math.max(a.Qj, Q.getActiveAttrib(a, b).name.length + 1);
            E[c >> 2] = a.Qj
        } else if (35381 == b) {
            if (!a.Rj)
                for (b = 0; b < Q.getProgramParameter(a, 35382); ++b) a.Rj = Math.max(a.Rj, Q.getActiveUniformBlockName(a, b).length + 1);
            E[c >> 2] = a.Rj
        } else E[c >> 2] = Q.getProgramParameter(a, b);
        else V(1281)
    },
    eh = (a, b, c) => {
        if (c) {
            a = Le[a];
            b = 2 >
                P.version ? Q.Si.getQueryObjectEXT(a, b) : Q.getQueryParameter(a, b);
            var d;
            "boolean" == typeof b ? d = b ? 1 : 0 : d = b;
            Xg(c, d)
        } else V(1281)
    },
    fh = (a, b, c) => {
        if (c) {
            a = Q.Si.getQueryObjectEXT(Le[a], b);
            var d;
            "boolean" == typeof a ? d = a ? 1 : 0 : d = a;
            E[c >> 2] = d
        } else V(1281)
    },
    gh = (a, b, c, d) => {
        a = Q.getShaderInfoLog(Je[a]);
        null === a && (a = "(unknown error)");
        b = 0 < b && d ? t(a, v, d, b) : 0;
        c && (E[c >> 2] = b)
    },
    hh = (a, b, c) => {
        c ? 35716 == b ? (a = Q.getShaderInfoLog(Je[a]), null === a && (a = "(unknown error)"), E[c >> 2] = a ? a.length + 1 : 0) : 35720 == b ? (a = Q.getShaderSource(Je[a]), E[c >>
            2] = a ? a.length + 1 : 0) : E[c >> 2] = Q.getShaderParameter(Je[a], b) : V(1281)
    },
    ih = a => {
        var b = Qe[a];
        if (!b) {
            switch (a) {
                case 7939:
                    b = Q.getSupportedExtensions() || [];
                    b = b.concat(b.map(d => "GL_" + d));
                    b = Fd(b.join(" "));
                    break;
                case 7936:
                case 7937:
                case 37445:
                case 37446:
                    (b = Q.getParameter(a)) || V(1280);
                    b = b && Fd(b);
                    break;
                case 7938:
                    b = Q.getParameter(7938);
                    b = 2 <= P.version ? "OpenGL ES 3.0 (" + b + ")" : "OpenGL ES 2.0 (" + b + ")";
                    b = Fd(b);
                    break;
                case 35724:
                    b = Q.getParameter(35724);
                    var c = b.match(/^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/);
                    null !==
                        c && (3 == c[1].length && (c[1] += "0"), b = "OpenGL ES GLSL ES " + c[1] + " (" + b + ")");
                    b = Fd(b);
                    break;
                default:
                    V(1280)
            }
            Qe[a] = b
        }
        return b
    },
    jh = a => "]" == a.slice(-1) && a.lastIndexOf("["),
    kh = a => {
        var b = a.Jj,
            c = a.cl,
            d;
        if (!b)
            for (a.Jj = b = {}, a.bl = {}, d = 0; d < Q.getProgramParameter(a, 35718); ++d) {
                var e = Q.getActiveUniform(a, d);
                var f = e.name;
                e = e.size;
                var g = jh(f);
                g = 0 < g ? f.slice(0, g) : f;
                var h = a.Fk;
                a.Fk += e;
                c[g] = [e, h];
                for (f = 0; f < e; ++f) b[h] = f, a.bl[h++] = g
            }
    },
    lh = (a, b) => {
        b = b ? x(v, b) : "";
        if (a = U[a]) {
            kh(a);
            var c = a.Jj,
                d = 0,
                e = b,
                f = jh(b);
            0 < f && (d = parseInt(b.slice(f +
                1)) >>> 0, e = b.slice(0, f));
            if ((e = a.cl[e]) && d < e[0] && (d += e[1], c[d] = c[d] || Q.getUniformLocation(a, b))) return d
        } else V(1281);
        return -1
    },
    W = a => {
        var b = Q.kl;
        if (b) {
            var c = b.Jj[a];
            "number" == typeof c && (b.Jj[a] = c = Q.getUniformLocation(b, b.bl[a] + (0 < c ? "[" + c + "]" : "")));
            return c
        }
        V(1282)
    },
    mh = (a, b, c, d) => {
        if (c)
            if (a = U[a], kh(a), a = Q.getUniform(a, W(b)), "number" == typeof a || "boolean" == typeof a) switch (d) {
                case 0:
                    E[c >> 2] = a;
                    break;
                case 2:
                    H[c >> 2] = a
            } else
                for (b = 0; b < a.length; b++) switch (d) {
                    case 0:
                        E[c + 4 * b >> 2] = a[b];
                        break;
                    case 2:
                        H[c + 4 * b >> 2] =
                            a[b]
                } else V(1281)
    },
    nh = (a, b, c, d) => {
        if (c)
            if (P.fj[a].enabled && l("glGetVertexAttrib*v on client-side array: not supported, bad data returned"), a = Q.getVertexAttrib(a, b), 34975 == b) E[c >> 2] = a && a.name;
            else if ("number" == typeof a || "boolean" == typeof a) switch (d) {
            case 0:
                E[c >> 2] = a;
                break;
            case 2:
                H[c >> 2] = a;
                break;
            case 5:
                E[c >> 2] = Math.fround(a)
        } else
            for (b = 0; b < a.length; b++) switch (d) {
                case 0:
                    E[c + 4 * b >> 2] = a[b];
                    break;
                case 2:
                    H[c + 4 * b >> 2] = a[b];
                    break;
                case 5:
                    E[c + 4 * b >> 2] = Math.fround(a[b])
            } else V(1281)
    },
    oh = (a, b, c) => {
        nh(a, b, c, 0)
    },
    ph =
    a => (a = Ke[a]) ? Q.isVertexArray(a) : 0,
    qh = a => {
        a = U[a];
        Q.linkProgram(a);
        a.Jj = 0;
        a.cl = {}
    },
    rh = (a, b) => {
        3317 == a && (Se = b);
        Q.pixelStorei(a, b)
    },
    sh = a => {
        a -= 5120;
        return 0 == a ? C : 1 == a ? v : 2 == a ? db : 4 == a ? E : 6 == a ? H : 5 == a || 28922 == a || 28520 == a || 30779 == a || 30782 == a ? G : D
    },
    th = (a, b, c, d, e) => {
        a = sh(a);
        var f = 31 - Math.clz32(a.BYTES_PER_ELEMENT),
            g = Se;
        return a.subarray(e >> f, e + d * (c * ({
            5: 3,
            6: 4,
            8: 2,
            29502: 3,
            29504: 4,
            26917: 2,
            26918: 2,
            29846: 3,
            29847: 4
        } [b - 6402] || 1) * (1 << f) + g - 1 & -g) >> f)
    },
    uh = (a, b, c, d, e, f, g) => {
        if (2 <= P.version)
            if (Q.hk) Q.readPixels(a, b, c, d, e, f,
                g);
            else {
                var h = sh(f);
                Q.readPixels(a, b, c, d, e, f, h, g >> 31 - Math.clz32(h.BYTES_PER_ELEMENT))
            }
        else(g = th(f, e, c, d, g)) ? Q.readPixels(a, b, c, d, e, f, g) : V(1280)
    };

function vh(a, b, c, d) {
    Q.renderbufferStorage(a, b, c, d)
}

function wh(a, b, c, d) {
    Q.scissor(a, b, c, d)
}
var xh = (a, b, c, d) => {
    for (var e = "", f = 0; f < b; ++f) {
        var g = d ? E[d + 4 * f >> 2] : -1;
        e += wd(E[c + 4 * f >> 2], 0 > g ? void 0 : g)
    }
    Q.shaderSource(Je[a], e)
};

function yh(a, b, c) {
    Q.stencilFunc(a, b, c)
}

function zh(a) {
    Q.stencilMask(a)
}

function Ah(a, b, c) {
    Q.stencilOp(a, b, c)
}
var Bh = (a, b, c, d, e, f, g, h, n) => {
    if (2 <= P.version)
        if (Q.Vi) Q.texImage2D(a, b, c, d, e, f, g, h, n);
        else if (n) {
        var p = sh(h);
        Q.texImage2D(a, b, c, d, e, f, g, h, p, n >> 31 - Math.clz32(p.BYTES_PER_ELEMENT))
    } else Q.texImage2D(a, b, c, d, e, f, g, h, null);
    else Q.texImage2D(a, b, c, d, e, f, g, h, n ? th(h, g, d, e, n) : null)
};

function Ch(a, b, c) {
    Q.texParameterf(a, b, c)
}
var Dh = (a, b, c, d, e, f, g, h, n) => {
        if (2 <= P.version)
            if (Q.Vi) Q.texSubImage2D(a, b, c, d, e, f, g, h, n);
            else if (n) {
            var p = sh(h);
            Q.texSubImage2D(a, b, c, d, e, f, g, h, p, n >> 31 - Math.clz32(p.BYTES_PER_ELEMENT))
        } else Q.texSubImage2D(a, b, c, d, e, f, g, h, null);
        else p = null, n && (p = th(h, g, e, f, n)), Q.texSubImage2D(a, b, c, d, e, f, g, h, p)
    },
    Eh = (a, b) => {
        Q.uniform1f(W(a), b)
    },
    Fh = [],
    Gh = (a, b, c) => {
        if (2 <= P.version) b && Q.uniform1fv(W(a), H, c >> 2, b);
        else {
            if (288 >= b)
                for (var d = Fh[b - 1], e = 0; e < b; ++e) d[e] = H[c + 4 * e >> 2];
            else d = H.subarray(c >> 2, c + 4 * b >> 2);
            Q.uniform1fv(W(a),
                d)
        }
    },
    Hh = (a, b) => {
        Q.uniform1i(W(a), b)
    },
    Ih = [],
    Jh = (a, b, c) => {
        if (2 <= P.version) b && Q.uniform1iv(W(a), E, c >> 2, b);
        else {
            if (288 >= b)
                for (var d = Ih[b - 1], e = 0; e < b; ++e) d[e] = E[c + 4 * e >> 2];
            else d = E.subarray(c >> 2, c + 4 * b >> 2);
            Q.uniform1iv(W(a), d)
        }
    },
    Kh = (a, b, c) => {
        if (2 <= P.version) b && Q.uniform2fv(W(a), H, c >> 2, 2 * b);
        else {
            if (144 >= b)
                for (var d = Fh[2 * b - 1], e = 0; e < 2 * b; e += 2) d[e] = H[c + 4 * e >> 2], d[e + 1] = H[c + (4 * e + 4) >> 2];
            else d = H.subarray(c >> 2, c + 8 * b >> 2);
            Q.uniform2fv(W(a), d)
        }
    },
    Lh = (a, b, c) => {
        if (2 <= P.version) b && Q.uniform2iv(W(a), E, c >> 2, 2 * b);
        else {
            if (144 >=
                b)
                for (var d = Ih[2 * b - 1], e = 0; e < 2 * b; e += 2) d[e] = E[c + 4 * e >> 2], d[e + 1] = E[c + (4 * e + 4) >> 2];
            else d = E.subarray(c >> 2, c + 8 * b >> 2);
            Q.uniform2iv(W(a), d)
        }
    },
    Mh = (a, b, c) => {
        if (2 <= P.version) b && Q.uniform3fv(W(a), H, c >> 2, 3 * b);
        else {
            if (96 >= b)
                for (var d = Fh[3 * b - 1], e = 0; e < 3 * b; e += 3) d[e] = H[c + 4 * e >> 2], d[e + 1] = H[c + (4 * e + 4) >> 2], d[e + 2] = H[c + (4 * e + 8) >> 2];
            else d = H.subarray(c >> 2, c + 12 * b >> 2);
            Q.uniform3fv(W(a), d)
        }
    },
    Nh = (a, b, c) => {
        if (2 <= P.version) b && Q.uniform3iv(W(a), E, c >> 2, 3 * b);
        else {
            if (96 >= b)
                for (var d = Ih[3 * b - 1], e = 0; e < 3 * b; e += 3) d[e] = E[c + 4 * e >> 2], d[e + 1] = E[c +
                    (4 * e + 4) >> 2], d[e + 2] = E[c + (4 * e + 8) >> 2];
            else d = E.subarray(c >> 2, c + 12 * b >> 2);
            Q.uniform3iv(W(a), d)
        }
    },
    Oh = (a, b, c) => {
        if (2 <= P.version) b && Q.uniform4fv(W(a), H, c >> 2, 4 * b);
        else {
            if (72 >= b) {
                var d = Fh[4 * b - 1],
                    e = H;
                c >>= 2;
                for (var f = 0; f < 4 * b; f += 4) {
                    var g = c + f;
                    d[f] = e[g];
                    d[f + 1] = e[g + 1];
                    d[f + 2] = e[g + 2];
                    d[f + 3] = e[g + 3]
                }
            } else d = H.subarray(c >> 2, c + 16 * b >> 2);
            Q.uniform4fv(W(a), d)
        }
    },
    Ph = (a, b, c) => {
        if (2 <= P.version) b && Q.uniform4iv(W(a), E, c >> 2, 4 * b);
        else {
            if (72 >= b)
                for (var d = Ih[4 * b - 1], e = 0; e < 4 * b; e += 4) d[e] = E[c + 4 * e >> 2], d[e + 1] = E[c + (4 * e + 4) >> 2], d[e + 2] = E[c +
                    (4 * e + 8) >> 2], d[e + 3] = E[c + (4 * e + 12) >> 2];
            else d = E.subarray(c >> 2, c + 16 * b >> 2);
            Q.uniform4iv(W(a), d)
        }
    },
    Qh = (a, b, c, d) => {
        if (2 <= P.version) b && Q.uniformMatrix2fv(W(a), !!c, H, d >> 2, 4 * b);
        else {
            if (72 >= b)
                for (var e = Fh[4 * b - 1], f = 0; f < 4 * b; f += 4) e[f] = H[d + 4 * f >> 2], e[f + 1] = H[d + (4 * f + 4) >> 2], e[f + 2] = H[d + (4 * f + 8) >> 2], e[f + 3] = H[d + (4 * f + 12) >> 2];
            else e = H.subarray(d >> 2, d + 16 * b >> 2);
            Q.uniformMatrix2fv(W(a), !!c, e)
        }
    },
    Rh = (a, b, c, d) => {
        if (2 <= P.version) b && Q.uniformMatrix3fv(W(a), !!c, H, d >> 2, 9 * b);
        else {
            if (32 >= b)
                for (var e = Fh[9 * b - 1], f = 0; f < 9 * b; f += 9) e[f] = H[d +
                    4 * f >> 2], e[f + 1] = H[d + (4 * f + 4) >> 2], e[f + 2] = H[d + (4 * f + 8) >> 2], e[f + 3] = H[d + (4 * f + 12) >> 2], e[f + 4] = H[d + (4 * f + 16) >> 2], e[f + 5] = H[d + (4 * f + 20) >> 2], e[f + 6] = H[d + (4 * f + 24) >> 2], e[f + 7] = H[d + (4 * f + 28) >> 2], e[f + 8] = H[d + (4 * f + 32) >> 2];
            else e = H.subarray(d >> 2, d + 36 * b >> 2);
            Q.uniformMatrix3fv(W(a), !!c, e)
        }
    },
    Sh = (a, b, c, d) => {
        if (2 <= P.version) b && Q.uniformMatrix4fv(W(a), !!c, H, d >> 2, 16 * b);
        else {
            if (18 >= b) {
                var e = Fh[16 * b - 1],
                    f = H;
                d >>= 2;
                for (var g = 0; g < 16 * b; g += 16) {
                    var h = d + g;
                    e[g] = f[h];
                    e[g + 1] = f[h + 1];
                    e[g + 2] = f[h + 2];
                    e[g + 3] = f[h + 3];
                    e[g + 4] = f[h + 4];
                    e[g + 5] = f[h + 5];
                    e[g +
                        6] = f[h + 6];
                    e[g + 7] = f[h + 7];
                    e[g + 8] = f[h + 8];
                    e[g + 9] = f[h + 9];
                    e[g + 10] = f[h + 10];
                    e[g + 11] = f[h + 11];
                    e[g + 12] = f[h + 12];
                    e[g + 13] = f[h + 13];
                    e[g + 14] = f[h + 14];
                    e[g + 15] = f[h + 15]
                }
            } else e = H.subarray(d >> 2, d + 64 * b >> 2);
            Q.uniformMatrix4fv(W(a), !!c, e)
        }
    },
    Th = a => {
        a = U[a];
        Q.useProgram(a);
        Q.kl = a
    },
    Uh = (a, b) => {
        Q.vertexAttribDivisor(a, b)
    },
    Vh = (a, b, c, d, e, f) => {
        var g = P.fj[a];
        Q.uj ? (g.Ej = !1, Q.vertexAttribPointer(a, b, c, !!d, e, f)) : (g.size = b, g.type = c, g.rk = d, g.Zj = e, g.Gj = f, g.Ej = !0, g.Gk = function (h, n, p, q, u, w) {
            this.vertexAttribPointer(h, n, p, q, u, w)
        })
    };

function Wh(a, b, c, d) {
    Q.viewport(a, b, c, d)
}
var Xh = (a, b) => {
        if (!uf()) return -1;
        a = Kf(a);
        return a ? a.requestFullscreen || a.webkitRequestFullscreen ? of() ? Uf(a, b) : b.ol ? (mf(Uf, 1, [a, b]), 1) : -2 : -3 : -4
    },
    Yh = (a, b) => {
        var c = {
            target: Kf(2),
            Li: "beforeunload",
            Pi: b,
            Qi: (d = event) => {
                var e = M(b)(28, 0, a);
                e && (e = e ? x(v, e) : "");
                if (e) return d.preventDefault(), d.returnValue = e
            },
            Oi: !0
        };
        return rf(c)
    },
    Zh = (a, b, c, d, e, f) => {
        xf || (xf = m(256));
        a = {
            target: Kf(a),
            Li: f,
            Pi: d,
            Qi: (g = event) => {
                var h = g.target.id ? g.target.id : "",
                    n = xf;
                t(tf(g.target), v, n + 0, 128);
                t(h, v, n + 128, 128);
                M(d)(e, n, b) && g.preventDefault()
            },
            Oi: c
        };
        return rf(a)
    },
    $h = (a, b, c, d, e) => {
        zf || (zf = m(280));
        return rf({
            target: a,
            Li: e,
            Pi: d,
            Qi: (f = event) => {
                var g = zf,
                    h = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement,
                    n = !!h;
                E[g >> 2] = n;
                E[g + 4 >> 2] = uf();
                var p = n ? h : yf,
                    q = p && p.id ? p.id : "";
                t(tf(p), v, g + 8, 128);
                t(q, v, g + 136, 128);
                E[g + 264 >> 2] = p ? p.clientWidth : 0;
                E[g + 268 >> 2] = p ? p.clientHeight : 0;
                E[g + 272 >> 2] = screen.width;
                E[g + 276 >> 2] = screen.height;
                n && (yf = h);
                M(d)(19, g, b) && f.preventDefault()
            },
            Oi: c
        })
    },
    ai = (a, b,
        c, d, e) => {
        Af || (Af = m(1432));
        b = {
            target: Kf(2),
            Dj: !0,
            Li: e,
            Pi: c,
            Qi: (f = event) => {
                var g = Af;
                Wf(g, f.gamepad);
                M(c)(d, g, a) && f.preventDefault()
            },
            Oi: b
        };
        return rf(b)
    },
    bi = (a, b, c, d, e, f) => {
        Bf || (Bf = m(176));
        a = {
            target: Kf(a),
            Dj: !0,
            Li: f,
            Pi: d,
            Qi: g => {
                var h = Bf;
                eb[h >> 3] = g.timeStamp;
                var n = h >> 2;
                E[n + 2] = g.location;
                E[n + 3] = g.ctrlKey;
                E[n + 4] = g.shiftKey;
                E[n + 5] = g.altKey;
                E[n + 6] = g.metaKey;
                E[n + 7] = g.repeat;
                E[n + 8] = g.charCode;
                E[n + 9] = g.keyCode;
                E[n + 10] = g.which;
                t(g.key || "", v, h + 44, 32);
                t(g.code || "", v, h + 76, 32);
                t(g.char || "", v, h + 108, 32);
                t(g.locale ||
                    "", v, h + 140, 32);
                M(d)(e, h, b) && g.preventDefault()
            },
            Oi: c
        };
        return rf(a)
    },
    ci = (a, b, c) => {
        eb[a >> 3] = b.timeStamp;
        a >>= 2;
        E[a + 2] = b.screenX;
        E[a + 3] = b.screenY;
        E[a + 4] = b.clientX;
        E[a + 5] = b.clientY;
        E[a + 6] = b.ctrlKey;
        E[a + 7] = b.shiftKey;
        E[a + 8] = b.altKey;
        E[a + 9] = b.metaKey;
        db[2 * a + 20] = b.button;
        db[2 * a + 21] = b.buttons;
        E[a + 11] = b.movementX;
        E[a + 12] = b.movementY;
        c = Tf(c);
        E[a + 13] = b.clientX - c.left;
        E[a + 14] = b.clientY - c.top
    },
    di = (a, b, c, d, e, f) => {
        Cf || (Cf = m(72));
        a = Kf(a);
        return rf({
            target: a,
            Dj: "mousemove" != f && "mouseenter" != f && "mouseleave" != f,
            Li: f,
            Pi: d,
            Qi: (g = event) => {
                ci(Cf, g, a);
                M(d)(e, Cf, b) && g.preventDefault()
            },
            Oi: c
        })
    },
    ei = (a, b, c, d, e) => {
        Df || (Df = m(260));
        return rf({
            target: a,
            Li: e,
            Pi: d,
            Qi: (f = event) => {
                var g = Df,
                    h = document.pointerLockElement || document.Ai || document.Ri || document.Gi;
                E[g >> 2] = !!h;
                var n = h && h.id ? h.id : "";
                t(tf(h), v, g + 4, 128);
                t(n, v, g + 132, 128);
                M(d)(20, g, b) && f.preventDefault()
            },
            Oi: c
        })
    },
    fi = (a, b, c, d) => {
        Ef || (Ef = m(36));
        a = Kf(a);
        return rf({
            target: a,
            Li: "resize",
            Pi: d,
            Qi: (e = event) => {
                if (e.target == a) {
                    var f = document.body;
                    if (f) {
                        var g = Ef;
                        E[g >> 2] = e.detail;
                        E[g +
                            4 >> 2] = f.clientWidth;
                        E[g + 8 >> 2] = f.clientHeight;
                        E[g + 12 >> 2] = innerWidth;
                        E[g + 16 >> 2] = innerHeight;
                        E[g + 20 >> 2] = outerWidth;
                        E[g + 24 >> 2] = outerHeight;
                        E[g + 28 >> 2] = pageXOffset;
                        E[g + 32 >> 2] = pageYOffset;
                        M(d)(10, g, b) && e.preventDefault()
                    }
                }
            },
            Oi: c
        })
    },
    gi = (a, b, c, d, e, f) => {
        Ff || (Ff = m(1696));
        a = Kf(a);
        return rf({
            target: a,
            Dj: "touchstart" == f || "touchend" == f,
            Li: f,
            Pi: d,
            Qi: g => {
                for (var h, n = {}, p = g.touches, q = 0; q < p.length; ++q) h = p[q], h.Tk = h.Yk = 0, n[h.identifier] = h;
                for (q = 0; q < g.changedTouches.length; ++q) h = g.changedTouches[q], h.Tk = 1, n[h.identifier] =
                    h;
                for (q = 0; q < g.targetTouches.length; ++q) n[g.targetTouches[q].identifier].Yk = 1;
                p = Ff;
                eb[p >> 3] = g.timeStamp;
                var u = p >> 2;
                E[u + 3] = g.ctrlKey;
                E[u + 4] = g.shiftKey;
                E[u + 5] = g.altKey;
                E[u + 6] = g.metaKey;
                u += 7;
                var w = Tf(a),
                    r = 0;
                for (q in n)
                    if (h = n[q], E[u] = h.identifier, E[u + 1] = h.screenX, E[u + 2] = h.screenY, E[u + 3] = h.clientX, E[u + 4] = h.clientY, E[u + 5] = h.pageX, E[u + 6] = h.pageY, E[u + 7] = h.Tk, E[u + 8] = h.Yk, E[u + 9] = h.clientX - w.left, E[u + 10] = h.clientY - w.top, u += 13, 31 < ++r) break;
                E[p + 8 >> 2] = r;
                M(d)(e, p, b) && g.preventDefault()
            },
            Oi: c
        })
    },
    hi = (a, b, c) => {
        var d =
            Jf[1];
        Gf || (Gf = m(8));
        return rf({
            target: d,
            Li: "visibilitychange",
            Pi: c,
            Qi: (e = event) => {
                var f = Gf,
                    g = ["hidden", "visible", "prerender", "unloaded"].indexOf(document.visibilityState);
                E[f >> 2] = document.hidden;
                E[f + 4 >> 2] = g;
                M(c)(21, f, a) && e.preventDefault()
            },
            Oi: b
        })
    },
    ii = (a, b, c, d, e, f) => {
        a = {
            target: Kf(a),
            Li: f,
            Pi: d,
            Qi: (g = event) => {
                M(d)(e, 0, b) && g.preventDefault()
            },
            Oi: c
        };
        rf(a)
    },
    ji = (a, b, c, d) => {
        Hf || (Hf = m(104));
        return rf({
            target: a,
            Dj: !0,
            Li: "wheel",
            Pi: d,
            Qi: (e = event) => {
                var f = Hf;
                ci(f, e, a);
                eb[f + 72 >> 3] = e.deltaX;
                eb[f + 80 >> 3] = e.deltaY;
                eb[f + 88 >> 3] = e.deltaZ;
                E[f + 96 >> 2] = e.deltaMode;
                M(d)(9, f, b) && e.preventDefault()
            },
            Oi: c
        })
    };

function ki() {
    this.tj = [void 0];
    this.Qk = []
}
var li, mi;

function ni(a, b, c, d, e) {
    function f() {
        var Y = 0,
            ua = 0;
        F.response && N && 0 === G[a + 12 >> 2] && (ua = F.response.byteLength);
        0 < ua && (Y = m(ua), v.set(new Uint8Array(F.response), Y));
        G[a + 12 >> 2] = Y;
        Xg(a + 16, ua);
        Xg(a + 24, 0);
        (Y = F.response ? F.response.byteLength : 0) && Xg(a + 32, Y);
        D[a + 40 >> 1] = F.readyState;
        D[a + 42 >> 1] = F.status;
        F.statusText && t(F.statusText, v, a + 44, 64)
    }
    var g = G[a + 8 >> 2];
    if (g) {
        var h = g ? x(v, g) : "",
            n = a + 112,
            p = wd(n + 0);
        p || (p = "GET");
        var q = G[n + 56 >> 2],
            u = G[n + 68 >> 2],
            w = G[n + 72 >> 2];
        g = G[n + 76 >> 2];
        var r = G[n + 80 >> 2],
            A = G[n + 84 >> 2],
            z = G[n + 88 >> 2],
            I =
            G[n + 52 >> 2],
            N = !!(I & 1),
            ea = !!(I & 2);
        I = !!(I & 64);
        u = u ? u ? x(v, u) : "" : void 0;
        w = w ? w ? x(v, w) : "" : void 0;
        var F = new XMLHttpRequest;
        F.withCredentials = !!v[n + 60 >> 0];
        F.open(p, h, !I, u, w);
        I || (F.timeout = q);
        F.Gi = h;
        F.responseType = "arraybuffer";
        r && (h = r ? x(v, r) : "", F.overrideMimeType(h));
        if (g)
            for (;;) {
                n = G[g >> 2];
                if (!n) break;
                h = G[g + 4 >> 2];
                if (!h) break;
                g += 8;
                n = n ? x(v, n) : "";
                h = h ? x(v, h) : "";
                F.setRequestHeader(n, h)
            }
        var T = li.Lj(F);
        G[a >> 2] = T;
        g = A && z ? v.slice(A, A + z) : null;
        F.onload = Y => {
            li.has(T) && (f(), 200 <= F.status && 300 > F.status ? b && b(a, F, Y) : c && c(a,
                F, Y))
        };
        F.onerror = Y => {
            li.has(T) && (f(), c && c(a, F, Y))
        };
        F.ontimeout = Y => {
            li.has(T) && c && c(a, F, Y)
        };
        F.onprogress = Y => {
            if (li.has(T)) {
                var ua = N && ea && F.response ? F.response.byteLength : 0,
                    S = 0;
                0 < ua && N && ea && (S = m(ua), v.set(new Uint8Array(F.response), S));
                G[a + 12 >> 2] = S;
                Xg(a + 16, ua);
                Xg(a + 24, Y.loaded - ua);
                Xg(a + 32, Y.total);
                D[a + 40 >> 1] = F.readyState;
                3 <= F.readyState && 0 === F.status && 0 < Y.loaded && (F.status = 200);
                D[a + 42 >> 1] = F.status;
                F.statusText && t(F.statusText, v, a + 44, 64);
                d && d(a, F, Y);
                S && ca(S)
            }
        };
        F.onreadystatechange = Y => {
            li.has(T) && (D[a +
                40 >> 1] = F.readyState, 2 <= F.readyState && (D[a + 42 >> 1] = F.status), e && e(a, F, Y))
        };
        try {
            F.send(g)
        } catch (Y) {
            c && c(a, F, Y)
        }
    } else c(a, 0, "no url specified!")
}

function oi(a, b, c, d) {
    var e = mi;
    if (e) {
        var f = G[a + 112 + 64 >> 2];
        f || (f = G[a + 8 >> 2]);
        var g = f ? x(v, f) : "";
        try {
            var h = e.transaction(["FILES"], "readwrite").objectStore("FILES").put(b, g);
            h.onsuccess = () => {
                D[a + 40 >> 1] = 4;
                D[a + 42 >> 1] = 200;
                t("OK", v, a + 44, 64);
                c(a, 0, g)
            };
            h.onerror = n => {
                D[a + 40 >> 1] = 4;
                D[a + 42 >> 1] = 413;
                t("Payload Too Large", v, a + 44, 64);
                d(a, 0, n)
            }
        } catch (n) {
            d(a, 0, n)
        }
    } else d(a, 0, "IndexedDB not available!")
}

function pi(a, b, c) {
    var d = mi;
    if (d) {
        var e = G[a + 112 + 64 >> 2];
        e || (e = G[a + 8 >> 2]);
        e = e ? x(v, e) : "";
        try {
            var f = d.transaction(["FILES"], "readonly").objectStore("FILES").get(e);
            f.onsuccess = g => {
                if (g.target.result) {
                    g = g.target.result;
                    var h = g.byteLength || g.length,
                        n = m(h);
                    v.set(new Uint8Array(g), n);
                    G[a + 12 >> 2] = n;
                    Xg(a + 16, h);
                    Xg(a + 24, 0);
                    Xg(a + 32, h);
                    D[a + 40 >> 1] = 4;
                    D[a + 42 >> 1] = 200;
                    t("OK", v, a + 44, 64);
                    b(a, 0, g)
                } else D[a + 40 >> 1] = 4, D[a + 42 >> 1] = 404, t("Not Found", v, a + 44, 64), c(a, 0, "no data")
            };
            f.onerror = g => {
                D[a + 40 >> 1] = 4;
                D[a + 42 >> 1] = 404;
                t("Not Found",
                    v, a + 44, 64);
                c(a, 0, g)
            }
        } catch (g) {
            c(a, 0, g)
        }
    } else c(a, 0, "IndexedDB not available!")
}

function qi(a, b, c) {
    var d = mi;
    if (d) {
        var e = G[a + 112 + 64 >> 2];
        e || (e = G[a + 8 >> 2]);
        e = e ? x(v, e) : "";
        try {
            var f = d.transaction(["FILES"], "readwrite").objectStore("FILES").delete(e);
            f.onsuccess = g => {
                g = g.target.result;
                G[a + 12 >> 2] = 0;
                Xg(a + 16, 0);
                Xg(a + 24, 0);
                Xg(a + 32, 0);
                D[a + 40 >> 1] = 4;
                D[a + 42 >> 1] = 200;
                t("OK", v, a + 44, 64);
                b(a, 0, g)
            };
            f.onerror = g => {
                D[a + 40 >> 1] = 4;
                D[a + 42 >> 1] = 404;
                t("Not Found", v, a + 44, 64);
                c(a, 0, g)
            }
        } catch (g) {
            c(a, 0, g)
        }
    } else c(a, 0, "IndexedDB not available!")
}
var ri = ["default", "low-power", "high-performance"],
    si = [null],
    X = null,
    ti = {},
    vi = () => {
        if (!ui) {
            var a = {
                    USER: "web_user",
                    LOGNAME: "web_user",
                    PATH: "/",
                    PWD: "/",
                    HOME: "/home/web_user",
                    LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
                    _: Ma || "./this.program"
                },
                b;
            for (b in ti) void 0 === ti[b] ? delete a[b] : a[b] = ti[b];
            var c = [];
            for (b in a) c.push(`=${a[b]}`);
            ui = c
        }
        return ui
    },
    ui, wi = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    xi = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    yi =
    (a, b, c, d) => {
        function e(r, A, z) {
            for (r = "number" == typeof r ? r.toString() : r || ""; r.length < A;) r = z[0] + r;
            return r
        }

        function f(r, A) {
            return e(r, A, "0")
        }

        function g(r, A) {
            function z(N) {
                return 0 > N ? -1 : 0 < N ? 1 : 0
            }
            var I;
            0 === (I = z(r.getFullYear() - A.getFullYear())) && 0 === (I = z(r.getMonth() - A.getMonth())) && (I = z(r.getDate() - A.getDate()));
            return I
        }

        function h(r) {
            switch (r.getDay()) {
                case 0:
                    return new Date(r.getFullYear() - 1, 11, 29);
                case 1:
                    return r;
                case 2:
                    return new Date(r.getFullYear(), 0, 3);
                case 3:
                    return new Date(r.getFullYear(), 0, 2);
                case 4:
                    return new Date(r.getFullYear(), 0, 1);
                case 5:
                    return new Date(r.getFullYear() - 1, 11, 31);
                case 6:
                    return new Date(r.getFullYear() - 1, 11, 30)
            }
        }

        function n(r) {
            var A = r.rj;
            for (r = new Date((new Date(r.sj + 1900, 0, 1)).getTime()); 0 < A;) {
                var z = r.getMonth(),
                    I = (Cd(r.getFullYear()) ? wi : xi)[z];
                if (A > I - r.getDate()) A -= I - r.getDate() + 1, r.setDate(1), 11 > z ? r.setMonth(z + 1) : (r.setMonth(0), r.setFullYear(r.getFullYear() + 1));
                else {
                    r.setDate(r.getDate() + A);
                    break
                }
            }
            z = new Date(r.getFullYear() + 1, 0, 4);
            A = h(new Date(r.getFullYear(), 0, 4));
            z = h(z);
            return 0 >= g(A, r) ? 0 >= g(z, r) ? r.getFullYear() + 1 : r.getFullYear() : r.getFullYear() - 1
        }
        var p = G[d + 40 >> 2];
        d = {
            Nl: E[d >> 2],
            Ml: E[d + 4 >> 2],
            ak: E[d + 8 >> 2],
            Ek: E[d + 12 >> 2],
            bk: E[d + 16 >> 2],
            sj: E[d + 20 >> 2],
            Zi: E[d + 24 >> 2],
            rj: E[d + 28 >> 2],
            um: E[d + 32 >> 2],
            Ll: E[d + 36 >> 2],
            Ol: p ? p ? x(v, p) : "" : ""
        };
        c = c ? x(v, c) : "";
        p = {
            "%c": "%a %b %d %H:%M:%S %Y",
            "%D": "%m/%d/%y",
            "%F": "%Y-%m-%d",
            "%h": "%b",
            "%r": "%I:%M:%S %p",
            "%R": "%H:%M",
            "%T": "%H:%M:%S",
            "%x": "%m/%d/%y",
            "%X": "%H:%M:%S",
            "%Ec": "%c",
            "%EC": "%C",
            "%Ex": "%m/%d/%y",
            "%EX": "%H:%M:%S",
            "%Ey": "%y",
            "%EY": "%Y",
            "%Od": "%d",
            "%Oe": "%e",
            "%OH": "%H",
            "%OI": "%I",
            "%Om": "%m",
            "%OM": "%M",
            "%OS": "%S",
            "%Ou": "%u",
            "%OU": "%U",
            "%OV": "%V",
            "%Ow": "%w",
            "%OW": "%W",
            "%Oy": "%y"
        };
        for (var q in p) c = c.replace(new RegExp(q, "g"), p[q]);
        var u = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
            w = "January February March April May June July August September October November December".split(" ");
        p = {
            "%a": r => u[r.Zi].substring(0, 3),
            "%A": r => u[r.Zi],
            "%b": r => w[r.bk].substring(0, 3),
            "%B": r => w[r.bk],
            "%C": r => f((r.sj + 1900) / 100 | 0, 2),
            "%d": r =>
                f(r.Ek, 2),
            "%e": r => e(r.Ek, 2, " "),
            "%g": r => n(r).toString().substring(2),
            "%G": r => n(r),
            "%H": r => f(r.ak, 2),
            "%I": r => {
                r = r.ak;
                0 == r ? r = 12 : 12 < r && (r -= 12);
                return f(r, 2)
            },
            "%j": r => {
                for (var A = 0, z = 0; z <= r.bk - 1; A += (Cd(r.sj + 1900) ? wi : xi)[z++]);
                return f(r.Ek + A, 3)
            },
            "%m": r => f(r.bk + 1, 2),
            "%M": r => f(r.Ml, 2),
            "%n": () => "\n",
            "%p": r => 0 <= r.ak && 12 > r.ak ? "AM" : "PM",
            "%S": r => f(r.Nl, 2),
            "%t": () => "\t",
            "%u": r => r.Zi || 7,
            "%U": r => f(Math.floor((r.rj + 7 - r.Zi) / 7), 2),
            "%V": r => {
                var A = Math.floor((r.rj + 7 - (r.Zi + 6) % 7) / 7);
                2 >= (r.Zi + 371 - r.rj - 2) % 7 && A++;
                if (A) 53 ==
                    A && (z = (r.Zi + 371 - r.rj) % 7, 4 == z || 3 == z && Cd(r.sj) || (A = 1));
                else {
                    A = 52;
                    var z = (r.Zi + 7 - r.rj - 1) % 7;
                    (4 == z || 5 == z && Cd(r.sj % 400 - 1)) && A++
                }
                return f(A, 2)
            },
            "%w": r => r.Zi,
            "%W": r => f(Math.floor((r.rj + 7 - (r.Zi + 6) % 7) / 7), 2),
            "%y": r => (r.sj + 1900).toString().substring(2),
            "%Y": r => r.sj + 1900,
            "%z": r => {
                r = r.Ll;
                var A = 0 <= r;
                r = Math.abs(r) / 60;
                return (A ? "+" : "-") + String("0000" + (r / 60 * 100 + r % 60)).slice(-4)
            },
            "%Z": r => r.Ol,
            "%%": () => "%"
        };
        c = c.replace(/%%/g, "\x00\x00");
        for (q in p) c.includes(q) && (c = c.replace(new RegExp(q, "g"), p[q](d)));
        c = c.replace(/\0\0/g,
            "%");
        q = Yb(c, !1);
        if (q.length > b) return 0;
        C.set(q, a);
        return q.length - 1
    },
    Fb = (a, b, c, d) => {
        var e = {
            string: p => {
                var q = 0;
                null !== p && void 0 !== p && 0 !== p && (q = Nf(p));
                return q
            },
            array: p => {
                var q = Mf(p.length);
                C.set(p, q);
                return q
            }
        };
        a = k["_" + a];
        var f = [],
            g = 0;
        if (d)
            for (var h = 0; h < d.length; h++) {
                var n = e[c[h]];
                n ? (0 === g && (g = df()), f[h] = n(d[h])) : f[h] = d[h]
            }
        c = a.apply(null, f);
        return c = function (p) {
            0 !== g && ef(g);
            return "string" === b ? p ? x(v, p) : "" : "boolean" === b ? !!p : p
        }(c)
    };

function Fc(a, b, c, d) {
    a || (a = this);
    this.parent = a;
    this.Ji = a.Ji;
    this.ij = null;
    this.id = vc++;
    this.name = b;
    this.mode = c;
    this.Bi = {};
    this.Di = {};
    this.rdev = d
}
Object.defineProperties(Fc.prototype, {
    read: {
        get: function () {
            return 365 === (this.mode & 365)
        },
        set: function (a) {
            a ? this.mode |= 365 : this.mode &= -366
        }
    },
    write: {
        get: function () {
            return 146 === (this.mode & 146)
        },
        set: function (a) {
            a ? this.mode |= 146 : this.mode &= -147
        }
    },
    El: {
        get: function () {
            return B(this.mode)
        }
    },
    Dl: {
        get: function () {
            return 8192 === (this.mode & 61440)
        }
    }
});
Xc();
wc = Array(4096);
Db(y, "/");
Cb("/tmp");
Cb("/home");
Cb("/home/web_user");
(function () {
    Cb("/dev");
    bc(259, {
        read: () => 0,
        write: (d, e, f, g) => g
    });
    Pc("/dev/null", 259);
    $b(1280, dc);
    $b(1536, ec);
    Pc("/dev/tty", 1280);
    Pc("/dev/tty1", 1536);
    var a = new Uint8Array(1024),
        b = 0,
        c = () => {
            0 === b && (b = Pb(a).byteLength);
            return a[--b]
        };
    ad("/dev", "random", c);
    ad("/dev", "urandom", c);
    Cb("/dev/shm");
    Cb("/dev/shm/tmp")
})();
(function () {
    Cb("/proc");
    var a = Cb("/proc/self");
    Cb("/proc/self/fd");
    Db({
        Ji() {
            var b = hc(a, "fd", 16895, 73);
            b.Bi = {
                lookup(c, d) {
                    var e = Kc(+d);
                    c = {
                        parent: null,
                        Ji: {
                            jj: "fake"
                        },
                        Bi: {
                            readlink: () => e.path
                        }
                    };
                    return c.parent = c
                }
            };
            return b
        }
    }, "/proc/self/fd")
})();
k.FS_createPath = Zc;
k.FS_createDataFile = pc;
k.FS_createPreloadedFile = qc;
k.FS_unlink = Ja;
k.FS_createLazyFile = cd;
k.FS_createDevice = ad;
k.requestFullscreen = (a, b) => ne(a, b);
k.requestAnimationFrame = a => Od(a);
k.setCanvasSize = (a, b, c) => {
    pe(k.canvas, a, b);
    c || qe()
};
k.pauseMainLoop = () => {
    Kd = null;
    Qd++
};
k.resumeMainLoop = () => {
    Qd++;
    var a = Gd,
        b = Hd,
        c = Id;
    Id = null;
    Wd(c);
    Pd(a, b);
    Kd()
};
k.getUserMedia = () => {
    window.getUserMedia || (window.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia);
    window.getUserMedia(void 0)
};
k.createContext = (a, b, c, d) => fe(a, b, c, d);
for (var Q, zi = 0; 32 > zi; ++zi) Cg.push(Array(zi));
var Bi = new Float32Array(288);
for (zi = 0; 288 > zi; ++zi) Fh[zi] = Bi.subarray(0, zi + 1);
var Ci = new Int32Array(288);
for (zi = 0; 288 > zi; ++zi) Ih[zi] = Ci.subarray(0, zi + 1);
li = new ki;
qb("library_fetch_init");
(function (a, b) {
    try {
        var c = indexedDB.open("emscripten_filesystem", 1)
    } catch (d) {
        b(d);
        return
    }
    c.onupgradeneeded = d => {
        d = d.target.result;
        d.objectStoreNames.contains("FILES") && d.deleteObjectStore("FILES");
        d.createObjectStore("FILES")
    };
    c.onsuccess = d => a(d.target.result);
    c.onerror = d => b(d)
})(a => {
    mi = a;
    rb("library_fetch_init")
}, () => {
    mi = !1;
    rb("library_fetch_init")
});
Object.assign(ki.prototype, {
    get(a) {
        return this.tj[a]
    },
    has(a) {
        return void 0 !== this.tj[a]
    },
    Lj(a) {
        var b = this.Qk.pop() || this.tj.length;
        this.tj[b] = a;
        return b
    },
    ul(a) {
        this.tj[a] = void 0;
        this.Qk.push(a)
    }
});
var Gi = {
        Tb: function (a) {
            try {
                a = a ? x(v, a) : "";
                var b = Ca(a, {
                    oj: !0
                });
                if (null === b.node) throw new O(44);
                if (!B(b.node.mode)) throw new O(54);
                var c = Ec(b.node, "x");
                if (c) throw new O(c);
                Ub = b.path;
                return 0
            } catch (d) {
                if ("undefined" == typeof dd || "ErrnoError" !== d.name) throw d;
                return -d.Ei
            }
        },
        za: function (a, b, c) {
            zd = c;
            try {
                var d = Kc(a);
                switch (b) {
                    case 0:
                        var e = Ad();
                        if (0 > e) return -28;
                        for (; uc[e];) e++;
                        return Lc(d, e).fd;
                    case 1:
                    case 2:
                        return 0;
                    case 3:
                        return d.flags;
                    case 4:
                        return e = Ad(), d.flags |= e, 0;
                    case 5:
                        return e = Ad(), db[e + 0 >> 1] = 2,
                            0;
                    case 6:
                    case 7:
                        return 0;
                    case 16:
                    case 8:
                        return -28;
                    case 9:
                        return E[Di() >> 2] = 28, -1;
                    default:
                        return -28
                }
            } catch (f) {
                if ("undefined" == typeof dd || "ErrnoError" !== f.name) throw f;
                return -f.Ei
            }
        },
        Kb: function (a, b, c) {
            try {
                var d = Kc(a);
                d.pj || (d.pj = Aa(d.path));
                a = 0;
                for (var e = Vc(d, 0, 1), f = Math.floor(e / 280); f < d.pj.length && a + 280 <= c;) {
                    var g = d.pj[f];
                    if ("." === g) {
                        var h = d.node.id;
                        var n = 4
                    } else if (".." === g) h = Ca(d.path, {
                        parent: !0
                    }).node.id, n = 4;
                    else {
                        var p = jc(d.node, g);
                        h = p.id;
                        n = 8192 === (p.mode & 61440) ? 2 : B(p.mode) ? 4 : 40960 === (p.mode & 61440) ?
                            10 : 8
                    }
                    K = [h >>> 0, (J = h, 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)];
                    E[b + a >> 2] = K[0];
                    E[b + a + 4 >> 2] = K[1];
                    K = [280 * (f + 1) >>> 0, (J = 280 * (f + 1), 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)];
                    E[b + a + 8 >> 2] = K[0];
                    E[b + a + 12 >> 2] = K[1];
                    db[b + a + 16 >> 1] = 280;
                    C[b + a + 18 >> 0] = n;
                    t(g, v, b + a + 19, 256);
                    a += 280;
                    f += 1
                }
                Vc(d, 280 * f, 0);
                return a
            } catch (q) {
                if ("undefined" == typeof dd || "ErrnoError" !== q.name) throw q;
                return -q.Ei
            }
        },
        Vb: function (a, b, c) {
            zd = c;
            try {
                var d = Kc(a);
                switch (b) {
                    case 21509:
                        return d.tty ? 0 : -59;
                    case 21505:
                        if (!d.tty) return -59;
                        if (d.tty.dj.Al) {
                            b = [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            var e = Ad();
                            E[e >> 2] = 25856;
                            E[e + 4 >> 2] = 5;
                            E[e + 8 >> 2] = 191;
                            E[e + 12 >> 2] = 35387;
                            for (var f = 0; 32 > f; f++) C[e + f + 17 >> 0] = b[f] || 0
                        }
                        return 0;
                    case 21510:
                    case 21511:
                    case 21512:
                        return d.tty ? 0 : -59;
                    case 21506:
                    case 21507:
                    case 21508:
                        if (!d.tty) return -59;
                        if (d.tty.dj.Bl)
                            for (e = Ad(), b = [], f = 0; 32 > f; f++) b.push(C[e + f + 17 >> 0]);
                        return 0;
                    case 21519:
                        if (!d.tty) return -59;
                        e = Ad();
                        return E[e >> 2] = 0;
                    case 21520:
                        return d.tty ? -28 : -59;
                    case 21531:
                        e = Ad();
                        if (!d.Di.Oj) throw new O(59);
                        return d.Di.Oj(d, b, e);
                    case 21523:
                        if (!d.tty) return -59;
                        d.tty.dj.Cl && (f = [24, 80], e = Ad(), db[e >> 1] = f[0], db[e + 2 >> 1] = f[1]);
                        return 0;
                    case 21524:
                        return d.tty ? 0 : -59;
                    case 21515:
                        return d.tty ? 0 : -59;
                    default:
                        return -28
                }
            } catch (g) {
                if ("undefined" == typeof dd || "ErrnoError" !== g.name) throw g;
                return -g.Ei
            }
        },
        Ob: function (a, b) {
            try {
                return a = a ? x(v, a) : "", yd(Rc, a, b)
            } catch (c) {
                if ("undefined" == typeof dd || "ErrnoError" !== c.name) throw c;
                return -c.Ei
            }
        },
        Lb: function (a, b, c) {
            try {
                return b = b ? x(v, b) : "", b = xd(a, b), b = za(b), "/" === b[b.length - 1] && (b = b.substr(0, b.length - 1)), Cb(b, c), 0
            } catch (d) {
                if ("undefined" == typeof dd || "ErrnoError" !== d.name) throw d;
                return -d.Ei
            }
        },
        Pb: function (a, b, c, d) {
            try {
                b = b ? x(v, b) : "";
                var e = d & 256;
                b = xd(a, b, d & 4096);
                return yd(e ? Rc : Ba, b, c)
            } catch (f) {
                if ("undefined" == typeof dd || "ErrnoError" !== f.name) throw f;
                return -f.Ei
            }
        },
        wa: function (a, b, c, d) {
            zd = d;
            try {
                b = b ? x(v, b) : "";
                b = xd(a, b);
                var e = d ? Ad() : 0;
                return Sc(b, c, e).fd
            } catch (f) {
                if ("undefined" == typeof dd ||
                    "ErrnoError" !== f.name) throw f;
                return -f.Ei
            }
        },
        Jb: function (a, b, c, d) {
            try {
                b = b ? x(v, b) : "";
                b = xd(a, b);
                if (0 >= d) return -28;
                var e = zc(b),
                    f = Math.min(d, aa(e)),
                    g = C[c + f];
                t(e, v, c, d + 1);
                C[c + f] = g;
                return f
            } catch (h) {
                if ("undefined" == typeof dd || "ErrnoError" !== h.name) throw h;
                return -h.Ei
            }
        },
        Bb: function (a, b, c, d, e, f) {
            try {
                var g = kd(a),
                    h = ed(g, c);
                if (!h) return 0;
                e && Bd(e, g.family, vd(h.Hi), h.port, f);
                v.set(h.buffer, b);
                return h.buffer.byteLength
            } catch (n) {
                if ("undefined" == typeof dd || "ErrnoError" !== n.name) throw n;
                return -n.Ei
            }
        },
        Fb: function (a,
            b, c, d) {
            try {
                b = b ? x(v, b) : "";
                d = d ? x(v, d) : "";
                b = xd(a, b);
                d = xd(c, d);
                a = b;
                var e = Rb(a),
                    f = Rb(d),
                    g = Sb(a),
                    h = Sb(d);
                var n = Ca(a, {
                    parent: !0
                });
                var p = n.node;
                n = Ca(d, {
                    parent: !0
                });
                var q = n.node;
                if (!p || !q) throw new O(44);
                if (p.Ji !== q.Ji) throw new O(75);
                var u = jc(p, g),
                    w = Vb(a, f);
                if ("." !== w.charAt(0)) throw new O(28);
                w = Vb(d, e);
                if ("." !== w.charAt(0)) throw new O(55);
                try {
                    var r = jc(q, h)
                } catch (I) {}
                if (u !== r) {
                    var A = B(u.mode),
                        z = Ic(p, g, A);
                    if (z) throw new O(z);
                    if (z = r ? Ic(q, h, A) : Hc(q, h)) throw new O(z);
                    if (!p.Bi.rename) throw new O(63);
                    if (u.ij ||
                        r && r.ij) throw new O(10);
                    if (q !== p && (z = Ec(p, "w"))) throw new O(z);
                    Dc(u);
                    try {
                        p.Bi.rename(u, q, h)
                    } catch (I) {
                        throw I;
                    } finally {
                        Cc(u)
                    }
                }
                return 0
            } catch (I) {
                if ("undefined" == typeof dd || "ErrnoError" !== I.name) throw I;
                return -I.Ei
            }
        },
        Gb: function (a) {
            try {
                return a = a ? x(v, a) : "", Ia(a), 0
            } catch (b) {
                if ("undefined" == typeof dd || "ErrnoError" !== b.name) throw b;
                return -b.Ei
            }
        },
        Ab: function (a, b, c, d, e, f) {
            try {
                var g = kd(a);
                if (0 === e) var h = null;
                else {
                    var n = od(e, f);
                    if (n.Ei) throw new O(n.Ei);
                    var p = n.Hi;
                    n.Hi = (ud[p] ? ud[p] : null) || n.Hi;
                    h = n
                }
                return h ?
                    fd(g, C, b, c, h.Hi, h.port) : Wc(g.stream, C, b, c)
            } catch (q) {
                if ("undefined" == typeof dd || "ErrnoError" !== q.name) throw q;
                return -q.Ei
            }
        },
        Qb: function (a, b) {
            try {
                return a = a ? x(v, a) : "", yd(Ba, a, b)
            } catch (c) {
                if ("undefined" == typeof dd || "ErrnoError" !== c.name) throw c;
                return -c.Ei
            }
        },
        Hb: function (a, b, c) {
            try {
                return b = b ? x(v, b) : "", b = xd(a, b), 0 === c ? Ja(b) : 512 === c ? Ia(b) : $a("Invalid flags passed to unlinkat"), 0
            } catch (d) {
                if ("undefined" == typeof dd || "ErrnoError" !== d.name) throw d;
                return -d.Ei
            }
        },
        fh: function (a) {
            if (li.has(a)) {
                var b = li.get(a);
                li.ul(a);
                0 < b.readyState && 4 > b.readyState && b.abort()
            }
        },
        dh: function (a, b, c) {
            a = li.get(a).getAllResponseHeaders();
            var d = aa(a) + 1;
            t(a, v, b, c);
            return Math.min(d, c)
        },
        eh: function (a) {
            return aa(li.get(a).getAllResponseHeaders()) + 1
        },
        Rb: () => !0,
        vb: function (a, b, c) {
            a = new Date(1E3 * (b + 2097152 >>> 0 < 4194305 - !!a ? (a >>> 0) + 4294967296 * b : NaN));
            E[c >> 2] = a.getUTCSeconds();
            E[c + 4 >> 2] = a.getUTCMinutes();
            E[c + 8 >> 2] = a.getUTCHours();
            E[c + 12 >> 2] = a.getUTCDate();
            E[c + 16 >> 2] = a.getUTCMonth();
            E[c + 20 >> 2] = a.getUTCFullYear() - 1900;
            E[c + 24 >> 2] = a.getUTCDay();
            E[c + 28 >> 2] = (a.getTime() - Date.UTC(a.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864E5 | 0
        },
        wb: function (a, b, c) {
            a = new Date(1E3 * (b + 2097152 >>> 0 < 4194305 - !!a ? (a >>> 0) + 4294967296 * b : NaN));
            E[c >> 2] = a.getSeconds();
            E[c + 4 >> 2] = a.getMinutes();
            E[c + 8 >> 2] = a.getHours();
            E[c + 12 >> 2] = a.getDate();
            E[c + 16 >> 2] = a.getMonth();
            E[c + 20 >> 2] = a.getFullYear() - 1900;
            E[c + 24 >> 2] = a.getDay();
            E[c + 28 >> 2] = (Cd(a.getFullYear()) ? Dd : Ed)[a.getMonth()] + a.getDate() - 1 | 0;
            E[c + 36 >> 2] = -(60 * a.getTimezoneOffset());
            b = (new Date(a.getFullYear(), 6, 1)).getTimezoneOffset();
            var d =
                (new Date(a.getFullYear(), 0, 1)).getTimezoneOffset();
            E[c + 32 >> 2] = (b != d && a.getTimezoneOffset() == Math.min(d, b)) | 0
        },
        xb: function (a) {
            var b = new Date(E[a + 20 >> 2] + 1900, E[a + 16 >> 2], E[a + 12 >> 2], E[a + 8 >> 2], E[a + 4 >> 2], E[a >> 2], 0),
                c = E[a + 32 >> 2],
                d = b.getTimezoneOffset(),
                e = (new Date(b.getFullYear(), 6, 1)).getTimezoneOffset(),
                f = (new Date(b.getFullYear(), 0, 1)).getTimezoneOffset(),
                g = Math.min(f, e);
            0 > c ? E[a + 32 >> 2] = Number(e != f && g == d) : 0 < c != (g == d) && (e = Math.max(f, e), b.setTime(b.getTime() + 6E4 * ((0 < c ? g : e) - d)));
            E[a + 24 >> 2] = b.getDay();
            E[a +
                28 >> 2] = (Cd(b.getFullYear()) ? Dd : Ed)[b.getMonth()] + b.getDate() - 1 | 0;
            E[a >> 2] = b.getSeconds();
            E[a + 4 >> 2] = b.getMinutes();
            E[a + 8 >> 2] = b.getHours();
            E[a + 12 >> 2] = b.getDate();
            E[a + 16 >> 2] = b.getMonth();
            E[a + 20 >> 2] = b.getYear();
            a = b.getTime() / 1E3;
            return Ei((J = a, 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)), a >>> 0
        },
        yb: function (a) {
            var b = new Date(Date.UTC(E[a + 20 >> 2] + 1900, E[a + 16 >> 2], E[a + 12 >> 2], E[a + 8 >> 2], E[a + 4 >> 2], E[a >> 2], 0));
            E[a + 24 >> 2] = b.getUTCDay();
            E[a + 28 >> 2] = (b.getTime() -
                Date.UTC(b.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864E5 | 0;
            a = b.getTime() / 1E3;
            return Ei((J = a, 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)), a >>> 0
        },
        Eb: (a, b, c) => {
            function d(n) {
                return (n = n.toTimeString().match(/\(([A-Za-z ]+)\)$/)) ? n[1] : "GMT"
            }
            var e = (new Date).getFullYear(),
                f = new Date(e, 0, 1),
                g = new Date(e, 6, 1);
            e = f.getTimezoneOffset();
            var h = g.getTimezoneOffset();
            G[a >> 2] = 60 * Math.max(e, h);
            E[b >> 2] = Number(e != h);
            a = d(f);
            b = d(g);
            a = Fd(a);
            b = Fd(b);
            h < e ? (G[c >> 2] = a, G[c + 4 >> 2] = b) :
                (G[c >> 2] = b, G[c + 4 >> 2] = a)
        },
        q: () => {
            $a("")
        },
        zh: a => {
            if (12448 == a) return R = 12288, 1;
            R = 12300;
            return 0
        },
        Ch: (a, b, c, d, e) => {
            if (62E3 != a) R = 12296, c = 0;
            else {
                if (b)
                    for (;;) {
                        a = E[b >> 2];
                        if (12321 == a) xe.alpha = 0 < E[b + 4 >> 2];
                        else if (12325 == a) xe.depth = 0 < E[b + 4 >> 2];
                        else if (12326 == a) xe.stencil = 0 < E[b + 4 >> 2];
                        else if (12337 == a) a = E[b + 4 >> 2], xe.antialias = 0 < a;
                        else if (12338 == a) a = E[b + 4 >> 2], xe.antialias = 1 == a;
                        else if (12544 == a) xe.mm = 12547 != E[b + 4 >> 2];
                        else if (12344 == a) break;
                        b += 8
                    }
                c && d || e ? (e && (E[e >> 2] = 1), c && 0 < d && (G[c >> 2] = 62002), R = 12288, c = 1) : (R = 12300,
                    c = 0)
            }
            return c
        },
        ph: (a, b, c, d) => {
            if (62E3 != a) return R = 12296, 0;
            for (a = 1;;) {
                b = E[d >> 2];
                if (12440 == b) a = E[d + 4 >> 2];
                else if (12344 == b) break;
                else return R = 12292, 0;
                d += 8
            }
            if (2 > a || 3 < a) return R = 12293, 0;
            xe.Pj = a - 1;
            xe.Fl = 0;
            ze = he(k.canvas, xe);
            if (0 != ze) return R = 12288, je(ze), k.Ql = !0, ce.forEach(function (e) {
                e()
            }), je(null), 62004;
            R = 12297;
            return 0
        },
        rh: (a, b) => {
            if (62E3 != a) return R = 12296, 0;
            if (62002 != b) return R = 12293, 0;
            R = 12288;
            return 62006
        },
        qh: (a, b) => {
            if (62E3 != a) return R = 12296, 0;
            if (62004 != b) return R = 12294, 0;
            a = ze;
            P === ie[a] && (P = null);
            if ("object" == typeof vf)
                for (var c = ie[a].Ti.canvas, d = 0; d < jf.length; ++d) jf[d].target != c || kf(d--);
            ie[a] && ie[a].Ti.canvas && (ie[a].Ti.canvas.Cj = void 0);
            ie[a] = null;
            R = 12288;
            ue == b && (ue = 0);
            return 1
        },
        sh: (a, b) => {
            if (62E3 != a) return R = 12296, 0;
            if (62006 != b) return R = 12301, 1;
            ve == b && (ve = 0);
            we == b && (we = 0);
            R = 12288;
            return 1
        },
        Dh: (a, b, c, d) => {
            if (62E3 != a) return R = 12296, 0;
            if (62002 != b) return R = 12293, 0;
            if (!d) return R = 12300, 0;
            R = 12288;
            switch (c) {
                case 12320:
                    return E[d >> 2] = xe.alpha ? 32 : 24, 1;
                case 12321:
                    return E[d >> 2] = xe.alpha ? 8 : 0, 1;
                case 12322:
                    return E[d >>
                        2] = 8, 1;
                case 12323:
                    return E[d >> 2] = 8, 1;
                case 12324:
                    return E[d >> 2] = 8, 1;
                case 12325:
                    return E[d >> 2] = xe.depth ? 24 : 0, 1;
                case 12326:
                    return E[d >> 2] = xe.stencil ? 8 : 0, 1;
                case 12327:
                    return E[d >> 2] = 12344, 1;
                case 12328:
                    return E[d >> 2] = 62002, 1;
                case 12329:
                    return E[d >> 2] = 0, 1;
                case 12330:
                    return E[d >> 2] = 4096, 1;
                case 12331:
                    return E[d >> 2] = 16777216, 1;
                case 12332:
                    return E[d >> 2] = 4096, 1;
                case 12333:
                    return E[d >> 2] = 0, 1;
                case 12334:
                    return E[d >> 2] = 0, 1;
                case 12335:
                    return E[d >> 2] = 12344, 1;
                case 12337:
                    return E[d >> 2] = xe.antialias ? 4 : 0, 1;
                case 12338:
                    return E[d >>
                        2] = xe.antialias ? 1 : 0, 1;
                case 12339:
                    return E[d >> 2] = 4, 1;
                case 12340:
                    return E[d >> 2] = 12344, 1;
                case 12341:
                case 12342:
                case 12343:
                    return E[d >> 2] = -1, 1;
                case 12345:
                case 12346:
                    return E[d >> 2] = 0, 1;
                case 12347:
                    return E[d >> 2] = 0, 1;
                case 12348:
                    return E[d >> 2] = 1;
                case 12349:
                case 12350:
                    return E[d >> 2] = 0, 1;
                case 12351:
                    return E[d >> 2] = 12430, 1;
                case 12352:
                    return E[d >> 2] = 4, 1;
                case 12354:
                    return E[d >> 2] = 0, 1;
                default:
                    return R = 12292, 0
            }
        },
        Pa: () => {
            R = 12288;
            return 62E3
        },
        oh: () => R,
        Ah: (a, b, c) => {
            if (62E3 != a) return R = 12296, 0;
            b && (E[b >> 2] = 1);
            c && (E[c >>
                2] = 4);
            te = !0;
            R = 12288;
            return 1
        },
        uh: (a, b, c, d) => {
            if (62E3 != a) return R = 12296, 0;
            if (0 != d && 62004 != d) return R = 12294, 0;
            if (0 != c && 62006 != c || 0 != b && 62006 != b) return R = 12301, 0;
            je(d ? ze : null);
            ue = d;
            we = b;
            ve = c;
            R = 12288;
            return 1
        },
        nh: (a, b) => {
            if (62E3 != a) return R = 12296, 0;
            R = 12288;
            if (ye[b]) return ye[b];
            switch (b) {
                case 12371:
                    a = Fd("Emscripten");
                    break;
                case 12372:
                    a = Fd("1.4 Emscripten EGL");
                    break;
                case 12373:
                    a = Fd("");
                    break;
                case 12429:
                    a = Fd("OpenGL_ES");
                    break;
                default:
                    return R = 12300, 0
            }
            return ye[b] = a
        },
        vh: () => {
            if (te)
                if (k.Ui)
                    if (k.Ui.isContextLost()) R =
                        12302;
                    else return R = 12288, 1;
            else R = 12290;
            else R = 12289;
            return 0
        },
        wh: (a, b) => {
            if (62E3 != a) return R = 12296, 0;
            0 == b ? Pd(0, 0) : Pd(1, b);
            R = 12288;
            return 1
        },
        Bh: a => {
            if (62E3 != a) return R = 12296, 0;
            we = ve = ue = 0;
            te = !1;
            R = 12288;
            return 1
        },
        yh: () => {
            R = 12288;
            return 1
        },
        xh: () => {
            R = 12288;
            return 1
        },
        s: (a, b, c) => {
            b = $e(b, c);
            return Ib[a].apply(null, b)
        },
        a: (a, b, c) => {
            b = $e(b, c);
            return Ib[a].apply(null, b)
        },
        e: (a, b, c) => {
            b = $e(b, c);
            return Ib[a].apply(null, b)
        },
        Va: (a, b, c, d, e, f, g, h) => {
            function n() {
                g && ff(() => {
                    var w = 0;
                    q.statusText && (w = Nf(q.statusText));
                    M(g)(u, d, q.status, w)
                })
            }
            var p = a ? x(v, a) : "";
            a = b ? x(v, b) : "";
            c = c ? x(v, c) : "";
            var q = new XMLHttpRequest;
            q.open(a, p, !0);
            q.responseType = "arraybuffer";
            var u = cf();
            q.onload = function () {
                if (200 <= q.status && 300 > q.status || 0 === q.status && "http" != p.substr(0, 4).toLowerCase()) {
                    var w = new Uint8Array(q.response),
                        r = m(w.length);
                    v.set(w, r);
                    f && M(f)(u, d, r, w.length);
                    e && ca(r)
                } else n();
                delete af[u]
            };
            q.onerror = function () {
                n();
                delete af[u]
            };
            q.onprogress = function (w) {
                h && M(h)(u, d, w.loaded, w.lengthComputable || void 0 === w.lengthComputable ? w.total :
                    0)
            };
            q.onabort = function () {
                delete af[u]
            };
            "POST" == a ? (q.setRequestHeader("Content-type", "application/x-www-form-urlencoded"), q.send(c)) : q.send(null);
            af[u] = q;
            return u
        },
        Ih: a => {
            clearInterval(a)
        },
        ba: () => Date.now(),
        ih: () => {
            if (!uf()) return -1;
            nf(Uf);
            var a = Jf[1];
            if (a.exitFullscreen) a.fullscreenElement && a.exitFullscreen();
            else if (a.webkitExitFullscreen) a.webkitFullscreenElement && a.webkitExitFullscreen();
            else return -1;
            return 0
        },
        lh: () => {
            nf(Vf);
            if (document.exitPointerLock) document.exitPointerLock();
            else return -1;
            return 0
        },
        Ya: Lf,
        z: () => "number" == typeof devicePixelRatio && devicePixelRatio || 1,
        k: (a, b, c) => {
            a = Kf(a);
            if (!a) return -4;
            a = Tf(a);
            eb[b >> 3] = a.width;
            eb[c >> 3] = a.height;
            return 0
        },
        Sa: (a, b) => {
            if (0 > a || a >= wf.length) return -5;
            if (!wf[a]) return -7;
            Wf(b, wf[a]);
            return 0
        },
        aa: Md,
        Eh: () => wf.length,
        mh: (a, b) => {
            E[a >> 2] = screen.width;
            E[b >> 2] = screen.height
        },
        Lg: Xf,
        Kg: Yf,
        Od: (a, b) => {
            Q.beginQuery(a, Le[b])
        },
        $g: (a, b) => {
            Q.Si.beginQueryEXT(a, Le[b])
        },
        rd: function (a) {
            Q.beginTransformFeedback(a)
        },
        Jg: (a, b, c) => {
            Q.bindAttribLocation(U[a], b, c ? x(v,
                c) : "")
        },
        Ig: Zf,
        od: (a, b, c) => {
            Q.bindBufferBase(a, b, Ee[c])
        },
        pd: (a, b, c, d, e) => {
            Q.bindBufferRange(a, b, Ee[c], d, e)
        },
        Hg: $f,
        Fg: ag,
        vc: (a, b) => {
            Q.bindSampler(a, Me[b])
        },
        Eg: bg,
        nc: (a, b) => {
            Q.bindTransformFeedback(a, Ne[b])
        },
        wd: cg,
        Tg: cg,
        Dg: function (a, b, c, d) {
            Q.blendColor(a, b, c, d)
        },
        Cg: function (a) {
            Q.blendEquation(a)
        },
        Bg: function (a, b) {
            Q.blendEquationSeparate(a, b)
        },
        Ag: dg,
        zg: eg,
        Bd: function (a, b, c, d, e, f, g, h, n, p) {
            Q.blitFramebuffer(a, b, c, d, e, f, g, h, n, p)
        },
        yg: fg,
        xg: (a, b, c, d) => {
            2 <= P.version ? c && Q.bufferSubData(a, b, v, d, c) : Q.bufferSubData(a,
                b, v.subarray(d, d + c))
        },
        wg: function (a) {
            return Q.checkFramebufferStatus(a)
        },
        vg: gg,
        Tc: function (a, b, c, d) {
            Q.clearBufferfi(a, b, c, d)
        },
        Uc: (a, b, c) => {
            Q.clearBufferfv(a, b, H, c >> 2)
        },
        Wc: (a, b, c) => {
            Q.clearBufferiv(a, b, E, c >> 2)
        },
        Vc: (a, b, c) => {
            Q.clearBufferuiv(a, b, G, c >> 2)
        },
        ug: hg,
        tg: ig,
        sg: jg,
        Fc: (a, b, c, d) => Q.clientWaitSync(Oe[a], b, (c >>> 0) + 4294967296 * d),
        rg: kg,
        qg: lg,
        pg: (a, b, c, d, e, f, g, h) => {
            2 <= P.version ? Q.Vi || !g ? Q.compressedTexImage2D(a, b, c, d, e, f, g, h) : Q.compressedTexImage2D(a, b, c, d, e, f, v, h, g) : Q.compressedTexImage2D(a, b, c, d,
                e, f, h ? v.subarray(h, h + g) : null)
        },
        Td: (a, b, c, d, e, f, g, h, n) => {
            Q.Vi ? Q.compressedTexImage3D(a, b, c, d, e, f, g, h, n) : Q.compressedTexImage3D(a, b, c, d, e, f, g, v, n, h)
        },
        og: (a, b, c, d, e, f, g, h, n) => {
            2 <= P.version ? Q.Vi || !h ? Q.compressedTexSubImage2D(a, b, c, d, e, f, g, h, n) : Q.compressedTexSubImage2D(a, b, c, d, e, f, g, v, n, h) : Q.compressedTexSubImage2D(a, b, c, d, e, f, g, n ? v.subarray(n, n + h) : null)
        },
        Sd: (a, b, c, d, e, f, g, h, n, p, q) => {
            Q.Vi ? Q.compressedTexSubImage3D(a, b, c, d, e, f, g, h, n, p, q) : Q.compressedTexSubImage3D(a, b, c, d, e, f, g, h, n, v, q, p)
        },
        Rc: function (a,
            b, c, d, e) {
            Q.copyBufferSubData(a, b, c, d, e)
        },
        ng: function (a, b, c, d, e, f, g, h) {
            Q.copyTexImage2D(a, b, c, d, e, f, g, h)
        },
        mg: function (a, b, c, d, e, f, g, h) {
            Q.copyTexSubImage2D(a, b, c, d, e, f, g, h)
        },
        Ud: function (a, b, c, d, e, f, g, h, n) {
            Q.copyTexSubImage3D(a, b, c, d, e, f, g, h, n)
        },
        lg: mg,
        kg: ng,
        jg: function (a) {
            Q.cullFace(a)
        },
        ig: og,
        hg: pg,
        gg: qg,
        Qd: (a, b) => {
            for (var c = 0; c < a; c++) {
                var d = E[b + 4 * c >> 2],
                    e = Le[d];
                e && (Q.deleteQuery(e), Le[d] = null)
            }
        },
        bh: (a, b) => {
            for (var c = 0; c < a; c++) {
                var d = E[b + 4 * c >> 2],
                    e = Le[d];
                e && (Q.Si.deleteQueryEXT(e), Le[d] = null)
            }
        },
        fg: rg,
        xc: (a, b) => {
            for (var c = 0; c < a; c++) {
                var d = E[b + 4 * c >> 2],
                    e = Me[d];
                e && (Q.deleteSampler(e), e.name = 0, Me[d] = null)
            }
        },
        eg: sg,
        Gc: a => {
            if (a) {
                var b = Oe[a];
                b ? (Q.deleteSync(b), b.name = 0, Oe[a] = null) : V(1281)
            }
        },
        dg: tg,
        mc: (a, b) => {
            for (var c = 0; c < a; c++) {
                var d = E[b + 4 * c >> 2],
                    e = Ne[d];
                e && (Q.deleteTransformFeedback(e), e.name = 0, Ne[d] = null)
            }
        },
        vd: ug,
        Sg: ug,
        cg: vg,
        bg: wg,
        ag: xg,
        $f: (a, b) => {
            Q.detachShader(U[a], Je[b])
        },
        _f: yg,
        Zf: zg,
        Yf: Ag,
        Kc: Bg,
        Og: Bg,
        Yb: Bg,
        $d: Bg,
        Zb: Bg,
        Id: Dg,
        Zd: Dg,
        Pg: Dg,
        Xf: Eg,
        Jc: Fg,
        Ng: Fg,
        Wb: Fg,
        Xb: Fg,
        _d: Fg,
        Xd: (a, b, c, d, e, f) => {
            Eg(a, d,
                e, f)
        },
        Wf: Gg,
        Vf: Hg,
        Nd: function (a) {
            Q.endQuery(a)
        },
        _g: a => {
            Q.Si.endQueryEXT(a)
        },
        qd: function () {
            Q.endTransformFeedback()
        },
        Ic: (a, b) => (a = Q.fenceSync(a, b)) ? (b = Ue(Oe), a.name = b, Oe[b] = a, b) : 0,
        Uf: function () {
            Q.finish()
        },
        Tf: Ig,
        xd: (a, b, c) => {
            if (Kg(a)) {
                var d = Fe[Jg(a)];
                d ? d.Ik & 16 ? 0 > b || 0 > c || b + c > d.length ? (V(1281), l("invalid range in glFlushMappedBufferRange")) : Q.bufferSubData(a, d.offset, v.subarray(d.cj + b, d.cj + b + c)) : (V(1282), l("buffer was not mapped with GL_MAP_FLUSH_EXPLICIT_BIT in glFlushMappedBufferRange")) : (V(1282),
                    l("buffer was never mapped in glFlushMappedBufferRange"))
            } else V(1280), l("GL_INVALID_ENUM in glFlushMappedBufferRange")
        },
        Sf: Lg,
        Rf: Mg,
        zd: (a, b, c, d, e) => {
            Q.framebufferTextureLayer(a, b, Ie[c], d, e)
        },
        Qf: Ng,
        Pf: Pg,
        Nf: Qg,
        Rd: (a, b) => {
            Og(a, b, "createQuery", Le)
        },
        ch: (a, b) => {
            for (var c = 0; c < a; c++) {
                var d = Q.Si.createQueryEXT();
                if (!d) {
                    for (V(1282); c < a;) E[b + 4 * c++ >> 2] = 0;
                    break
                }
                var e = Ue(Le);
                d.name = e;
                Le[e] = d;
                E[b + 4 * c >> 2] = e
            }
        },
        Mf: Rg,
        yc: (a, b) => {
            Og(a, b, "createSampler", Me)
        },
        Lf: Sg,
        lc: (a, b) => {
            Og(a, b, "createTransformFeedback", Ne)
        },
        ud: Tg,
        Rg: Tg,
        Of: function (a) {
            Q.generateMipmap(a)
        },
        Kf: (a, b, c, d, e, f, g) => {
            Ug("getActiveAttrib", a, b, c, d, e, f, g)
        },
        Jf: Vg,
        Mc: (a, b, c, d, e) => {
            a = U[a];
            if (a = Q.getActiveUniformBlockName(a, b)) e && 0 < c ? (c = t(a, v, e, c), d && (E[d >> 2] = c)) : d && (E[d >> 2] = 0)
        },
        Nc: (a, b, c, d) => {
            if (d)
                if (a = U[a], 35393 == c) E[d >> 2] = Q.getActiveUniformBlockName(a, b).length + 1;
                else {
                    if (a = Q.getActiveUniformBlockParameter(a, b, c), null !== a)
                        if (35395 == c)
                            for (c = 0; c < a.length; c++) E[d + 4 * c >> 2] = a[c];
                        else E[d >> 2] = a
                }
            else V(1281)
        },
        Pc: (a, b, c, d, e) => {
            if (e)
                if (0 < b && 0 == c) V(1281);
                else {
                    a = U[a];
                    for (var f = [], g = 0; g < b; g++) f.push(E[c + 4 * g >> 2]);
                    if (a = Q.getActiveUniforms(a, f, d))
                        for (b = a.length, g = 0; g < b; g++) E[e + 4 * g >> 2] = a[g]
                }
            else V(1281)
        },
        If: (a, b, c, d) => {
            a = Q.getAttachedShaders(U[a]);
            var e = a.length;
            e > b && (e = b);
            E[c >> 2] = e;
            for (b = 0; b < e; ++b) E[d + 4 * b >> 2] = Je.indexOf(a[b])
        },
        Hf: Wg,
        Gf: (a, b) => {
            Yg(a, b, 4)
        },
        Ac: (a, b, c) => {
            c ? Xg(c, Q.getBufferParameter(a, b)) : V(1281)
        },
        Ff: (a, b, c) => {
            c ? E[c >> 2] = Q.getBufferParameter(a, b) : V(1281)
        },
        Jd: (a, b, c) => {
            if (35005 == b) {
                b = 0;
                if (a = Fe[Jg(a)]) b = a.cj;
                E[c >> 2] = b
            } else V(1280), l("GL_INVALID_ENUM in glGetBufferPointerv")
        },
        Ef: Zg,
        Df: $g,
        dd: (a, b) => Q.getFragDataLocation(U[a], b ? x(v, b) : ""),
        Cf: (a, b, c, d) => {
            a = Q.getFramebufferAttachmentParameter(a, b, c);
            if (a instanceof WebGLRenderbuffer || a instanceof WebGLTexture) a = a.name | 0;
            E[d >> 2] = a
        },
        Bc: (a, b, c) => ah(a, b, c, 1),
        Dc: (a, b) => {
            Yg(a, b, 1)
        },
        sd: (a, b, c) => ah(a, b, c, 0),
        Bf: bh,
        ac: (a, b, c, d, e) => {
            if (0 > d) V(1281);
            else if (e) {
                if (a = Q.getInternalformatParameter(a, b, c), null !== a)
                    for (b = 0; b < a.length && b < d; ++b) E[e + 4 * b >> 2] = a[b]
            } else V(1281)
        },
        hc: () => {
            V(1282)
        },
        yf: ch,
        Af: dh,
        Vg: eh,
        Xg: fh,
        Ug: eh,
        Ld: (a, b, c) => {
            if (c) {
                a =
                    Q.getQueryParameter(Le[a], b);
                var d;
                "boolean" == typeof a ? d = a ? 1 : 0 : d = a;
                E[c >> 2] = d
            } else V(1281)
        },
        Wg: fh,
        Md: (a, b, c) => {
            c ? E[c >> 2] = Q.getQuery(a, b) : V(1281)
        },
        Yg: (a, b, c) => {
            c ? E[c >> 2] = Q.Si.getQueryEXT(a, b) : V(1281)
        },
        xf: (a, b, c) => {
            c ? E[c >> 2] = Q.getRenderbufferParameter(a, b) : V(1281)
        },
        pc: (a, b, c) => {
            c ? H[c >> 2] = Q.getSamplerParameter(Me[a], b) : V(1281)
        },
        qc: (a, b, c) => {
            c ? E[c >> 2] = Q.getSamplerParameter(Me[a], b) : V(1281)
        },
        vf: gh,
        uf: (a, b, c, d) => {
            a = Q.getShaderPrecisionFormat(a, b);
            E[c >> 2] = a.rangeMin;
            E[c + 4 >> 2] = a.rangeMax;
            E[d >> 2] = a.precision
        },
        tf: (a, b, c, d) => {
            if (a = Q.getShaderSource(Je[a])) b = 0 < b && d ? t(a, v, d, b) : 0, c && (E[c >> 2] = b)
        },
        wf: hh,
        sf: ih,
        Sc: (a, b) => {
            if (2 > P.version) return V(1282), 0;
            var c = Re[a];
            if (c) return 0 > b || b >= c.length ? (V(1281), 0) : c[b];
            switch (a) {
                case 7939:
                    return c = Q.getSupportedExtensions() || [], c = c.concat(c.map(function (d) {
                        return "GL_" + d
                    })), c = c.map(function (d) {
                        return Fd(d)
                    }), c = Re[a] = c, 0 > b || b >= c.length ? (V(1281), 0) : c[b];
                default:
                    return V(1280), 0
            }
        },
        Cc: (a, b, c, d, e) => {
            0 > c ? V(1281) : e ? (a = Q.getSyncParameter(Oe[a], b), null !== a && (E[e >> 2] = a, d && (E[d >> 2] =
                1))) : V(1281)
        },
        rf: (a, b, c) => {
            c ? H[c >> 2] = Q.getTexParameter(a, b) : V(1281)
        },
        qf: (a, b, c) => {
            c ? E[c >> 2] = Q.getTexParameter(a, b) : V(1281)
        },
        md: (a, b, c, d, e, f, g) => {
            a = U[a];
            if (a = Q.getTransformFeedbackVarying(a, b)) g && 0 < c ? (c = t(a.name, v, g, c), d && (E[d >> 2] = c)) : d && (E[d >> 2] = 0), e && (E[e >> 2] = a.size), f && (E[f >> 2] = a.type)
        },
        Oc: (a, b) => Q.getUniformBlockIndex(U[a], b ? x(v, b) : ""),
        Qc: (a, b, c, d) => {
            if (d)
                if (0 < b && (0 == c || 0 == d)) V(1281);
                else {
                    a = U[a];
                    for (var e = [], f = 0; f < b; f++) e.push(wd(E[c + 4 * f >> 2]));
                    if (a = Q.getUniformIndices(a, e))
                        for (b = a.length, f = 0; f <
                            b; f++) E[d + 4 * f >> 2] = a[f]
                }
            else V(1281)
        },
        nf: lh,
        pf: (a, b, c) => {
            mh(a, b, c, 2)
        },
        of: (a, b, c) => {
            mh(a, b, c, 0)
        },
        ed: (a, b, c) => mh(a, b, c, 0),
        kd: oh,
        jd: oh,
        kf: (a, b, c) => {
            c ? (P.fj[a].enabled && l("glGetVertexAttribPointer on client-side array: not supported, bad data returned"), E[c >> 2] = Q.getVertexAttribOffset(a, b)) : V(1281)
        },
        mf: (a, b, c) => {
            nh(a, b, c, 2)
        },
        lf: (a, b, c) => {
            nh(a, b, c, 5)
        },
        jf: function (a, b) {
            Q.hint(a, b)
        },
        ec: (a, b, c) => {
            for (var d = Cg[b], e = 0; e < b; e++) d[e] = E[c + 4 * e >> 2];
            Q.invalidateFramebuffer(a, d)
        },
        dc: (a, b, c, d, e, f, g) => {
            for (var h = Cg[b],
                    n = 0; n < b; n++) h[n] = E[c + 4 * n >> 2];
            Q.invalidateSubFramebuffer(a, h, d, e, f, g)
        },
        hf: a => (a = Ee[a]) ? Q.isBuffer(a) : 0,
        gf: function (a) {
            return Q.isEnabled(a)
        },
        ff: a => (a = Ge[a]) ? Q.isFramebuffer(a) : 0,
        ef: a => (a = U[a]) ? Q.isProgram(a) : 0,
        Pd: a => (a = Le[a]) ? Q.isQuery(a) : 0,
        ah: a => (a = Le[a]) ? Q.Si.isQueryEXT(a) : 0,
        df: a => (a = He[a]) ? Q.isRenderbuffer(a) : 0,
        wc: a => (a = Me[a]) ? Q.isSampler(a) : 0,
        cf: a => (a = Je[a]) ? Q.isShader(a) : 0,
        Hc: a => Q.isSync(Oe[a]),
        bf: a => (a = Ie[a]) ? Q.isTexture(a) : 0,
        kc: a => Q.isTransformFeedback(Ne[a]),
        td: ph,
        Qg: ph,
        af: function (a) {
            Q.lineWidth(a)
        },
        $e: qh,
        yd: (a, b, c, d) => {
            if (0 != (d & 33)) return l("glMapBufferRange access does not support MAP_READ or MAP_UNSYNCHRONIZED"), 0;
            if (0 == (d & 2)) return l("glMapBufferRange access must include MAP_WRITE"), 0;
            if (0 == (d & 12)) return l("glMapBufferRange access must include INVALIDATE_BUFFER or INVALIDATE_RANGE"), 0;
            if (!Kg(a)) return V(1280), l("GL_INVALID_ENUM in glMapBufferRange"), 0;
            var e = m(c);
            a = Jg(a);
            if (!e) return 0;
            Fe[a] || (Fe[a] = {});
            a = Fe[a];
            a.offset = b;
            a.length = c;
            a.cj = e;
            a.Ik = d;
            return e
        },
        jc: function () {
            Q.pauseTransformFeedback()
        },
        _e: rh,
        Ze: function (a, b) {
            Q.polygonOffset(a, b)
        },
        gc: () => {
            V(1280)
        },
        fc: () => {
            V(1280)
        },
        Zg: (a, b) => {
            Q.Si.queryCounterEXT(Le[a], b)
        },
        Yd: function (a) {
            Q.readBuffer(a)
        },
        Ye: uh,
        Xe: () => {},
        We: vh,
        Ad: function (a, b, c, d, e) {
            Q.renderbufferStorageMultisample(a, b, c, d, e)
        },
        ic: function () {
            Q.resumeTransformFeedback()
        },
        Ve: (a, b) => {
            Q.sampleCoverage(a, !!b)
        },
        sc: (a, b, c) => {
            Q.samplerParameterf(Me[a], b, c)
        },
        rc: (a, b, c) => {
            Q.samplerParameterf(Me[a], b, H[c >> 2])
        },
        uc: (a, b, c) => {
            Q.samplerParameteri(Me[a], b, c)
        },
        tc: (a, b, c) => {
            Q.samplerParameteri(Me[a],
                b, E[c >> 2])
        },
        Ue: wh,
        Te: () => {
            V(1280)
        },
        Se: xh,
        Re: yh,
        Qe: function (a, b, c, d) {
            Q.stencilFuncSeparate(a, b, c, d)
        },
        Pe: zh,
        Oe: function (a, b) {
            Q.stencilMaskSeparate(a, b)
        },
        Ne: Ah,
        Me: function (a, b, c, d) {
            Q.stencilOpSeparate(a, b, c, d)
        },
        Le: Bh,
        Wd: (a, b, c, d, e, f, g, h, n, p) => {
            if (Q.Vi) Q.texImage3D(a, b, c, d, e, f, g, h, n, p);
            else if (p) {
                var q = sh(n);
                Q.texImage3D(a, b, c, d, e, f, g, h, n, q, p >> 31 - Math.clz32(q.BYTES_PER_ELEMENT))
            } else Q.texImage3D(a, b, c, d, e, f, g, h, n, null)
        },
        Ke: Ch,
        Je: (a, b, c) => {
            Q.texParameterf(a, b, H[c >> 2])
        },
        Ie: function (a, b, c) {
            Q.texParameteri(a,
                b, c)
        },
        He: (a, b, c) => {
            Q.texParameteri(a, b, E[c >> 2])
        },
        cc: function (a, b, c, d, e) {
            Q.texStorage2D(a, b, c, d, e)
        },
        bc: function (a, b, c, d, e, f) {
            Q.texStorage3D(a, b, c, d, e, f)
        },
        Ge: Dh,
        Vd: (a, b, c, d, e, f, g, h, n, p, q) => {
            if (Q.Vi) Q.texSubImage3D(a, b, c, d, e, f, g, h, n, p, q);
            else if (q) {
                var u = sh(p);
                Q.texSubImage3D(a, b, c, d, e, f, g, h, n, p, u, q >> 31 - Math.clz32(u.BYTES_PER_ELEMENT))
            } else Q.texSubImage3D(a, b, c, d, e, f, g, h, n, p, null)
        },
        nd: (a, b, c, d) => {
            a = U[a];
            for (var e = [], f = 0; f < b; f++) e.push(wd(E[c + 4 * f >> 2]));
            Q.transformFeedbackVaryings(a, e, d)
        },
        Fe: Eh,
        Ee: Gh,
        De: Hh,
        Ce: Jh,
        cd: (a, b) => {
            Q.uniform1ui(W(a), b)
        },
        _c: (a, b, c) => {
            b && Q.uniform1uiv(W(a), G, c >> 2, b)
        },
        Be: (a, b, c) => {
            Q.uniform2f(W(a), b, c)
        },
        Ae: Kh,
        ze: (a, b, c) => {
            Q.uniform2i(W(a), b, c)
        },
        ye: Lh,
        bd: (a, b, c) => {
            Q.uniform2ui(W(a), b, c)
        },
        Zc: (a, b, c) => {
            b && Q.uniform2uiv(W(a), G, c >> 2, 2 * b)
        },
        xe: (a, b, c, d) => {
            Q.uniform3f(W(a), b, c, d)
        },
        we: Mh,
        ve: (a, b, c, d) => {
            Q.uniform3i(W(a), b, c, d)
        },
        ue: Nh,
        ad: (a, b, c, d) => {
            Q.uniform3ui(W(a), b, c, d)
        },
        Yc: (a, b, c) => {
            b && Q.uniform3uiv(W(a), G, c >> 2, 3 * b)
        },
        te: (a, b, c, d, e) => {
            Q.uniform4f(W(a), b, c, d, e)
        },
        se: Oh,
        re: (a, b, c,
            d, e) => {
            Q.uniform4i(W(a), b, c, d, e)
        },
        qe: Ph,
        $c: (a, b, c, d, e) => {
            Q.uniform4ui(W(a), b, c, d, e)
        },
        Xc: (a, b, c) => {
            b && Q.uniform4uiv(W(a), G, c >> 2, 4 * b)
        },
        Lc: (a, b, c) => {
            a = U[a];
            Q.uniformBlockBinding(a, b, c)
        },
        pe: Qh,
        Hd: (a, b, c, d) => {
            b && Q.uniformMatrix2x3fv(W(a), !!c, H, d >> 2, 6 * b)
        },
        Fd: (a, b, c, d) => {
            b && Q.uniformMatrix2x4fv(W(a), !!c, H, d >> 2, 8 * b)
        },
        oe: Rh,
        Gd: (a, b, c, d) => {
            b && Q.uniformMatrix3x2fv(W(a), !!c, H, d >> 2, 6 * b)
        },
        Dd: (a, b, c, d) => {
            b && Q.uniformMatrix3x4fv(W(a), !!c, H, d >> 2, 12 * b)
        },
        ne: Sh,
        Ed: (a, b, c, d) => {
            b && Q.uniformMatrix4x2fv(W(a), !!c, H, d >> 2,
                8 * b)
        },
        Cd: (a, b, c, d) => {
            b && Q.uniformMatrix4x3fv(W(a), !!c, H, d >> 2, 12 * b)
        },
        Kd: a => {
            if (!Kg(a)) return V(1280), l("GL_INVALID_ENUM in glUnmapBuffer"), 0;
            var b = Fe[Jg(a)];
            if (!b || !b.cj) return V(1282), l("buffer was never mapped in glUnmapBuffer"), 0;
            b.Ik & 16 || (2 <= P.version ? Q.bufferSubData(a, b.offset, v, b.cj, b.length) : Q.bufferSubData(a, b.offset, v.subarray(b.cj, b.cj + b.length)));
            ca(b.cj);
            b.cj = 0;
            return 1
        },
        me: Th,
        le: a => {
            Q.validateProgram(U[a])
        },
        ke: function (a, b) {
            Q.vertexAttrib1f(a, b)
        },
        je: (a, b) => {
            Q.vertexAttrib1f(a, H[b >> 2])
        },
        ie: function (a, b, c) {
            Q.vertexAttrib2f(a, b, c)
        },
        he: (a, b) => {
            Q.vertexAttrib2f(a, H[b >> 2], H[b + 4 >> 2])
        },
        ge: function (a, b, c, d) {
            Q.vertexAttrib3f(a, b, c, d)
        },
        fe: (a, b) => {
            Q.vertexAttrib3f(a, H[b >> 2], H[b + 4 >> 2], H[b + 8 >> 2])
        },
        ee: function (a, b, c, d, e) {
            Q.vertexAttrib4f(a, b, c, d, e)
        },
        de: (a, b) => {
            Q.vertexAttrib4f(a, H[b >> 2], H[b + 4 >> 2], H[b + 8 >> 2], H[b + 12 >> 2])
        },
        oc: Uh,
        Mg: Uh,
        _b: Uh,
        ae: Uh,
        $b: Uh,
        id: function (a, b, c, d, e) {
            Q.vertexAttribI4i(a, b, c, d, e)
        },
        gd: (a, b) => {
            Q.vertexAttribI4i(a, E[b >> 2], E[b + 4 >> 2], E[b + 8 >> 2], E[b + 12 >> 2])
        },
        hd: function (a, b, c, d, e) {
            Q.vertexAttribI4ui(a,
                b, c, d, e)
        },
        fd: (a, b) => {
            Q.vertexAttribI4ui(a, G[b >> 2], G[b + 4 >> 2], G[b + 8 >> 2], G[b + 12 >> 2])
        },
        ld: (a, b, c, d, e) => {
            var f = P.fj[a];
            Q.uj ? (f.Ej = !1, Q.vertexAttribIPointer(a, b, c, d, e)) : (f.size = b, f.type = c, f.rk = !1, f.Zj = d, f.Gj = e, f.Ej = !0, f.Gk = function (g, h, n, p, q, u) {
                this.vertexAttribIPointer(g, h, n, q, u)
            })
        },
        ce: Vh,
        be: Wh,
        Ec: (a, b, c, d) => {
            Q.waitSync(Oe[a], b, (c >>> 0) + 4294967296 * d)
        },
        ma: () => 0,
        hh: () => !Pa,
        Sb: (a, b, c) => v.copyWithin(a, b, b + c),
        Gh: (a, b) => {
            function c(d) {
                M(a)(d, b) && requestAnimationFrame(c)
            }
            return requestAnimationFrame(c)
        },
        jh: (a,
            b, c) => Xh(a, {
            zk: E[c >> 2],
            fk: E[c + 4 >> 2],
            tl: E[c + 8 >> 2],
            ol: b,
            Mj: E[c + 12 >> 2],
            Mk: E[c + 16 >> 2]
        }),
        Oa: (a, b) => {
            a = Kf(a);
            return a ? a.requestPointerLock ? of() ? Vf(a) : b ? (mf(Vf, 2, [a]), 1) : -2 : -1 : -4
        },
        Db: a => {
            var b = v.length;
            a >>>= 0;
            if (2147483648 < a) return !1;
            for (var c = 1; 4 >= c; c *= 2) {
                var d = b * (1 + .2 / c);
                d = Math.min(d, a + 100663296);
                var e = Math;
                d = Math.max(a, d);
                a: {
                    e = (e.min.call(e, 2147483648, d + (65536 - d % 65536) % 65536) - ab.buffer.byteLength + 65535) / 65536;
                    try {
                        ab.grow(e);
                        fb();
                        var f = 1;
                        break a
                    } catch (g) {}
                    f = void 0
                }
                if (f) return !0
            }
            return !1
        },
        Ta: () => (wf = navigator.getGamepads ?
            navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : null) ? 0 : -1,
        Ha: (a, b, c) => "undefined" == typeof onbeforeunload ? -1 : 1 !== c ? -5 : Yh(a, b),
        La: (a, b, c, d) => Zh(a, b, c, d, 12, "blur"),
        r: Pf,
        ja: (a, b, c) => {
            a = Kf(a);
            if (!a) return -4;
            a.style.width = b + "px";
            a.style.height = c + "px";
            return 0
        },
        N: (a, b, c, d) => Zh(a, b, c, d, 13, "focus"),
        la: (a, b, c, d) => {
            if (!uf()) return -1;
            a = Kf(a);
            if (!a) return -4;
            $h(a, b, c, d, "webkitfullscreenchange");
            return $h(a, b, c, d, "fullscreenchange")
        },
        Ra: (a, b, c) => navigator.getGamepads || navigator.webkitGetGamepads ?
            ai(a, b, c, 26, "gamepadconnected") : -1,
        Qa: (a, b, c) => navigator.getGamepads || navigator.webkitGetGamepads ? ai(a, b, c, 27, "gamepaddisconnected") : -1,
        Hh: (a, b, c) => setInterval(() => {
            Vd(() => M(a)(c))
        }, b),
        T: (a, b, c, d) => bi(a, b, c, d, 2, "keydown"),
        ka: (a, b, c, d) => bi(a, b, c, d, 1, "keypress"),
        S: (a, b, c, d) => bi(a, b, c, d, 3, "keyup"),
        R: (a, b, c, d) => di(a, b, c, d, 5, "mousedown"),
        Na: (a, b, c, d) => di(a, b, c, d, 33, "mouseenter"),
        Ma: (a, b, c, d) => di(a, b, c, d, 34, "mouseleave"),
        P: (a, b, c, d) => di(a, b, c, d, 8, "mousemove"),
        Jh: (a, b, c, d) => di(a, b, c, d, 35, "mouseover"),
        Q: (a,
            b, c, d) => di(a, b, c, d, 6, "mouseup"),
        Ka: (a, b, c, d) => {
            if (!document || !document.body || !(document.body.requestPointerLock || document.body.dk || document.body.Xl || document.body.Vl)) return -1;
            a = Kf(a);
            if (!a) return -4;
            ei(a, b, c, d, "mozpointerlockchange");
            ei(a, b, c, d, "webkitpointerlockchange");
            ei(a, b, c, d, "mspointerlockchange");
            return ei(a, b, c, d, "pointerlockchange")
        },
        Ja: (a, b, c, d) => fi(a, b, c, d),
        J: (a, b, c, d) => gi(a, b, c, d, 25, "touchcancel"),
        L: (a, b, c, d) => gi(a, b, c, d, 23, "touchend"),
        K: (a, b, c, d) => gi(a, b, c, d, 24, "touchmove"),
        M: (a, b, c,
            d) => gi(a, b, c, d, 22, "touchstart"),
        Ia: (a, b, c) => Jf[1] ? hi(a, b, c) : -4,
        Nh: (a, b, c, d) => {
            ii(a, b, c, d, 31, "webglcontextlost");
            return 0
        },
        Mh: (a, b, c, d) => {
            ii(a, b, c, d, 32, "webglcontextrestored");
            return 0
        },
        O: (a, b, c, d) => (a = Kf(a)) ? "undefined" != typeof a.onwheel ? ji(a, b, c, d) : -1 : -4,
        kh: a => document.title = a ? x(v, a) : "",
        m: () => {
            throw "Please compile your program with async support in order to use asynchronous operations like emscripten_sleep";
        },
        gh: function (a, b, c, d, e) {
            function f(S) {
                w ? S() : Vd(S)
            }
            var g = a + 112,
                h = G[g + 36 >> 2],
                n = G[g + 40 >> 2],
                p = G[g + 44 >> 2],
                q = G[g + 48 >> 2],
                u = G[g + 52 >> 2],
                w = !!(u & 64),
                r = S => {
                    f(() => {
                        h ? M(h)(S) : b && b(S)
                    })
                },
                A = S => {
                    f(() => {
                        p ? M(p)(S) : d && d(S)
                    })
                },
                z = S => {
                    f(() => {
                        n ? M(n)(S) : c && c(S)
                    })
                },
                I = S => {
                    f(() => {
                        q ? M(q)(S) : e && e(S)
                    })
                },
                N = S => {
                    ni(S, r, z, A, I)
                },
                ea = (S, Ki) => {
                    oi(S, Ki.response, ac => {
                        f(() => {
                            h ? M(h)(ac) : b && b(ac)
                        })
                    }, ac => {
                        f(() => {
                            h ? M(h)(ac) : b && b(ac)
                        })
                    })
                },
                F = S => {
                    ni(S, ea, z, A, I)
                },
                T = wd(g + 0),
                Y = !!(u & 16),
                ua = !!(u & 4);
            u = !!(u & 32);
            if ("EM_IDB_STORE" === T) N = G[g + 84 >> 2], oi(a, v.slice(N, N + G[g + 88 >> 2]), r, z);
            else if ("EM_IDB_DELETE" === T) qi(a, r, z);
            else if (Y) {
                if (u) return 0;
                ni(a, ua ? ea : r, z, A, I)
            } else pi(a, r, u ? z : ua ? F : N);
            return a
        },
        Xa: (a, b) => {
            b >>= 2;
            b = {
                alpha: !!E[b],
                depth: !!E[b + 1],
                stencil: !!E[b + 2],
                antialias: !!E[b + 3],
                premultipliedAlpha: !!E[b + 4],
                preserveDrawingBuffer: !!E[b + 5],
                powerPreference: ri[E[b + 6]],
                failIfMajorPerformanceCaveat: !!E[b + 7],
                Pj: E[b + 8],
                Fl: E[b + 9],
                ik: E[b + 10],
                sl: E[b + 11],
                sm: E[b + 12],
                tm: E[b + 13]
            };
            a = Kf(a);
            return !a || b.sl ? 0 : he(a, b)
        },
        Kh: (a, b) => {
            if (!b) return -5;
            a = ie[a];
            if (!a) return -3;
            var c = a.Ti;
            if (!c) return -3;
            c = c.getContextAttributes();
            E[b >> 2] = c.alpha;
            E[b + 4 >> 2] = c.depth;
            E[b +
                8 >> 2] = c.stencil;
            E[b + 12 >> 2] = c.antialias;
            E[b + 16 >> 2] = c.premultipliedAlpha;
            E[b + 20 >> 2] = c.preserveDrawingBuffer;
            E[b + 24 >> 2] = c.powerPreference && ri.indexOf(c.powerPreference);
            E[b + 28 >> 2] = c.failIfMajorPerformanceCaveat;
            E[b + 32 >> 2] = a.version;
            E[b + 36 >> 2] = 0;
            E[b + 40 >> 2] = a.attributes.ik;
            return 0
        },
        Lh: () => P ? P.handle : 0,
        Oh: a => {
            a >>= 2;
            for (var b = 0; 14 > b; ++b) E[a + b] = 0;
            E[a] = E[a + 1] = E[a + 3] = E[a + 4] = E[a + 8] = E[a + 10] = 1
        },
        Wa: a => je(a) ? 0 : -5,
        U: a => {
            var b = si[a];
            if (!b) return -3;
            b.onopen = b.onerror = b.onclose = b.onmessage = null;
            delete si[a];
            return 0
        },
        Fh: () => "undefined" != typeof WebSocket,
        Ca: a => {
            if ("undefined" == typeof WebSocket) return -1;
            if (!a) return -5;
            var b = a >> 2;
            a = wd(E[b]);
            a = (b = E[b + 1]) ? new WebSocket(a, (b ? x(v, b) : "").split(",")) : new WebSocket(a);
            a.binaryType = "arraybuffer";
            b = si.length;
            si[b] = a;
            return b
        },
        Ua: (a, b, c) => {
            a = si[a];
            if (!a) return -3;
            a.send(v.subarray(b, b + c));
            return 0
        },
        Ph: (a, b) => {
            a = si[a];
            if (!a) return -3;
            b = b ? x(v, b) : "";
            a.send(b);
            return 0
        },
        oa: (a, b, c) => {
            X || (X = m(1024));
            var d = si[a];
            if (!d) return -3;
            d.onclose = function (e) {
                G[X >> 2] = a;
                G[X + 4 >> 2] = e.wasClean;
                G[X +
                    8 >> 2] = e.code;
                t(e.reason, v, X + 10, 512);
                M(c)(0, X, b)
            };
            return 0
        },
        ra: (a, b, c) => {
            X || (X = m(1024));
            var d = si[a];
            if (!d) return -3;
            d.onerror = function () {
                G[X >> 2] = a;
                M(c)(0, X, b)
            };
            return 0
        },
        ta: (a, b, c) => {
            X || (X = m(1024));
            var d = si[a];
            if (!d) return -3;
            d.onmessage = function (e) {
                G[X >> 2] = a;
                if ("string" == typeof e.data) {
                    var f = Fd(e.data),
                        g = aa(e.data) + 1;
                    G[X + 12 >> 2] = 1
                } else g = e.data.byteLength, f = m(g), C.set(new Uint8Array(e.data), f), G[X + 12 >> 2] = 0;
                G[X + 4 >> 2] = f;
                G[X + 8 >> 2] = g;
                M(c)(0, X, b);
                ca(f)
            };
            return 0
        },
        va: (a, b, c) => {
            X || (X = m(1024));
            var d = si[a];
            if (!d) return -3;
            d.onopen = function () {
                G[X >> 2] = a;
                M(c)(0, X, b)
            };
            return 0
        },
        Mb: (a, b) => {
            var c = 0;
            vi().forEach((d, e) => {
                var f = b + c;
                e = G[a + 4 * e >> 2] = f;
                for (f = 0; f < d.length; ++f) C[e++ >> 0] = d.charCodeAt(f);
                C[e >> 0] = 0;
                c += d.length + 1
            });
            return 0
        },
        Nb: (a, b) => {
            var c = vi();
            G[a >> 2] = c.length;
            var d = 0;
            c.forEach(e => d += e.length + 1);
            G[b >> 2] = d;
            return 0
        },
        b: Zd,
        D: function (a) {
            try {
                var b = Kc(a);
                Uc(b);
                return 0
            } catch (c) {
                if ("undefined" == typeof dd || "ErrnoError" !== c.name) throw c;
                return c.Ei
            }
        },
        Ub: function (a, b, c, d) {
            try {
                a: {
                    var e = Kc(a);a = b;
                    for (var f, g = b = 0; g < c; g++) {
                        var h =
                            G[a >> 2],
                            n = G[a + 4 >> 2];
                        a += 8;
                        var p = e,
                            q = h,
                            u = n,
                            w = f,
                            r = C;
                        if (0 > u || 0 > w) throw new O(28);
                        if (null === p.fd) throw new O(8);
                        if (1 === (p.flags & 2097155)) throw new O(8);
                        if (B(p.node.mode)) throw new O(31);
                        if (!p.Di.read) throw new O(28);
                        var A = "undefined" != typeof w;
                        if (!A) w = p.position;
                        else if (!p.seekable) throw new O(70);
                        var z = p.Di.read(p, r, q, u, w);
                        A || (p.position += z);
                        var I = z;
                        if (0 > I) {
                            var N = -1;
                            break a
                        }
                        b += I;
                        if (I < n) break;
                        "undefined" !== typeof f && (f += I)
                    }
                    N = b
                }
                G[d >> 2] = N;
                return 0
            }
            catch (ea) {
                if ("undefined" == typeof dd || "ErrnoError" !== ea.name) throw ea;
                return ea.Ei
            }
        },
        zb: function (a, b, c, d, e) {
            b = c + 2097152 >>> 0 < 4194305 - !!b ? (b >>> 0) + 4294967296 * c : NaN;
            try {
                if (isNaN(b)) return 61;
                var f = Kc(a);
                Vc(f, b, d);
                K = [f.position >>> 0, (J = f.position, 1 <= +Math.abs(J) ? 0 < J ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)];
                E[e >> 2] = K[0];
                E[e + 4 >> 2] = K[1];
                f.pj && 0 === b && 0 === d && (f.pj = null);
                return 0
            } catch (g) {
                if ("undefined" == typeof dd || "ErrnoError" !== g.name) throw g;
                return g.Ei
            }
        },
        ya: function (a, b, c, d) {
            try {
                a: {
                    var e = Kc(a);a = b;
                    for (var f, g = b = 0; g < c; g++) {
                        var h = G[a >> 2],
                            n = G[a + 4 >> 2];
                        a += 8;
                        var p = Wc(e, C, h, n, f);
                        if (0 > p) {
                            var q = -1;
                            break a
                        }
                        b += p;
                        "undefined" !== typeof f && (f += p)
                    }
                    q = b
                }
                G[d >> 2] = q;
                return 0
            }
            catch (u) {
                if ("undefined" == typeof dd || "ErrnoError" !== u.name) throw u;
                return u.Ei
            }
        },
        th: (a, b, c, d) => {
            function e(u, w, r, A, z, I) {
                var N = 10 === u ? 28 : 16;
                z = 10 === u ? nd(z) : ld(z);
                N = m(N);
                !Bd(N, u, z, I) || $a();
                z = m(32);
                E[z + 4 >> 2] = u;
                E[z + 8 >> 2] = w;
                E[z + 12 >> 2] = r;
                G[z + 24 >> 2] = A;
                G[z + 20 >> 2] = N;
                E[z + 16 >> 2] = 10 === u ? 28 : 16;
                E[z + 28 >> 2] = 0;
                return z
            }
            var f = 0,
                g = 0,
                h = 0,
                n = 0,
                p = 0,
                q = 0;
            c && (h = E[c >> 2], n = E[c + 4 >> 2], p = E[c + 8 >> 2], q = E[c + 12 >> 2]);
            p && !q && (q = 2 === p ? 17 : 6);
            !p && q && (p = 17 === q ? 2 : 1);
            0 === q && (q = 6);
            0 === p && (p = 1);
            if (!a && !b) return -2;
            if (h & -1088 || 0 !== c && E[c >> 2] & 2 && !a) return -1;
            if (h & 32) return -2;
            if (0 !== p && 1 !== p && 2 !== p) return -7;
            if (0 !== n && 2 !== n && 10 !== n) return -6;
            if (b && (b = b ? x(v, b) : "", g = parseInt(b, 10), isNaN(g))) return h & 1024 ? -2 : -8;
            if (!a) return 0 === n && (n = 2), 0 === (h & 1) && (2 === n ? f = Fi(2130706433) : f = [0, 0, 0, 1]), a = e(n, p, q, null, f, g), G[d >> 2] = a, 0;
            a = a ? x(v, a) : "";
            f = pd(a);
            if (null !== f)
                if (0 === n || 2 === n) n = 2;
                else if (10 === n && h & 8) f = [0, 0, Fi(65535), f], n = 10;
            else return -2;
            else if (f =
                rd(a), null !== f)
                if (0 === n || 10 === n) n = 10;
                else return -2;
            if (null != f) return a = e(n, p, q, a, f, g), G[d >> 2] = a, 0;
            if (h & 4) return -2;
            a = vd(a);
            f = pd(a);
            0 === n ? n = 2 : 10 === n && (f = [0, 0, Fi(65535), f]);
            a = e(n, p, q, null, f, g);
            G[d >> 2] = a;
            return 0
        },
        fa: Xf,
        na: Yf,
        C: Zf,
        ob: $f,
        w: ag,
        d: bg,
        xa: dg,
        E: eg,
        rb: fg,
        x: gg,
        F: hg,
        Ba: ig,
        zc: jg,
        $: kg,
        lb: lg,
        ib: mg,
        nb: ng,
        tb: og,
        da: pg,
        qa: qg,
        A: rg,
        u: sg,
        ga: tg,
        Fa: vg,
        Aa: wg,
        zf: xg,
        i: yg,
        qb: zg,
        pb: Ag,
        o: Gg,
        p: Hg,
        G: Ig,
        v: Lg,
        y: Mg,
        Ib: Ng,
        sb: Pg,
        Da: Qg,
        sa: Rg,
        l: Sg,
        V: Vg,
        t: Wg,
        Ga: Zg,
        Gg: $g,
        ia: bh,
        gb: ch,
        W: dh,
        kb: gh,
        pa: hh,
        j: ih,
        c: lh,
        hb: qh,
        Ea: rh,
        ea: uh,
        X: vh,
        H: wh,
        mb: xh,
        Z: yh,
        ub: zh,
        _: Ah,
        h: Bh,
        f: Ch,
        ca: Dh,
        Y: Eh,
        fb: Gh,
        B: Hh,
        cb: Jh,
        eb: Kh,
        bb: Lh,
        db: Mh,
        ab: Nh,
        n: Oh,
        $a: Ph,
        _a: Qh,
        Za: Rh,
        ua: Sh,
        jb: Th,
        g: Vh,
        I: Wh,
        ha: yi,
        Cb: (a, b, c, d) => yi(a, b, c, d)
    },
    Z = function () {
        function a(c) {
            Z = c.exports;
            ab = Z.Qh;
            fb();
            Mb = Z.Uh;
            hb.unshift(Z.Rh);
            rb("wasm-instantiate");
            return Z
        }
        var b = {
            a: Gi
        };
        qb("wasm-instantiate");
        if (k.instantiateWasm) try {
            return k.instantiateWasm(b, a)
        } catch (c) {
            return l(`Module.instantiateWasm callback failed with error: `), !1
        }
        zb(b, function (c) {
            a(c.instance)
        });
        return {}
    }(),
    m = a => (m = Z.Sh)(a),
    ca = a => (ca = Z.Th)(a),
    ba = k._memcpy = (a, b, c) => (ba = k._memcpy = Z.Vh)(a, b, c),
    qd = a => (qd = Z.Wh)(a),
    Fi = a => (Fi = Z.Xh)(a),
    md = a => (md = Z.Yh)(a),
    Di = () => (Di = Z.Zh)();
k._chat_callback = (a, b) => (k._chat_callback = Z._h)(a, b);
k._join_game_callback = a => (k._join_game_callback = Z.$h)(a);
k._api_error_callback = (a, b) => (k._api_error_callback = Z.ai)(a, b);
k._create_game_callback = (a, b, c) => (k._create_game_callback = Z.bi)(a, b, c);
k._player_info_callback = (a, b, c, d, e, f) => (k._player_info_callback = Z.ci)(a, b, c, d, e, f);
k._log_next_game_state = () => (k._log_next_game_state = Z.di)();
k._start_game = () => (k._start_game = Z.ei)();
k._video_playback_started = () => (k._video_playback_started = Z.fi)();
k._video_playback_ended = () => (k._video_playback_ended = Z.gi)();
k._post_video_upload_callback = a => (k._post_video_upload_callback = Z.hi)(a);
k._YYSum = (a, b) => (k._YYSum = Z.ii)(a, b);
var Hi = k._main = (a, b) => (Hi = k._main = Z.ji)(a, b);
k._FSSyncCompleted = () => (k._FSSyncCompleted = Z.ki)();
var sb = () => (sb = Z.li)(),
    Ei = a => (Ei = Z.mi)(a),
    df = () => (df = Z.ni)(),
    ef = a => (ef = Z.oi)(a),
    Mf = a => (Mf = Z.pi)(a);
k.dynCall_viij = (a, b, c, d, e) => (k.dynCall_viij = Z.qi)(a, b, c, d, e);
k.dynCall_vij = (a, b, c, d) => (k.dynCall_vij = Z.ri)(a, b, c, d);
k.dynCall_iiiiiij = (a, b, c, d, e, f, g, h) => (k.dynCall_iiiiiij = Z.si)(a, b, c, d, e, f, g, h);
k.dynCall_iiji = (a, b, c, d, e) => (k.dynCall_iiji = Z.ti)(a, b, c, d, e);
k.dynCall_jiji = (a, b, c, d, e) => (k.dynCall_jiji = Z.ui)(a, b, c, d, e);
k.dynCall_ji = (a, b) => (k.dynCall_ji = Z.vi)(a, b);
k.dynCall_viijii = (a, b, c, d, e, f, g) => (k.dynCall_viijii = Z.wi)(a, b, c, d, e, f, g);
k.dynCall_iiiiij = (a, b, c, d, e, f, g) => (k.dynCall_iiiiij = Z.xi)(a, b, c, d, e, f, g);
k.dynCall_iiiiijj = (a, b, c, d, e, f, g, h, n) => (k.dynCall_iiiiijj = Z.yi)(a, b, c, d, e, f, g, h, n);
k.dynCall_iiiiiijj = (a, b, c, d, e, f, g, h, n, p) => (k.dynCall_iiiiiijj = Z.zi)(a, b, c, d, e, f, g, h, n, p);
k.addRunDependency = qb;
k.removeRunDependency = rb;
k.FS_createPath = Zc;
k.FS_createLazyFile = cd;
k.FS_createDevice = ad;
k.dynCall = Hb;
k.cwrap = (a, b, c, d) => {
    var e = !c || c.every(f => "number" === f || "boolean" === f);
    return "string" !== b && e && !d ? k["_" + a] : function () {
        return Fb(a, b, c, arguments)
    }
};
k.FS_createPreloadedFile = qc;
k.FS_createDataFile = pc;
k.FS_unlink = Ja;
var Ii;
pb = function Ji() {
    Ii || Li();
    Ii || (pb = Ji)
};

function Mi(a = []) {
    var b = Hi;
    a.unshift(Ma);
    var c = a.length,
        d = Mf(4 * (c + 1)),
        e = d;
    a.forEach(g => {
        G[e >> 2] = Nf(g);
        e += 4
    });
    G[e >> 2] = 0;
    try {
        var f = b(c, d);
        Zd(f, !0)
    } catch (g) {
        Xd(g)
    }
}

function Li() {
    var a = La;

    function b() {
        if (!Ii && (Ii = !0, k.calledRun = !0, !bb)) {
            lb = !0;
            jd.root = Db(jd, null);
            k.noFSInit || Yc || (Yc = !0, Xc(), k.stdin = k.stdin, k.stdout = k.stdout, k.stderr = k.stderr, k.stdin ? ad("/dev", "stdin", k.stdin) : Qc("/dev/tty", "/dev/stdin"), k.stdout ? ad("/dev", "stdout", null, k.stdout) : Qc("/dev/tty", "/dev/stdout"), k.stderr ? ad("/dev", "stderr", null, k.stderr) : Qc("/dev/tty1", "/dev/stderr"), Sc("/dev/stdin", 0), Sc("/dev/stdout", 1), Sc("/dev/stderr", 1));
            xc = !1;
            Kb(hb);
            Kb(ib);
            if (k.onRuntimeInitialized) k.onRuntimeInitialized();
            Ni && Mi(a);
            if (k.postRun)
                for ("function" == typeof k.postRun && (k.postRun = [k.postRun]); k.postRun.length;) {
                    var c = k.postRun.shift();
                    kb.unshift(c)
                }
            Kb(kb)
        }
    }
    if (!(0 < nb)) {
        if (k.preRun)
            for ("function" == typeof k.preRun && (k.preRun = [k.preRun]); k.preRun.length;) mb();
        Kb(gb);
        0 < nb || (k.setStatus ? (k.setStatus("Running..."), setTimeout(function () {
            setTimeout(function () {
                k.setStatus("")
            }, 1);
            b()
        }, 1)) : b())
    }
}
if (k.preInit)
    for ("function" == typeof k.preInit && (k.preInit = [k.preInit]); 0 < k.preInit.length;) k.preInit.pop()();
var Ni = !0;
k.noInitialRun && (Ni = !1);
Li();
(function () {
    if ("undefined" != typeof window && !window.Ai) {
        webtransport_async_read = async d => {
            try {
                let g = d.transport.datagrams.readable.getReader();
                for (var e = !1; !e;) {
                    var f;
                    ({
                        value: f,
                        done: e
                    } = await g.read());
                    d.Wj.push(f)
                }
                console.log("Closing WebTransport connection")
            } catch (g) {
                console.error("Could not open channel to read datagrams, " + g)
            }
        };
        webtransport_async_connect = async (d, e) => {
            try {
                await d.transport.ready;
                console.log("Connected successfully to relay.");
                try {
                    d.nj = d.transport.datagrams.writable.getWriter()
                } catch (f) {
                    console.error("Could not open channel to send datagrams, " + f)
                }
            } catch (f) {
                console.error("Connection failed to " +
                    e + ", " + f)
            }
            d.transport.closed.then(() => {
                d.nj = null;
                console.log("Connection to " + e + " closed gracefully")
            }).catch(() => {
                d.nj = null;
                console.error("Connection to " + e + " closed abruptly")
            });
            webtransport_async_read(d)
        };
        class c {
            constructor() {
                this.nj = this.transport = null;
                this.Wj = [];
                this.url = ""
            }
            destroy() {
                null != this.transport && this.transport && (this.transport.close(), this.transport = null);
                this.nj = null
            }
            async connect(d, e) {
                try {
                    d.transport = new WebTransport(e)
                } catch (f) {
                    console.error("Failed to initialise WebTransport, " +
                        f)
                }
                await webtransport_async_connect(d, e)
            }
            async send(d, e) {
                null == this.transport && await this.connect(this, this.url);
                for (var f = 10; !this.nj && f;) await new Promise(n => setTimeout(n, 100)), f--;
                if (this.nj) {
                    d = k.HEAPU8.subarray(d, d + e);
                    f = new ArrayBuffer(e);
                    for (var g = new Uint8Array(f), h = 0; h < e; h++) g[h] = d[h];
                    this.nj.write(f)
                } else console.log("DatagramWriter is not initialized. Couldn't send message.")
            }
            Il(d, e) {
                if (0 == this.Wj.length) return -1;
                var f = this.Wj[0];
                this.Wj.shift();
                var g = f.length;
                if (g > e) return -1;
                d = k.HEAPU8.subarray(d,
                    d + g);
                for (e = 0; e < g; e++) d[e] = f[e];
                return g
            }
        }
        var a = [],
            b = 0;
        webtransport_set_relay = (d, e) => {
            const f = b++;
            a[f] = new c;
            a[f].url = d + ":" + e;
            return f
        };
        webtransport_send = (d, e, f) => {
            a[d].send(e, f)
        };
        webtransport_receive = (d, e, f) => a[d].Il(e, f);
        webtransport_destroy = d => {
            a[d].destroy();
            a[d] = null
        }
    }
})();
"undefined" != typeof window && (api_error_callback = k.cwrap("api_error_callback", null, ["number", "string"]), create_game_callback = k.cwrap("create_game_callback", null, ["string", "string", "string"]), join_game_callback = k.cwrap("join_game_callback", null, ["string"]), chat_callback = k.cwrap("chat_callback", null, ["string", "number"]), player_info_callback = k.cwrap("player_info_callback", null, "number string string string bool string".split(" ")), log_next_game_state = k.cwrap("log_next_game_state", null, []), start_game = k.cwrap("start_game",
    null, []), init_request_parameters = a => {
    var b = {
        method: "POST",
        credentials: "include",
        headers: {}
    };
    b.headers["Content-Type"] = "application/json;charset=UTF-8";
    b.headers["Access-Control-Allow-Credentials"] = "true";
    b.body = JSON.stringify(a);
    return b
}, gxc_room_size = 4, gxc_local_player = 0, gxc_player_info = [], gxc_set_room_info = (a, b) => {
    gxc_room_size = a;
    gxc_local_player = b
}, set_local_share_url = a => {
    window.shareUrl = a;
    if (a = document.getElementById("share-button")) a.style.visibility = "visible"
}, post_share_url = a => {
    if (window.parent) {
        var b = {
            type: "share_url"
        };
        b.shareUrl = a;
        window.parent.postMessage(b, "*")
    }
}, gxc_request_room = (a, b, c, d, e) => {
    var f = location.host.startsWith("localhost") || location.host.startsWith("test.vectorwars.gmx.dev");
    f && (d = "debug");
    console.log("Requesting " + c + "-player game with game-id " + d);
    var g = {};
    g.roomSize = c;
    g.region = b;
    b = init_request_parameters(g);
    fetch("https://" + a + "/gg/games/" + d + "/rooms" + (e.length ? "?trackId=" + e : ""), b).then(h => {
        h.ok ? h.json().then(n => {
            var p = n.data.shareUrl,
                q = n.data.roomUrl;
            n = n.data.joinRoomUrl;
            f ? (p =
                location.protocol + "//" + location.host + location.pathname + "?game=debug&roomUrl=" + q, set_local_share_url(p)) : post_share_url(p);
            create_game_callback(n, p, q)
        }) : h.json().then(n => {
            if (window.parent) {
                var p = {
                    type: "api_error"
                };
                p.error = n.errors[0].code;
                window.parent.postMessage(p, "*")
            }
            api_error_callback(h.status, n.errors[0].code)
        })
    })
}, gxc_join_room = (a, b, c, d) => {
    console.log("Joining game '" + b + "' with track-id '" + c + "' on environment '" + a + "' using url " + d);
    var e = {};
    "debug" != b && (e.gameId = b, e.trackId = c);
    e.roomUrl = d;
    b =
        init_request_parameters(e);
    fetch("https://" + a + "/gg/rooms", b).then(f => {
        f.ok ? f.json().then(g => {
            join_game_callback(g.data.roomUrl)
        }) : f.json().then(g => {
            if (window.parent) {
                var h = {
                    type: "api_error"
                };
                h.error = g.errors[0].code;
                window.parent.postMessage(h, "*")
            }
            api_error_callback(f.status, g.errors[0].code)
        })
    });
    location.host.startsWith("localhost") || location.host.startsWith("test.vectorwars.gmx.dev") ? set_local_share_url(window.location.href) : post_share_url(window.location.href)
}, gxc_get_player_info = (a, b, c) => {
    console.log("Requesting player info.");
    var d = {
        method: "GET",
        credentials: "include",
        headers: {}
    };
    d.headers["Content-Type"] = "application/json;charset=UTF-8";
    d.headers["Access-Control-Allow-Credentials"] = "true";
    let e = "https://" + b + "/images/AvatarPlaceholder.png";
    fetch("https://" + a + "/gg/rooms?roomUrl=" + c, d).then(f => {
        f.ok ? f.json().then(g => {
            gxc_player_info = g.data.players;
            gxc_player_info.forEach(h => {
                null !== h.playerId && (null === h.user ? (h.user = {}, h.user.username = "unknown", h.user.avatarUrl = e, h.user.userId = "", h.user.guest = !0) : (null === h.user.avatarUrl &&
                    (h.user.avatarUrl = e), h.user.guest = !1))
            });
            window.parent && (g = {
                type: "players"
            }, g.roomSize = gxc_room_size, g.local = gxc_local_player, g.players = gxc_player_info, window.parent.postMessage(g, "*"));
            gxc_player_info.forEach(h => {
                null !== h.playerId && player_info_callback(h.playerId, h.user.username, h.user.avatarUrl, h.status, h.user.guest, h.user.userId)
            })
        }) : (404 == f.status && [0, 1, 2, 3].forEach(g => player_info_callback(g, "unknown", e, "JOINED", !0, "")), f.json().then(g => console.log(g)))
    })
}, gxc_set_player_status = (a, b) => {
    gxc_player_info.forEach(d => {
        d.playerId === a && (d.status = b)
    });
    if (window.parent) {
        var c = {
            type: "players"
        };
        c.roomSize = gxc_room_size;
        c.local = gxc_local_player;
        c.players = gxc_player_info;
        window.parent.postMessage(c, "*")
    }
}, window.addEventListener("message", a => {
    if (a && a.data && "parent_send_chat_message" == a.data.type) {
        var b = a.data.pl;
        if (null === b || void 0 === b) b = -1;
        chat_callback(a.data.content || "", b)
    }
}), gxc_receive_chat_message = (a, b, c) => {
    window.parent.postMessage({
        type: "receive_chat_message",
        content: a,
        src: b,
        pl: c
    }, "*")
}, gxc_report_status = a => {
    window.parent.postMessage({
        type: "report_status",
        status: a
    }, "*")
});
