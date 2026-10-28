import gifsicle from "./gifsicle.min.js";

export function rungifsiclewithprogress(options = {}, onprogress = ()=>{}){
    const start = typeof options.start === "function" ? options.start : null;
    onprogress({completed: 0, total: 2, detail: "loading GIF input"});
    return gifsicle.run({...options, start(input){
        onprogress({completed: 1, total: 2, detail: "optimizer worker started"});
        if (start) start(input);
    }}).then(result=>{
        onprogress({completed: 2, total: 2, detail: "optimizer returned output"});
        return result;
    });
}
