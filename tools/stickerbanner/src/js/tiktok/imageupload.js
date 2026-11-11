const encoder = new TextEncoder();

export async function uploadimage(transport, config, content) {
    const token = typeof config.auth_token === "string" ? JSON.parse(config.auth_token) : config.auth_token;
    async function signed(action, method = "GET", body = "") {
        const parameters = {Action:action,Version:"2018-08-01",ServiceId:config.service_id,device_platform:"android",aid:"1233"};
        if (action === "ApplyImageUpload") Object.assign(parameters,{FileSize:String(content.byteLength),s:Array.from(crypto.getRandomValues(new Uint8Array(6)),value => value.toString(16).padStart(2,"0")).join("")});
        const query = Object.entries(parameters).sort(([first],[second]) => first < second ? -1 : first > second ? 1 : 0).map(([name,value]) => encodeURIComponent(name) + "=" + encodeURIComponent(value)).join("&");
        const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g,"");
        const day = date.slice(0,8);
        const headers = {"x-amz-date":date,"x-amz-security-token":token.session_token};
        const names = Object.keys(headers).join(";");
        const canonical = [method,"/top/v1",query,Object.entries(headers).map(([name,value]) => name + ":" + value + "\n").join(""),names,await digest(body)].join("\n");
        const scope = day + "/us-east-1/imagex/aws4_request";
        const text = ["AWS4-HMAC-SHA256",date,scope,await digest(canonical)].join("\n");
        let key = encoder.encode("AWS4" + token.secret_access_key);
        for (const value of [day,"us-east-1","imagex","aws4_request"]) key = await mac(key,value);
        headers.authorization = `AWS4-HMAC-SHA256 Credential=${token.access_key_id}/${scope}, SignedHeaders=${names}, Signature=${hex(await mac(key,text))}`;
        headers["content-type"] = "application/json";
        const response = await transport.request("https://" + config.host + "/top/v1?" + query,{method,headers,...(method === "POST" ? {body:encoder.encode(body)} : {})});
        const data = await response.json();
        if (!response.ok || !data.Result || data.ResponseMetadata?.Error) throw Error("tiktok rejected the image upload configuration");
        return data.Result;
    }
    const address = (await signed("ApplyImageUpload")).UploadAddress;
    const info = address.StoreInfos[0];
    const response = await transport.request("https://" + address.UploadHosts[0] + "/upload/v1/" + info.StoreUri,{method:"POST",headers:{...(address.UploadHeader || {}),authorization:info.Auth,"content-type":"application/octet-stream","content-crc32":crc(content)},body:content});
    const result = await response.json();
    if (!response.ok || result.code !== 2000) throw Error("tiktok rejected the gif upload");
    const committed = await signed("CommitImageUpload","POST",JSON.stringify({SessionKey:address.SessionKey}));
    if (!committed.Results?.some(item => item.UriStatus === 2000)) throw Error("tiktok did not commit the gif upload");
    return info.StoreUri;
}

/*//////////////////////////////////////////////////////////////////////*/

export async function digest(value) {
    return hex(await crypto.subtle.digest("SHA-256",typeof value === "string" ? encoder.encode(value) : value));
}

function hex(value) {
    return Array.from(new Uint8Array(value),item => item.toString(16).padStart(2,"0")).join("");
}

async function mac(key, value) {
    const imported = await crypto.subtle.importKey("raw",key,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC",imported,encoder.encode(value)));
}

function crc(content) {
    let value = 4294967295;
    for (const byte of new Uint8Array(content)) {
        value ^= byte;
        for (let bit = 0; bit < 8; bit += 1) value = value >>> 1 ^ (value & 1 ? 3988292384 : 0);
    }
    return ((value ^ 4294967295) >>> 0).toString(16).padStart(8,"0");
}
