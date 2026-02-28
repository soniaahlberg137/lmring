import { describe, expect, it } from 'vitest';
import { getPreset, presets } from './presets';

describe('presets', () => {
  it('defines exactly 8 preset themes', () => {
    expect(presets).toHaveLength(8);
  });

  it('uses kebab-case names', () => {
    for (const preset of presets) {
      expect(preset.name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('includes all expected preset names', () => {
    const names = presets.map((p) => p.name);
    expect(names).toEqual([
      'ocean-blue',
      'violet',
      'emerald',
      'amber',
      'rose',
      'crimson',
      'cyan',
      'indigo',
    ]);
  });

  it('has correct hue values for each preset', () => {
    const hueMap: Record<string, number> = {
      'ocean-blue': 255,
      violet: 280,
      emerald: 155,
      amber: 75,
      rose: 350,
      crimson: 25,
      cyan: 195,
      indigo: 265,
    };
    for (const preset of presets) {
      expect(preset.hue).toBe(hueMap[preset.name]);
    }
  });
});

describe('getPreset', () => {
  it('returns a ThemePalette with light and dark palettes', () => {
    const palette = getPreset('ocean-blue');
    expect(palette).toHaveProperty('light');
    expect(palette).toHaveProperty('dark');
  });

  it('returns palettes with all 17 semantic keys', () => {
    const palette = getPreset('violet');
    const keys = [
      'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
      'accent', 'accentForeground', 'muted', 'mutedForeground',
      'destructive', 'destructiveForeground', 'background', 'foreground',
      'card', 'cardForeground', 'border', 'input', 'ring',
    ];
    for (const key of keys) {
      expect(palette.light).toHaveProperty(key);
      expect(palette.dark).toHaveProperty(key);
    }
  });

  it('works for every defined preset', () => {
    for (const preset of presets) {
      const palette = getPreset(preset.name);
      expect(palette.light.primary.h).toBeCloseTo(preset.hue, 0);
    }
  });

  it('throws for unknown preset names', () => {
    expect(() => getPreset('nonexistent')).toThrow('Unknown preset "nonexistent"');
  });
});
