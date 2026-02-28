/**
 * Theme configuration serialization and deserialization.
 *
 * Provides pure-function helpers for persisting a {@link PersistedThemeConfig}
 * to/from JSON strings. Deserialization includes full validation so callers
 * can safely trust the returned value.
 */

import type { PersistedThemeConfig, OklchColor } from './types';

const VALID_MODES = new Set<PersistedThemeConfig['mode']>([
  'light',
  'dark',
  'system',
]);

/** Serialize a theme config to a JSON string. */
export function serialize(config: PersistedThemeConfig): string {
  return JSON.stringify(config);
}

/**
 * Deserialize a raw JSON string into a validated {@link PersistedThemeConfig}.
 *
 * Returns `null` when:
 * - the string is not valid JSON
 * - any field fails validation (mode enum, OKLCH ranges, presetName type)
 */
export function deserialize(raw: string): PersistedThemeConfig | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;

  // Validate mode
  if (!VALID_MODES.has(obj.mode as PersistedThemeConfig['mode'])) {
    return null;
  }

  // Validate seedColor
  if (!isValidOklchColor(obj.seedColor)) {
    return null;
  }

  // Validate presetName
  if (obj.presetName !== null && typeof obj.presetName !== 'string') {
    return null;
  }

  return {
    mode: obj.mode as PersistedThemeConfig['mode'],
    seedColor: obj.seedColor as OklchColor,
    presetName: obj.presetName as string | null,
  };
}

function isValidOklchColor(value: unknown): value is OklchColor {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const color = value as Record<string, unknown>;

  return (
    typeof color.l === 'number' &&
    typeof color.c === 'number' &&
    typeof color.h === 'number' &&
    color.l >= 0 &&
    color.l <= 1 &&
    color.c >= 0 &&
    color.c <= 0.4 &&
    color.h >= 0 &&
    color.h <= 360
  );
}
