/**
 * Core type definitions for @lmring/theme
 *
 * All color values use the OKLCH color space for perceptual uniformity.
 */

/** A color in the OKLCH color space. */
export interface OklchColor {
  /** Lightness: 0–1 */
  l: number;
  /** Chroma: 0–0.4 */
  c: number;
  /** Hue: 0–360 */
  h: number;
}

/** Full set of semantic color slots used by the design system. */
export interface SemanticPalette {
  primary: OklchColor;
  primaryForeground: OklchColor;
  secondary: OklchColor;
  secondaryForeground: OklchColor;
  accent: OklchColor;
  accentForeground: OklchColor;
  muted: OklchColor;
  mutedForeground: OklchColor;
  destructive: OklchColor;
  destructiveForeground: OklchColor;
  background: OklchColor;
  foreground: OklchColor;
  card: OklchColor;
  cardForeground: OklchColor;
  border: OklchColor;
  input: OklchColor;
  ring: OklchColor;
}

/** Light and dark mode palettes derived from a seed color. */
export interface ThemePalette {
  light: SemanticPalette;
  dark: SemanticPalette;
}

/** Serializable theme configuration stored in localStorage / server DB. */
export interface PersistedThemeConfig {
  mode: 'light' | 'dark' | 'system';
  seedColor: OklchColor;
  presetName: string | null;
}

/** A named preset theme with its OKLCH seed parameters. */
export interface ThemePreset {
  name: string;
  hue: number;
  chroma: number;
  lightness: number;
}
