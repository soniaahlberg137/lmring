import { beforeEach, describe, expect, it } from 'vitest';
import { registry } from '../providers/registry';
import { getAllProviderUrls, getDefaultProviderUrl } from './defaultUrls';

describe('getDefaultProviderUrl', () => {
  beforeEach(() => {
    registry.clear();
  });

  describe('official providers', () => {
    it('returns OpenAI URL', () => {
      expect(getDefaultProviderUrl('openai')).toBe('https://api.openai.com/v1');
    });

    it('returns Anthropic URL', () => {
      expect(getDefaultProviderUrl('anthropic')).toBe('https://api.anthropic.com/v1');
    });

    it('returns xAI URL', () => {
      expect(getDefaultProviderUrl('xai')).toBe('https://api.x.ai/v1');
    });

    it('returns DeepSeek URL', () => {
      expect(getDefaultProviderUrl('deepseek')).toBe('https://api.deepseek.com/v1');
    });

    it('returns Mistral URL', () => {
      expect(getDefaultProviderUrl('mistral')).toBe('https://api.mistral.ai/v1');
    });

    it('returns OpenRouter URL', () => {
      expect(getDefaultProviderUrl('openrouter')).toBe('https://openrouter.ai/api/v1');
    });

    it('returns Gemini URL', () => {
      expect(getDefaultProviderUrl('gemini')).toBe(
        'https://generativelanguage.googleapis.com/v1beta/openai/',
      );
    });

    it('returns null for Azure (requires config)', () => {
      expect(getDefaultProviderUrl('azure')).toBeNull();
    });

    it('returns null for Vertex (requires config)', () => {
      expect(getDefaultProviderUrl('vertex')).toBeNull();
    });

    it('returns null for Bedrock (different auth)', () => {
      expect(getDefaultProviderUrl('bedrock')).toBeNull();
    });
  });

  describe('compatible providers from registry', () => {
    it('returns baseURL from registry config', () => {
      registry.register({
        id: 'custom-provider',
        name: 'Custom',
        type: 'compatible',
        compatibleConfig: {
          baseURL: 'https://custom.api.com/v1',
        },
      });

      expect(getDefaultProviderUrl('custom-provider')).toBe('https://custom.api.com/v1');
    });

    it('prefers registry baseURL over official URL', () => {
      registry.register({
        id: 'openai',
        name: 'Custom OpenAI',
        type: 'compatible',
        compatibleConfig: {
          baseURL: 'https://custom-openai.api.com/v1',
        },
      });

      expect(getDefaultProviderUrl('openai')).toBe('https://custom-openai.api.com/v1');
    });
  });

  describe('unknown providers', () => {
    it('returns null for unknown provider', () => {
      expect(getDefaultProviderUrl('unknown-provider')).toBeNull();
    });
  });
});

describe('getAllProviderUrls', () => {
  beforeEach(() => {
    registry.clear();
  });

  it('returns all official provider URLs', () => {
    const urls = getAllProviderUrls();

    expect(urls.openai).toBe('https://api.openai.com/v1');
    expect(urls.anthropic).toBe('https://api.anthropic.com/v1');
    expect(urls.xai).toBe('https://api.x.ai/v1');
  });

  it('includes providers that require config with null', () => {
    const urls = getAllProviderUrls();

    expect(urls.azure).toBeNull();
    expect(urls.vertex).toBeNull();
  });

  it('includes compatible providers from registry', () => {
    registry.register({
      id: 'silicon',
      name: 'Silicon Flow',
      type: 'compatible',
      compatibleConfig: {
        baseURL: 'https://api.siliconflow.cn/v1',
      },
    });

    const urls = getAllProviderUrls();

    expect(urls.silicon).toBe('https://api.siliconflow.cn/v1');
  });

  it('returns null for compatible providers without baseURL', () => {
    registry.register({
      id: 'broken',
      name: 'Broken',
      type: 'compatible',
    });

    const urls = getAllProviderUrls();

    expect(urls.broken).toBeNull();
  });
});
