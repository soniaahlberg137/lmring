/**
 * Design tokens for @lmring/theme
 *
 * Static design tokens covering spacing, radius, shadow, typography,
 * line-height (leading), easing, and duration values.
 *
 * Spacing uses a 4px base grid. All numeric spacing values (excluding 0)
 * are positive multiples of 4.
 */

/** Spacing scale based on 4px grid */
const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

/** Border-radius scale with 10px (0.625rem) base */
const radius = {
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
  full: '9999px',
} as const;

/** Multi-layer composite shadow system (3 levels) */
const shadow = {
  sm: '0 1px 2px oklch(0 0 0 / 3%), 0 1px 3px oklch(0 0 0 / 2%)',
  md: '0 2px 4px oklch(0 0 0 / 3%), 0 4px 8px oklch(0 0 0 / 3%), 0 8px 16px oklch(0 0 0 / 2%)',
  lg: '0 4px 8px oklch(0 0 0 / 3%), 0 8px 16px oklch(0 0 0 / 3%), 0 16px 32px oklch(0 0 0 / 4%), 0 32px 64px oklch(0 0 0 / 2%)',
} as const;

/** Typography font-size scale (rem values) */
const typography = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
} as const;

/** Line-height scale */
const leading = {
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '1.75',
} as const;

/** CSS easing functions */
const easing = {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/** Animation duration values */
const duration = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/** All design tokens grouped by category */
export const tokens = {
  spacing,
  radius,
  shadow,
  typography,
  leading,
  easing,
  duration,
} as const;
