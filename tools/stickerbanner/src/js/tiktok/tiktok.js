import {uploadimage} from "./imageupload.js";

const host = "https://api16-normal-c-alisg.tiktokv.com";
const agent = "com.zhiliaoapp.musically/2023700040 (Linux; U; Android 14; en_US; Pixel 7; Build/UP1A; Cronet/TTNetVersion:5f9640e5 2023-09-14)";

export class rejected extends Error {}

export class tiktok {
    constructor(transport, device) {
        this.transport = transport;
        this.device = device;
        this.user = null;
        this.sources = new Map();
    }

    async request(path, parameters = {}, method = "GET") {
        const query = new URLSearchParams({aid:"1233",app_name:"musical_ly",device_platform:"android",device_id:this.device,version_code:"370004",version_name:"37.0.4",...parameters});
        const response = await this.transport.request(host + path + "?" + query,{session:true,method,headers:{Origin:"https://www.tiktok.com","User-Agent":agent,"Content-Type":"application/x-www-form-urlencoded"},...(method === "POST" ? {body:new Uint8Array()} : {})});
        let result;
        try {result = await response.json();} catch {throw Error("tiktok returned an unreadable response");}
        if (result.status_code !== 0) throw new rejected(`TikTok code ${result.status_code}: ${result.status_msg || "request rejected"}`);
        return result;
    }

    async identity(expected) {
        const response = await this.transport.request(host + "/passport/account/info/v2/?aid=1233&app_name=musical_ly&device_platform=android",{session:true,headers:{Origin:"https://www.tiktok.com","User-Agent":agent}});
        const result = await response.json();
        if (result.message !== "success" || !result.data?.sec_user_id || expected && result.data.username !== expected) throw Error("the approved tiktok account does not match the login request");
        if (!this.device) this.device = String(result.data.device_id || "");
        this.user = {name:result.data.username,secuid:result.data.sec_user_id,id:String(result.data.user_id || result.data.uid || ""),nickname:String(result.data.screen_name || result.data.nickname || "")};
        return this.user;
    }

    async profile() {
        return (await this.request("/tiktok/v1/im/video2sticker/profile/list/",{sec_user_id:this.user.secuid,count:"30",cursor:"0"})).video_stickers || [];
    }

    async upload(content) {
        const config = (await this.request("/tiktok/v1/im/upload_config",{upload_scene:"2"})).image_upload_config;
        return uploadimage(this.transport,config,content);
    }

    async create(uri, source, size, stored = true) {
        const result = await this.request("/tiktok/v1/im/video2sticker/create/",{store_toggle:String(stored),origin_video_id:source.id,origin_video_sec_user_id:source.secuid,sticker_type:"4",animated_uri:uri,width:String(size),height:String(size),labels:"",source:"video2sticker"},"POST");
        if (!result.video_sticker?.id) throw Error("tiktok did not return the created sticker id");
        return String(result.video_sticker.id);
    }

    async source(value) {
        let url = new URL(value);
        const key = url.href;
        if (this.sources.has(key)) return this.sources.get(key);
        let retried = false;
        for (let attempt = 0; attempt < 6; attempt += 1) {
            if (url.protocol !== "https:" || !["www.tiktok.com","tiktok.com","vt.tiktok.com","vm.tiktok.com","m.tiktok.com"].includes(url.hostname) || url.username || url.password || url.port) throw Error("enter a tiktok video url");
            const response = await this.transport.request(url.href,{session:["www.tiktok.com","tiktok.com"].includes(url.hostname)});
            if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {url = new URL(response.headers.get("location"),url); continue;}
            const document = new DOMParser().parseFromString(await response.text(),"text/html");
            let item;
            try {item = JSON.parse(document.querySelector("script[type='application/json'][id='__UNIVERSAL_DATA_FOR_REHYDRATION__']")?.textContent || "{}").__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct;}
            catch {}
            if (!item?.id || !item.author?.secUid) {
                if (!retried) {retried = true; await new Promise(resolve => setTimeout(resolve,600)); continue;}
                throw Error("tiktok source video unavailable. try its full www.tiktok.com video url");
            }
            const source = {id:String(item.id),secuid:item.author.secUid,url:url.href,author:item.author.uniqueId};
            this.sources.set(key,source);
            return source;
        }
        throw Error("tiktok source link redirected too many times");
    }
}
