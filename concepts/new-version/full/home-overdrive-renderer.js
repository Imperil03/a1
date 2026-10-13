(() => {
  'use strict';

  // The native player remains visible and owns playback throughout this effect.
  const VERSION = '20261013-pixels-01';
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  const smooth = (from, to, value) => {
    const p = clamp((value - from) / (to - from));
    return p * p * (3 - 2 * p);
  };
  const mq = query => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const restricted = () => mq('(prefers-reduced-motion: reduce)') || Boolean(navigator.connection?.saveData);

  const vertexShader = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * .5 + .5;
      gl_Position = vec4(aPosition, 0., 1.);
    }
  `;
  const fragmentShader = `
    precision mediump float;
    uniform sampler2D uImage;
    uniform vec2 uGrid;
    uniform float uProgress;
    varying vec2 vUv;
    void main() {
      vec2 cell = floor(min(vUv, vec2(.99999)) * uGrid);
      // The diagonal starts at the logo's lower-left pixel steps.
      float order = .57 * cell.x / max(1., uGrid.x - 1.)
                  + .43 * cell.y / max(1., uGrid.y - 1.);
      float phase = clamp(uProgress * 1.55 - order * .55, 0., 1.);
      float tier = floor(phase * 5.99);
      float subdivision = exp2(tier);
      vec2 grid = uGrid * subdivision;
      vec2 pixelUv = (floor(vUv * grid) + .5) / grid;
      vec4 pixel = texture2D(uImage, pixelUv);
      vec4 exact = texture2D(uImage, vUv);
      // Distinct pixel levels lock in, then the last level resolves to full detail.
      vec4 color = mix(pixel, exact, smoothstep(.86, 1., phase));
      color.a *= 1. - smoothstep(.88, 1., uProgress);
      gl_FragColor = color;
    }
  `;

  function create(player, video, options = {}) {
    let job = null;
    let destroyed = false;
    let report = {
      version: VERSION, mode: 'none', state: 'idle', reason: null,
      frames: 0, fps: null, recentFrameMs: null, longFrames: 0, reducedQuality: false,
      durationMs: 0, activeRAF: false, canvasAlive: false, contextAlive: false,
      resolution: null, source: null
    };

    const diagnostics = () => ({ ...report, resolution: report.resolution && [...report.resolution] });
    const notify = () => {
      if (player?.dataset) player.dataset.overdriveRenderer = report.state;
      if (typeof options.onStateChange === 'function') {
        try { options.onStateChange(diagnostics()); } catch (_) { /* Consumer callbacks do not own cleanup. */ }
      }
    };

    function release(run) {
      if (!run) return;
      if (run.raf) cancelAnimationFrame(run.raf);
      run.raf = 0;
      if (run.stopSource) run.stopSource();
      run.stopSource = null;
      if (run.canvas && run.onContextLost) {
        run.canvas.removeEventListener('webglcontextlost', run.onContextLost);
      }
      const gl = run.gl;
      if (gl) {
        try {
          if (!gl.isContextLost()) {
            if (run.texture) gl.deleteTexture(run.texture);
            if (run.buffer) gl.deleteBuffer(run.buffer);
            if (run.program) gl.deleteProgram(run.program);
            for (const shader of run.shaders || []) gl.deleteShader(shader);
            // This is a disposable plane: return the GPU context immediately.
            gl.getExtension('WEBGL_lose_context')?.loseContext();
          }
        } catch (_) { /* A lost context has already released its resources. */ }
      }
      if (run.canvas) {
        run.canvas.remove();
        run.canvas.width = run.canvas.height = 1;
      }
      for (const canvas of [run.scratch, ...(run.tiers || [])]) {
        if (canvas) canvas.width = canvas.height = 1;
      }
      run.canvas = run.scratch = run.gl = run.context = run.source = null;
      run.tiers = null;
      run.scratchContext = run.texture = run.buffer = run.program = null;
      run.shaders = null;
    }

    function finish(run, completed, reason) {
      if (job !== run) return;
      job = null;
      report.state = completed ? 'complete' : (reason === 'error' || reason === 'context-lost' ? 'error' : 'cancelled');
      report.reason = reason;
      report.durationMs = run.started ? Math.round(performance.now() - run.started) : 0;
      release(run);
      report.activeRAF = report.canvasAlive = report.contextAlive = false;
      notify();
      run.resolve(completed);
    }

    const cancel = (reason = 'cancelled') => {
      if (job) finish(job, false, reason);
    };

    function posterFor(run) {
      if (!video.poster) return Promise.resolve(null);
      let url;
      try { url = new URL(video.poster, document.baseURI); } catch (_) { return Promise.resolve(null); }
      // The supplied local poster is sufficient; no cross-origin media requests.
      if (url.origin !== window.location.origin) return Promise.resolve(null);
      return new Promise(resolve => {
        const image = new Image();
        image.decoding = 'async';
        let settled = false;
        let timer = 0;
        const settle = result => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          image.onload = image.onerror = null;
          if (run.stopSource === stop) run.stopSource = null;
          resolve(result);
        };
        const stop = () => settle(null);
        run.stopSource = stop;
        image.onload = () => settle(image.naturalWidth > 0 ? image : null);
        image.onerror = () => settle(null);
        timer = setTimeout(stop, 1400);
        image.src = url.href;
        if (image.complete && image.naturalWidth > 0) settle(image);
      });
    }

    function makeCanvas(width, height) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }

    function fitSize(rect, compact) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const scale = Math.min(dpr, (compact ? 640 : 960) / rect.width, (compact ? 360 : 540) / rect.height);
      return [Math.max(1, Math.round(rect.width * scale)), Math.max(1, Math.round(rect.height * scale))];
    }

    function paintSource(run, source) {
      const context = run.scratchContext;
      const { width, height } = run.scratch;
      const sw = source.videoWidth || source.naturalWidth;
      const sh = source.videoHeight || source.naturalHeight;
      if (!sw || !sh) throw new Error('Source has no image');
      context.clearRect(0, 0, width, height);
      const fit = run.objectFit;
      if (fit === 'fill') context.drawImage(source, 0, 0, width, height);
      else {
        const scale = fit === 'contain' ? Math.min(width / sw, height / sh) : Math.max(width / sw, height / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        context.drawImage(source, (width - dw) * run.position[0], (height - dh) * run.position[1], dw, dh);
      }
    }

    function compile(run, type, source) {
      const gl = run.gl;
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader allocation failed');
      run.shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compilation failed');
      return shader;
    }

    function prepareGL(run) {
      const gl = run.gl;
      run.shaders = [];
      run.program = gl.createProgram();
      if (!run.program) throw new Error('Program allocation failed');
      gl.attachShader(run.program, compile(run, gl.VERTEX_SHADER, vertexShader));
      gl.attachShader(run.program, compile(run, gl.FRAGMENT_SHADER, fragmentShader));
      gl.linkProgram(run.program);
      if (!gl.getProgramParameter(run.program, gl.LINK_STATUS)) throw new Error('Shader link failed');
      gl.useProgram(run.program);
      run.buffer = gl.createBuffer();
      run.texture = gl.createTexture();
      if (!run.buffer || !run.texture) throw new Error('GPU allocation failed');
      gl.bindBuffer(gl.ARRAY_BUFFER, run.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(run.program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, run.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      run.progressUniform = gl.getUniformLocation(run.program, 'uProgress');
      gl.uniform1i(gl.getUniformLocation(run.program, 'uImage'), 0);
      gl.uniform2f(gl.getUniformLocation(run.program, 'uGrid'), run.columns, run.rows);
      gl.viewport(0, 0, run.canvas.width, run.canvas.height);
      run.onContextLost = event => {
        event.preventDefault();
        finish(run, false, 'context-lost');
      };
      run.canvas.addEventListener('webglcontextlost', run.onContextLost);
    }

    function upload(run, timestamp) {
      const live = !run.reduced && video.readyState >= 2 && video.videoWidth > 0;
      if (run.uploaded && (!live || timestamp - run.lastUpload < 30)) return;
      paintSource(run, live ? video : run.source);
      const gl = run.gl;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, run.scratch);
      if (!run.uploaded && gl.getError() !== gl.NO_ERROR) throw new Error('Texture upload failed');
      run.uploaded = true;
      run.lastUpload = timestamp;
      report.source = live ? 'video' : (run.source === video ? 'video-still' : 'poster');
    }

    function prepare2D(run) {
      paintSource(run, run.source);
      for (const canvas of run.tiers || []) canvas.width = canvas.height = 1;
      run.tiers = [];
      for (let tier = 0; tier < 6; tier += 1) {
        const canvas = tier === 5 ? makeCanvas(run.scratch.width, run.scratch.height)
          : makeCanvas(run.columns * 2 ** tier, run.rows * 2 ** tier);
        run.tiers.push(canvas);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Fallback allocation failed');
        context.drawImage(run.scratch, 0, 0, canvas.width, canvas.height);
      }
      run.context.imageSmoothingEnabled = false;
    }

    function draw2D(run, progress) {
      const context = run.context;
      const { width, height } = run.canvas;
      context.clearRect(0, 0, width, height);
      context.globalAlpha = 1 - smooth(.82, 1, progress);
      for (let y = 0; y < run.rows; y += 1) {
        for (let x = 0; x < run.columns; x += 1) {
          const order = .57 * x / (run.columns - 1) + .43 * (1 - y / (run.rows - 1));
          const phase = clamp(progress * 1.55 - order * .55);
          const source = run.tiers[Math.min(5, Math.floor(phase * 5.99))];
          const dx = Math.round(x * width / run.columns);
          const dy = Math.round(y * height / run.rows);
          const dw = Math.round((x + 1) * width / run.columns) - dx;
          const dh = Math.round((y + 1) * height / run.rows) - dy;
          context.drawImage(source, x * source.width / run.columns, y * source.height / run.rows,
            source.width / run.columns, source.height / run.rows, dx, dy, dw, dh);
        }
      }
    }

    function frame(run, timestamp) {
      if (job !== run || destroyed) return;
      run.raf = 0;
      report.activeRAF = false;
      if (document.hidden || restricted() || !player.isConnected) {
        finish(run, false, document.hidden ? 'hidden' : 'restricted');
        return;
      }
      const progress = clamp((timestamp - run.started) / run.duration);
      if (run.previous) {
        const interval = timestamp - run.previous;
        if (interval > 0) {
          run.intervalCount += 1;
          run.intervalElapsed += interval;
          if (interval >= 50) report.longFrames += 1;
          run.intervals.push(interval);
          if (run.intervals.length > 18) run.intervals.shift();
          const mean = run.intervals.reduce((sum, value) => sum + value, 0) / run.intervals.length;
          report.recentFrameMs = Math.round(mean * 10) / 10;
          // Aggregate the active frame intervals; long stalls are part of real FPS.
          report.fps = Math.round(run.intervalCount * 10000 / run.intervalElapsed) / 10;
          const slow = (run.intervals.length >= 12 && mean > 20) || interval >= 200;
          if (!run.reduced && timestamp - run.started > 280 && slow) {
            run.reduced = report.reducedQuality = true;
            if (run.gl) {
              const [width, height] = fitSize(run.rect, true);
              run.canvas.width = run.scratch.width = width;
              run.canvas.height = run.scratch.height = height;
              run.gl.viewport(0, 0, width, height);
              run.uploaded = false;
              report.resolution = [width, height];
            } else {
              // Fewer constructed tiles keep the same wave on a slower device.
              run.columns = 8;
              run.rows = Math.max(2, Math.min(20, Math.round(8 * run.canvas.height / run.canvas.width)));
              try { prepare2D(run); } catch (_) {
                finish(run, false, 'error');
                return;
              }
            }
          }
        }
      }
      run.previous = timestamp;
      try {
        if (run.gl) {
          if (run.gl.isContextLost()) throw new Error('Context lost');
          upload(run, timestamp);
          run.gl.uniform1f(run.progressUniform, progress);
          run.gl.drawArrays(run.gl.TRIANGLE_STRIP, 0, 4);
        } else draw2D(run, progress);
      } catch (_) {
        finish(run, false, 'error');
        return;
      }
      report.frames += 1;
      if (progress >= 1) finish(run, true, 'finished');
      else {
        run.raf = requestAnimationFrame(next => frame(run, next));
        report.activeRAF = true;
      }
    }

    async function begin(run) {
      try {
        if (job !== run || destroyed) return;
        const desktop = window.innerWidth >= 760 && mq('(hover: hover) and (pointer: fine)');
        // Touch takes a static poster path, with no recurring video-frame copies.
        run.source = desktop && video.readyState >= 2 && video.videoWidth > 0 ? video : await posterFor(run);
        if (job !== run || destroyed) return;
        if (!run.source && video.readyState >= 2 && video.videoWidth > 0) run.source = video;
        if (!run.source || document.hidden || restricted()) {
          finish(run, false, 'unavailable');
          return;
        }
        run.rect = video.getBoundingClientRect();
        if (run.rect.width < 1 || run.rect.height < 1) {
          finish(run, false, 'unavailable');
          return;
        }
        const [width, height] = fitSize(run.rect, !desktop);
        run.canvas = makeCanvas(width, height);
        run.canvas.className = 'overdrive-canvas';
        run.canvas.setAttribute('aria-hidden', 'true');
        run.canvas.setAttribute('role', 'presentation');
        run.scratch = makeCanvas(width, height);
        run.scratchContext = run.scratch.getContext('2d', { alpha: true });
        if (!run.scratchContext) throw new Error('Source canvas allocation failed');
        const style = getComputedStyle(video);
        run.objectFit = style.objectFit === 'contain' || style.objectFit === 'fill' ? style.objectFit : 'cover';
        run.position = style.objectPosition.split(' ').slice(0, 2).map(value => value.endsWith('%') ? clamp(parseFloat(value) / 100) : .5);
        while (run.position.length < 2) run.position.push(.5);
        run.columns = desktop ? 18 : 12;
        run.rows = Math.max(2, Math.min(20, Math.round(run.columns * height / width)));
        run.gl = desktop ? run.canvas.getContext('webgl', {
          alpha: true, antialias: false, depth: false, stencil: false,
          premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power'
        }) : null;
        if (run.gl) prepareGL(run);
        else {
          if (run.source === video) {
            const poster = await posterFor(run);
            if (job !== run || destroyed) return;
            if (poster) run.source = poster;
          }
          const compact = fitSize(run.rect, true);
          run.canvas.width = run.scratch.width = compact[0];
          run.canvas.height = run.scratch.height = compact[1];
          run.columns = 12;
          run.rows = Math.max(2, Math.min(20, Math.round(12 * compact[1] / compact[0])));
          run.context = run.canvas.getContext('2d', { alpha: true });
          if (!run.context) throw new Error('No rendering context');
          prepare2D(run);
        }
        report.mode = run.gl ? 'webgl' : 'canvas2d';
        report.source = run.source === video ? 'video' : 'poster';
        report.resolution = [run.canvas.width, run.canvas.height];
        run.duration = run.gl ? 1740 : 820;
        run.started = performance.now();
        // Paint before insertion: unsupported/security errors never show a blank plane.
        if (run.gl) {
          upload(run, run.started);
          run.gl.uniform1f(run.progressUniform, 0);
          run.gl.drawArrays(run.gl.TRIANGLE_STRIP, 0, 4);
        } else draw2D(run, 0);
        player.append(run.canvas);
        report.state = 'running';
        report.canvasAlive = report.contextAlive = true;
        run.raf = requestAnimationFrame(timestamp => frame(run, timestamp));
        report.activeRAF = true;
        notify();
      } catch (_) { finish(run, false, 'error'); }
    }

    function play() {
      if (destroyed || !player?.isConnected || !video || document.hidden || restricted()) return Promise.resolve(false);
      cancel('replay');
      report = { ...report, mode: 'none', state: 'preparing', reason: null, frames: 0,
        fps: null, recentFrameMs: null, longFrames: 0, durationMs: 0, reducedQuality: false,
        activeRAF: false, canvasAlive: false, contextAlive: false, resolution: null, source: null };
      return new Promise(resolve => {
        const run = { resolve, raf: 0, previous: 0, intervals: [], intervalCount: 0, intervalElapsed: 0, reduced: false };
        job = run;
        notify();
        begin(run);
      });
    }

    function destroy() {
      cancel('destroyed');
      destroyed = true;
      report.state = 'destroyed';
      report.reason = 'destroyed';
      if (player?.dataset) delete player.dataset.overdriveRenderer;
      if (typeof options.onStateChange === 'function') {
        try { options.onStateChange(diagnostics()); } catch (_) { /* Cleanup is complete. */ }
      }
    }

    return Object.freeze({ play, cancel, destroy, diagnostics });
  }

  window.A1OverdriveRenderer = Object.freeze({ create, version: VERSION });
})();
