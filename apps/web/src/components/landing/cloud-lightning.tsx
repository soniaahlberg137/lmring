'use client';

import { useEffect, useRef } from 'react';

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Vertex Shader (Simple full-screen triangle/quad)
    const vsSource = `
      attribute vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    // Fragment Shader
    const fsSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;

      // Basic noise function
      float noise(vec2 p) {
          return sin(p.x * 3. + sin(p.y * 2.7)) * cos(p.y * 1.1 + cos(p.x * 2.3));
      }

      // Fractal layering function (fBm)
      float fbm(vec2 p) {
          float value = 0., amplitude = 1.;
          for(int i = 0; i < 9; i++) {
              value += noise(p) * amplitude;
              p *= 2.;
              amplitude *= .5;
          }
          return value;
      }

      void mainImage(out vec4 fragColor, vec2 fragCoord) {
          // Normalize coordinates to center
          vec2 uv = (fragCoord - iResolution.xy * .5) / iResolution.y;
          float t = iTime;

          // Pre-compute common terms (flow direction: upper-right)
          float fbmVal = fbm(uv + vec2(t * .4, t * .2));

          // Four light source positions
          vec2 pos1 = uv + vec2(sin(t * 2.2), sin(t)) + fbmVal + 1.;
          vec2 pos2 = uv + vec2(cos(t * 2.), sin(t)) + fbmVal + 1.;
          vec2 pos3 = uv + vec2(sin(t * 1.2), cos(t * 1.3)) + fbmVal + 2.;
          vec2 pos4 = uv + vec2(cos(t * 1.8), sin(t * 1.5)) + fbmVal + 1.5;

          // Calculate light source color overlay (gold, white, purple, blue)
          vec3 color = vec3(1.0, .84, .1) / (length(pos1) * 2.1)
                      + vec3(1.3, 1.3, 1.3) / (length(pos2) * 2.1)
                      + vec3(.8, .2, 1.0) / (length(pos3) * 2.1)
                      + vec3(.1, .4, 1.2) / (length(pos4) * 2.1);

          // Tone mapping
          fragColor = vec4(color * .8 / (3.5 + color), 1.);
      }

      void main() {
        vec4 color;
        mainImage(color, gl_FragCoord.xy);
        gl_FragColor = color;
      }
    `;

    // Shader compilation helpers
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    // biome-ignore lint/correctness/useHookAtTopLevel: This is WebGL API, not a React hook
    gl.useProgram(program);

    // Set up full-screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');

    let animationFrameId: number;
    const startTime = Date.now();

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000;

      // Handle resize
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }

      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(iTimeLocation, currentTime);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 h-full w-full bg-black" />;
}
