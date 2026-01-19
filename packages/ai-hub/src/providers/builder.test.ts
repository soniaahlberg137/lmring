import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationError, ProviderError } from '../utils/errors';
import { ConfigurableBuilder, ProviderBuilder } from './builder';
import { registry } from './registry';

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

vi.mock('@ai-sdk/azure', () => ({
  createAzure: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

vi.mock('@ai-sdk/google-vertex', () => ({
  createVertex: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

vi.mock('@ai-sdk/xai', () => ({
  createXai: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

vi.mock('@ai-sdk/mistral', () => ({
  createMistral: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

vi.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: vi.fn(() => ({
    languageModel: vi.fn((id: string) => ({ modelId: id })),
  })),
}));

describe('ProviderBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registry.clear();
  });

  describe('openai', () => {
    it('creates OpenAI provider with API key', async () => {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const instance = ProviderBuilder.openai('test-key');

      expect(createOpenAI).toHaveBeenCalledWith({ apiKey: 'test-key', baseURL: undefined });
      expect(instance.providerId).toBe('openai');
      expect(instance.apiKey).toBe('test-key');
    });

    it('creates OpenAI provider with custom baseURL', async () => {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const instance = ProviderBuilder.openai('test-key', 'https://custom.api');

      expect(createOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        baseURL: 'https://custom.api',
      });
      expect(instance.baseURL).toBe('https://custom.api');
    });

    it('languageModel returns model', () => {
      const instance = ProviderBuilder.openai('test-key');
      const model = instance.languageModel('gpt-4');
      expect(model).toEqual({ modelId: 'gpt-4' });
    });
  });

  describe('anthropic', () => {
    it('creates Anthropic provider', async () => {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const instance = ProviderBuilder.anthropic('test-key');

      expect(createAnthropic).toHaveBeenCalledWith({ apiKey: 'test-key', baseURL: undefined });
      expect(instance.providerId).toBe('anthropic');
    });

    it('creates Anthropic provider with baseURL', async () => {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      ProviderBuilder.anthropic('test-key', 'https://custom.api');

      expect(createAnthropic).toHaveBeenCalledWith({
        apiKey: 'test-key',
        baseURL: 'https://custom.api',
      });
    });
  });

  describe('azure', () => {
    it('creates Azure provider with defaults', async () => {
      const { createAzure } = await import('@ai-sdk/azure');
      const instance = ProviderBuilder.azure('test-key', 'my-resource');

      expect(createAzure).toHaveBeenCalledWith({
        apiKey: 'test-key',
        resourceName: 'my-resource',
        apiVersion: '2024-02-01',
      });
      expect(instance.providerId).toBe('azure');
    });

    it('creates Azure provider with custom API version', async () => {
      const { createAzure } = await import('@ai-sdk/azure');
      ProviderBuilder.azure('test-key', 'my-resource', '2023-12-01');

      expect(createAzure).toHaveBeenCalledWith({
        apiKey: 'test-key',
        resourceName: 'my-resource',
        apiVersion: '2023-12-01',
      });
    });
  });

  describe('vertex', () => {
    it('creates Vertex provider with defaults', async () => {
      const { createVertex } = await import('@ai-sdk/google-vertex');
      const instance = ProviderBuilder.vertex('my-project');

      expect(createVertex).toHaveBeenCalledWith({
        project: 'my-project',
        location: 'us-central1',
      });
      expect(instance.providerId).toBe('vertex');
    });

    it('creates Vertex provider with custom location', async () => {
      const { createVertex } = await import('@ai-sdk/google-vertex');
      ProviderBuilder.vertex('my-project', 'europe-west1');

      expect(createVertex).toHaveBeenCalledWith({
        project: 'my-project',
        location: 'europe-west1',
      });
    });
  });

  describe('xai', () => {
    it('creates xAI provider', async () => {
      const { createXai } = await import('@ai-sdk/xai');
      const instance = ProviderBuilder.xai('test-key');

      expect(createXai).toHaveBeenCalledWith({ apiKey: 'test-key', baseURL: undefined });
      expect(instance.providerId).toBe('xai');
    });
  });

  describe('deepseek', () => {
    it('creates DeepSeek provider', async () => {
      const { createDeepSeek } = await import('@ai-sdk/deepseek');
      const instance = ProviderBuilder.deepseek('test-key');

      expect(createDeepSeek).toHaveBeenCalledWith({ apiKey: 'test-key', baseURL: undefined });
      expect(instance.providerId).toBe('deepseek');
    });
  });

  describe('mistral', () => {
    it('creates Mistral provider', async () => {
      const { createMistral } = await import('@ai-sdk/mistral');
      const instance = ProviderBuilder.mistral('test-key');

      expect(createMistral).toHaveBeenCalledWith({ apiKey: 'test-key', baseURL: undefined });
      expect(instance.providerId).toBe('mistral');
    });
  });

  describe('openrouter', () => {
    it('creates OpenRouter provider', async () => {
      const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');
      const instance = ProviderBuilder.openrouter('test-key');

      expect(createOpenRouter).toHaveBeenCalledWith({ apiKey: 'test-key', baseURL: undefined });
      expect(instance.providerId).toBe('openrouter');
    });
  });

  describe('compatible', () => {
    it('creates OpenAI-compatible provider', async () => {
      const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible');
      const instance = ProviderBuilder.compatible(
        'custom-provider',
        'test-key',
        'https://api.custom.com',
      );

      expect(createOpenAICompatible).toHaveBeenCalledWith({
        name: 'custom-provider',
        apiKey: 'test-key',
        baseURL: 'https://api.custom.com',
        headers: undefined,
      });
      expect(instance.providerId).toBe('custom-provider');
    });

    it('creates compatible provider with headers', async () => {
      const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible');
      ProviderBuilder.compatible('custom', 'key', 'https://api.com', { 'X-Custom': 'value' });

      expect(createOpenAICompatible).toHaveBeenCalledWith({
        name: 'custom',
        apiKey: 'key',
        baseURL: 'https://api.com',
        headers: { 'X-Custom': 'value' },
      });
    });
  });

  describe('create', () => {
    it('returns ConfigurableBuilder', () => {
      const builder = ProviderBuilder.create('openai');
      expect(builder).toBeInstanceOf(ConfigurableBuilder);
    });
  });

  describe('createProviderInstance', () => {
    it('throws if provider not in registry', () => {
      expect(() => ProviderBuilder.createProviderInstance('unknown', {})).toThrow(ProviderError);
      expect(() => ProviderBuilder.createProviderInstance('unknown', {})).toThrow(
        'Provider unknown not found in registry',
      );
    });

    it('creates official provider using creator', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'test', languageModel: vi.fn() });
      registry.register({ id: 'test', name: 'Test', type: 'official', creator });

      const instance = ProviderBuilder.createProviderInstance('test', { apiKey: 'key' });

      expect(creator).toHaveBeenCalledWith({ apiKey: 'key' });
      expect(instance.providerId).toBe('test');
    });

    it('caches created instances', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'test', languageModel: vi.fn() });
      registry.register({ id: 'test', name: 'Test', type: 'official', creator });

      const instance1 = ProviderBuilder.createProviderInstance('test', { apiKey: 'key' });
      const instance2 = ProviderBuilder.createProviderInstance('test', { apiKey: 'key' });

      expect(creator).toHaveBeenCalledTimes(1);
      expect(instance1).toBe(instance2);
    });

    it('creates different instances for different options', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'test', languageModel: vi.fn() });
      registry.register({ id: 'test', name: 'Test', type: 'official', creator });

      ProviderBuilder.createProviderInstance('test', { apiKey: 'key1' });
      ProviderBuilder.createProviderInstance('test', { apiKey: 'key2' });

      expect(creator).toHaveBeenCalledTimes(2);
    });

    it('creates compatible provider', async () => {
      const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible');
      registry.register({
        id: 'compat',
        name: 'Compatible',
        type: 'compatible',
        compatibleConfig: {
          baseURL: 'https://api.compat.com',
          defaultHeaders: { 'X-Default': 'value' },
        },
      });

      const instance = ProviderBuilder.createProviderInstance('compat', { apiKey: 'key' });

      expect(createOpenAICompatible).toHaveBeenCalledWith({
        name: 'Compatible',
        apiKey: 'key',
        baseURL: 'https://api.compat.com',
        headers: { 'X-Default': 'value' },
      });
      expect(instance.providerId).toBe('compat');
    });

    it('uses alternative baseURL when useAnthropicFormat is true', async () => {
      const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible');
      registry.register({
        id: 'compat',
        name: 'Compatible',
        type: 'compatible',
        compatibleConfig: {
          baseURL: 'https://api.compat.com',
          alternativeBaseURL: 'https://alt.compat.com',
        },
      });

      ProviderBuilder.createProviderInstance('compat', {
        apiKey: 'key',
        useAnthropicFormat: true,
      });

      expect(createOpenAICompatible).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://alt.compat.com',
        }),
      );
    });

    it('allows custom baseURL to override config', async () => {
      const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible');
      registry.register({
        id: 'compat',
        name: 'Compatible',
        type: 'compatible',
        compatibleConfig: { baseURL: 'https://default.com' },
      });

      ProviderBuilder.createProviderInstance('compat', {
        apiKey: 'key',
        baseURL: 'https://custom.com',
      });

      expect(createOpenAICompatible).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'https://custom.com' }),
      );
    });

    it('merges custom headers with default headers', async () => {
      const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible');
      registry.register({
        id: 'compat',
        name: 'Compatible',
        type: 'compatible',
        compatibleConfig: {
          baseURL: 'https://api.com',
          defaultHeaders: { 'X-Default': 'default' },
        },
      });

      ProviderBuilder.createProviderInstance('compat', {
        apiKey: 'key',
        headers: { 'X-Custom': 'custom' },
      });

      expect(createOpenAICompatible).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'X-Default': 'default', 'X-Custom': 'custom' },
        }),
      );
    });

    it('throws for provider without creator or compatible config', () => {
      registry.register({ id: 'broken', name: 'Broken', type: 'custom' });

      expect(() => ProviderBuilder.createProviderInstance('broken', { apiKey: 'key' })).toThrow(
        ConfigurationError,
      );
      expect(() => ProviderBuilder.createProviderInstance('broken', { apiKey: 'key' })).toThrow(
        'Cannot create provider broken',
      );
    });
  });
});

