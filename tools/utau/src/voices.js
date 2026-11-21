import {load,JSON_SCHEMA as schema} from "../vendor/yaml.mjs";
import {decode,find,stem,filename} from "./files.js";

/*//////////////////////////////////////////////////////////////////////*/

const folder = name => name.includes("/") ? name.slice(0, name.lastIndexOf("/")) : "";
const inside = (name, root) => !root || name.startsWith(root + "/");

function resolve(directory, file) {
    const pieces = directory ? directory.split("/") : [];
    for (const piece of file.replaceAll("\\", "/").split("/")) {
        if (!piece || piece === ".") {continue;}
        if (piece === "..") {if (!pieces.length) {return "";} pieces.pop();}
        else {pieces.push(piece);}
    }
    return pieces.join("/");
}

export function banks(files) {
    const roots = new Set([...files.keys()].filter(name => /(^|\/)(character\.txt|character\.ya?ml)$/i.test(name)).map(folder));
    if (!roots.size) {
        const otos = [...files.keys()].filter(name => /(^|\/)oto\.ini$/i.test(name));
        if (!otos.length) {throw new Error("No oto.ini was found. Choose a UTAU WAV voicebank.");}
        let common = folder(otos[0]).split("/");
        for (const name of otos) {const parts = folder(name).split("/"); common = common.filter((part, index) => parts[index] === part && common.slice(0, index).every((value, position) => parts[position] === value));}
        roots.add(common.join("/"));
    }
    const result = [];
    for (const root of roots) {
        const textfile = find(files, resolve(root, "character.txt"));
        const yamlfile = find(files, resolve(root, "character.yaml")) || find(files, resolve(root, "character.yml"));
        let metadata = {};
        if (yamlfile) {try {metadata = load(decode(files.get(yamlfile)), {schema}) || {};} catch {metadata = {};}}
        const text = textfile ? decode(files.get(textfile)) : "";
        const name = metadata.name || text.match(/^name\s*=\s*(.+)$/im)?.[1]?.trim() || root.split("/").pop() || "voice";
        if (metadata.singer_type && metadata.singer_type !== "utau") {continue;}
        const lookup = new Map([...files.keys()].map(key => [key.normalize("NFC").toLowerCase(), key]));
        const rows = [];
        let missing = 0;
        for (const [path, bytes] of files) {
            if (!inside(path, root) || !/(^|\/)oto\.ini$/i.test(path)) {continue;}
            for (const line of decode(bytes).split(/\r?\n/)) {
                const split = line.indexOf("=");
                if (split < 1) {continue;}
                const source = line.slice(0, split).trim();
                const values = line.slice(split + 1).split(",");
                if (values.length < 6) {continue;}
                const file = lookup.get(resolve(folder(path), source).normalize("NFC").toLowerCase());
                if (!file || !inside(file, root)) {missing++; continue;}
                const numbers = values.slice(1, 6).map(value => Number(value.trim() || 0));
                if (numbers.some(value => !Number.isFinite(value))) {continue;}
                const [offset, consonant, cutoff, preutter, overlap] = numbers;
                if (offset < 0 || consonant < 0) {continue;}
                const alias = values[0].trim() || stem(source);
                const frequency = file.replace(/\.wav$/i, "_wav.frq");
                const frq = lookup.get(frequency.normalize("NFC").toLowerCase());
                rows.push({alias, file, offset, consonant, cutoff, preutter, overlap, frq});
            }
        }
        if (!rows.length) {continue;}
        const prefixes = [];
        const prefixfile = find(files, resolve(root, "prefix.map"));
        if (prefixfile) {
            for (const line of decode(files.get(prefixfile)).split(/\r?\n/)) {
                const [tone, prefix = "", suffix = ""] = line.split("\t");
                const number = miditone(tone);
                if (number !== null) {prefixes.push({tone: number, prefix, suffix});}
            }
        }
        const pitched = new Map();
        for (const row of rows) {
            if (!row.frq || pitched.has(row.frq)) {continue;}
            const data = files.get(row.frq);
            if (data.length < 40 || decode(data.subarray(0, 8)) !== "FREQ0003") {continue;}
            const value = new DataView(data.buffer, data.byteOffset, data.byteLength).getFloat64(12, true);
            if (value > 50 && value < 1800) {pitched.set(row.frq, value);}
        }
        const measured = [...pitched.values()].sort((left, right) => left - right);
        const native = measured.length ? measured[Math.floor(measured.length / 2)] : 0;
        const unique = new Set(rows.map(row => row.file));
        const japanese = rows.some(row => /[\u3040-\u30ff]/.test(row.alias));
        const phonetic = rows.filter(row => kana.has(normalize(row.alias).toLowerCase())).length;
        const sfx = !japanese && phonetic < 4 && unique.size <= 16 && rows.length <= 40;
        const names = [...new Set(rows.map(row => row.alias))];
        const preferred = ["nom", "meow", "nyo", "open", "a", "あ"].find(value => names.includes(value)) || names.find(value => !/sus|angry|sad|fall|br|breath/i.test(value)) || names[0];
        let short = names.filter(value => !/sus|angry|sad|fall|breath|^br$|^r$/i.test(value) && rows.find(row => row.alias === value).consonant < 250);
        if (names.includes("nyo") && names.includes("nyob")) {short = ["nyo", "nyob"];}
        if (names.includes("open") && names.includes("close")) {short = ["open", "close"];}
        if (!short.length) {short = [preferred];}
        result.push({name, root, id: root.split("/").pop() || filename(name), rows, prefixes, native, sfx, short, preferred, missing, files, metadata});
    }
    if (!result.length) {throw new Error("No usable WAV/oto.ini voicebank was found. Model libraries require their own singing engine.");}
    return result.sort((left, right) => right.rows.length - left.rows.length);
}

