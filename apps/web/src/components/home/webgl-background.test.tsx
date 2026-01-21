import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockWebGLContext = {
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(),
  deleteShader: vi.fn(),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  uniform2f: vi.fn(),
  uniform1f: vi.fn(),
  viewport: vi.fn(),
  drawArrays: vi.fn(),
  deleteProgram: vi.fn(),
  deleteBuffer: vi.fn(),
  canvas: { width: 800, height: 600 },
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  FLOAT: 5126,
  TRIANGLES: 4,
  LINK_STATUS: 35714,
  COMPILE_STATUS: 35713,
};

describe('WebGLBackground (home)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (contextType: string) => {
        if (contextType === 'webgl') {
          return mockWebGLContext as unknown as WebGLRenderingContext;
        }
        return null;
      },
    );
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(cb, 16) as unknown as number;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render a canvas element', async () => {
    const { WebGLBackground } = await import('./webgl-background');
    const { container } = render(<WebGLBackground />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should have fixed positioning class', async () => {
    const { WebGLBackground } = await import('./webgl-background');
    const { container } = render(<WebGLBackground />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('fixed');
    expect(canvas).toHaveClass('inset-0');
  });

  it('should have negative z-index class', async () => {
    const { WebGLBackground } = await import('./webgl-background');
    const { container } = render(<WebGLBackground />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('-z-50');
  });

  it('should initialize WebGL context', async () => {
    const { WebGLBackground } = await import('./webgl-background');
    render(<WebGLBackground />);
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('webgl');
  });

  it('should create shaders', async () => {
    const { WebGLBackground } = await import('./webgl-background');
    render(<WebGLBackground />);
    expect(mockWebGLContext.createShader).toHaveBeenCalled();
    expect(mockWebGLContext.compileShader).toHaveBeenCalled();
  });

  it('should set up program and buffers', async () => {
    const { WebGLBackground } = await import('./webgl-background');
    render(<WebGLBackground />);
    expect(mockWebGLContext.createProgram).toHaveBeenCalled();
    expect(mockWebGLContext.useProgram).toHaveBeenCalled();
    expect(mockWebGLContext.createBuffer).toHaveBeenCalled();
  });

  it('should clean up on unmount', async () => {
    const { WebGLBackground } = await import('./webgl-background');
    const { unmount } = render(<WebGLBackground />);
    unmount();
    expect(mockWebGLContext.deleteProgram).toHaveBeenCalled();
    expect(mockWebGLContext.deleteShader).toHaveBeenCalled();
    expect(mockWebGLContext.deleteBuffer).toHaveBeenCalled();
  });

  it('should handle WebGL not supported', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const { WebGLBackground } = await import('./webgl-background');
    render(<WebGLBackground />);

    expect(consoleSpy).toHaveBeenCalledWith('WebGL not supported');
    consoleSpy.mockRestore();
  });
});
