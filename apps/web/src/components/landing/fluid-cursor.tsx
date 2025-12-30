'use client';

import { cn } from '@lmring/ui';
import { useEffect, useRef } from 'react';

type RGB = { r: number; g: number; b: number };

type FluidCursorProps = {
  className?: string;
  simResolution?: number;
  dyeResolution?: number;
  densityDissipation?: number;
  velocityDissipation?: number;
  pressure?: number;
  pressureIterations?: number;
  curl?: number;
  splatRadius?: number;
  splatForce?: number;
  colorUpdateSpeed?: number;
  colorIntensity?: number;
  ambientSparks?: boolean;
  ambientSparksRate?: number;
  transparent?: boolean;
};

// Lightweight WebGL fluid overlay inspired by the common "webgl-fluid-simulation" pipeline.
export function FluidCursor({
  className,
  simResolution = 128,
  dyeResolution = 1440,
  densityDissipation = 3.5,
  velocityDissipation = 2,
  pressure = 0.1,
  pressureIterations = 20,
  curl = 3,
  splatRadius = 0.2,
  splatForce = 6000,
  colorUpdateSpeed = 10,
  colorIntensity = 0.55,
  ambientSparks = true,
  ambientSparksRate = 0.12,
  transparent = true,
}: FluidCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const contextParams: WebGLContextAttributes = {
      alpha: transparent,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    const gl2 = canvas.getContext('webgl2', contextParams) as WebGL2RenderingContext | null;
    const gl = gl2 ?? (canvas.getContext('webgl', contextParams) as WebGLRenderingContext | null);
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const isWebGL2 = gl instanceof WebGL2RenderingContext;

    const getExtension = (name: string) => gl.getExtension(name);

    const ext = {
      halfFloatTexType: 0 as number,
      supportLinearFiltering: false,
      formatRGBA: null as null | { internalFormat: number; format: number },
      formatRG: null as null | { internalFormat: number; format: number },
      formatR: null as null | { internalFormat: number; format: number },
    };

    if (isWebGL2) {
      getExtension('EXT_color_buffer_float');
      ext.supportLinearFiltering = Boolean(getExtension('OES_texture_float_linear'));
      // @ts-expect-error WebGL2 constant exists at runtime
      ext.halfFloatTexType = (gl as WebGL2RenderingContext).HALF_FLOAT;
      ext.formatRGBA = { internalFormat: (gl as WebGL2RenderingContext).RGBA16F, format: gl.RGBA };
      ext.formatRG = {
        internalFormat: (gl as WebGL2RenderingContext).RG16F,
        format: (gl as WebGL2RenderingContext).RG,
      };
      ext.formatR = {
        internalFormat: (gl as WebGL2RenderingContext).R16F,
        format: (gl as WebGL2RenderingContext).RED,
      };
    } else {
      const hf = getExtension('OES_texture_half_float') as { HALF_FLOAT_OES: number } | null;
      ext.halfFloatTexType = hf?.HALF_FLOAT_OES ?? 0;
      ext.supportLinearFiltering = Boolean(getExtension('OES_texture_half_float_linear'));
      ext.formatRGBA = { internalFormat: gl.RGBA, format: gl.RGBA };
      ext.formatRG = { internalFormat: gl.RGBA, format: gl.RGBA };
      ext.formatR = { internalFormat: gl.RGBA, format: gl.RGBA };
      getExtension('OES_texture_half_float');
      getExtension('OES_texture_half_float_linear');
      getExtension('OES_texture_float');
      getExtension('OES_texture_float_linear');
      getExtension('WEBGL_color_buffer_float');
      getExtension('EXT_color_buffer_half_float');
    }

    const state = {
      SIM_RESOLUTION: simResolution,
      DYE_RESOLUTION: dyeResolution,
      DENSITY_DISSIPATION: densityDissipation,
      VELOCITY_DISSIPATION: velocityDissipation,
      PRESSURE: pressure,
      PRESSURE_ITERATIONS: pressureIterations,
      CURL: curl,
      SPLAT_RADIUS: splatRadius,
      SPLAT_FORCE: splatForce,
      COLOR_UPDATE_SPEED: colorUpdateSpeed,
      TRANSPARENT: transparent,
    };

    // --- GL helpers
    const compile = (type: number, source: string) => {
      const s = gl.createShader(type);
      if (!s) throw new Error('Shader create failed');
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s) ?? 'Unknown shader compile error';
        gl.deleteShader(s);
        throw new Error(log);
      }
      return s;
    };

    const createProgram = (vertexSource: string, fragmentSource: string) => {
      const vs = compile(gl.VERTEX_SHADER, vertexSource);
      const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
      const p = gl.createProgram();
      if (!p) throw new Error('Program create failed');
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.bindAttribLocation(p, 0, 'aPosition');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(p) ?? 'Unknown program link error';
        gl.deleteProgram(p);
        throw new Error(log);
      }
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return p;
    };

    const getUniforms = (program: WebGLProgram) => {
      const uniforms: Record<string, WebGLUniformLocation> = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < count; i += 1) {
        const info = gl.getActiveUniform(program, i);
        if (!info) continue;
        const loc = gl.getUniformLocation(program, info.name);
        if (loc) uniforms[info.name] = loc;
      }
      return uniforms;
    };

    const quadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    const quadIBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

    const blit = (target: FBO | null, clear = false) => {
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      if (clear) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    type FBO = {
      texture: WebGLTexture;
      fbo: WebGLFramebuffer;
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      attach: (id: number) => number;
    };

    type DoubleFBO = {
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      read: FBO;
      write: FBO;
      swap: () => void;
    };

    const createTextureFBO = (
      width: number,
      height: number,
      internalFormat: number,
      format: number,
      type: number,
      filtering: number,
    ): FBO => {
      const tex = gl.createTexture();
      if (!tex) throw new Error('Texture create failed');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

      const fbo = gl.createFramebuffer();
      if (!fbo) throw new Error('Framebuffer create failed');
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const texelSizeX = 1 / width;
      const texelSizeY = 1 / height;

      return {
        texture: tex,
        fbo,
        width,
        height,
        texelSizeX,
        texelSizeY,
        attach(id: number) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          return id;
        },
      };
    };

    const createDoubleFBO = (
      width: number,
      height: number,
      internalFormat: number,
      format: number,
      type: number,
      filtering: number,
    ): DoubleFBO => {
      const fbo1 = createTextureFBO(width, height, internalFormat, format, type, filtering);
      const fbo2 = createTextureFBO(width, height, internalFormat, format, type, filtering);
      return {
        width,
        height,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        read: fbo1,
        write: fbo2,
        swap() {
          const temp = this.read;
          this.read = this.write;
          this.write = temp;
        },
      };
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width === w && canvas.height === h) return false;
      canvas.width = w;
      canvas.height = h;
      return true;
    };

    const scaleByPixelRatio = (input: number) => Math.floor(input * (window.devicePixelRatio || 1));

    const getResolution = (res: number) => {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const min = Math.round(res);
      const max = Math.round(res * (aspect < 1 ? 1 / aspect : aspect));
      return gl.drawingBufferWidth > gl.drawingBufferHeight
        ? { width: max, height: min }
        : { width: min, height: max };
    };

    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    if (!ext.formatRGBA || !ext.formatRG || !ext.formatR || !ext.halfFloatTexType) {
      console.error('WebGL formats not supported; FluidCursor disabled.');
      return;
    }

    let dye: DoubleFBO;
    let velocity: DoubleFBO;
    let divergence: FBO;
    let curlTex: FBO;
    let pressureTex: DoubleFBO;

    const initFramebuffers = () => {
      const sim = getResolution(state.SIM_RESOLUTION);
      const dyeRes = getResolution(state.DYE_RESOLUTION);

      velocity = createDoubleFBO(
        sim.width,
        sim.height,
        ext.formatRG.internalFormat,
        ext.formatRG.format,
        ext.halfFloatTexType,
        filtering,
      );

      dye = createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        ext.formatRGBA.internalFormat,
        ext.formatRGBA.format,
        ext.halfFloatTexType,
        filtering,
      );

      divergence = createTextureFBO(
        sim.width,
        sim.height,
        ext.formatR.internalFormat,
        ext.formatR.format,
        ext.halfFloatTexType,
        gl.NEAREST,
      );

      curlTex = createTextureFBO(
        sim.width,
        sim.height,
        ext.formatR.internalFormat,
        ext.formatR.format,
        ext.halfFloatTexType,
        gl.NEAREST,
      );

      pressureTex = createDoubleFBO(
        sim.width,
        sim.height,
        ext.formatR.internalFormat,
        ext.formatR.format,
        ext.halfFloatTexType,
        gl.NEAREST,
      );
    };

    // --- shaders
    const baseVertex = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;

      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const clearFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `;

    const displayFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        gl_FragColor = vec4(c, 1.0);
      }
    `;

    const splatFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec2 point;
      uniform vec3 color;
      uniform float radius;
      void main () {
        vec2 p = vUv - point;
        p.x *= aspectRatio;
        vec3 base = texture2D(uTarget, vUv).xyz;
        float r = exp(-dot(p, p) / radius);
        gl_FragColor = vec4(base + color * r, 1.0);
      }
    `;

    const advectionFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;
      void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
        gl_FragColor = dissipation * result;
      }
    `;

    const divergenceFrag = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;

    const curlFrag = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float c = R - L - T + B;
        gl_FragColor = vec4(c, 0.0, 0.0, 1.0);
      }
    `;

    const vorticityFrag = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main () {
        float L = abs(texture2D(uCurl, vL).x);
        float R = abs(texture2D(uCurl, vR).x);
        float T = abs(texture2D(uCurl, vT).x);
        float B = abs(texture2D(uCurl, vB).x);
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(R - L, T - B);
        force /= (length(force) + 0.0001);
        force *= curl * C;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `;

    const pressureFrag = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float D = texture2D(uDivergence, vUv).x;
        float P = (L + R + B + T - D) * 0.25;
        gl_FragColor = vec4(P, 0.0, 0.0, 1.0);
      }
    `;

    const gradientSubtractFrag = `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        vel -= vec2(R - L, T - B) * 0.5;
        gl_FragColor = vec4(vel, 0.0, 1.0);
      }
    `;

    const programs = (() => {
      const program = (vertex: string, fragment: string) => {
        const p = createProgram(vertex, fragment);
        return { program: p, uniforms: getUniforms(p) };
      };

      // base-vertex programs share texelSize varying
      return {
        clear: program(baseVertex, clearFrag),
        display: program(
          `
            precision highp float;
            attribute vec2 aPosition;
            varying vec2 vUv;
            void main () {
              vUv = aPosition * 0.5 + 0.5;
              gl_Position = vec4(aPosition, 0.0, 1.0);
            }
          `,
          displayFrag,
        ),
        splat: program(
          `
            precision highp float;
            attribute vec2 aPosition;
            varying vec2 vUv;
            void main () {
              vUv = aPosition * 0.5 + 0.5;
              gl_Position = vec4(aPosition, 0.0, 1.0);
            }
          `,
          splatFrag,
        ),
        advection: program(baseVertex, advectionFrag),
        divergence: program(baseVertex, divergenceFrag),
        curl: program(baseVertex, curlFrag),
        vorticity: program(baseVertex, vorticityFrag),
        pressure: program(baseVertex, pressureFrag),
        gradSubtract: program(baseVertex, gradientSubtractFrag),
      };
    })();

    const apply = (p: {
      program: WebGLProgram;
      uniforms: Record<string, WebGLUniformLocation>;
    }) => {
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API method name starts with "use".
      gl.useProgram(p.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIBO);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      return p.uniforms;
    };

    const splat = (x: number, y: number, dx: number, dy: number, color: RGB) => {
      // velocity
      let u = apply(programs.splat);
      gl.uniform1i(u.uTarget, velocity.read.attach(0));
      gl.uniform1f(u.aspectRatio, gl.drawingBufferWidth / gl.drawingBufferHeight);
      gl.uniform2f(u.point, x, y);
      gl.uniform3f(u.color, dx, dy, 0);
      gl.uniform1f(u.radius, clampRadius(state.SPLAT_RADIUS));
      blit(velocity.write);
      velocity.swap();

      // dye
      u = apply(programs.splat);
      gl.uniform1i(u.uTarget, dye.read.attach(0));
      gl.uniform1f(u.aspectRatio, gl.drawingBufferWidth / gl.drawingBufferHeight);
      gl.uniform2f(u.point, x, y);
      gl.uniform3f(u.color, color.r, color.g, color.b);
      gl.uniform1f(u.radius, clampRadius(state.SPLAT_RADIUS));
      blit(dye.write);
      dye.swap();
    };

    const clampRadius = (r: number) => {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      let v = r / 100;
      if (aspect > 1) v *= aspect;
      return v;
    };

    const hsvToRgb = (h: number, s: number, v: number): RGB => {
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0:
          return { r: v, g: t, b: p };
        case 1:
          return { r: q, g: v, b: p };
        case 2:
          return { r: p, g: v, b: t };
        case 3:
          return { r: p, g: q, b: v };
        case 4:
          return { r: t, g: p, b: v };
        default:
          return { r: v, g: p, b: q };
      }
    };

    const randomColor = (): RGB => {
      const hue = 0.58 + Math.random() * 0.16; // cyan -> violet
      const sat = 0.65 + Math.random() * 0.25;
      const val = 0.9 + Math.random() * 0.1;
      const c = hsvToRgb(hue, sat, val);

      // occasional bright "flash" for lightning feel
      const flash = Math.random() < 0.08 ? 1.6 : 1.0;

      return {
        r: c.r * colorIntensity * flash,
        g: c.g * colorIntensity * flash,
        b: c.b * colorIntensity * flash,
      };
    };

    const pointers = [
      {
        id: -1,
        down: false,
        moved: false,
        texcoordX: 0,
        texcoordY: 0,
        prevTexcoordX: 0,
        prevTexcoordY: 0,
        deltaX: 0,
        deltaY: 0,
        color: randomColor(),
      },
    ];

    let colorTimer = 0;

    const updatePointerDown = (
      pointer: (typeof pointers)[number],
      id: number,
      x: number,
      y: number,
    ) => {
      pointer.id = id;
      pointer.down = true;
      pointer.moved = false;
      pointer.texcoordX = x / gl.drawingBufferWidth;
      pointer.texcoordY = 1 - y / gl.drawingBufferHeight;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0;
      pointer.deltaY = 0;
      pointer.color = randomColor();
    };

    const correctDeltaX = (dx: number) => {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspect < 1) return dx * aspect;
      return dx;
    };

    const correctDeltaY = (dy: number) => {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspect > 1) return dy / aspect;
      return dy;
    };

    const updatePointerMove = (
      pointer: (typeof pointers)[number],
      x: number,
      y: number,
      color: RGB,
    ) => {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = x / gl.drawingBufferWidth;
      pointer.texcoordY = 1 - y / gl.drawingBufferHeight;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      pointer.color = color;
    };

    const updatePointerUp = (pointer: (typeof pointers)[number]) => {
      pointer.down = false;
    };

    const splatPointer = (p: (typeof pointers)[number]) => {
      splat(
        p.texcoordX,
        p.texcoordY,
        p.deltaX * state.SPLAT_FORCE,
        p.deltaY * state.SPLAT_FORCE,
        p.color,
      );
    };

    const pointerEvent = (e: MouseEvent) => {
      const dpr = window.devicePixelRatio || 1;
      const x = scaleByPixelRatio(e.clientX);
      const y = scaleByPixelRatio(e.clientY);
      return { x, y, dpr };
    };

    const onMouseDown = (e: MouseEvent) => {
      const p = pointers[0];
      const { x, y } = pointerEvent(e);
      updatePointerDown(p, -1, x, y);
      // initial splat
      splat(
        p.texcoordX,
        p.texcoordY,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 30,
        randomColor(),
      );
    };

    const onMouseMove = (e: MouseEvent) => {
      const p = pointers[0];
      const { x, y } = pointerEvent(e);
      updatePointerMove(p, x, y, p.color);
    };

    const onMouseUp = () => {
      updatePointerUp(pointers[0]);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.targetTouches[0];
      if (!t) return;
      const p = pointers[0];
      const x = scaleByPixelRatio(t.clientX);
      const y = scaleByPixelRatio(t.clientY);
      updatePointerDown(p, t.identifier, x, y);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.targetTouches[0];
      if (!t) return;
      const p = pointers[0];
      const x = scaleByPixelRatio(t.clientX);
      const y = scaleByPixelRatio(t.clientY);
      updatePointerMove(p, x, y, p.color);
    };

    const onTouchEnd = () => {
      updatePointerUp(pointers[0]);
    };

    let lastInteraction = performance.now();
    const markInteraction = () => {
      lastInteraction = performance.now();
    };

    const onMouseDownWrapped = (e: MouseEvent) => {
      markInteraction();
      onMouseDown(e);
    };

    const onMouseMoveWrapped = (e: MouseEvent) => {
      markInteraction();
      onMouseMove(e);
    };

    const onTouchStartWrapped = (e: TouchEvent) => {
      markInteraction();
      onTouchStart(e);
    };

    const onTouchMoveWrapped = (e: TouchEvent) => {
      markInteraction();
      onTouchMove(e);
    };

    window.addEventListener('mousedown', onMouseDownWrapped);
    window.addEventListener('mousemove', onMouseMoveWrapped);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStartWrapped, { passive: true });
    window.addEventListener('touchmove', onTouchMoveWrapped, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    resizeCanvas();
    gl.clearColor(0, 0, 0, 1);

    initFramebuffers();

    let raf = 0;
    let last = performance.now();

    const step = () => {
      raf = requestAnimationFrame(step);

      const now = performance.now();
      const dt = Math.min(0.016666, (now - last) / 1000);
      last = now;

      const resized = resizeCanvas();
      if (resized) initFramebuffers();

      colorTimer += dt * state.COLOR_UPDATE_SPEED;
      if (colorTimer >= 1) {
        colorTimer = ((colorTimer % 1) + 1) % 1;
        pointers[0].color = randomColor();
      }

      // splats
      for (const p of pointers) {
        if (!p.moved) continue;
        p.moved = false;
        splatPointer(p);
      }

      // ambient sparks when idle (keeps "energy layer" visible)
      if (ambientSparks && performance.now() - lastInteraction > 900) {
        if (Math.random() < ambientSparksRate) {
          const x = Math.random();
          const y = Math.random();
          const fx = (Math.random() - 0.5) * state.SPLAT_FORCE * 0.06;
          const fy = (Math.random() - 0.5) * state.SPLAT_FORCE * 0.06;
          splat(x, y, fx, fy, randomColor());
        }
      }

      // curl
      let u = apply(programs.curl);
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      blit(curlTex);

      // vorticity
      u = apply(programs.vorticity);
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      gl.uniform1i(u.uCurl, curlTex.attach(1));
      gl.uniform1f(u.curl, state.CURL);
      gl.uniform1f(u.dt, dt);
      blit(velocity.write);
      velocity.swap();

      // divergence
      u = apply(programs.divergence);
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      blit(divergence);

      // clear pressure
      u = apply(programs.clear);
      gl.uniform1i(u.uTexture, pressureTex.read.attach(0));
      gl.uniform1f(u.value, state.PRESSURE);
      blit(pressureTex.write);
      pressureTex.swap();

      // pressure solve
      u = apply(programs.pressure);
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uDivergence, divergence.attach(0));
      for (let i = 0; i < state.PRESSURE_ITERATIONS; i += 1) {
        gl.uniform1i(u.uPressure, pressureTex.read.attach(1));
        blit(pressureTex.write);
        pressureTex.swap();
      }

      // gradient subtract
      u = apply(programs.gradSubtract);
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uPressure, pressureTex.read.attach(0));
      gl.uniform1i(u.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      // advect velocity
      u = apply(programs.advection);
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      gl.uniform1i(u.uSource, velocity.read.attach(0));
      gl.uniform1f(u.dt, dt);
      gl.uniform1f(u.dissipation, 1 - dt * state.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      // advect dye
      u = apply(programs.advection);
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      gl.uniform1i(u.uSource, dye.read.attach(1));
      gl.uniform1f(u.dt, dt);
      gl.uniform1f(u.dissipation, 1 - dt * state.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();

      // display
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      u = apply(programs.display);
      gl.uniform1i(u.uTexture, dye.read.attach(0));
      blit(null, false);
      gl.disable(gl.BLEND);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener('mousedown', onMouseDownWrapped);
      window.removeEventListener('mousemove', onMouseMoveWrapped);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStartWrapped);
      window.removeEventListener('touchmove', onTouchMoveWrapped);
      window.removeEventListener('touchend', onTouchEnd);

      for (const p of Object.values(programs)) gl.deleteProgram(p.program);
      gl.deleteBuffer(quadVBO);
      gl.deleteBuffer(quadIBO);
      gl.deleteFramebuffer(divergence.fbo);
      gl.deleteTexture(divergence.texture);
      gl.deleteFramebuffer(curlTex.fbo);
      gl.deleteTexture(curlTex.texture);
      gl.deleteFramebuffer(velocity.read.fbo);
      gl.deleteTexture(velocity.read.texture);
      gl.deleteFramebuffer(velocity.write.fbo);
      gl.deleteTexture(velocity.write.texture);
      gl.deleteFramebuffer(dye.read.fbo);
      gl.deleteTexture(dye.read.texture);
      gl.deleteFramebuffer(dye.write.fbo);
      gl.deleteTexture(dye.write.texture);
      gl.deleteFramebuffer(pressureTex.read.fbo);
      gl.deleteTexture(pressureTex.read.texture);
      gl.deleteFramebuffer(pressureTex.write.fbo);
      gl.deleteTexture(pressureTex.write.texture);
    };
  }, [
    ambientSparks,
    ambientSparksRate,
    colorIntensity,
    colorUpdateSpeed,
    curl,
    densityDissipation,
    dyeResolution,
    pressure,
    pressureIterations,
    simResolution,
    splatForce,
    splatRadius,
    transparent,
    velocityDissipation,
  ]);

  return (
    <div className={cn('pointer-events-none fixed inset-0 z-50', className)}>
      <canvas
        ref={canvasRef}
        className="block h-screen w-screen"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}
