import { describe, expect, it } from 'vitest';
import type { OklchColor, SemanticPalette } from './types';
import { generatePalette, mergePalette } from './color-engine';

const SEMANTIC_KEYS: (keyof SemanticPalette)[] = [
  'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
  'accent', 'accentForeground', 'muted', 'mutedForeground',
  'destructive', 'destructiveForeground', 'background', 'foreground',
  'card', 'cardForeground', 'border', 'input', 'ring',
];

const seed: OklchColor = { l: 0.55, c: 0.18, h: 255 };

describe('generatePalette', () => {
  it('returns light and dark palettes', () => {
    const palette = generatePalette(seed);
    expect(palette).toHaveProperty('light');
    expect(palette).toHaveProperty('dark');
  });

  it('light palette has all 17 semantic keys', () => {
    const { light } = generatePalette(seed);
    for (const key of SEMANTIC_KEYS) {
      expect(light).toHaveProperty(key);
      expect(light[key]).toHaveProperty('l');
      expect(light[key]).toHaveProperty('c');
      expect(light[key]).toHaveProperty('h');
    }
  });

  it('dark palette has all 17 semantic keys', () => {
    const { dark } = generatePalette(seed);
    for (const key of SEMANTIC_KEYS) {
      expect(dark).toHaveProperty(key);
    }
  });

  it('all OKLCH values are within valid ranges', () => {
    const palette = generatePalette(seed);
    for (const mode of ['light', 'dark'] as const) {
      for (const key of SEMANTIC_KEYS) {
        const color = palette[mode][key];
        expect(color.l).toBeGreaterThanOrEqual(0);
        expect(color.l).toBeLessThanOrEqual(1);
        expect(color.c).toBeGreaterThanOrEqual(0);
        expect(color.c).toBeLessThanOrEqual(0.4);
        expect(color.h).toBeGreaterThanOrEqual(0);
        expect(color.h).toBeLessThan(360);
      }
    }
  });

  it('dark mode layers are monotonically increasing in lightness', () => {
    const { dark } = generatePalette(seed);
    expect(dark.background.l).toBeLessThan(dark.card.l);
    // input (L=0.22) serves as elevated layer
    expect(dark.card.l).toBeLessThan(dark.input.l);
  });

  it('ring matches primary in both modes', () => {
    const palette = generatePalette(seed);
    expect(palette.light.ring).toEqual(palette.light.primary);
    expect(palette.dark.ring).toEqual(palette.dark.primary);
  });
});

describe('mergePalette', () => {
  it('empty overrides returns deep-equal copy', () => {
    const base = generatePalette(seed);
    const merged = mergePalette(base, {});
    expect(merged).toEqual(base);
  });

  it('merged palette is a new object (not same reference)', () => {
    const base = generatePalette(seed);
    const merged = mergePalette(base, {});
    expect(merged).not.toBe(base);
    expect(merged.light).not.toBe(base.light);
    expect(merged.dark).not.toBe(base.dark);
  });

  it('applies light overrides', () => {
    const base = generatePalette(seed);
    const override: OklchColor = { l: 0.5, c: 0.25, h: 30 };
    const merged = mergePalette(base, { light: { destructive: override } });
    expect(merged.light.destructive).toEqual(override);
    expect(merged.dark.destructive).toEqual(base.dark.destructive);
  });

  it('applies dark overrides', () => {
    const base = generatePalette(seed);
    const override: OklchColor = { l: 0.12, c: 0.015, h: 280 };
    const merged = mergePalette(base, { dark: { background: override } });
    expect(merged.dark.background).toEqual(override);
    expect(merged.light.background).toEqual(base.light.background);
  });

  it('non-overridden keys remain unchanged', () => {
    const base = generatePalette(seed);
    const merged = mergePalette(base, { light: { primary: { l: 0.6, c: 0.2, h: 100 } } });
    expect(merged.light.secondary).toEqual(base.light.secondary);
    expect(merged.light.background).toEqual(base.light.background);
  });
});
