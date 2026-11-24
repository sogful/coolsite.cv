(() => {
    const page = document.querySelector(".frontpage");
    const nav = page.querySelector(".gameicons");
    const ring = page.querySelector(".iconring");
    const links = [...nav.querySelectorAll("a")];
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", {willReadFrequently: true});
    const images = new WeakMap();
    const obstaclefields = new WeakMap();
    const textgroups = [...page.querySelectorAll(".main > span, .status, .bottom, .kofi")];
    const badges = page.querySelector(".bottom");
    const status = page.querySelector(".status");
    const badgepillar = page.querySelector(".badgepillar");
    const logos = [...page.querySelectorAll(".cv, .cvtuah")];
    const support = page.querySelector(".kofipanel");
    const maskimage = new Image();
    maskimage.src = "/assets/images/bg/cloudmask.webp";
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
    let area, circle, terrain;
    let stationary = [], solids = [];
    let bodies = [], grab = null;
    let pending = 0, previous = 0, still = 0, dirty = true;

    function box(element) {
        const rect = element.getBoundingClientRect();
        return {x: rect.left - area.left, y: rect.top - area.top, width: rect.width, height: rect.height};
    }

    function imagepixels(image) {
        if (!image.naturalWidth) return null;
        const saved = images.get(image);
        if (saved?.src === image.currentSrc) return saved;
        const width = canvas.width = image.naturalWidth;
        const height = canvas.height = image.naturalHeight;
        context.drawImage(image, 0, 0);
        try {
            const mask = {width, height, rgba: context.getImageData(0, 0, width, height).data, src: image.currentSrc};
            images.set(image, mask);
            return mask;
        } catch {
            return null;
        }
    }

    function imageshape(image) {
        const bounds = box(image);
        if (!bounds.width || !bounds.height) return;
        const mask = imagepixels(image);
        if (!mask) return;
        const style = getComputedStyle(image);
        const left = parseFloat(style.paddingLeft), right = parseFloat(style.paddingRight);
        const top = parseFloat(style.paddingTop), bottom = parseFloat(style.paddingBottom);
        const matrix = style.transform === "none" ? null : new DOMMatrixReadOnly(style.transform);
        if (matrix?.is2D && (matrix.b || matrix.c)) {
            const width = parseFloat(style.width), height = parseFloat(style.height);
            const x = bounds.x + (bounds.width - width) / 2, y = bounds.y + (bounds.height - height) / 2;
            return {x, y, width, height, mask, inverse: matrix.inverse(),
                left: bounds.x - x, right: bounds.x + bounds.width - x,
                top: bounds.y - y, bottom: bounds.y + bounds.height - y};
        }
        bounds.x += left;
        bounds.y += top;
        bounds.width -= left + right;
        bounds.height -= top + bottom;
        const flip = matrix?.m11 < 0;
        return {...bounds, mask, flip};
    }

    /*//////////////////////////////////////////////////////////////////////*/

    function glyphs(rect, text, style) {
        const x = Math.floor(rect.left) - 2, y = Math.floor(rect.top) - 2;
        const width = canvas.width = Math.ceil(rect.right) - x + 2;
        const height = canvas.height = Math.ceil(rect.bottom) - y + 2;
        context.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(" ");
        context.direction = style.direction;
        context.textAlign = "left";
        const metrics = context.measureText(text);
        const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * .8;
        const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * .2;
        const baseline = rect.top - y + (rect.height + ascent - descent) / 2;
        context.fillText(text, rect.left - x, baseline);
        return {x: x - area.left, y: y - area.top, width, height,
            mask: {width, height, rgba: context.getImageData(0, 0, width, height).data}};
    }

    function textshapes(group) {
        const walker = document.createTreeWalker(group, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        const result = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.data.trim()) continue;
            const style = getComputedStyle(node.parentElement);
            if (style.visibility !== "visible") continue;
            const collapse = !["pre", "pre-wrap", "break-spaces"].includes(style.whiteSpace);
            const text = value => collapse ? value.replace(/\s+/g, " ") : value;
            range.selectNodeContents(node);
            const rects = range.getClientRects();
            if (rects.length === 1 && rects[0].width) {
                result.push(glyphs(rects[0], text(node.data), style));
                continue;
            }
            if (rects.length < 2) continue;
            let start = 0, line = null;
            const append = end => {
                if (line === null || !node.data.slice(start, end).trim()) return;
                range.setStart(node, start);
                range.setEnd(node, end);
                result.push(glyphs(range.getBoundingClientRect(), text(node.data.slice(start, end)), style));
            };
            for (let index = 0; index < node.length; index += 1) {
                range.setStart(node, index);
                range.setEnd(node, index + 1);
                const rect = range.getBoundingClientRect();
                if (!rect.width) continue;
                if (line !== rect.top) {
                    append(index);
                    start = index;
                    line = rect.top;
                }
            }
            append(node.length);
        }
        return result;
    }

    function refreshsolids() {
        if (dirty) {
            const clip = box(badges);
            const caption = box(status);
            for (const [side, pseudo] of [["left", "::before"], ["right", "::after"]]) {
                const style = getComputedStyle(status, pseudo);
                const x = caption.x + parseFloat(style.left) + parseFloat(style.width) / 2;
                const overlaps = x > clip.x && x < clip.x + clip.width;
                const start = overlaps ? Math.max(0, clip.y - caption.y - caption.height + 1) : 0;
                const end = overlaps ? Math.max(start, clip.y + clip.height - caption.y - caption.height + 1) : 0;
                status.style.setProperty(`--${side}-gap-start`, `${start}px`);
                status.style.setProperty(`--${side}-gap-end`, `${end}px`);
                if (badgepillar && side === "left") badgepillar.hidden = overlaps;
            }
            stationary = textgroups.flatMap(group => {
                const shapes = textshapes(group);
                if (group === badges) for (const shape of shapes) shape.clip = clip;
                return shapes;
            });
            for (const image of page.querySelectorAll(".bottom img, .status img, .soggytraybtn, .iconstand img")) {
                const shape = imageshape(image);
                if (!shape) continue;
                if (badges.contains(image)) shape.clip = clip;
                stationary.push(shape);
            }
            if (support.classList.contains("open")) stationary.push(box(support));
            dirty = false;
        }
        solids = stationary.concat(logos.map(imageshape).filter(Boolean));
    }

    /*//////////////////////////////////////////////////////////////////////*/

    function rotatemask(body, angle) {
        body.angle = angle;
        body.cos = Math.cos(angle);
        body.sin = Math.sin(angle);
        body.left = body.top = Infinity;
        body.right = body.bottom = -Infinity;
        const cx = body.width / 2, cy = body.height / 2;
        for (let index = 0; index < body.points.length; index += 1) {
            const [px, py] = body.points[index];
            const x = cx + px * body.cos - py * body.sin;
            const y = cy + px * body.sin + py * body.cos;
            const point = body.rotated[index];
            point[0] = x;
            point[1] = y;
            body.left = Math.min(body.left, x - .5);
            body.right = Math.max(body.right, x + .5);
            body.top = Math.min(body.top, y - .5);
            body.bottom = Math.max(body.bottom, y + .5);
        }
    }

    function makebodymask(body, width, height) {
        body.width = width;
        body.height = height;
        const cols = Math.ceil(width), rows = Math.ceil(height);
        const pixels = new Uint8Array(cols * rows);
        let mass = 0, inertia = 0;
        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
                const u = Math.min(body.mask.width - 1, Math.floor((x + .5) * body.mask.width / width));
                const v = Math.min(body.mask.height - 1, Math.floor((y + .5) * body.mask.height / height));
                if (!body.mask.rgba[(v * body.mask.width + u) * 4 + 3]) continue;
                pixels[y * cols + x] = 1;
                mass += 1;
                inertia += (x + .5 - width / 2) ** 2 + (y + .5 - height / 2) ** 2 + 1 / 6;
            }
        }
        const filled = (x, y) => x >= 0 && x < cols && y >= 0 && y < rows && pixels[y * cols + x];
        const contour = [];
        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
                if (!filled(x, y)) continue;
                if (!filled(x - 1, y)) contour.push([x, y + .5]);
                if (!filled(x + 1, y)) contour.push([x + 1, y + .5]);
                if (!filled(x, y - 1)) contour.push([x + .5, y]);
                if (!filled(x, y + 1)) contour.push([x + .5, y + 1]);
            }
        }
        const stride = cols + 4;
        const distances = new Float32Array(stride * (rows + 4));
        for (let y = -2; y < rows + 2; y += 1) {
            for (let x = -2; x < cols + 2; x += 1) {
                let squared = 25;
                for (const [px, py] of contour) {
                    squared = Math.min(squared, (x + .5 - px) ** 2 + (y + .5 - py) ** 2);
                }
                distances[(y + 2) * stride + x + 2] = Math.sqrt(squared) * (filled(x, y) ? -1 : 1);
            }
        }
        body.field = {stride, rows: rows + 4, distances};
        body.points = contour.map(([x, y]) => [x - width / 2, y - height / 2]);
        body.rotated = contour.map(() => [0, 0]);
        body.radius = Math.max(...body.points.map(([x, y]) => Math.hypot(x, y)));
        body.inv = width * height / mass;
        body.invang = width * height / inertia;
        rotatemask(body, body.angle);
    }

    function distanceat(field, x, y) {
        x += 1.5;
        y += 1.5;
        const col = Math.floor(x), row = Math.floor(y), stride = field.stride;
        if (col < 0 || row < 0 || col >= stride - 1 || row >= field.rows - 1) return 5;
        const base = row * stride + col, tx = x - col, ty = y - row;
        const d = field.distances;
        return (d[base] * (1 - tx) + d[base + 1] * tx) * (1 - ty)
            + (d[base + stride] * (1 - tx) + d[base + stride + 1] * tx) * ty;
    }

    function boundsmeet(a, b, margin = 0) {
        return a.x + a.right + margin > b.x + (b.left ?? 0) && a.x + a.left - margin < b.x + (b.right ?? b.width)
            && a.y + a.bottom + margin > b.y + (b.top ?? 0) && a.y + a.top - margin < b.y + (b.bottom ?? b.height);
    }

    function piececontact(a, b) {
        let contact;
        const ax = b.x + b.width * .5, ay = b.y + b.height * .5;
        for (const [px, py] of a.rotated) {
            const x = a.x + px, y = a.y + py;
            const dx = x - ax, dy = y - ay;
            const sx = dx * b.cos + dy * b.sin + b.width * .5;
            const sy = dy * b.cos - dx * b.sin + b.height * .5;
            const depth = -distanceat(b.field, sx, sy);
            if (depth <= (contact?.depth ?? .04)) continue;
            const gx = distanceat(b.field, sx + .65, sy) - distanceat(b.field, sx - .65, sy);
            const gy = distanceat(b.field, sx, sy + .65) - distanceat(b.field, sx, sy - .65);
            const length = Math.hypot(gx, gy);
            if (length < .001) continue;
            contact = {x, y, depth, nx: (gx * b.cos - gy * b.sin) / length, ny: (gx * b.sin + gy * b.cos) / length};
        }
        return contact;
    }

    function paircontact(a, b) {
        if (!boundsmeet(a, b)) return null;
        const first = piececontact(a, b);
        const second = piececontact(b, a);
        if (!second || first?.depth >= second.depth) return first;
        return {...second, nx: -second.nx, ny: -second.ny};
    }

    function obstaclefield(mask) {
        const existing = obstaclefields.get(mask);
        if (existing) return existing;
        const stride = mask.width + 4, rows = mask.height + 4;
        const filled = new Uint8Array(stride * rows);
        const distances = new Float32Array(filled.length).fill(1e6);
        for (let y = 0; y < mask.height; y += 1) {
            for (let x = 0; x < mask.width; x += 1) {
                filled[(y + 2) * stride + x + 2] = Number(Boolean(mask.rgba[(y * mask.width + x) * 4 + 3]));
            }
        }
        for (let y = 1; y < rows - 1; y += 1) {
            for (let x = 1; x < stride - 1; x += 1) {
                const at = y * stride + x, pixel = filled[at];
                if (pixel !== filled[at - 1] || pixel !== filled[at + 1]
                    || pixel !== filled[at - stride] || pixel !== filled[at + stride]) distances[at] = .5;
            }
        }
        const diagonal = Math.SQRT2;
        for (const direction of [1, -1]) {
            const first = direction === 1 ? 1 : rows - 2;
            const last = direction === 1 ? rows - 1 : 0;
            for (let y = first; y !== last; y += direction) {
                for (let k = 1; k < stride - 1; k += 1) {
                    const x = direction === 1 ? k : stride - 1 - k;
                    const at = y * stride + x, previous = at - stride * direction;
                    distances[at] = Math.min(distances[at], distances[at - direction] + 1,
                        distances[previous] + 1, distances[previous - 1] + diagonal, distances[previous + 1] + diagonal);
                }
            }
        }
        for (let i = 0; i < filled.length; i += 1) {
            distances[i] = Math.min(5, distances[i]) * (filled[i] ? -1 : 1);
        }
        const field = {stride, rows, distances};
        obstaclefields.set(mask, field);
        return field;
    }

    function rectcontact(bounds, x, y) {
        const left = x - bounds.x, top = y - bounds.y;
        const right = bounds.width - left, bottom = bounds.height - top;
        const depth = Math.min(left, top, right, bottom);
        if (depth === top) return {x, y, depth, nx: 0, ny: -1};
        if (depth === bottom) return {x, y, depth, nx: 0, ny: 1};
        return {x, y, depth, nx: depth === left ? -1 : 1, ny: 0};
    }

    function alphacontact(shape, x, y, field) {
        const sx = shape.mask.width / shape.width * (shape.flip ? -1 : 1);
        const sy = shape.mask.height / shape.height;
        const dx = x - shape.x - shape.width / 2, dy = y - shape.y - shape.height / 2;
        const {a, b, c, d} = shape.inverse || {a: 1, b: 0, c: 0, d: 1};
        const u = (a * dx + c * dy) * sx + shape.mask.width / 2;
        const v = (b * dx + d * dy) * sy + shape.mask.height / 2;
        const distance = distanceat(field, u, v);
        if (distance >= 0) return null;
        const gx = (distanceat(field, u + .5, v) - distanceat(field, u - .5, v)) * sx;
        const gy = (distanceat(field, u, v + .5) - distanceat(field, u, v - .5)) * sy;
        const nx = gx * a + gy * b, ny = gx * c + gy * d;
        const scale = Math.hypot(nx, ny);
        if (scale < .001) return null;
        return {x, y, depth: Math.min(-distance / scale, 3), nx: nx / scale, ny: ny / scale};
    }

    function obstaclecontact(body, shape) {
        if (!boundsmeet(body, shape)) return null;
        const field = shape.mask && obstaclefield(shape.mask);
        const candidates = [];
        let deepest;
        for (const [px, py] of body.rotated) {
            const x = body.x + px, y = body.y + py;
            const clip = shape.clip && rectcontact(shape.clip, x, y);
            if (clip && clip.depth <= 0) continue;
            let contact = field ? alphacontact(shape, x, y, field) : rectcontact(shape, x, y);
            if (!contact || contact.depth <= 0) continue;
            if (clip && clip.depth < contact.depth) contact = clip;
            candidates.push(contact);
            if (!deepest || contact.depth > deepest.depth) deepest = contact;
        }
        if (!deepest) return null;
        let x = 0, y = 0, count = 0;
        for (const contact of candidates) {
            if (contact.depth < deepest.depth - .32 || contact.nx * deepest.nx + contact.ny * deepest.ny < .97) continue;
            x += contact.x;
            y += contact.y;
            count += 1;
        }
        return {...deepest, x: x / count, y: y / count};
    }

    function rimcontact(body, outside = body.outside) {
        const center = Math.hypot(body.x + body.width / 2 - circle.x, body.y + body.height / 2 - circle.y);
        const radius = outside ? circle.outer : circle.inner;
        if (outside ? center - body.radius >= radius : center + body.radius <= radius) return null;
        let contact;
        for (const [px, py] of body.rotated) {
            const x = body.x + px, y = body.y + py;
            const dx = x - circle.x, dy = y - circle.y, distance = Math.hypot(dx, dy);
            const depth = outside ? radius - distance : distance - radius;
            if (depth <= (contact?.depth || 0) || distance < .01) continue;
            const sign = outside ? 1 : -1;
            contact = {x, y, depth, nx: sign * dx / distance, ny: sign * dy / distance};
        }
        return contact;
    }

    function maskedge(edges, x) {
        const col = clamp(x, 0, edges.length - 1), whole = Math.floor(col);
        return edges[whole] + (edges[Math.min(whole + 1, edges.length - 1)] - edges[whole]) * (col - whole);
    }

    function groundcontact(body) {
        if (body.y + body.top >= terrain.hightop && body.y + body.bottom <= terrain.lowbottom) return null;
        let contact;
        for (const [px, py] of body.rotated) {
            const x = body.x + px, y = body.y + py;
            const upper = maskedge(terrain.top, x), lower = maskedge(terrain.bottom, x);
            const over = y < upper;
            const vertical = over ? upper - y : y - lower;
            if (vertical <= 0) continue;
            const row = over ? terrain.top : terrain.bottom;
            const slope = clamp((maskedge(row, x + 2.5) - maskedge(row, x - 2.5)) / 5, -1.2, 1.2);
            const length = Math.hypot(slope, 1), sign = over ? -1 : 1;
            const depth = vertical / length;
            if (depth > (contact?.depth || 0)) contact = {x, y, depth, nx: sign * slope / length, ny: -sign / length};
        }
        return contact;
    }

    function wallcontact(body) {
        const left = -(body.x + body.left), right = body.x + body.right - area.width;
        if (left <= 0 && right <= 0) return null;
        return {x: left > right ? 0 : area.width, y: body.y + body.height / 2,
            depth: Math.max(left, right), nx: left > right ? 1 : -1, ny: 0};
    }

    /*//////////////////////////////////////////////////////////////////////*/

    function resolvecontact(a, b, contact, held, surface = false) {
        if (!contact) return;
        const {x, y, nx, ny, depth} = contact;
        const ia = held === a ? 0 : a.inv, ib = !b || held === b ? 0 : b.inv;
        const ra = held === a ? 0 : a.invang, rb = !b || held === b ? 0 : b.invang;
        const ax = x - a.x - a.width * .5, ay = y - a.y - a.height * .5;
        const bx = b ? x - b.x - b.width * .5 : 0, by = b ? y - b.y - b.height * .5 : 0;
        const correction = Math.max(depth - .025, 0) * .84 / (ia + ib || a.inv);
        a.x += correction * nx * (ia || (!b && held === a ? a.inv : 0));
        a.y += correction * ny * (ia || (!b && held === a ? a.inv : 0));
        if (b) {
            b.x -= correction * nx * ib;
            b.y -= correction * ny * ib;
        }
        if (!ia && !ib) return;

        const impulse = (ux, uy, bounce, cap) => {
            const crossa = ax * uy - ay * ux, crossb = bx * uy - by * ux;
            const vx = a.vx - a.spin * ay - (b ? b.vx - b.spin * by : 0);
            const vy = a.vy + a.spin * ax - (b ? b.vy + b.spin * bx : 0);
            const speed = vx * ux + vy * uy;
            const strength = clamp(-(1 + (speed < -52 ? bounce : 0)) * speed
                / (ia + ib + crossa ** 2 * ra + crossb ** 2 * rb), cap ? -cap : 0, cap || Infinity);
            a.vx += strength * ux * ia;
            a.vy += strength * uy * ia;
            a.spin += strength * crossa * ra;
            if (b) {
                b.vx -= strength * ux * ib;
                b.vy -= strength * uy * ib;
                b.spin -= strength * crossb * rb;
            }
            return strength;
        };
        const normal = impulse(nx, ny, surface ? .08 : .34, 0);
        if (normal <= 0) return;
        impulse(-ny, nx, 0, normal * (surface ? .76 : .42));
        if (surface && ny < -.6) {
            const load = normal * ia * -ny;
            a.vx *= Math.exp(-load / 110);
            a.spin *= Math.exp(-load / 65);
        }
    }

    function scenecollisions(body, held = null) {
        resolvecontact(body, null, wallcontact(body), held);
        resolvecontact(body, null, groundcontact(body), held);
        if (body !== held) resolvecontact(body, null, rimcontact(body), held);
        for (const shape of solids) resolvecontact(body, null, obstaclecontact(body, shape), held, true);
    }

    function movegrab(body, dx, dy, elapsed) {
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 1.1));
        body.vx = clamp(dx / elapsed, -900, 900);
        body.vy = clamp(dy / elapsed, -900, 900);
        for (let i = 0; i < steps; i += 1) {
            body.x += dx / steps;
            body.y += dy / steps;
            scenecollisions(body, body);
            for (const other of bodies) {
                if (other === body) continue;
                resolvecontact(body, other, paircontact(body, other), body);
                scenecollisions(other, body);
                resolvecontact(body, null, paircontact(body, other), body);
            }
            scenecollisions(body, body);
        }
        body.vx = body.vy = 0;
    }
    function paint(body) {
        body.link.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.angle}rad)`;
        body.link.toggleAttribute("data-outside", body.outside);
    }

    function frame(now) {
        pending = 0;
        const dt = Math.min(.025, (now - previous) / 1000 || 1 / 60);
        previous = now;
        refreshsolids();
        const held = grab?.body;
        const speed = Math.max(100, ...bodies.map(body => Math.hypot(body.vx, body.vy) + Math.abs(body.spin) * body.radius));
        const nearsolid = bodies.some(body => body !== held && solids.some(shape => boundsmeet(body, shape, dt * speed)));
        const steps = Math.max(2, Math.ceil(dt * speed / (nearsolid ? .7 : 1.7)));
        const interval = dt / steps;
        const damping = Math.pow(.98, interval * 60);
        for (let step = 0; step < steps; step += 1) {
            for (const body of bodies) {
                if (body === held) continue;
                body.vy = Math.min(1050, body.vy + 680 * interval);
                body.vx *= damping;
                body.spin *= damping;
                body.x += body.vx * interval;
                body.y += body.vy * interval;
                rotatemask(body, (body.angle + body.spin * interval) % (Math.PI * 2));
            }
            for (let pass = 0; pass < 2; pass += 1) {
                for (let i = 0; i < bodies.length; i += 1) {
                    const body = bodies[i];
                    if (body !== held) scenecollisions(body, held);
                    for (let j = i + 1; j < bodies.length; j += 1) {
                        resolvecontact(body, bodies[j], paircontact(body, bodies[j]), held);
                    }
                }
            }
        }
        for (const body of bodies) paint(body);
        still = grab || bodies.some(body => Math.hypot(body.vx, body.vy) > 4 || Math.abs(body.spin) > .25) ? 0 : still + 1;
        if (still < 14) pending = requestAnimationFrame(frame);
    }

    function wake() {
        still = 0;
        if (pending) return;
        previous = performance.now();
        pending = requestAnimationFrame(frame);
    }

    /*//////////////////////////////////////////////////////////////////////*/

    function mappedges() {
        const mask = imagepixels(maskimage);
        const cols = Math.ceil(area.width) + 1;
        const top = new Float32Array(cols), bottom = new Float32Array(cols).fill(area.height);
        if (!mask) return {top, bottom, hightop: 0, lowbottom: area.height};

        const start = new Uint16Array(mask.width), end = new Uint16Array(mask.width);
        const middle = Math.floor(mask.height / 2);
        const visible = (column, row) => mask.rgba[(row * mask.width + column) * 4 + 3] >= 128;
        for (let x = 0; x < mask.width; x += 1) {
            let first = middle, last = middle;
            while (first > 0 && visible(x, first - 1)) first -= 1;
            while (last + 1 < mask.height && visible(x, last + 1)) last += 1;
            start[x] = first;
            end[x] = last + 1;
        }

        const scale = area.height / mask.height;
        const origin = (area.width - mask.width * scale) / 2;
        let hightop = 0, lowbottom = area.height;
        for (let x = 0; x < cols; x += 1) {
            const shift = (x - origin) / scale;
            const source = (shift % mask.width + mask.width) % mask.width;
            const first = Math.floor(source), second = (first + 1) % mask.width;
            const fraction = source - first;
            top[x] = (start[first] + (start[second] - start[first]) * fraction) * scale;
            bottom[x] = (end[first] + (end[second] - end[first]) * fraction) * scale;
            hightop = Math.max(hightop, top[x]);
            lowbottom = Math.min(lowbottom, bottom[x]);
        }
        return {top, bottom, hightop, lowbottom};
    }

    function layout() {
        const prior = circle;
        area = page.getBoundingClientRect();
        const rim = box(ring);
        circle = {x: rim.x + rim.width / 2, y: rim.y + rim.height / 2,
            outer: rim.width / 2, inner: rim.width / 2 - parseFloat(getComputedStyle(ring).borderTopWidth)};
        terrain = mappedges();
        for (const body of bodies) {
            if (prior && !body.outside) {
                body.x += circle.x - prior.x;
                body.y += circle.y - prior.y;
            }
            const style = getComputedStyle(body.link);
            const width = parseFloat(style.width), height = parseFloat(style.height);
            if (width !== body.width || height !== body.height) {
                body.x += (body.width - width) / 2;
                body.y += (body.height - height) / 2;
                makebodymask(body, width, height);
            }
            body.x = clamp(body.x, -body.left, area.width - body.right);
            body.y = clamp(body.y, -body.top, area.height - body.bottom);
            paint(body);
        }
        dirty = true;
        wake();
    }

    function samplepointer(event) {
        const samples = grab.samples;
        samples.push({x: grab.body.x, y: grab.body.y, time: event.timeStamp});
        while (samples.length > 2 && event.timeStamp - samples[0].time > 85) samples.shift();
    }

    function drag(event) {
        if (grab?.pointer !== event.pointerId) return;
        const {body, clientx, clienty} = grab;
        if (!grab.moved) {
            if (Math.hypot(event.clientX - clientx, event.clientY - clienty) < 4) return;
            grab.moved = true;
        }
        refreshsolids();
        const elapsed = Math.max(.012, (event.timeStamp - grab.samples.at(-1).time) / 1000);
        movegrab(body, event.clientX - area.left - grab.offsetx - body.x,
            event.clientY - area.top - grab.offsety - body.y, elapsed);
        if (!rimcontact(body, true)) body.outside = true;
        if (!rimcontact(body, false)) body.outside = false;
        samplepointer(event);
        paint(body);
    }

    function drop(event) {
        if (grab?.pointer !== event.pointerId) return;
        const {body, moved, samples, offsetx, offsety} = grab;
        grab = null;
        if (moved) {
            body.skipclick = true;
            const outer = rimcontact(body, true), inner = rimcontact(body, false);
            body.outside = (outer?.depth || 0) < (inner?.depth || 0);
            for (let pass = 0; pass < 4; pass += 1) scenecollisions(body);
            if (event.type === "pointerup" && samples.length > 1) {
                const first = samples[0], last = samples[samples.length - 1];
                const elapsed = Math.max(.02, (last.time - first.time) / 1000);
                const momentum = clamp(1 - (event.timeStamp - last.time) / 85, 0, 1);
                body.vx = clamp((last.x - first.x) / elapsed, -950, 950) * momentum;
                body.vy = clamp((last.y - first.y) / elapsed, -950, 950) * momentum;
                const leverx = offsetx - body.width / 2, levery = offsety - body.height / 2;
                body.spin = clamp((leverx * body.vy - levery * body.vx) / (body.radius ** 2) * .44, -20, 20);
            }
            paint(body);
        }
        wake();
    }

    function attach(body) {
        body.link.addEventListener("pointerdown", event => {
            if (event.button !== 0 || grab) return;
            body.skipclick = false;
            body.vx = body.vy = body.spin = 0;
            grab = {body, pointer: event.pointerId, clientx: event.clientX, clienty: event.clientY,
                offsetx: event.clientX - area.left - body.x, offsety: event.clientY - area.top - body.y,
                moved: false, samples: []};
            samplepointer(event);
            body.link.setPointerCapture(event.pointerId);
            wake();
        });
        body.link.addEventListener("click", event => {
            if (event.detail && body.skipclick) event.preventDefault();
            body.skipclick = false;
        });
    }

    Promise.allSettled([maskimage.decode(), ...links.map(link => link.querySelector("img").decode())]).then(() => {
        layout();
        bodies = links.map((link, index) => {
            const bounds = box(link);
            const mask = imagepixels(link.querySelector("img")) || {width: 1, height: 1, rgba: [0, 0, 0, 255]};
            const body = {...bounds, link, mask, vx: 0, vy: 0, spin: index % 2 ? -.65 : .65,
                outside: false, angle: 0};
            makebodymask(body, bounds.width, bounds.height);
            attach(body);
            paint(body);
            return body;
        });
        nav.classList.add("islive");
        nav.addEventListener("dragstart", event => event.preventDefault());
        window.addEventListener("pointermove", drag);
        window.addEventListener("pointerup", drop);
        window.addEventListener("pointercancel", drop);
        nav.addEventListener("lostpointercapture", drop);
        window.addEventListener("resize", layout);
        const invalidate = () => {dirty = true; wake();};
        const mutations = new MutationObserver(invalidate);
        const sizes = new ResizeObserver(invalidate);
        for (const group of [...textgroups, support]) {
            mutations.observe(group, {childList: true, subtree: true, characterData: true});
            sizes.observe(group);
        }
        page.addEventListener("load", invalidate, true);
        page.addEventListener("click", invalidate);
        badges.addEventListener("scroll", invalidate, {passive: true});
        document.fonts.ready.then(invalidate);
    });
})();
