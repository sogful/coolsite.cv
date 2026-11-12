let features = null;
let dimensions = 0;
let count = 0;
let unifont = null;

self.onmessage = event => {
    const message = event.data;
    if (message.type === "index") {
        features = message.feat;
        dimensions = message.dim;
        count = message.n;
        unifont = message.uni;
        return;
    }
    if (message.type !== "match") return;
    const vectors = message.vecs;
    const top = [];
    const skip = message.nouni && unifont;
    let worst = -1e9;
    for (let glyph = 0; glyph < count; glyph++) {
        if (skip && unifont[glyph]) continue;
        const base = glyph * dimensions;
        let best = -1e9;
        for (const vector of vectors) {
            let dot = 0;
            for (let index = 0; index < dimensions; index++) dot += vector[index] * features[base + index];
            if (dot > best) best = dot;
        }
        if (top.length < 100) {
            top.push({idx:glyph,score:best});
            if (top.length === 100) {
                top.sort((first,second) => first.score - second.score);
                worst = top[0].score;
            }
        } else if (best > worst) {
            top[0] = {idx:glyph,score:best};
            top.sort((first,second) => first.score - second.score);
            worst = top[0].score;
        }
    }
    top.sort((first,second) => second.score - first.score);
    self.postMessage({type:"result",items:top});
};
