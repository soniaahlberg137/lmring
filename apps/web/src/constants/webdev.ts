/**
 * WebDev Preview configuration constants
 */

/**
 * Maximum number of models that can be compared simultaneously
 */
export const MAX_WEBDEV_MODELS = 5;

/**
 * WCAG AA compliant badge colors for options A-E (white text on colored bg).
 * All contrast ratios >= 4.5:1 against white text.
 */
export const OPTION_COLORS = [
  { key: 'A', bg: '#7C3AED', tw: 'bg-violet-600', contrast: 7.2 },
  { key: 'B', bg: '#B45309', tw: 'bg-amber-700', contrast: 5.1 },
  { key: 'C', bg: '#0E7490', tw: 'bg-cyan-700', contrast: 5.0 },
  { key: 'D', bg: '#BE185D', tw: 'bg-pink-700', contrast: 6.2 },
  { key: 'E', bg: '#047857', tw: 'bg-emerald-700', contrast: 5.3 },
] as const;

/**
 * Dark mode badge colors (lighter variants for dark backgrounds).
 * Used for tab active indicators and accents in dark mode.
 */
export const OPTION_COLORS_DARK = [
  { key: 'A', bg: '#A78BFA', tw: 'bg-violet-400' },
  { key: 'B', bg: '#FBBF24', tw: 'bg-amber-400' },
  { key: 'C', bg: '#22D3EE', tw: 'bg-cyan-400' },
  { key: 'D', bg: '#F472B6', tw: 'bg-pink-400' },
  { key: 'E', bg: '#34D399', tw: 'bg-emerald-400' },
] as const;

/**
 * Status colors — WCAG AA compliant on white backgrounds.
 * Each entry has light (for light mode) and dark (for dark mode) variants.
 */
export const STATUS_COLORS = {
  complete: { light: '#15803D', dark: '#22C55E', tw: 'text-green-700 dark:text-green-500' },
  generating: { light: '#1D4ED8', dark: '#3B82F6', tw: 'text-blue-700 dark:text-blue-500' },
  building: { light: '#1D4ED8', dark: '#3B82F6', tw: 'text-blue-700 dark:text-blue-500' },
  error: { light: '#B91C1C', dark: '#EF4444', tw: 'text-red-700 dark:text-red-500' },
  idle: { light: '#71717A', dark: '#A1A1AA', tw: 'text-zinc-500 dark:text-zinc-400' },
} as const;

/**
 * Activity log icon colors by action type
 */
export const LOG_ICON_COLORS = {
  folder: 'text-zinc-500',
  'file-plus': 'text-green-700 dark:text-green-500',
  pencil: 'text-amber-600 dark:text-amber-400',
  eye: 'text-blue-600 dark:text-blue-400',
  'circle-check': 'text-green-700 dark:text-green-500',
  'circle-x': 'text-red-700 dark:text-red-500',
} as const;

export type OptionKey = (typeof OPTION_COLORS)[number]['key'];
export type StatusKey = keyof typeof STATUS_COLORS;
export type LogIconKey = keyof typeof LOG_ICON_COLORS;
