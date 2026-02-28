/**
 * OKLCH palette generation engine.
 *
 * Given a seed color in OKLCH space, generates a complete semantic palette
 * for both light and dark modes following the design system's generation rules.
 */

import type { OklchColor, SemanticPalette, ThemePalette } from './types';

/**
 * Clamp a number to the given range.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normalize a hue value to [0, 360).
 */
function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * Create a valid OklchColor with clamped values.
 */
function oklch(l: number, c: number, h: number): OklchColor {
  return {
    l: clamp(l, 0, 1),
    c: clamp(c, 0, 0.4),
    h: normalizeHue(h),
  };
}

/**
 * Derive the light-mode semantic palette from a seed color.
 */
function generateLightPalette(seed: OklchColor): SemanticPalette {
  const h = normalizeHue(seed.h);

  const primary = oklch(0.52, seed.c, h);

  return {
    primary,
    primaryForeground: oklch(1.0, 0, h),
    secondary: oklch(0.96, 0.005, h),
    secondaryForeground: oklch(0.25, 0.015, h),
    accent: oklch(0.96, 0.01, h),
    accentForeground: oklch(0.25, 0.015, h),
    muted: oklch(0.96, 0.005, h),
    mutedForeground: oklch(0.58, 0.01, h),
    destructive: oklch(0.55, 0.22, 25),
    destructiveForeground: oklch(1.0, 0, 25),
    background: oklch(0.98, 0.002, h),
    foreground: oklch(0.20, 0.015, h),
    card: oklch(1.0, 0, h),
    cardForeground: oklch(0.20, 0.015, h),
    border: oklch(0.90, 0.005, h),
    input: oklch(0.95, 0.005, h),
    ring: primary,
  };
}

/**
 * Derive the dark-mode semantic palette from a seed color.
 *
 * Uses a layered surface system with increasing lightness:
 *   Layer 0 (background): L=0.14
 *   Layer 1 (card):       L=0.18
 *   Layer 2 (elevated):   L=0.22  (mapped to `input`)
 *   Layer 3 (overlay):    L=0.26  (mapped to `border` at L=0.28 per rules table)
 */
function generateDarkPalette(seed: OklchColor): SemanticPalette {
  const h = normalizeHue(seed.h);

  const primary = oklch(0.65, seed.c * 1.1, h);

  return {
    primary,
    primaryForeground: oklch(0.15, seed.c * 0.05, h),
    secondary: oklch(0.25, 0.01, h),
    secondaryForeground: oklch(0.90, 0.005, h),
    accent: oklch(0.28, 0.015, h),
    accentForeground: oklch(0.90, 0.005, h),
    muted: oklch(0.25, 0.01, h),
    mutedForeground: oklch(0.72, 0.005, h),
    destructive: oklch(0.60, 0.24, 25),
    destructiveForeground: oklch(0.95, 0.01, 25),
    background: oklch(0.14, 0.01, h),
    foreground: oklch(0.95, 0.005, h),
    card: oklch(0.18, 0.01, h),
    cardForeground: oklch(0.95, 0.005, h),
    border: oklch(0.28, 0.01, h),
    input: oklch(0.22, 0.01, h),
    ring: primary,
  };
}


/**
 * Generate a complete light + dark semantic palette from a seed OKLCH color.
 *
 * The seed color's hue drives the entire palette. Lightness and chroma
 * are adjusted per semantic role according to the design system rules.
 *
 * @param seed - The user-chosen seed color in OKLCH space
 * @returns A `ThemePalette` with `light` and `dark` semantic palettes
 */
export function generatePalette(seed: OklchColor): ThemePalette {
  return {
    light: generateLightPalette(seed),
    dark: generateDarkPalette(seed),
  };
}

/**
 * Deep-merge partial overrides into a base palette.
 *
 * Overridden keys take the override value; all other keys are preserved
 * from the base. Always returns a new object (no mutation).
 *
 * @param base - The base palette to start from
 * @param overrides - Partial light/dark overrides to apply
 * @returns A new `ThemePalette` with overrides merged in
 */
export function mergePalette(
  base: ThemePalette,
  overrides: Partial<{
    light: Partial<SemanticPalette>;
    dark: Partial<SemanticPalette>;
  }>,
): ThemePalette {
  return {
    light: { ...base.light, ...overrides.light },
    dark: { ...base.dark, ...overrides.dark },
  };
}
