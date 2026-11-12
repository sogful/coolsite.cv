import {build} from "./build.js";

self.onmessage = async event => {
    if (!self.fonts || typeof OffscreenCanvas !== "function" || typeof FontFace !== "function") {
        self.postMessage({type:"unsupported"});
        return;
    }
    try {
        const {data,settings} = event.data;
        await Promise.all(data.fonts.map(async font => {
            const face = new FontFace(font.family,font.data);
            await face.load();self.fonts.add(face);
        }));
        const result = await build(data,{...settings,canvas:(width,height) => new OffscreenCanvas(width,height),progress:progress => self.postMessage({type:"progress",...progress})});
        const buffers = Object.values(result).filter(value => ArrayBuffer.isView(value)).map(value => value.buffer);
        self.postMessage({type:"result",result},buffers);
    } catch (error) {self.postMessage({type:"error",message:error.message});}
};
