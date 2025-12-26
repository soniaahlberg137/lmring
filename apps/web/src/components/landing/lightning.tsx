'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@lmring/ui';

type LightningProps = {
  className?: string;
};

export function Lightning({ className }: LightningProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Modified fragment shader - avoid center, shorter lines, more aesthetic
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;

      #define OCTAVE_COUNT 8

      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash11(float p) {
          p = fract(p * .1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
      }

      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));

          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      // Lightning bolt function - shorter, thinner
      vec3 lightning(vec2 uv, float hue, float timeOffset, float speed, float intensity, float size, bool vertical) {
          vec2 dir_uv = vertical ? uv : vec2(uv.y, uv.x);

          dir_uv += 2.0 * fbm(dir_uv * size + 0.8 * (iTime + timeOffset) * speed) - 1.0;

          float dist = abs(dir_uv.x);
          vec3 baseColor = hsv2rgb(vec3(hue / 360.0, 0.6, 0.9));

          // Softer flickering
          float flicker = hash11((iTime + timeOffset) * speed * 1.5);
          float flickerIntensity = mix(0.015, 0.045, flicker);

          vec3 col = baseColor * pow(flickerIntensity / dist, 1.0) * intensity;
          return col;
      }

      // Fade in/out function
      float fadeInOut(float time, float duration, float offset) {
          float cycle = mod(time + offset, duration * 2.0);
          if (cycle < duration) {
              return smoothstep(0.0, duration * 0.25, cycle) * smoothstep(duration, duration * 0.75, cycle);
          } else {
              return 0.0;
          }
      }

      // Center mask - creates safe zone for title
      float centerMask(vec2 uv) {
          // Elliptical mask in center
          float maskX = smoothstep(0.3, 0.7, abs(uv.x));
          float maskY = smoothstep(0.25, 0.6, abs(uv.y));
          return max(maskX, maskY);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;

          vec3 col = vec3(0.0);

          // Center safe zone mask
          float mask = centerMask(uv);

          // Top-left blue lightning - shorter
          float fade1 = fadeInOut(iTime, 5.0, 0.0);
          if (fade1 > 0.01) {
              vec2 uv1 = uv;
              uv1.x += 1.2;
              uv1.y += 0.6;
              col += lightning(uv1, 210.0, 0.0, 0.4, 0.7 * fade1, 1.5, false) * mask;
          }

          // Top-right gold lightning - shorter
          float fade2 = fadeInOut(iTime, 6.0, 2.0);
          if (fade2 > 0.01) {
              vec2 uv2 = uv;
              uv2.x -= 1.0;
              uv2.y += 0.5;
              col += lightning(uv2, 42.0, 1.5, 0.35, 0.65 * fade2, 1.6, true) * mask;
          }

          // Bottom-right blue lightning
          float fade3 = fadeInOut(iTime, 5.5, 3.5);
          if (fade3 > 0.01) {
              vec2 uv3 = uv;
              uv3.x -= 1.3;
              uv3.y -= 0.5;
              col += lightning(uv3, 220.0, 3.0, 0.45, 0.6 * fade3, 1.4, false) * mask;
          }

          // Bottom-left gold lightning
          float fade4 = fadeInOut(iTime, 6.5, 1.5);
          if (fade4 > 0.01) {
              vec2 uv4 = uv;
              uv4.x += 1.1;
              uv4.y -= 0.6;
              col += lightning(uv4, 38.0, 2.0, 0.38, 0.55 * fade4, 1.5, true) * mask;
          }

          // Edge glow - very subtle ambient light at edges
          float edgeGlow = (1.0 - mask) * 0.02;
          col += vec3(0.1, 0.15, 0.25) * edgeGlow;

          // Soft clamp
          col = min(col, vec3(1.0));

          // Add subtle vignette
          float vignette = 1.0 - length(uv) * 0.3;
          col *= vignette;

          fragColor = vec4(col, 1.0);
      }

      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const compileShader = (source: string, type: number): WebGLShader | null => {
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

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');

    const startTime = performance.now();
    let animationId: number;

    const render = () => {
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
      const currentTime = performance.now();
      gl.uniform1f(iTimeLocation, (currentTime - startTime) / 1000.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
}
