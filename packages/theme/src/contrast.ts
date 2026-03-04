/**
 * WCAG 2.1 contrast ratio utilities.
 *
 * Computes relative luminance and contrast ratios for OKLCH colors
 * by converting through sRGB, following the WCAG 2.1 specification.
 */

import { converter } from 'culori';
import type { OklchColor } from './types';

const toRgb = converter('rgb');

/**
 * Linearize a single sRGB channel value for luminance calculation.
 *
 * @param c - sRGB channel value in [0, 1]
 * @returns Linear RGB value
 */
function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Compute the WCAG 2.1 relative luminance of an OKLCH color.
 *
 * Converts the color to sRGB, linearizes each channel, then applies
 * the standard luminance coefficients: 0.2126·R + 0.7152·G + 0.0722·B.
 *
 * @param color - An OKLCH color
 * @returns Relative luminance in [0, 1]
 */
export function getRelativeLuminance(color: OklchColor): number {
  const rgb = toRgb({ mode: 'oklch', l: color.l, c: color.c, h: color.h });
  if (!rgb) {
    return 0;
  }

  const r = linearize(Math.max(0, Math.min(1, rgb.r)));
  const g = linearize(Math.max(0, Math.min(1, rgb.g)));
  const b = linearize(Math.max(0, Math.min(1, rgb.b)));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Compute the WCAG 2.1 contrast ratio between two OKLCH colors.
 *
 * The ratio is always ≥ 1, with 21:1 being the maximum (black on white).
 *
 * @param fg - Foreground color
 * @param bg - Background color
 * @returns Contrast ratio (e.g. 4.5 means 4.5:1)
 */
export function getContrastRatio(fg: OklchColor, bg: OklchColor): number {
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether two OKLCH colors meet the WCAG 2.1 AA contrast requirement.
 *
 * - Normal text: contrast ratio ≥ 4.5:1
 * - Large text (≥ 18pt or ≥ 14pt bold): contrast ratio ≥ 3.0:1
 *
 * @param fg - Foreground color
 * @param bg - Background color
 * @param isLargeText - Whether the text qualifies as "large" under WCAG
 * @returns `true` if the pair meets WCAG AA
 */
export function meetsWcagAA(
  fg: OklchColor,
  bg: OklchColor,
  isLargeText: boolean,
): boolean {
  const ratio = getContrastRatio(fg, bg);
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}
