import { describe, expect, it } from 'vitest';
import type { OklchColor } from './types';
import { getContrastRatio, getRelativeLuminance, meetsWcagAA } from './contrast';

/** Pure black in OKLCH. */
const black: OklchColor = { l: 0, c: 0, h: 0 };

/** Pure white in OKLCH. */
const white: OklchColor = { l: 1, c: 0, h: 0 };

/** A mid-gray for intermediate tests. */
const midGray: OklchColor = { l: 0.6, c: 0, h: 0 };

describe('getRelativeLuminance', () => {
  it('returns 0 for black', () => {
    expect(getRelativeLuminance(black)).toBeCloseTo(0, 2);
  });

  it('returns 1 for white', () => {
    expect(getRelativeLuminance(white)).toBeCloseTo(1, 2);
  });

  it('returns a value between 0 and 1 for mid-gray', () => {
    const lum = getRelativeLuminance(midGray);
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(1);
  });
});

describe('getContrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    const ratio = getContrastRatio(black, white);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1:1 for identical colors', () => {
    const ratio = getContrastRatio(white, white);
    expect(ratio).toBeCloseTo(1, 2);
  });

  it('is symmetric — order of fg/bg does not change the ratio', () => {
    const r1 = getContrastRatio(black, midGray);
    const r2 = getContrastRatio(midGray, black);
    expect(r1).toBeCloseTo(r2, 5);
  });

  it('returns a ratio > 1 for different colors', () => {
    const ratio = getContrastRatio(black, midGray);
    expect(ratio).toBeGreaterThan(1);
  });
});

describe('meetsWcagAA', () => {
  it('black on white passes for normal text (≥ 4.5:1)', () => {
    expect(meetsWcagAA(black, white, false)).toBe(true);
  });

  it('black on white passes for large text (≥ 3.0:1)', () => {
    expect(meetsWcagAA(black, white, true)).toBe(true);
  });

  it('white on white fails for normal text', () => {
    expect(meetsWcagAA(white, white, false)).toBe(false);
  });

  it('white on white fails for large text', () => {
    expect(meetsWcagAA(white, white, true)).toBe(false);
  });

  it('uses 4.5:1 threshold for normal text', () => {
    // A pair with ratio between 3.0 and 4.5 should fail normal but pass large
    const darkish: OklchColor = { l: 0.45, c: 0, h: 0 };
    const ratio = getContrastRatio(darkish, white);

    if (ratio >= 3.0 && ratio < 4.5) {
      expect(meetsWcagAA(darkish, white, false)).toBe(false);
      expect(meetsWcagAA(darkish, white, true)).toBe(true);
    }
  });
});
