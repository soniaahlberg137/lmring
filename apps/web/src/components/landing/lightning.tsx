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

    // Short lightning bolts only in corners
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;

      #define OCTAVE_COUNT 6

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

      // Short lightning bolt - very localized
      vec3 shortLightning(vec2 uv, vec2 center, float hue, float timeOffset, float fade) {
          vec2 localUV = uv - center;

          // Limit range - only render near center
          float range = length(localUV);
          if (range > 0.4) return vec3(0.0);

          float rangeFade = smoothstep(0.4, 0.15, range);

          localUV += 1.5 * fbm(localUV * 3.0 + 0.5 * (iTime + timeOffset) * 0.3) - 0.75;

          float dist = abs(localUV.x);
          vec3 baseColor = hsv2rgb(vec3(hue / 360.0, 0.5, 0.95));

          float flicker = hash11((iTime + timeOffset) * 0.8);
          float flickerIntensity = mix(0.008, 0.025, flicker);

          vec3 col = baseColor * pow(flickerIntensity / max(dist, 0.001), 1.0) * fade * rangeFade;
          return col;
      }

      // Fade in/out
      float fadeInOut(float time, float duration, float offset) {
          float cycle = mod(time + offset, duration * 2.0);
          if (cycle < duration) {
              return smoothstep(0.0, duration * 0.2, cycle) * smoothstep(duration, duration * 0.8, cycle);
          }
          return 0.0;
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;

          vec3 col = vec3(0.0);

          // Top-left corner - blue
          float fade1 = fadeInOut(iTime, 6.0, 0.0);
          if (fade1 > 0.01) {
              col += shortLightning(uv, vec2(-1.4, 0.7), 220.0, 0.0, fade1 * 0.6);
          }

          // Top-right corner - gold
          float fade2 = fadeInOut(iTime, 7.0, 3.0);
          if (fade2 > 0.01) {
              col += shortLightning(uv, vec2(1.3, 0.6), 42.0, 1.5, fade2 * 0.5);
          }

          // Bottom-right corner - blue
          float fade3 = fadeInOut(iTime, 6.5, 4.5);
          if (fade3 > 0.01) {
              col += shortLightning(uv, vec2(1.4, -0.65), 210.0, 3.0, fade3 * 0.55);
          }

          // Bottom-left corner - gold
          float fade4 = fadeInOut(iTime, 7.5, 1.5);
          if (fade4 > 0.01) {
              col += shortLightning(uv, vec2(-1.3, -0.7), 38.0, 2.0, fade4 * 0.5);
          }

          col = min(col, vec3(0.8));

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
      gl.uniform1f(iTimeLocation, (performance.now() - startTime) / 1000.0);
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
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
