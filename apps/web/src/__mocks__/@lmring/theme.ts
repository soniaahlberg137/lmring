// Mock for @lmring/theme — prevents culori ESM from hanging in vitest threads.
// Used via alias in vitest.config.mts (same pattern as @lmring/ui).

const stubColor = { l: 0.5, c: 0.15, h: 240 };

const semanticKeys = [
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'accent',
  'accentForeground',
  'muted',
  'mutedForeground',
  'destructive',
  'destructiveForeground',
  'background',
  'foreground',
  'card',
  'cardForeground',
  'border',
  'input',
  'ring',
];

const stubSemanticPalette = Object.fromEntries(semanticKeys.map((key) => [key, stubColor]));

const stubPalette = { light: stubSemanticPalette, dark: stubSemanticPalette };

export const presets = [
  { name: 'ocean-blue', hue: 255, chroma: 0.18, lightness: 0.55 },
  { name: 'violet', hue: 280, chroma: 0.18, lightness: 0.55 },
  { name: 'emerald', hue: 155, chroma: 0.18, lightness: 0.55 },
  { name: 'amber', hue: 75, chroma: 0.18, lightness: 0.55 },
  { name: 'rose', hue: 350, chroma: 0.18, lightness: 0.55 },
  { name: 'crimson', hue: 25, chroma: 0.18, lightness: 0.55 },
  { name: 'cyan', hue: 195, chroma: 0.18, lightness: 0.55 },
  { name: 'indigo', hue: 265, chroma: 0.18, lightness: 0.55 },
];

export const getPreset = () => stubPalette;
export const generatePalette = () => stubPalette;
export const mergePalette = () => stubPalette;

export const hexToOklch = () => stubColor;
export const oklchToHex = () => '#3b82f6';
export const oklchToCss = () => 'oklch(0.5 0.15 240)';

export const getRelativeLuminance = () => 0.5;
export const getContrastRatio = () => 4.5;
export const meetsWcagAA = () => true;

export const tokens = {};
export const paletteToCssVars = () => ({});

export const serialize = (config: unknown) => JSON.stringify(config);
export const deserialize = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'mode' in parsed) return parsed;
    return null;
  } catch {
    return null;
  }
};
