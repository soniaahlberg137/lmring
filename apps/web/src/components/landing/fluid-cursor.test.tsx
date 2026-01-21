import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lmring/ui', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

class MockWebGL2RenderingContext {}
vi.stubGlobal('WebGL2RenderingContext', MockWebGL2RenderingContext);

describe('FluidCursor', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    mockRequestAnimationFrame = vi.fn().mockReturnValue(1);
    mockCancelAnimationFrame = vi.fn();

    vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame);
    vi.stubGlobal('requestAnimationFrame', mockRequestAnimationFrame);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  it('should render canvas with correct structure', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const { FluidCursor } = await import('./fluid-cursor');
    const { container } = render(<FluidCursor />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('pointer-events-none', 'fixed', 'inset-0', 'z-50');

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('block', 'h-screen', 'w-screen');
    expect(canvas).toHaveStyle({ mixBlendMode: 'screen' });
  });

  it('should apply custom className', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const { FluidCursor } = await import('./fluid-cursor');
    const { container } = render(<FluidCursor className="custom-class" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should not initialize WebGL when prefers-reduced-motion is enabled', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { FluidCursor } = await import('./fluid-cursor');
    render(<FluidCursor />);

    expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith('WebGL not supported');

    consoleErrorSpy.mockRestore();
  });

  it('should log error when WebGL is not supported', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

    const { FluidCursor } = await import('./fluid-cursor');
    render(<FluidCursor />);

    expect(consoleErrorSpy).toHaveBeenCalledWith('WebGL not supported');

    HTMLCanvasElement.prototype.getContext = originalGetContext;
    consoleErrorSpy.mockRestore();
  });
});

describe('FluidCursor event handlers and cleanup', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let mockGL: Record<string, unknown>;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    mockRequestAnimationFrame = vi.fn().mockReturnValue(42);
    mockCancelAnimationFrame = vi.fn();
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame);
    vi.stubGlobal('requestAnimationFrame', mockRequestAnimationFrame);
    vi.stubGlobal('devicePixelRatio', 1);

    mockGL = {
      TEXTURE_2D: 0x0de1,
      TEXTURE_MIN_FILTER: 0x2801,
      TEXTURE_MAG_FILTER: 0x2800,
      TEXTURE_WRAP_S: 0x2802,
      TEXTURE_WRAP_T: 0x2803,
      CLAMP_TO_EDGE: 0x812f,
      LINEAR: 0x2601,
      NEAREST: 0x2600,
      RGBA: 0x1908,
      RGBA16F: 0x881a,
      RG16F: 0x822f,
      RG: 0x8227,
      R16F: 0x822d,
      RED: 0x1903,
      HALF_FLOAT: 0x140b,
      FLOAT: 0x1406,
      UNSIGNED_BYTE: 0x1401,
      UNSIGNED_SHORT: 0x1403,
      ARRAY_BUFFER: 0x8892,
      ELEMENT_ARRAY_BUFFER: 0x8893,
      STATIC_DRAW: 0x88e4,
      FRAMEBUFFER: 0x8d40,
      COLOR_ATTACHMENT0: 0x8ce0,
      COLOR_BUFFER_BIT: 0x00004000,
      VERTEX_SHADER: 0x8b31,
      FRAGMENT_SHADER: 0x8b30,
      COMPILE_STATUS: 0x8b81,
      LINK_STATUS: 0x8b82,
      ACTIVE_UNIFORMS: 0x8b86,
      TRIANGLES: 0x0004,
      BLEND: 0x0be2,
      ONE: 1,
      ONE_MINUS_SRC_ALPHA: 0x0303,
      TEXTURE0: 0x84c0,
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getExtension: vi.fn().mockReturnValue({ HALF_FLOAT_OES: 0x8d61 }),
      createShader: vi.fn().mockReturnValue({}),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
      createProgram: vi.fn().mockReturnValue({}),
      attachShader: vi.fn(),
      bindAttribLocation: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn().mockReturnValue(true),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      getActiveUniform: vi.fn().mockReturnValue(null),
      getUniformLocation: vi.fn().mockReturnValue({}),
      createBuffer: vi.fn().mockReturnValue({}),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      createTexture: vi.fn().mockReturnValue({}),
      bindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texImage2D: vi.fn(),
      createFramebuffer: vi.fn().mockReturnValue({}),
      bindFramebuffer: vi.fn(),
      framebufferTexture2D: vi.fn(),
      viewport: vi.fn(),
      clear: vi.fn(),
      clearColor: vi.fn(),
      activeTexture: vi.fn(),
      useProgram: vi.fn(),
      vertexAttribPointer: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      uniform1i: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      drawElements: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      blendFunc: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteFramebuffer: vi.fn(),
      deleteTexture: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  it('should add event listeners on mount', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockGL);

    const { FluidCursor } = await import('./fluid-cursor');
    render(<FluidCursor />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), {
      passive: true,
    });
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), {
      passive: true,
    });
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));

    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('should remove event listeners on unmount', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockGL);

    const { FluidCursor } = await import('./fluid-cursor');
    const { unmount } = render(<FluidCursor />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));

    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('should call cancelAnimationFrame on unmount', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockGL);

    const { FluidCursor } = await import('./fluid-cursor');
    const { unmount } = render(<FluidCursor />);

    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(42);

    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('should log error when WebGL formats are not supported', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockGLNoFormats = {
      ...mockGL,
      getExtension: vi.fn().mockReturnValue(null),
    };

    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockGLNoFormats);

    const { FluidCursor } = await import('./fluid-cursor');
    render(<FluidCursor />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'WebGL formats not supported; FluidCursor disabled.',
    );

    HTMLCanvasElement.prototype.getContext = originalGetContext;
    consoleErrorSpy.mockRestore();
  });
});
