/**
 * Color space conversion utilities.
 *
 * Converts between HEX, OKLCH, and CSS string representations
 * using the `culori` library for accurate color math.
 */

import { converter, formatHex } from 'culori';
import type { OklchColor } from './types';

const toOklch = converter('oklch');

const HEX_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Validate that a string is a valid HEX color (#RGB or #RRGGBB).
 * Throws if the format is invalid.
 */
function assertValidHex(hex: string): void {
  if (!HEX_REGEX.test(hex)) {
    throw new Error(
      `Invalid HEX color: "${hex}". Expected format: #RGB or #RRGGBB.`,
    );
  }
}

/**
 * Convert a HEX color string to an OKLCH color object.
 *
 * @param hex - A valid 3 or 6 digit HEX string with `#` prefix (e.g. `#ff0000`, `#f00`)
 * @returns The color in OKLCH space
 * @throws If the HEX string is invalid
 */
export function hexToOklch(hex: string): OklchColor {
  assertValidHex(hex);
  const result = toOklch(hex);
  if (!result) {
    throw new Error(`Failed to convert HEX "${hex}" to OKLCH.`);
  }
  return {
    l: result.l,
    c: result.c ?? 0,
    h: result.h ?? 0,
  };
}

/**
 * Convert an OKLCH color object back to a 6-digit HEX string.
 *
 * @param color - An OKLCH color
 * @returns A HEX string like `#rrggbb`
 */
export function oklchToHex(color: OklchColor): string {
  const hex = formatHex({ mode: 'oklch', l: color.l, c: color.c, h: color.h });
  return hex;
}

/**
 * Format an OKLCH color as a CSS `oklch()` function string.
 *
 * @param color - An OKLCH color
 * @returns A string like `oklch(0.5 0.2 270)`
 */
export function oklchToCss(color: OklchColor): string {
  return `oklch(${color.l} ${color.c} ${color.h})`;
}
