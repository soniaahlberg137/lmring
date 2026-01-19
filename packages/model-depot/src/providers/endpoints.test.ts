import { describe, expect, it } from 'vitest';
import { getEndpointConfig, PROVIDER_ENDPOINTS } from './endpoints';

describe('PROVIDER_ENDPOINTS', () => {
  it('contains official provider endpoints', () => {
    expect(PROVIDER_ENDPOINTS.openai).toBeDefined();
    expect(PROVIDER_ENDPOINTS.anthropic).toBeDefined();
    expect(PROVIDER_ENDPOINTS.google).toBeDefined();
  });

  it('has valid baseURL for all providers', () => {
    for (const [, config] of Object.entries(PROVIDER_ENDPOINTS)) {
      expect(config.baseURL).toBeDefined();
      expect(typeof config.baseURL).toBe('string');
      expect(config.baseURL.length).toBeGreaterThan(0);
    }
  });

  it('has correct URLs for known providers', () => {
    expect(getEndpointConfig('openai')?.baseURL).toBe('https://api.openai.com/v1');
    expect(getEndpointConfig('anthropic')?.baseURL).toBe('https://api.anthropic.com');
    expect(getEndpointConfig('groq')?.baseURL).toBe('https://api.groq.com/openai/v1');
  });

  it('supports alternativeBaseURL for some providers', () => {
    expect(getEndpointConfig('zhipu')?.alternativeBaseURL).toBe(
      'https://open.bigmodel.cn/api/anthropic',
    );
    expect(getEndpointConfig('minimax')?.alternativeBaseURL).toBe(
      'https://api.minimax.chat/v1/anthropic',
    );
  });

  it('contains Chinese provider endpoints', () => {
    expect(getEndpointConfig('silicon')?.baseURL).toBe('https://api.siliconflow.cn/v1');
    expect(getEndpointConfig('dashscope')?.baseURL).toBe(
      'https://dashscope.aliyuncs.com/compatible-mode/v1',
    );
    expect(getEndpointConfig('zhipu')?.baseURL).toBe('https://open.bigmodel.cn/api/paas/v4');
  });

  it('contains local provider endpoints', () => {
    expect(getEndpointConfig('lmstudio')?.baseURL).toBe('http://127.0.0.1:1234/v1');
    expect(getEndpointConfig('vllm')?.baseURL).toBe('http://localhost:8000/v1');
    expect(getEndpointConfig('xinference')?.baseURL).toBe('http://localhost:9997/v1');
  });
});

describe('getEndpointConfig', () => {
  it('returns config for valid provider', () => {
    const config = getEndpointConfig('openai');
    expect(config).toBeDefined();
    expect(config?.baseURL).toBe('https://api.openai.com/v1');
  });

  it('returns config with alternativeBaseURL when available', () => {
    const config = getEndpointConfig('zhipu');
    expect(config?.baseURL).toBeDefined();
    expect(config?.alternativeBaseURL).toBeDefined();
  });

  it('returns undefined for invalid provider', () => {
    expect(getEndpointConfig('invalid')).toBeUndefined();
    expect(getEndpointConfig('')).toBeUndefined();
  });

  it('returns config for all known providers', () => {
    const knownProviders = ['openai', 'anthropic', 'google', 'groq', 'zhipu', 'lmstudio'];
    for (const provider of knownProviders) {
      expect(getEndpointConfig(provider)).toBeDefined();
    }
  });
});
