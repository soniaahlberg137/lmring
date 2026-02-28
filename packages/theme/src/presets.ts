/**
 * Preset theme definitions for @lmring/theme.
 *
 * Each preset is defined by its OKLCH hue angle. The color engine
 * generates a full semantic palette from the seed parameters.
 */

import { generatePalette } from './color-engine';
import type { ThemePalette, ThemePreset } from './types';

/**
 * All available preset themes.
 *
 * Each preset uses a default chroma of 0.18 and lightness of 0.55,
 * varying only in hue to produce distinct color families.
 */
export const presets: ThemePreset[] = [
  { name: 'ocean-blue', hue: 255, chroma: 0.18, lightness: 0.55 },
  { name: 'violet', hue: 280, chroma: 0.18, lightness: 0.55 },
  { name: 'emerald', hue: 155, chroma: 0.18, lightness: 0.55 },
  { name: 'amber', hue: 75, chroma: 0.18, lightness: 0.55 },
  { name: 'rose', hue: 350, chroma: 0.18, lightness: 0.55 },
  { name: 'crimson', hue: 25, chroma: 0.18, lightness: 0.55 },
  { name: 'cyan', hue: 195, chroma: 0.18, lightness: 0.55 },
  { name: 'indigo', hue: 265, chroma: 0.18, lightness: 0.55 },
];

/**
 * Look up a preset by name and return its generated palette.
 *
 * @param name - Kebab-case preset name (e.g. 'ocean-blue', 'violet')
 * @returns The full light + dark `ThemePalette` for the preset
 * @throws {Error} If no preset matches the given name
 */
export function getPreset(name: string): ThemePalette {
  const preset = presets.find((p) => p.name === name);
  if (!preset) {
    throw new Error(
      `Unknown preset "${name}". Available: ${presets.map((p) => p.name).join(', ')}`,
    );
  }
  return generatePalette({ h: preset.hue, c: preset.chroma, l: preset.lightness });
}
