import { describe, expect, it } from 'vitest';
import {
  ALL_PROVIDER_METADATA,
  COMPATIBLE_PROVIDER_METADATA,
  getAllProviderIds,
  getProviderMetadata,
  getProvidersByType,
  OFFICIAL_PROVIDER_METADATA,
} from './metadata';

describe('OFFICIAL_PROVIDER_METADATA', () => {
  it('contains official providers with correct type', () => {
    expect(OFFICIAL_PROVIDER_METADATA.length).toBeGreaterThan(0);
    for (const provider of OFFICIAL_PROVIDER_METADATA) {
      expect(provider.type).toBe('official');
      expect(provider.id).toBeDefined();
      expect(provider.name).toBeDefined();
    }
  });

  it('includes known official providers', () => {
    const ids = OFFICIAL_PROVIDER_METADATA.map((p) => p.id);
    expect(ids).toContain('openai');
    expect(ids).toContain('anthropic');
    expect(ids).toContain('google');
    expect(ids).toContain('ollama');
  });
});

describe('COMPATIBLE_PROVIDER_METADATA', () => {
  it('contains compatible providers with correct type', () => {
    expect(COMPATIBLE_PROVIDER_METADATA.length).toBeGreaterThan(0);
    for (const provider of COMPATIBLE_PROVIDER_METADATA) {
      expect(provider.type).toBe('compatible');
      expect(provider.id).toBeDefined();
      expect(provider.name).toBeDefined();
    }
  });

  it('includes known compatible providers', () => {
    const ids = COMPATIBLE_PROVIDER_METADATA.map((p) => p.id);
    expect(ids).toContain('groq');
    expect(ids).toContain('zhipu');
    expect(ids).toContain('silicon');
  });
});

describe('ALL_PROVIDER_METADATA', () => {
  it('combines official and compatible providers', () => {
    expect(ALL_PROVIDER_METADATA.length).toBe(
      OFFICIAL_PROVIDER_METADATA.length + COMPATIBLE_PROVIDER_METADATA.length,
    );
  });

  it('has unique provider IDs', () => {
    const ids = ALL_PROVIDER_METADATA.map((p) => p.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });
});

describe('getProviderMetadata', () => {
  it('returns metadata for valid provider', () => {
    const openai = getProviderMetadata('openai');
    expect(openai).toBeDefined();
    expect(openai?.id).toBe('openai');
    expect(openai?.name).toBe('OpenAI');
    expect(openai?.type).toBe('official');
  });

  it('returns metadata with capabilities', () => {
    const anthropic = getProviderMetadata('anthropic');
    expect(anthropic?.supportsStreaming).toBe(true);
    expect(anthropic?.supportsStructuredOutput).toBe(true);
  });

  it('returns undefined for invalid provider', () => {
    expect(getProviderMetadata('invalid')).toBeUndefined();
    expect(getProviderMetadata('')).toBeUndefined();
  });
});

describe('getProvidersByType', () => {
  it('returns official providers', () => {
    const official = getProvidersByType('official');
    expect(official.length).toBe(OFFICIAL_PROVIDER_METADATA.length);
    for (const provider of official) {
      expect(provider.type).toBe('official');
    }
  });

  it('returns compatible providers', () => {
    const compatible = getProvidersByType('compatible');
    expect(compatible.length).toBe(COMPATIBLE_PROVIDER_METADATA.length);
    for (const provider of compatible) {
      expect(provider.type).toBe('compatible');
    }
  });

  it('returns empty array for custom type', () => {
    const custom = getProvidersByType('custom');
    expect(custom).toEqual([]);
  });
});

describe('getAllProviderIds', () => {
  it('returns all provider IDs', () => {
    const ids = getAllProviderIds();
    expect(ids.length).toBe(ALL_PROVIDER_METADATA.length);
    expect(ids).toContain('openai');
    expect(ids).toContain('anthropic');
    expect(ids).toContain('groq');
  });

  it('returns strings only', () => {
    const ids = getAllProviderIds();
    for (const id of ids) {
      expect(typeof id).toBe('string');
    }
  });
});
