import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRotatedApiKey, KeyRotationManager, keyRotationManager } from './keyRotation';

describe('KeyRotationManager', () => {
  let manager: KeyRotationManager;

  beforeEach(() => {
    manager = new KeyRotationManager();
  });

  describe('registerPool', () => {
    it('registers a single key', () => {
      manager.registerPool('openai', 'key1');
      expect(manager.getKeys('openai')).toEqual(['key1']);
    });

    it('registers multiple keys', () => {
      manager.registerPool('openai', ['key1', 'key2', 'key3']);
      expect(manager.getKeys('openai')).toEqual(['key1', 'key2', 'key3']);
    });

    it('throws if no keys provided', () => {
      expect(() => manager.registerPool('openai', [])).toThrow('At least one API key is required');
    });

    it('uses round-robin strategy by default', () => {
      manager.registerPool('openai', ['key1', 'key2']);
      expect(manager.getPoolInfo('openai')?.strategy).toBe('round-robin');
    });

    it('accepts custom strategy', () => {
      manager.registerPool('openai', ['key1'], { strategy: 'random' });
      expect(manager.getPoolInfo('openai')?.strategy).toBe('random');
    });

    it('throws if weights length does not match keys for weighted strategy', () => {
      expect(() =>
        manager.registerPool('openai', ['key1', 'key2'], {
          strategy: 'weighted',
          weights: [1],
        }),
      ).toThrow('Weights array must match keys array length');
    });

    it('accepts matching weights for weighted strategy', () => {
      manager.registerPool('openai', ['key1', 'key2'], {
        strategy: 'weighted',
        weights: [1, 2],
      });
      expect(manager.getPoolInfo('openai')?.hasWeights).toBe(true);
    });
  });

  describe('getKey', () => {
    it('returns undefined for unregistered provider', () => {
      expect(manager.getKey('unknown')).toBeUndefined();
    });

    describe('round-robin strategy', () => {
      it('rotates through keys', () => {
        manager.registerPool('openai', ['key1', 'key2', 'key3']);

        expect(manager.getKey('openai')).toBe('key1');
        expect(manager.getKey('openai')).toBe('key2');
        expect(manager.getKey('openai')).toBe('key3');
        expect(manager.getKey('openai')).toBe('key1');
      });
    });

    describe('random strategy', () => {
      it('returns a key from the pool', () => {
        manager.registerPool('openai', ['key1', 'key2'], { strategy: 'random' });
        const key = manager.getKey('openai');

        expect(['key1', 'key2']).toContain(key);
      });
    });

    describe('weighted strategy', () => {
      it('returns weighted keys', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        manager.registerPool('openai', ['key1', 'key2'], {
          strategy: 'weighted',
          weights: [1, 9],
        });

        const key = manager.getKey('openai');
        expect(['key1', 'key2']).toContain(key);

        vi.restoreAllMocks();
      });

      it('falls back to round-robin if no weights', () => {
        manager.registerPool('openai', ['key1', 'key2'], { strategy: 'weighted' });

        expect(manager.getKey('openai')).toBe('key1');
        expect(manager.getKey('openai')).toBe('key2');
      });

      it('selects based on weight distribution', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.1);
        manager.registerPool('openai', ['key1', 'key2'], {
          strategy: 'weighted',
          weights: [90, 10],
        });

        const key = manager.getKey('openai');
        expect(key).toBe('key1');

        vi.restoreAllMocks();
      });
    });
  });

  describe('getKeys', () => {
    it('returns empty array for unregistered provider', () => {
      expect(manager.getKeys('unknown')).toEqual([]);
    });

    it('returns copy of keys array', () => {
      manager.registerPool('openai', ['key1', 'key2']);
      const keys = manager.getKeys('openai');

      keys.push('key3');
      expect(manager.getKeys('openai')).toEqual(['key1', 'key2']);
    });
  });

  describe('addKey', () => {
    it('adds key to existing pool', () => {
      manager.registerPool('openai', ['key1']);
      manager.addKey('openai', 'key2');

      expect(manager.getKeys('openai')).toEqual(['key1', 'key2']);
    });

    it('throws if pool does not exist', () => {
      expect(() => manager.addKey('unknown', 'key')).toThrow(
        'No key pool found for provider unknown',
      );
    });

    it('does not add duplicate keys', () => {
      manager.registerPool('openai', ['key1']);
      manager.addKey('openai', 'key1');

      expect(manager.getKeys('openai')).toEqual(['key1']);
    });

    it('requires weight for weighted pool', () => {
      manager.registerPool('openai', ['key1'], { strategy: 'weighted', weights: [1] });

      expect(() => manager.addKey('openai', 'key2')).toThrow(
        'Weight is required when adding a key to weighted pool openai',
      );
    });

    it('adds key with weight for weighted pool', () => {
      manager.registerPool('openai', ['key1'], { strategy: 'weighted', weights: [1] });
      manager.addKey('openai', 'key2', 2);

      expect(manager.getKeys('openai')).toEqual(['key1', 'key2']);
    });

    it('initializes weights array if missing for weighted pool', () => {
      manager.registerPool('openai', ['key1'], { strategy: 'weighted' });
      manager.addKey('openai', 'key2', 2);

      expect(manager.getPoolInfo('openai')?.hasWeights).toBe(true);
    });
  });

  describe('removeKey', () => {
    it('removes key from pool', () => {
      manager.registerPool('openai', ['key1', 'key2']);
      manager.removeKey('openai', 'key1');

      expect(manager.getKeys('openai')).toEqual(['key2']);
    });

    it('does nothing for non-existent provider', () => {
      expect(() => manager.removeKey('unknown', 'key')).not.toThrow();
    });

    it('does nothing for non-existent key', () => {
      manager.registerPool('openai', ['key1']);
      manager.removeKey('openai', 'key2');

      expect(manager.getKeys('openai')).toEqual(['key1']);
    });

    it('adjusts current index when needed', () => {
      manager.registerPool('openai', ['key1', 'key2']);
      manager.getKey('openai'); // index 0 -> 1
      manager.getKey('openai'); // index 1 -> 0 (wrapped)

      manager.removeKey('openai', 'key2');

      expect(manager.getKey('openai')).toBe('key1');
    });

    it('removes corresponding weight', () => {
      manager.registerPool('openai', ['key1', 'key2'], {
        strategy: 'weighted',
        weights: [1, 2],
      });
      manager.removeKey('openai', 'key1');

      expect(manager.getKeys('openai')).toEqual(['key2']);
    });
  });

  describe('clear', () => {
    it('clears all pools', () => {
      manager.registerPool('openai', ['key1']);
      manager.registerPool('anthropic', ['key2']);

      manager.clear();

      expect(manager.getKeys('openai')).toEqual([]);
      expect(manager.getKeys('anthropic')).toEqual([]);
    });
  });

  describe('clearProvider', () => {
    it('clears specific provider pool', () => {
      manager.registerPool('openai', ['key1']);
      manager.registerPool('anthropic', ['key2']);

      manager.clearProvider('openai');

      expect(manager.getKeys('openai')).toEqual([]);
      expect(manager.getKeys('anthropic')).toEqual(['key2']);
    });
  });

  describe('getPoolInfo', () => {
    it('returns undefined for unknown provider', () => {
      expect(manager.getPoolInfo('unknown')).toBeUndefined();
    });

    it('returns pool information', () => {
      manager.registerPool('openai', ['key1', 'key2'], {
        strategy: 'weighted',
        weights: [1, 2],
      });

      const info = manager.getPoolInfo('openai');
      expect(info).toEqual({
        keyCount: 2,
        strategy: 'weighted',
        hasWeights: true,
      });
    });
  });
});

