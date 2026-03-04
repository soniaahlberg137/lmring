/**
 * CSS variable generator.
 *
 * Converts a SemanticPalette into CSS custom property key-value pairs
 * for injection into the document root element.
 */

import { oklchToCss } from './color-convert';
import type { SemanticPalette } from './types';

/**
 * Convert a camelCase string to kebab-case.
 *
 * @example camelToKebab('primaryForeground') // 'primary-foreground'
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

/**
 * Convert a SemanticPalette into a Record of CSS custom properties.
 *
 * Each key in the palette is converted from camelCase to a `--kebab-case`
 * CSS variable name, and each value is formatted as an `oklch(l c h)` string.
 *
 * @param palette - A semantic palette (light or dark)
 * @returns A record mapping CSS variable names to OKLCH CSS values
 *
 * @example
 * paletteToCssVars(palette)
 * // { '--primary': 'oklch(0.55 0.18 255)', '--primary-foreground': 'oklch(1 0 0)', ... }
 */
export function paletteToCssVars(palette: SemanticPalette): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, color] of Object.entries(palette)) {
    const cssVarName = `--${camelToKebab(key)}`;
    vars[cssVarName] = oklchToCss(color);
  }

  return vars;
}
