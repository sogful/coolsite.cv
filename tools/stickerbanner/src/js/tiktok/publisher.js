import {digest} from "./imageupload.js?v=20261109d";
import {rejected} from "./tiktok.js?v=20261113perf";

import {positions as gridpositions} from "../editor/geometry.js";

export async function publishbanner(client, archive, sourceurl, expected, update) {
    if (client.user?.name !== expected) throw Error("the connected tiktok account changed");
    const zip = await globalThis.JSZip.loadAsync(archive);
    const files = Object.keys(zip.files);
    const manifest = JSON.parse(await zip.file("manifest.json")?.async("string") || "null");
    if (![1,2].includes(manifest?.version) || manifest.version === 2 && manifest.columns !== 3) throw Error("invalid banner version");
    const rows = manifest.version === 1 ? 2 : manifest.rows;
    if (![1,2,3,4].includes(rows)) throw Error("invalid banner rows");
    const positions = gridpositions(rows).reverse();
    const count = rows * 3;
    const names = positions.map((position,index) => String(index + 1).padStart(2,"0") + "-" + position + ".gif");
    if (files.length !== count + 1 || !files.includes("manifest.json") || names.some(name => !files.includes(name))) throw Error("choose a banner zip from this tool");
    if (manifest.files?.length !== count || manifest.files.some((item,index) => item.name !== names[index]) || manifest.width !== manifest.height || !Number.isInteger(manifest.width) || manifest.width < 16 || manifest.width > 1024) throw Error("invalid banner manifest");
    const contents = [];
    for (const item of manifest.files) {
        const bytes = await zip.file(item.name).async("uint8array");
        if (bytes.byteLength !== item.bytes || bytes.byteLength > 20000000 || await digest(bytes) !== item.sha256 || new TextDecoder().decode(bytes.subarray(0,6)) !== "GIF89a") throw Error("banner checksum or gif format mismatch");
        const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
        if (view.getUint16(6,true) !== manifest.width || view.getUint16(8,true) !== manifest.height) throw Error("banner dimensions do not match the manifest");
        contents.push(bytes);
    }
    update("checking the source video");
    const source = await client.source(sourceurl);
    const identity = await digest(JSON.stringify({account:expected,source:source.id,files:manifest.files.map(item => item.sha256)}));
    const key = "stickerbanner:" + identity;
    const journal = JSON.parse(localStorage.getItem(key) || "null") || {account:expected,source,files:[]};
    const save = () => localStorage.setItem(key,JSON.stringify(journal));
    const profile = await client.profile();
    for (let index = 0; index < count; index += 1) {
        const item = manifest.files[index];
        if (!journal.files[index]) journal.files.push({name:item.name,sha256:item.sha256});
        const entry = journal.files[index];
        update(`${index + 1}/${count} ${positions[index]}: uploading`);
        if (!entry.uri) {entry.uri = await client.upload(contents[index]); save();}
        const existing = profile.find(sticker => sticker.animated_urls?.uri === entry.uri);
        if (existing) {entry.id = String(existing.id); delete entry.pending; save(); continue;}
        if (entry.id) throw Error("a previously published tile is absent. stopped to avoid duplicates");
        if (entry.pending) throw Error("a previous creation request has an uncertain result. check the tiktok profile before retrying");
        update(`${index + 1}/${count} ${positions[index]}: creating sticker`);
        entry.pending = true;
        save();
        try {entry.id = await client.create(entry.uri,source,manifest.width);}
        catch (error) {if (error instanceof rejected) {delete entry.pending; save();} throw error;}
        delete entry.pending;
        save();
    }
    const expecteduris = [...journal.files].reverse().map(item => item.uri);
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const current = await client.profile();
        if (expecteduris.every((uri,index) => current[index]?.animated_urls?.uri === uri)) {
            journal.verified = true;
            save();
            update(`${count} stickers published; profile order verified`);
            return journal;
        }
        await new Promise(resolve => setTimeout(resolve,1200));
    }
    throw Error(`${count} stickers created, but profile order is not yet confirmed.. do not start another banner`);
}