describe('keyRotationManager', () => {
  beforeEach(() => {
    keyRotationManager.clear();
  });

  it('is a global instance', () => {
    expect(keyRotationManager).toBeInstanceOf(KeyRotationManager);
  });
});

describe('getRotatedApiKey', () => {
  beforeEach(() => {
    keyRotationManager.clear();
  });

  it('registers and returns key when apiKeys provided', () => {
    const key = getRotatedApiKey('openai', undefined, ['key1', 'key2']);
    expect(['key1', 'key2']).toContain(key);
  });

  it('registers string apiKeys', () => {
    const key = getRotatedApiKey('openai', undefined, 'single-key');
    expect(key).toBe('single-key');
  });

  it('returns from existing pool if keys have not changed', () => {
    getRotatedApiKey('openai', undefined, ['key1', 'key2']);
    const key = getRotatedApiKey('openai', undefined, ['key1', 'key2']);

    expect(['key1', 'key2']).toContain(key);
  });

  it('re-registers if keys have changed', () => {
    getRotatedApiKey('openai', undefined, ['key1']);
    const key = getRotatedApiKey('openai', undefined, ['key2', 'key3']);

    expect(['key2', 'key3']).toContain(key);
  });

  it('returns rotated key from existing pool', () => {
    keyRotationManager.registerPool('openai', ['key1', 'key2']);
    const key = getRotatedApiKey('openai');

    expect(['key1', 'key2']).toContain(key);
  });

  it('falls back to single apiKey if no pool exists', () => {
    const key = getRotatedApiKey('unknown', 'fallback-key');
    expect(key).toBe('fallback-key');
  });

  it('returns undefined if no key available', () => {
    const key = getRotatedApiKey('unknown');
    expect(key).toBeUndefined();
  });
});