export function miditone(name) {
    const match = String(name || "").trim().match(/^([a-g])([#b]?)(-?\d+)$/i);
    if (!match) {return null;}
    return (Number(match[3]) + 1) * 12 + ({c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11}[match[1].toLowerCase()]) + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0);
}

/*//////////////////////////////////////////////////////////////////////*/

const kana = new Map();
for (const line of ["a i u e o|あ い う え お", "ka ki ku ke ko|か き く け こ", "ga gi gu ge go|が ぎ ぐ げ ご", "sa shi su se so|さ し す せ そ", "za ji zu ze zo|ざ じ ず ぜ ぞ", "ta chi tsu te to|た ち つ て と", "da di du de do|だ ぢ づ で ど", "na ni nu ne no|な に ぬ ね の", "ha hi fu he ho|は ひ ふ へ ほ", "ba bi bu be bo|ば び ぶ べ ぼ", "pa pi pu pe po|ぱ ぴ ぷ ぺ ぽ", "ma mi mu me mo|ま み む め も", "ya yu yo|や ゆ よ", "ra ri ru re ro|ら り る れ ろ", "wa wo n|わ を ん", "kya kyu kyo|きゃ きゅ きょ", "gya gyu gyo|ぎゃ ぎゅ ぎょ", "sha shu sho|しゃ しゅ しょ", "ja ju jo|じゃ じゅ じょ", "cha chu cho|ちゃ ちゅ ちょ", "nya nyu nyo|にゃ にゅ にょ", "hya hyu hyo|ひゃ ひゅ ひょ", "bya byu byo|びゃ びゅ びょ", "pya pyu pyo|ぴゃ ぴゅ ぴょ", "mya myu myo|みゃ みゅ みょ", "rya ryu ryo|りゃ りゅ りょ"]) {
    const [latin, japanese] = line.split("|").map(value => value.split(" "));
    latin.forEach((value, index) => {kana.set(value, japanese[index]); kana.set(japanese[index], value);});
}
kana.set("si", "し"); kana.set("ti", "ち"); kana.set("tu", "つ"); kana.set("hu", "ふ");

export function normalize(value) {return String(value).normalize("NFKC").replace(/[ァ-ヶ]/g, letter => String.fromCharCode(letter.charCodeAt(0) - 96));}

export function vowel(value) {
    const cleaned = normalize(value).replace(/[↑↓]$/, "").replace(/[a-g][#b]?-?\d+$/i, "").trim();
    const latin = kana.get(cleaned.split(" ").at(-1)) || cleaned;
    return latin.match(/[aeiou](?!.*[aeiou])/i)?.[0]?.toLowerCase() || (/[nん]$/i.test(latin) ? "n" : "a");
}

export function matching(bank, lyric, tone, previous = "-", approximate = true) {
    if (!bank.lookup) {
        bank.lookup = new Map(bank.rows.map(row => [row.alias, row]));
        bank.normalized = new Map();
        for (const row of bank.rows) {
            const key = normalize(row.alias).toLowerCase();
            for (const value of new Set([key, key.replace(/\s*[a-g][#b]?-?\d+$/i, "")])) {
                if (!bank.normalized.has(value)) {bank.normalized.set(value, []);}
                bank.normalized.get(value).push(row);
            }
        }
    }
    const aliases = bank.lookup;
    const clean = normalize(lyric).replace(/^\?/, "").trim();
    const variations = [lyric, clean, clean.toLowerCase(), kana.get(clean.toLowerCase()), clean.replace(/^[aeioun-]\s+/, "")].filter(Boolean);
    const prefix = [...bank.prefixes].sort((left, right) => Math.abs(left.tone - tone) - Math.abs(right.tone - tone))[0];
    for (const value of variations) {
        const candidates = [prefix ? prefix.prefix + value + prefix.suffix : "", previous + " " + value, "- " + value, value];
        for (const candidate of candidates) {if (aliases.has(candidate)) {return {row: aliases.get(candidate), approximate: false};}}
        const normalized = [...(bank.normalized.get(value.toLowerCase()) || [])];
        if (normalized.length) {
            normalized.sort((left, right) => Math.abs((miditone(left.alias.match(/[a-g][#b]?-?\d+$/i)?.[0]) ?? tone) - tone) - Math.abs((miditone(right.alias.match(/[a-g][#b]?-?\d+$/i)?.[0]) ?? tone) - tone));
            return {row: normalized[0], approximate: false};
        }
    }
    if (approximate) {
        const ending = vowel(clean);
        const families = {a: ["あ", "a", "aa", "ah", "ax", "A", "@", "V"], e: ["え", "e", "eh", "ey", "E"], i: ["い", "i", "iy", "ih", "I"], o: ["お", "o", "ow", "ao", "O"], u: ["う", "u", "uw", "uh", "U"], n: ["ん", "n", "m", "N"]};
        for (const candidate of families[ending] || families.a) {
            const result = matching(bank, candidate, tone, previous, false);
            if (result) {return {row: result.row, approximate: true};}
        }
    }
    return null;
}

export function sustain(bank, alias) {
    return bank.rows.find(row => row.alias === alias + "sus") || bank.rows.find(row => row.alias === alias.replace(/sus$/, "") + "sus") || bank.rows.find(row => row.alias === alias);
}
