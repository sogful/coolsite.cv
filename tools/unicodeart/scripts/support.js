import {profiles} from "./profiles.js?v=20261112b";
import {context} from "./raster.js";

const checks = new Map();

/*//////////////////////////////////////////////////////////////////////*/

export function fontcheck(site) {
    if (checks.has(site)) return checks.get(site);
    const profile = profiles[site];
    const sizes = site === "twitter" ? [profile.size, 17] : [profile.size];
    const contexts = sizes.map(size => context(64, 64, {...profile, size}));
    const cache = new Map();
    function signature(ctx, text) {
        ctx.clearRect(0, 0, 64, 64);
        ctx.fillText(text, 8, 40);
        const data = ctx.getImageData(0, 0, 64, 64).data;
        let hash = 2166136261;
        for (let index = 3; index < data.length; index += 4) hash = Math.imul(hash ^ data[index], 16777619);
        return hash >>> 0;
    }
    const missing = contexts.map(ctx => {
        const bases = new Set();
        const marks = new Set();
        for (const char of ["\ufffd", "\u0378", "\u0380", "\udbff\udfff"]) {
            bases.add(signature(ctx, char));
            marks.add(signature(ctx, "a" + char));
        }
        bases.add(signature(ctx, ""));
        marks.add(signature(ctx, "a"));
        return {bases, marks};
    });
    function supported(text) {
        for (const char of text) {
            if (/^[\u00a0\u2000-\u200a ]$/u.test(char)) continue;
            if (!cache.has(char)) {
                const mark = /\p{Mark}/u.test(char);
                cache.set(char, contexts.every((ctx, index) => !missing[index][mark ? "marks" : "bases"].has(signature(ctx, mark ? "a" + char : char))));
            }
            if (!cache.get(char)) return false;
        }
        return true;
    }
    checks.set(site, supported);
    return supported;
}
