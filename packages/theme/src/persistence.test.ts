import { describe, expect, it } from 'vitest';
import { serialize, deserialize } from './persistence';
import type { PersistedThemeConfig } from './types';

const validConfig: PersistedThemeConfig = {
  mode: 'dark',
  seedColor: { l: 0.55, c: 0.18, h: 255 },
  presetName: 'ocean-blue',
};

describe('serialize', () => {
  it('returns a JSON string', () => {
    const result = serialize(validConfig);
    expect(JSON.parse(result)).toEqual(validConfig);
  });
});

describe('deserialize', () => {
  it('round-trips a valid config', () => {
    expect(deserialize(serialize(validConfig))).toEqual(validConfig);
  });

  it('accepts null presetName', () => {
    const cfg: PersistedThemeConfig = { ...validConfig, presetName: null };
    expect(deserialize(serialize(cfg))).toEqual(cfg);
  });

  it.each(['light', 'dark', 'system'] as const)('accepts mode "%s"', (mode) => {
    const cfg: PersistedThemeConfig = { ...validConfig, mode };
    expect(deserialize(serialize(cfg))).toEqual(cfg);
  });

  it('returns null for invalid JSON', () => {
    expect(deserialize('not json')).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    expect(deserialize('"hello"')).toBeNull();
    expect(deserialize('42')).toBeNull();
    expect(deserialize('[]')).toBeNull();
    expect(deserialize('null')).toBeNull();
  });

  it('returns null for invalid mode', () => {
    expect(deserialize(JSON.stringify({ ...validConfig, mode: 'auto' }))).toBeNull();
  });

  it('returns null when seedColor.l is out of range', () => {
    expect(
      deserialize(JSON.stringify({ ...validConfig, seedColor: { l: 1.5, c: 0.1, h: 100 } })),
    ).toBeNull();
    expect(
      deserialize(JSON.stringify({ ...validConfig, seedColor: { l: -0.1, c: 0.1, h: 100 } })),
    ).toBeNull();
  });

  it('returns null when seedColor.c is out of range', () => {
    expect(
      deserialize(JSON.stringify({ ...validConfig, seedColor: { l: 0.5, c: 0.5, h: 100 } })),
    ).toBeNull();
  });

  it('returns null when seedColor.h is out of range', () => {
    expect(
      deserialize(JSON.stringify({ ...validConfig, seedColor: { l: 0.5, c: 0.1, h: 400 } })),
    ).toBeNull();
  });

  it('returns null when seedColor is not an object', () => {
    expect(deserialize(JSON.stringify({ ...validConfig, seedColor: 'red' }))).toBeNull();
  });

  it('returns null when presetName is a number', () => {
    expect(deserialize(JSON.stringify({ ...validConfig, presetName: 123 }))).toBeNull();
  });

  it('accepts boundary values for seedColor', () => {
    const boundary: PersistedThemeConfig = {
      mode: 'system',
      seedColor: { l: 0, c: 0, h: 0 },
      presetName: null,
    };
    expect(deserialize(serialize(boundary))).toEqual(boundary);

    const upperBoundary: PersistedThemeConfig = {
      mode: 'light',
      seedColor: { l: 1, c: 0.4, h: 360 },
      presetName: 'test',
    };
    expect(deserialize(serialize(upperBoundary))).toEqual(upperBoundary);
  });
});
