import { describe, expect, it, vi } from 'vitest';
import { buildProviderConfigs, createProvider, type KeyData } from './provider-factory';

vi.mock('@lmring/ai-hub', () => ({
  ProviderBuilder: {
    openai: vi.fn((key, baseURL) => ({ type: 'openai', key, baseURL })),
    anthropic: vi.fn((key, baseURL) => ({ type: 'anthropic', key, baseURL })),
    deepseek: vi.fn((key, baseURL) => ({ type: 'deepseek', key, baseURL })),
    mistral: vi.fn((key, baseURL) => ({ type: 'mistral', key, baseURL })),
    xai: vi.fn((key, baseURL) => ({ type: 'xai', key, baseURL })),
    openrouter: vi.fn((key, baseURL) => ({ type: 'openrouter', key, baseURL })),
    compatible: vi.fn((name, key, baseURL) => ({ type: 'compatible', name, key, baseURL })),
  },
}));

vi.mock('@lmring/database', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
  decrypt: vi.fn((encrypted) => `decrypted-${encrypted}`),
  eq: vi.fn(),
  and: vi.fn(),
  inArray: vi.fn(),
}));

vi.mock('@lmring/database/schema', () => ({
  apiKeys: {},
}));

describe('provider-factory', () => {
  describe('createProvider', () => {
    it('should create openai provider', () => {
      const provider = createProvider('openai', 'sk-123');
      expect(provider).toEqual({ type: 'openai', key: 'sk-123', baseURL: undefined });
    });

    it('should create anthropic provider', () => {
      const provider = createProvider('anthropic', 'sk-ant-123');
      expect(provider).toEqual({ type: 'anthropic', key: 'sk-ant-123', baseURL: undefined });
    });

    it('should create deepseek provider', () => {
      const provider = createProvider('deepseek', 'sk-ds-123');
      expect(provider).toEqual({ type: 'deepseek', key: 'sk-ds-123', baseURL: undefined });
    });

    it('should create mistral provider', () => {
      const provider = createProvider('mistral', 'sk-mistral-123');
      expect(provider).toEqual({ type: 'mistral', key: 'sk-mistral-123', baseURL: undefined });
    });

    it('should create xai provider', () => {
      const provider = createProvider('xai', 'xai-123');
      expect(provider).toEqual({ type: 'xai', key: 'xai-123', baseURL: undefined });
    });

    it('should create openrouter provider', () => {
      const provider = createProvider('openrouter', 'sk-or-123');
      expect(provider).toEqual({ type: 'openrouter', key: 'sk-or-123', baseURL: undefined });
    });

    it('should create google provider as compatible', () => {
      const provider = createProvider('google', 'google-key');
      expect(provider).toEqual({
        type: 'compatible',
        name: 'google',
        key: 'google-key',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
    });

    it('should create cohere provider as compatible', () => {
      const provider = createProvider('cohere', 'cohere-key');
      expect(provider).toEqual({
        type: 'compatible',
        name: 'cohere',
        key: 'cohere-key',
        baseURL: 'https://api.cohere.ai/v1',
      });
    });

    it('should create together provider as compatible', () => {
      const provider = createProvider('together', 'together-key');
      expect(provider).toEqual({
        type: 'compatible',
        name: 'together',
        key: 'together-key',
        baseURL: 'https://api.together.xyz/v1',
      });
    });

    it('should create perplexity provider as compatible', () => {
      const provider = createProvider('perplexity', 'perp-key');
      expect(provider).toEqual({
        type: 'compatible',
        name: 'perplexity',
        key: 'perp-key',
        baseURL: 'https://api.perplexity.ai',
      });
    });

    it('should throw for unsupported provider', () => {
      expect(() => createProvider('unsupported' as 'openai', 'key')).toThrow(
        'Unsupported provider: unsupported',
      );
    });

    it('should normalize proxy URL without version', () => {
      const provider = createProvider('openai', 'sk-123', 'https://proxy.example.com');
      expect(provider).toEqual({
        type: 'openai',
        key: 'sk-123',
        baseURL: 'https://proxy.example.com/v1',
      });
    });

    it('should normalize proxy URL with trailing slash', () => {
      const provider = createProvider('openai', 'sk-123', 'https://proxy.example.com/');
      expect(provider).toEqual({
        type: 'openai',
        key: 'sk-123',
        baseURL: 'https://proxy.example.com/v1',
      });
    });

    it('should keep proxy URL with version intact', () => {
      const provider = createProvider('openai', 'sk-123', 'https://proxy.example.com/v1');
      expect(provider).toEqual({
        type: 'openai',
        key: 'sk-123',
        baseURL: 'https://proxy.example.com/v1',
      });
    });

    it('should keep proxy URL with v2 version intact', () => {
      const provider = createProvider('openai', 'sk-123', 'https://proxy.example.com/v2');
      expect(provider).toEqual({
        type: 'openai',
        key: 'sk-123',
        baseURL: 'https://proxy.example.com/v2',
      });
    });

    it('should keep proxy URL with beta version intact', () => {
      const provider = createProvider('openai', 'sk-123', 'https://proxy.example.com/v1beta');
      expect(provider).toEqual({
        type: 'openai',
        key: 'sk-123',
        baseURL: 'https://proxy.example.com/v1beta',
      });
    });

    it('should handle proxy URL ending with hash', () => {
      const provider = createProvider('openai', 'sk-123', 'https://proxy.example.com#');
      expect(provider).toEqual({
        type: 'openai',
        key: 'sk-123',
        baseURL: 'https://proxy.example.com#',
      });
    });

    it('should use custom proxy URL for compatible providers', () => {
      const provider = createProvider('google', 'google-key', 'https://custom.proxy.com');
      expect(provider).toEqual({
        type: 'compatible',
        name: 'google',
        key: 'google-key',
        baseURL: 'https://custom.proxy.com/v1',
      });
    });
  });

  describe('buildProviderConfigs', () => {
    it('should build configs from model entries', () => {
      const models = [
        { keyId: 'key-1', modelId: 'gpt-4', options: { temperature: 0.7 } },
        { keyId: 'key-2', modelId: 'claude-3', options: { maxTokens: 1000 } },
      ];
      const keyMap = new Map<string, KeyData>([
        [
          'key-1',
          {
            providerName: 'openai',
            apiKey: 'sk-123',
            proxyUrl: null,
            isCustom: false,
            providerType: null,
          },
        ],
        [
          'key-2',
          {
            providerName: 'anthropic',
            apiKey: 'sk-ant-123',
            proxyUrl: null,
            isCustom: false,
            providerType: null,
          },
        ],
      ]);

      const configs = buildProviderConfigs(models, keyMap);

      expect(configs).toHaveLength(2);
      expect(configs[0]?.model).toBe('gpt-4');
      expect(configs[0]?.options).toEqual({ temperature: 0.7 });
      expect(configs[1]?.model).toBe('claude-3');
      expect(configs[1]?.options).toEqual({ maxTokens: 1000 });
    });

    it('should throw error for missing key', () => {
      const models = [{ keyId: 'missing-key', modelId: 'gpt-4' }];
      const keyMap = new Map<string, KeyData>();

      expect(() => buildProviderConfigs(models, keyMap)).toThrow(
        'API key not found or not authorized: missing-key',
      );
    });

    it('should use proxy URL when available', () => {
      const models = [{ keyId: 'key-1', modelId: 'gpt-4' }];
      const keyMap = new Map<string, KeyData>([
        [
          'key-1',
          {
            providerName: 'openai',
            apiKey: 'sk-123',
            proxyUrl: 'https://proxy.example.com',
            isCustom: false,
            providerType: null,
          },
        ],
      ]);

      const configs = buildProviderConfigs(models, keyMap);

      expect(configs[0]?.provider).toEqual({
        type: 'openai',
        key: 'sk-123',
        baseURL: 'https://proxy.example.com/v1',
      });
    });

    it('should default to empty options when not provided', () => {
      const models = [{ keyId: 'key-1', modelId: 'gpt-4' }];
      const keyMap = new Map<string, KeyData>([
        [
          'key-1',
          {
            providerName: 'openai',
            apiKey: 'sk-123',
            proxyUrl: null,
            isCustom: false,
            providerType: null,
          },
        ],
      ]);

      const configs = buildProviderConfigs(models, keyMap);

      expect(configs[0]?.options).toEqual({});
    });
  });
});
