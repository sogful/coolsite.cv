function creategpupreview(fallback) {
  const canvas = document.createElement("canvas");
  const vertices = new Float32Array(16);
  let gl = null;
  let program = null;
  let buffer = null;
  let backgroundtexture = null;
  let tint = null;
  let textures = [];
  let filters = [];
  let sourceimages = null;
  let lost = false;

  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    lost = true;
    sourceimages = null;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    lost = false;
    sourceimages = null;
    window.dispatchEvent(new Event("nativepreviewrestored"));
  });

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error("Sprite shader initialization failed.");
    }
    return result;
  }

  function texture(image, filter) {
    const result = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, result);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (image) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return result;
  }

  function initialize(images) {
    if (lost) return false;
    if (sourceimages === images) return true;
    try {
      gl = canvas.getContext("webgl", {alpha: true, antialias: false, premultipliedAlpha: true});
      if (!gl || gl.isContextLost()) return false;
      for (const item of textures) gl.deleteTexture(item);
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      if (backgroundtexture) gl.deleteTexture(backgroundtexture);
      program = gl.createProgram();
      const vertex = shader(gl.VERTEX_SHADER, `
        attribute vec2 pos;
        attribute vec2 uv;
        varying highp vec2 texcoord;
        void main() {
          gl_Position = vec4(pos, 0.0, 1.0);
          texcoord = uv;
        }
      `);
      const fragment = shader(gl.FRAGMENT_SHADER, `
        precision highp float;
        uniform sampler2D image;
        uniform vec4 tint;
        varying highp vec2 texcoord;
        void main() {
          vec4 pixel = texture2D(image, texcoord);
          pixel.rgb *= tint.rgb * tint.a;
          pixel.a *= tint.a;
          gl_FragColor = pixel;
        }
      `);
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const position = gl.getAttribLocation(program, "pos");
      const coordinate = gl.getAttribLocation(program, "uv");
      gl.enableVertexAttribArray(position);
      gl.enableVertexAttribArray(coordinate);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(coordinate, 2, gl.FLOAT, false, 16, 8);
      tint = gl.getUniformLocation(program, "tint");
      gl.uniform1i(gl.getUniformLocation(program, "image"), 0);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      textures = images.map(image => texture(image, gl.LINEAR));
      filters = images.map(() => gl.LINEAR);
      backgroundtexture = texture(null, gl.NEAREST);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      sourceimages = images;
      return true;
    } catch {
      sourceimages = null;
      return false;
    }
  }

  /*//////////////////////////////////////////////////////////////////////*/

  function renderpreview(context, plan, scalex, scaley, images, dimensions) {
    if (!initialize(images)) {
      fallback.renderobjects(context, plan, scalex, scaley, images, dimensions);
      return false;
    }
    const width = context.canvas.width;
    const height = context.canvas.height;
    const transform = context.getTransform();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundtexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, context.canvas);
    gl.uniform4f(tint, 1, 1, 1, 1);
    gl.blendFunc(gl.ONE, gl.ZERO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]), gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const draws = plan.flatMap((candidate, index) => (candidate.asset.mesh || []).map((sprite, meshindex) => ({
      candidate, sprite, index,
      layer: candidate.zlayer ?? (candidate.role === "underlay" ? 3 : 5),
      order: candidate.asset.meshorder?.[meshindex]?.order ?? meshindex,
    })));
    draws.sort((left, right) => left.layer - right.layer || (left.sprite.batch || 0) - (right.sprite.batch || 0)
      || left.index - right.index || left.order - right.order);
    for (const {candidate, sprite} of draws) {
      preparecanvascandidate(candidate);
      const page = sprite.page;
      const filter = sprite.sampler === "nearest" ? gl.NEAREST : gl.LINEAR;
      gl.bindTexture(gl.TEXTURE_2D, textures[page]);
      if (filters[page] !== filter) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        filters[page] = filter;
      }
      gl.blendFunc(sprite.blendSource ?? gl.ONE, sprite.blendDestination ?? gl.ONE_MINUS_SRC_ALPHA);
      const color = sprite.role === "fixed" ? sprite.fixedColor || [255, 255, 255]
        : sprite.role === "detail" && Array.isArray(candidate.detailRGB) ? candidate.detailRGB
          : sprite.role !== "detail" && Array.isArray(candidate.baseRGB) ? candidate.baseRGB
            : [candidate.red, candidate.green, candidate.blue];
      gl.uniform4f(tint, color[0] / 255, color[1] / 255, color[2] / 255, sprite.opacity);
      for (const [index, sourceindex] of [0, 1, 3, 2].entries()) {
        const [x, y] = sprite.vertices[sourceindex];
        const localx = (x - candidate.asset.centrex) * candidate.width / candidate.asset.naturalwidth;
        const localy = -(y - candidate.asset.centrey) * candidate.height / candidate.asset.naturalheight;
        const screenx = (candidate.x + candidate.matrix00 * localx + candidate.matrix01 * localy) * scalex;
        const screeny = (candidate.y + candidate.matrix10 * localx + candidate.matrix11 * localy) * scaley;
        const pixelx = transform.a * screenx + transform.c * screeny + transform.e;
        const pixely = transform.b * screenx + transform.d * screeny + transform.f;
        vertices[index * 4] = pixelx * 2 / width - 1;
        vertices[index * 4 + 1] = 1 - pixely * 2 / height;
        vertices[index * 4 + 2] = sprite.uv[sourceindex][0];
        vertices[index * 4 + 3] = sprite.uv[sourceindex][1];
      }
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalCompositeOperation = "copy";
    context.globalAlpha = 1;
    context.drawImage(canvas, 0, 0);
    context.restore();
    return true;
  }

  return {...fallback, renderpreview};
}

window.nativepreview = creategpupreview(window.nativepreview);