describe('ConfigurableBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registry.clear();
  });

  describe('fluent API', () => {
    it('withApiKey returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withApiKey('key')).toBe(builder);
    });

    it('withBaseURL returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withBaseURL('https://api.com')).toBe(builder);
    });

    it('withHeaders returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withHeaders({ 'X-Custom': 'value' })).toBe(builder);
    });

    it('withOrganization returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withOrganization('org-123')).toBe(builder);
    });

    it('withProject returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withProject('proj-456')).toBe(builder);
    });

    it('withAzureConfig returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withAzureConfig({ resourceName: 'resource' })).toBe(builder);
    });

    it('withVertexConfig returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withVertexConfig({ project: 'project' })).toBe(builder);
    });

    it('withAnthropicFormat returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withAnthropicFormat()).toBe(builder);
    });

    it('withRetry returns this', () => {
      const builder = new ConfigurableBuilder('test');
      expect(builder.withRetry({ maxRetries: 5 })).toBe(builder);
    });
  });

  describe('chaining', () => {
    it('supports chained configuration', () => {
      const builder = new ConfigurableBuilder('test')
        .withApiKey('key')
        .withBaseURL('https://api.com')
        .withHeaders({ 'X-Custom': 'value' });

      expect(builder).toBeInstanceOf(ConfigurableBuilder);
    });
  });

  describe('withHeaders', () => {
    it('merges multiple header calls', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'test', languageModel: vi.fn() });
      registry.register({ id: 'test', name: 'Test', type: 'official', creator });

      new ConfigurableBuilder('test')
        .withApiKey('key')
        .withHeaders({ 'X-First': 'first' })
        .withHeaders({ 'X-Second': 'second' })
        .build();

      expect(creator).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'X-First': 'first', 'X-Second': 'second' },
        }),
      );
    });
  });

  describe('withAzureConfig', () => {
    it('sets resourceName and default apiVersion', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'azure', languageModel: vi.fn() });
      registry.register({ id: 'azure', name: 'Azure', type: 'official', creator });

      new ConfigurableBuilder('azure')
        .withApiKey('key')
        .withAzureConfig({ resourceName: 'my-resource' })
        .build();

      expect(creator).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceName: 'my-resource',
          apiVersion: '2024-02-01',
        }),
      );
    });

    it('allows custom apiVersion', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'azure', languageModel: vi.fn() });
      registry.register({ id: 'azure', name: 'Azure', type: 'official', creator });

      new ConfigurableBuilder('azure')
        .withApiKey('key')
        .withAzureConfig({ resourceName: 'resource', apiVersion: '2023-12-01' })
        .build();

      expect(creator).toHaveBeenCalledWith(expect.objectContaining({ apiVersion: '2023-12-01' }));
    });
  });

  describe('withVertexConfig', () => {
    it('sets project and default location', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'vertex', languageModel: vi.fn() });
      registry.register({ id: 'vertex', name: 'Vertex', type: 'official', creator });

      new ConfigurableBuilder('vertex')
        .withApiKey('key')
        .withVertexConfig({ project: 'my-project' })
        .build();

      expect(creator).toHaveBeenCalledWith(
        expect.objectContaining({
          project: 'my-project',
          region: 'us-central1',
        }),
      );
    });

    it('allows custom location', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'vertex', languageModel: vi.fn() });
      registry.register({ id: 'vertex', name: 'Vertex', type: 'official', creator });

      new ConfigurableBuilder('vertex')
        .withApiKey('key')
        .withVertexConfig({ project: 'project', location: 'europe-west1' })
        .build();

      expect(creator).toHaveBeenCalledWith(expect.objectContaining({ region: 'europe-west1' }));
    });
  });

  describe('withRetry', () => {
    it('sets retry headers with defaults', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'test', languageModel: vi.fn() });
      registry.register({ id: 'test', name: 'Test', type: 'official', creator });

      new ConfigurableBuilder('test').withApiKey('key').withRetry({}).build();

      expect(creator).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'x-max-retries': '3',
            'x-backoff-strategy': 'exponential',
            'x-initial-delay': '1000',
          },
        }),
      );
    });

    it('sets custom retry config', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'test', languageModel: vi.fn() });
      registry.register({ id: 'test', name: 'Test', type: 'official', creator });

      new ConfigurableBuilder('test')
        .withApiKey('key')
        .withRetry({ maxRetries: 5, backoff: 'linear', initialDelay: 500 })
        .build();

      expect(creator).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-max-retries': '5',
            'x-backoff-strategy': 'linear',
            'x-initial-delay': '500',
          }),
        }),
      );
    });
  });

  describe('build', () => {
    it('throws if provider not in registry', () => {
      const builder = new ConfigurableBuilder('unknown').withApiKey('key');

      expect(() => builder.build()).toThrow(ProviderError);
      expect(() => builder.build()).toThrow('Provider unknown not found in registry');
    });

    it('throws if API key missing for non-custom provider', () => {
      registry.register({ id: 'test', name: 'Test', type: 'official' });
      const builder = new ConfigurableBuilder('test');

      expect(() => builder.build()).toThrow(ConfigurationError);
      expect(() => builder.build()).toThrow('API key is required');
    });

    it('custom type bypasses API key check but needs creator in createProviderInstance', () => {
      // Custom type skips API key validation in build() but requires official/compatible type in createProviderInstance
      registry.register({ id: 'custom', name: 'Custom', type: 'custom' });

      expect(() => new ConfigurableBuilder('custom').build()).toThrow(ConfigurationError);
      expect(() => new ConfigurableBuilder('custom').build()).toThrow(
        'Cannot create provider custom',
      );
    });

    it('builds provider instance', () => {
      const creator = vi.fn().mockReturnValue({ providerId: 'test', languageModel: vi.fn() });
      registry.register({ id: 'test', name: 'Test', type: 'official', creator });

      const instance = new ConfigurableBuilder('test')
        .withApiKey('my-key')
        .withBaseURL('https://api.custom.com')
        .build();

      expect(creator).toHaveBeenCalledWith({
        apiKey: 'my-key',
        baseURL: 'https://api.custom.com',
      });
      expect(instance.providerId).toBe('test');
    });
  });
});
