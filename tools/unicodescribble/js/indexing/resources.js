const resources = globalThis.caches ? caches.open("scribble-resources-v1").catch(() => null) : Promise.resolve(null);

export async function digest(value) {
    const data = typeof value === "string" ? new TextEncoder().encode(value) : value;
    return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",data)),byte => byte.toString(16).padStart(2,"0")).join("");
}

async function resource(url) {
    const cache = await resources;
    const saved = await cache?.match(url);
    let response;
    try {
        response = await fetch(url,{cache:"no-cache"});
        if (!response.ok) throw Error("couldn't load " + url);
    } catch (error) {
        if (!saved) throw error;
        response = saved;
    }
    const data = await response.arrayBuffer();
    const hash = await digest(data);
    if (cache && saved?.headers.get("x-scribble-hash") !== hash) {
        try {
            const headers = new Headers(response.headers);
            headers.delete("content-encoding");headers.delete("content-length");
            headers.set("x-scribble-hash",hash);
            await cache.put(url,new Response(data,{headers}));
        } catch {}
    }
    return {data,hash};
}

export async function load(fonts,codepointurl,emojiurl) {
    const [faces,codepoints,emoji] = await Promise.all([
        Promise.all(fonts.map(async font => ({family:font.fam,url:font.url,...await resource(font.url)}))),
        resource(codepointurl),resource(emojiurl)
    ]);
    await Promise.all(faces.map(async font => {
        const face = new FontFace(font.family,font.data);
        await face.load();document.fonts.add(face);
    }));
    return {fonts:faces,cps:new Uint32Array(codepoints.data),emoji:new Uint32Array(emoji.data),hashes:[...faces.map(font => [font.family,font.url,font.hash]),codepoints.hash,emoji.hash]};
}

export async function fingerprint(data,settings) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;canvas.height = 256;
    const context = canvas.getContext("2d",{willReadFrequently:true});
    context.fillStyle = "#000000";
    for (const [index,font] of settings.fonts.entries()) {
        context.font = "46px " + font;
        context.fillText("Aa0漢⠿𐌀𝄞😀🧑∞م",4,50 + index * 64);
    }
    const probe = await digest(context.getImageData(0,0,canvas.width,canvas.height).data);
    return digest(JSON.stringify({hashes:data.hashes,settings,probe}));
}
