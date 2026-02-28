/// <reference path="./culori.d.ts" />

// @lmring/theme — package entry point
// Public API exports will be added as modules are implemented.

export type {
  OklchColor,
  SemanticPalette,
  ThemePalette,
  PersistedThemeConfig,
  ThemePreset,
} from './types';

export { hexToOklch, oklchToHex, oklchToCss } from './color-convert';

export {
  getRelativeLuminance,
  getContrastRatio,
  meetsWcagAA,
} from './contrast';

export { generatePalette, mergePalette } from './color-engine';

export { presets, getPreset } from './presets';

export { tokens } from './tokens';

export { paletteToCssVars } from './css-generator';

export { serialize, deserialize } from './persistence';
