import { describe, expect, it } from 'vitest';
import { DashScopeVideoProvider } from './dashscope';

function createProvider(baseURL?: string) {
  return new DashScopeVideoProvider({
    apiKey: 'test-key',
    ...(baseURL ? { baseURL } : {}),
  });
}

describe('DashScopeVideoProvider baseURL', () => {
  it('uses default baseURL when no config is provided', () => {
    const provider = createProvider();
    // Access via the public defaultBaseURL to verify the default
    expect(provider.defaultBaseURL).toBe('https://dashscope.aliyuncs.com/api/v1');
  });

  it('passes through correct /api/v1 URL unchanged', () => {
    const provider = createProvider('https://dashscope.aliyuncs.com/api/v1');
    // @ts-expect-error -- accessing protected getter for testing
    expect(provider.baseURL).toBe('https://dashscope.aliyuncs.com/api/v1');
  });

  it('rewrites compatible-mode URL to /api/', () => {
    const provider = createProvider('https://dashscope.aliyuncs.com/compatible-mode/v1');
    // @ts-expect-error -- accessing protected getter for testing
    expect(provider.baseURL).toBe('https://dashscope.aliyuncs.com/api/v1');
  });

  it('strips /v2 prefix and appends qwen/api/v1 for third-party proxy URLs', () => {
    const provider = createProvider('https://proxy.example.com/v2');
    // @ts-expect-error -- accessing protected getter for testing
    expect(provider.baseURL).toBe('https://proxy.example.com/qwen/api/v1');
  });

  it('strips /v1 prefix and appends qwen/api/v1 for third-party proxy URLs', () => {
    const provider = createProvider('https://proxy.example.com/v1');
    // @ts-expect-error -- accessing protected getter for testing
    expect(provider.baseURL).toBe('https://proxy.example.com/qwen/api/v1');
  });

  it('appends qwen/api/v1 for third-party proxy without version prefix', () => {
    const provider = createProvider('https://proxy.example.com');
    // @ts-expect-error -- accessing protected getter for testing
    expect(provider.baseURL).toBe('https://proxy.example.com/qwen/api/v1');
  });

  it('appends qwen/api/v1 for third-party proxy with compatible-mode path', () => {
    const provider = createProvider('https://proxy.example.com/compatible-mode/v1');
    // @ts-expect-error -- accessing protected getter for testing
    expect(provider.baseURL).toBe('https://proxy.example.com/compatible-mode/qwen/api/v1');
  });

  it('rewrites international DashScope URL', () => {
    const provider = createProvider('https://dashscope-intl.aliyuncs.com/compatible-mode/v1');
    // @ts-expect-error -- accessing protected getter for testing
    expect(provider.baseURL).toBe('https://dashscope-intl.aliyuncs.com/api/v1');
  });
});
