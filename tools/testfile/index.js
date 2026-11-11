// gif
function makeblackgif(width, height, framecount, delayms) {
    var header = [
        "GIF89a",
        String.fromCharCode(width & 0xff, width >> 8, height & 0xff, height >> 8),
        "\x80",
        "\x00",
        "\x00",
        "\x00\x00\x00",
        "\xff\xff\xff"
    ].join("");
    var loopext = "\x21\xff\x0bnetscape2.0\x03\x01\x00\x00\x00";
    function frame(delay) {
        var gce = "\x21\xf9\x04\x00" + String.fromCharCode(Math.floor(delay / 10), 0, 0) + "\x00";
        var id = "\x2c\x00\x00\x00\x00" + String.fromCharCode(width & 0xff, width >> 8, height & 0xff, height >> 8) + "\x00";
        var npixels = width * height,
            scanline = String.fromCharCode(0).repeat(width),
            colordata = "";
        for (var i = 0; i < height; ++ i) 
            colordata += scanline;

        var lzwdata = "\x02" + String.fromCharCode(npixels + 1) + "\x00";
        return gce + id + "\x02\x02\x44\x01\x00";
    }
    var gif = header + loopext;
    for (var f = 0; f < framecount; ++ f) 
        gif += frame(delayms);

    gif += "\x3b";
    var b64 = btoa(gif);
    return "data:image/gif;base64," + b64;
}

// mp4
async function generateblackvideo(width, height, durationsec, targetmb) {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    let stream = canvas.captureStream(30);
    let chunks = [];
    let options = {mimetype: "video/webm;codecs=vp9"};
    if (targetmb && targetmb > 0) {
        options.videobitspersecond = Math.round((targetmb * 8 * 1000000) / durationsec);
    }
    let rec = new MediaRecorder(stream, options);
    rec.ondataavailable = e => {
        if (e.data.size > 0) 
            chunks.push(e.data);

    };
    let stopped = new Promise(resolve => rec.onstop = resolve);
    rec.start();
    let start = Date.now();
    let frameinterval = 1000 / 30;
    let frame = 0;
    let maxframes = Math.floor(durationsec * 30);
    function drawframe() {
        frame++;
        if (frame < maxframes) {
            setTimeout(drawframe, frameinterval);
        }
    }
    drawframe();
    await new Promise(res => setTimeout(res, durationsec * 1000));
    rec.stop();
    await stopped;
    let blob = new Blob(chunks, {type: "video/webm"});
    return blob;
}

// png
function generateblackpng(width, height) {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/png");
}

const filetypesel = document.getElementById("filetype");
const framesordurationdiv = document.getElementById("framesordurationdiv");
const frameslabel = document.getElementById("frameslabel");
filetypesel.addEventListener("change", function () {
    if (filetypesel.value === "gif") {
        frameslabel.textContent = "frame count:";
        document.getElementById("duration").value = 24;
        document.getElementById("duration").min = 1;
        document.getElementById("duration").step = 1;
    } else if (filetypesel.value === "mp4") {
        frameslabel.textContent = "duration (seconds):";
        document.getElementById("duration").value = 2;
        document.getElementById("duration").min = 1;
        document.getElementById("duration").step = 1;
    } else {
        framesordurationdiv.style.display = "none";
        return;
    } framesordurationdiv.style.display = "block";
});
if (filetypesel.value === "png") 
    framesordurationdiv.style.display = "none";


document.getElementById("generatebtn").onclick = async function () {
    let filetype = document.getElementById("filetype").value;
    let width = Math.max(1, + document.getElementById("width").value);
    let height = Math.max(1, + document.getElementById("height").value);
    let duration = + document.getElementById("duration").value || 1;
    let targetmb = + document.getElementById("sizemb").value || 0;
    let resultdiv = document.getElementById("result");
    resultdiv.innerHTML = "";
    if (filetype === "png") {
        let url = generateblackpng(width, height);
        let a = document.createElement("a");
        a.href = url;
        a.download = `black_${width}x${height}.png`;
        a.textContent = "download png";
        a.className = "filelink";
        resultdiv.appendChild(a);
        fetch(url).then(r => r.blob()).then(blob => {
            let sz = (blob.size / 1048576).toFixed(4);
            let info = document.createElement("div");
            info.textContent = `~${sz} mb`;
            info.className = "info";
            resultdiv.appendChild(info);
        });
    } else if (filetype === "gif") {
        let framecount = duration;
        if (framecount > 120) {
            framecount = 120;
            alert("limiting to 120 frames for browser!");
        }
        let url = makeblackgif(width, height, framecount, 10);
        let a = document.createElement("a");
        a.href = url;
        a.download = `black_${width}x${height}_${framecount}f.gif`;
        a.textContent = "download gif";
        a.className = "filelink";
        resultdiv.appendChild(a);
        fetch(url).then(r => r.blob()).then(blob => {
            let sz = (blob.size / 1048576).toFixed(4);
            let info = document.createElement("div");
            info.textContent = `~${sz} mb`;
            info.className = "info";
            resultdiv.appendChild(info);
            if (targetmb && blob.size / 1048576 < targetmb) {
                let warn = document.createElement("div");
                warn.className = "info";
                warn.textContent = "warning: actual size is less than target.. increase dimensions or frames";
                resultdiv.appendChild(warn);
            }
        });
    } else if (filetype === "mp4") {

        resultdiv.textContent = "generating video file (webm).. please wait";
        let blob = await generateblackvideo(width, height, duration, targetmb);
        let sz = (blob.size / 1048576).toFixed(4);
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = `black_${width}x${height}_${duration}s.mp4`;
        a.textContent = "download mp4/webm";
        a.className = "filelink";

        resultdiv.textContent = "";
        resultdiv.appendChild(a);
        let info = document.createElement("div");
        info.textContent = `~${sz} mb`;
        info.className = "info";

        resultdiv.appendChild(info);
        if (targetmb && blob.size / 1048576 < targetmb) {
            let warn = document.createElement("div");
            warn.className = "info";
            warn.textContent = "warning: actual size is less than target.. increase the width/height/duration";
            resultdiv.appendChild(warn);
        }

        let v = document.createElement("video");
        v.src = url; v.controls = true;
        v.height = 120; v.autoplay = false; v.muted = true;
        resultdiv.appendChild(v);
    }
};
