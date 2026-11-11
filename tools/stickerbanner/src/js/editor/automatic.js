export function plans(duration, native, rows) {
    const frames = Math.floor(360 * Math.min(1,2 / rows));
    const cadence = Number.isFinite(native) && native > 0 ? native : 24;
    const fps = cadence / Math.max(1,Math.ceil(cadence / 30),Math.ceil(cadence * duration / frames));
    const candidates = [240,208,176,144,120].map(width => ({width,height:width,fps,limit:2500000,autolimit:false,loop:true,sticker:true}));
    for (const divisor of [2,3,4]) candidates.push({...candidates[4],fps:fps / divisor});
    return candidates;
}

/*//////////////////////////////////////////////////////////////////////*/

export function nextplan(candidates, current, bytes) {
    const plan = candidates[current];
    const width = plan.width * Math.sqrt(plan.limit / bytes) * 0.9;
    const next = candidates.findIndex((candidate,index) => index > current && (candidate.width <= width || candidate.fps < plan.fps));
    return next < 0 ? candidates.length : next;
}
