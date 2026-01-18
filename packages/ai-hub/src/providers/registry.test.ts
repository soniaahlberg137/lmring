import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigurationError } from '../utils/errors';
import { ProviderRegistry, registry } from './registry';

describe('ProviderRegistry', () => {
  let reg: ProviderRegistry;

  beforeEach(() => {
    reg = new ProviderRegistry();
  });

  describe('register', () => {
    it('registers a provider', () => {
      reg.register({ id: 'openai', name: 'OpenAI', type: 'official' });
      expect(reg.has('openai')).toBe(true);
    });

    it('throws if id is missing', () => {
      expect(() => reg.register({ id: '', name: 'Test', type: 'official' })).toThrow(
        ConfigurationError,
      );
      expect(() => reg.register({ id: '', name: 'Test', type: 'official' })).toThrow(
        'Provider id is required',
      );
    });
  });

  describe('registerWithAliases', () => {
    it('registers provider with aliases', () => {
      reg.registerWithAliases({ id: 'openai', name: 'OpenAI', type: 'official' }, [
        'gpt',
        'chatgpt',
      ]);

      expect(reg.has('openai')).toBe(true);
      expect(reg.has('gpt')).toBe(true);
      expect(reg.has('chatgpt')).toBe(true);
    });

    it('aliases resolve to same provider', () => {
      reg.registerWithAliases({ id: 'openai', name: 'OpenAI', type: 'official' }, ['gpt']);

      expect(reg.get('gpt')).toEqual(reg.get('openai'));
    });

    it('works without aliases', () => {
      reg.registerWithAliases({ id: 'test', name: 'Test', type: 'official' });
      expect(reg.has('test')).toBe(true);
    });
  });

  describe('registerBatch', () => {
    it('registers multiple providers', () => {
      reg.registerBatch([
        { id: 'openai', name: 'OpenAI', type: 'official' },
        { id: 'anthropic', name: 'Anthropic', type: 'official' },
      ]);

      expect(reg.has('openai')).toBe(true);
      expect(reg.has('anthropic')).toBe(true);
    });
  });

  describe('get', () => {
    it('returns provider config', () => {
      reg.register({ id: 'test', name: 'Test', type: 'compatible' });
      const config = reg.get('test');

      expect(config?.id).toBe('test');
      expect(config?.type).toBe('compatible');
    });

    it('returns undefined for unknown provider', () => {
      expect(reg.get('unknown')).toBeUndefined();
    });

    it('resolves aliases', () => {
      reg.registerWithAliases({ id: 'openai', name: 'OpenAI', type: 'official' }, ['gpt']);
      expect(reg.get('gpt')?.id).toBe('openai');
    });
  });

  describe('has', () => {
    it('returns true for registered provider', () => {
      reg.register({ id: 'test', name: 'Test', type: 'official' });
      expect(reg.has('test')).toBe(true);
    });

    it('returns false for unregistered provider', () => {
      expect(reg.has('unknown')).toBe(false);
    });

    it('returns true for aliases', () => {
      reg.registerWithAliases({ id: 'test', name: 'Test', type: 'official' }, ['alias']);
      expect(reg.has('alias')).toBe(true);
    });
  });

  describe('list', () => {
    it('returns all providers', () => {
      reg.register({ id: 'a', name: 'A', type: 'official' });
      reg.register({ id: 'b', name: 'B', type: 'compatible' });

      const list = reg.list();
      expect(list).toHaveLength(2);
    });

    it('returns empty array when no providers', () => {
      expect(reg.list()).toHaveLength(0);
    });
  });

  describe('listByType', () => {
    it('filters by type official', () => {
      reg.register({ id: 'a', name: 'A', type: 'official' });
      reg.register({ id: 'b', name: 'B', type: 'compatible' });
      reg.register({ id: 'c', name: 'C', type: 'official' });

      const official = reg.listByType('official');
      expect(official).toHaveLength(2);
    });

    it('filters by type compatible', () => {
      reg.register({ id: 'a', name: 'A', type: 'official' });
      reg.register({ id: 'b', name: 'B', type: 'compatible' });

      const compatible = reg.listByType('compatible');
      expect(compatible).toHaveLength(1);
      expect(compatible[0]?.id).toBe('b');
    });

    it('returns empty array for type with no providers', () => {
      reg.register({ id: 'a', name: 'A', type: 'official' });
      expect(reg.listByType('custom')).toHaveLength(0);
    });
  });

  describe('cacheInstance', () => {
    it('caches provider instance', () => {
      const instance = { providerId: 'test' } as never;
      reg.cacheInstance('test', instance);

      expect(reg.getCachedInstance('test')).toBe(instance);
    });

    it('resolves alias when caching', () => {
      reg.registerWithAliases({ id: 'test', name: 'Test', type: 'official' }, ['alias']);
      const instance = { providerId: 'test' } as never;
      reg.cacheInstance('alias', instance);

      expect(reg.getCachedInstance('test')).toBe(instance);
    });
  });

  describe('getCachedInstance', () => {
    it('returns cached instance', () => {
      const instance = { providerId: 'test' } as never;
      reg.cacheInstance('test', instance);

      expect(reg.getCachedInstance('test')).toBe(instance);
    });

    it('returns undefined if not cached', () => {
      expect(reg.getCachedInstance('unknown')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('clears all providers and cache', () => {
      reg.register({ id: 'test', name: 'Test', type: 'official' });
      reg.registerWithAliases({ id: 'test2', name: 'Test2', type: 'official' }, ['alias']);
      reg.cacheInstance('test', {} as never);

      reg.clear();

      expect(reg.list()).toHaveLength(0);
      expect(reg.has('test')).toBe(false);
      expect(reg.has('alias')).toBe(false);
      expect(reg.getCachedInstance('test')).toBeUndefined();
    });
  });
});

describe('registry (global instance)', () => {
  it('is an instance of ProviderRegistry', () => {
    expect(registry).toBeInstanceOf(ProviderRegistry);
  });
});
