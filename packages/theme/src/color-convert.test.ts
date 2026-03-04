import { describe, expect, it } from 'vitest';
import { hexToOklch, oklchToCss, oklchToHex } from './color-convert';

describe('hexToOklch', () => {
  it('converts a 6-digit HEX to OKLCH', () => {
    const result = hexToOklch('#ff0000');
    expect(result.l).toBeGreaterThan(0);
    expect(result.l).toBeLessThanOrEqual(1);
    expect(result.c).toBeGreaterThanOrEqual(0);
    expect(result.h).toBeGreaterThanOrEqual(0);
    expect(result.h).toBeLessThan(360);
  });

  it('converts a 3-digit HEX to OKLCH', () => {
    const result = hexToOklch('#f00');
    const full = hexToOklch('#ff0000');
    expect(result.l).toBeCloseTo(full.l, 5);
    expect(result.c).toBeCloseTo(full.c, 5);
    expect(result.h).toBeCloseTo(full.h, 5);
  });

  it('handles black (#000000)', () => {
    const result = hexToOklch('#000000');
    expect(result.l).toBeCloseTo(0, 2);
    expect(result.c).toBeCloseTo(0, 2);
  });

  it('handles white (#ffffff)', () => {
    const result = hexToOklch('#ffffff');
    expect(result.l).toBeCloseTo(1, 2);
    expect(result.c).toBeCloseTo(0, 2);
  });

  it('throws on invalid HEX (no hash)', () => {
    expect(() => hexToOklch('ff0000')).toThrow('Invalid HEX color');
  });

  it('throws on invalid HEX (wrong length)', () => {
    expect(() => hexToOklch('#ff00')).toThrow('Invalid HEX color');
  });

  it('throws on invalid HEX (non-hex chars)', () => {
    expect(() => hexToOklch('#gggggg')).toThrow('Invalid HEX color');
  });

  it('throws on empty string', () => {
    expect(() => hexToOklch('')).toThrow('Invalid HEX color');
  });
});

describe('oklchToHex', () => {
  it('converts an OKLCH color back to HEX', () => {
    const hex = oklchToHex({ l: 0.6, c: 0.2, h: 30 });
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('converts black', () => {
    const hex = oklchToHex({ l: 0, c: 0, h: 0 });
    expect(hex).toBe('#000000');
  });

  it('converts white', () => {
    const hex = oklchToHex({ l: 1, c: 0, h: 0 });
    expect(hex).toBe('#ffffff');
  });
});

describe('oklchToCss', () => {
  it('formats as oklch() CSS function', () => {
    const css = oklchToCss({ l: 0.5, c: 0.2, h: 270 });
    expect(css).toBe('oklch(0.5 0.2 270)');
  });

  it('handles zero values', () => {
    const css = oklchToCss({ l: 0, c: 0, h: 0 });
    expect(css).toBe('oklch(0 0 0)');
  });
});

describe('round-trip: hexToOklch → oklchToHex', () => {
  const samples = ['#ff0000', '#00ff00', '#0000ff', '#123456', '#abcdef', '#000000', '#ffffff'];

  for (const hex of samples) {
    it(`round-trips ${hex} within ±1 sRGB`, () => {
      const oklch = hexToOklch(hex);
      const result = oklchToHex(oklch);

      // Parse both hex values to compare RGB components
      const parseHexToRgb = (h: string): [number, number, number] => {
        const v = h.replace('#', '');
        return [
          Number.parseInt(v.slice(0, 2), 16),
          Number.parseInt(v.slice(2, 4), 16),
          Number.parseInt(v.slice(4, 6), 16),
        ];
      };

      const [r1, g1, b1] = parseHexToRgb(hex);
      const [r2, g2, b2] = parseHexToRgb(result);

      expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(1);
      expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(1);
      expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(1);
    });
  }
});
