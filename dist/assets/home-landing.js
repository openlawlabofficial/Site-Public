const canvas = document.querySelector('[data-landing-canvas]');

if (!canvas) {
  // Not on home page.
} else {
  const heroSection = canvas.closest('.landing-hero');
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  });

  if (!gl) {
    heroSection?.classList.add('landing-hero-ready');
  } else {
    const vertexSource = `#version 300 es
      precision highp float;
      layout (location = 0) in vec2 aPosition;
      out vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentSource = `#version 300 es
      precision highp float;
      in vec2 vUv;
      out vec4 outColor;

      uniform vec2 uResolution;
      uniform float uTime;

      #define PI 3.14159265359

      float hash(float p) {
        return fract(sin(p * 127.1) * 43758.5453123);
      }

      vec2 hash2(float p) {
        return vec2(hash(p), hash(p + 17.13));
      }

      float glow(vec2 p, vec2 center, float size, float power) {
        float d = length(p - center);
        return pow(max(0.0, 1.0 - d / size), power);
      }

      vec3 palette(float t) {
        vec3 a = vec3(0.11, 0.08, 0.06);
        vec3 b = vec3(0.60, 0.30, 0.10);
        vec3 c = vec3(0.25, 0.16, 0.08);
        vec3 d = vec3(0.42, 0.33, 0.20);
        return a + b * cos(6.28318 * (c * t + d));
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = (uv * 2.0 - 1.0);
        p.x *= uResolution.x / max(uResolution.y, 1.0);

        vec3 color = mix(vec3(0.08, 0.05, 0.03), vec3(0.05, 0.04, 0.04), uv.y);

        for (int i = 0; i < 4; i += 1) {
          float fi = float(i);
          vec2 c = vec2(
            0.25 * sin(uTime * (0.09 + fi * 0.03) + fi * 1.7),
            0.20 * cos(uTime * (0.08 + fi * 0.025) + fi * 2.1)
          );
          float intensity = glow(p, c, 1.2 - fi * 0.15, 2.1);
          color += vec3(0.24 + fi * 0.06, 0.12 + fi * 0.03, 0.07) * intensity * 0.20;
        }

        for (int i = 0; i < 28; i += 1) {
          float fi = float(i);
          vec2 seed = hash2(fi * 13.7);
          vec2 seed2 = hash2(fi * 31.9);

          float travel = fract(uTime * (0.04 + seed.x * 0.03) + seed.y);
          vec2 head = vec2(
            -0.75 + travel * (1.75 + seed2.x * 0.4) + sin(uTime * 0.2 + fi) * 0.04,
            0.9 - travel * 1.8 + cos(uTime * 0.18 + fi * 0.7) * 0.05
          );

          vec2 dir = normalize(vec2(-0.65 - seed.x * 0.35, 0.45 + seed.y * 0.28));
          float trail = 0.16 + seed2.y * 0.24;
          vec2 rel = p - head;
          float along = clamp(dot(rel, -dir), 0.0, trail);
          vec2 nearest = head - dir * along;
          float dist = length(p - nearest);

          float tail = smoothstep(0.08, 0.0, dist) * smoothstep(trail, 0.0, along);
          float headGlow = smoothstep(0.06, 0.0, length(rel));

          vec3 cometColor = mix(vec3(1.0, 0.74, 0.42), vec3(0.95, 0.52, 0.28), seed.x);
          color += cometColor * (tail * 0.45 + headGlow * 0.70);
        }

        float dust = hash(dot(floor(uv * uResolution * 0.13), vec2(17.0, 59.0)) + floor(uTime * 12.0));
        color += vec3(dust * 0.03);

        color = pow(color, vec3(0.9));
        outColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compile failed: ${log}`);
      }
      return shader;
    };

    let program;
    let animationFrame;
    let started = false;
    let resizeQueued = false;
    const state = { startTime: 0 };

    const resize = () => {
      const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
      const nextWidth = Math.max(Math.floor((window.innerWidth || document.documentElement.clientWidth || 1) * ratio), 1);
      const nextHeight = Math.max(Math.floor((window.innerHeight || document.documentElement.clientHeight || 1) * ratio), 1);

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }

      canvas.style.width = `${Math.max(Math.round(nextWidth / ratio), 1)}px`;
      canvas.style.height = `${Math.max(Math.round(nextHeight / ratio), 1)}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const queueResize = () => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        resize();
      });
    };

    const render = (timestamp) => {
      if (!started) return;
      if (!state.startTime) state.startTime = timestamp;
      const elapsed = (timestamp - state.startTime) * 0.001;

      const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
      const timeLocation = gl.getUniformLocation(program, 'uTime');

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrame = requestAnimationFrame(render);
    };

    const prewarm = () => {
      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
      if (!vertexShader || !fragmentShader) return false;

      program = gl.createProgram();
      if (!program) return false;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
      }

      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
      ]), gl.STATIC_DRAW);

      gl.useProgram(program);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      resize();
      gl.clearColor(0.05, 0.04, 0.04, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return true;
    };

    const start = () => {
      if (started) return;
      try {
        if (!prewarm()) return;
      } catch {
        heroSection?.classList.add('landing-hero-ready');
        return;
      }

      started = true;
      heroSection?.classList.add('landing-hero-ready');
      window.addEventListener('resize', queueResize, { passive: true });
      window.visualViewport?.addEventListener('resize', queueResize, { passive: true });
      animationFrame = requestAnimationFrame(render);
    };

    if (document.readyState === 'complete') {
      start();
    } else {
      window.addEventListener('load', start, { once: true });
    }

    window.addEventListener('beforeunload', () => {
      started = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', queueResize);
      window.visualViewport?.removeEventListener('resize', queueResize);
      window.removeEventListener('load', start);
      if (program) gl.deleteProgram(program);
    }, { once: true });
  }
}
