import { describe, expect, it } from 'vitest';
import {
  AiHubError,
  ArenaError,
  ConfigurationError,
  ModelResolutionError,
  PluginError,
  ProviderError,
} from './errors';

describe('AiHubError', () => {
  it('creates error with message and code', () => {
    const error = new AiHubError('test message', 'TEST_CODE');
    expect(error.message).toBe('test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('AiHubError');
    expect(error.details).toBeUndefined();
  });

  it('creates error with details', () => {
    const details = { foo: 'bar', count: 42 };
    const error = new AiHubError('test', 'CODE', details);
    expect(error.details).toEqual(details);
  });

  it('inherits from Error', () => {
    const error = new AiHubError('test', 'CODE');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ProviderError', () => {
  it('creates error with providerId', () => {
    const error = new ProviderError('provider failed', 'openai');
    expect(error.message).toBe('provider failed');
    expect(error.providerId).toBe('openai');
    expect(error.code).toBe('PROVIDER_ERROR');
    expect(error.name).toBe('ProviderError');
    expect(error.details).toEqual({ providerId: 'openai' });
  });

  it('merges additional details', () => {
    const error = new ProviderError('failed', 'anthropic', { reason: 'timeout' });
    expect(error.details).toEqual({ providerId: 'anthropic', reason: 'timeout' });
  });

  it('handles undefined details', () => {
    const error = new ProviderError('failed', 'provider');
    expect(error.details).toEqual({ providerId: 'provider' });
  });

  it('inherits from AiHubError', () => {
    const error = new ProviderError('test', 'id');
    expect(error).toBeInstanceOf(AiHubError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ModelResolutionError', () => {
  it('creates error with formatted message', () => {
    const error = new ModelResolutionError('gpt-4', 'openai', 'model not found');
    expect(error.message).toBe(
      'Failed to resolve model gpt-4 for provider openai: model not found',
    );
    expect(error.modelId).toBe('gpt-4');
    expect(error.providerId).toBe('openai');
    expect(error.code).toBe('MODEL_RESOLUTION_ERROR');
    expect(error.name).toBe('ModelResolutionError');
  });

  it('includes modelId and providerId in details', () => {
    const error = new ModelResolutionError('claude-3', 'anthropic', 'reason');
    expect(error.details).toEqual({ modelId: 'claude-3', providerId: 'anthropic' });
  });

  it('inherits from AiHubError', () => {
    const error = new ModelResolutionError('model', 'provider', 'reason');
    expect(error).toBeInstanceOf(AiHubError);
  });
});

describe('ArenaError', () => {
  it('creates error with failures array', () => {
    const failures = [new Error('error 1'), new Error('error 2')];
    const error = new ArenaError('arena failed', failures);
    expect(error.message).toBe('arena failed');
    expect(error.failures).toBe(failures);
    expect(error.code).toBe('ARENA_ERROR');
    expect(error.name).toBe('ArenaError');
  });

  it('stores failures in details', () => {
    const failures = [new Error('test')];
    const error = new ArenaError('msg', failures);
    expect(error.details).toEqual({ failures });
  });

  it('handles empty failures array', () => {
    const error = new ArenaError('no failures', []);
    expect(error.failures).toEqual([]);
  });

  it('inherits from AiHubError', () => {
    const error = new ArenaError('test', []);
    expect(error).toBeInstanceOf(AiHubError);
  });
});

describe('PluginError', () => {
  it('creates error with formatted message', () => {
    const error = new PluginError('transform failed', 'RetryPlugin', 'transformParams');
    expect(error.message).toBe('Plugin RetryPlugin failed at transformParams: transform failed');
    expect(error.pluginName).toBe('RetryPlugin');
    expect(error.hook).toBe('transformParams');
    expect(error.code).toBe('PLUGIN_ERROR');
    expect(error.name).toBe('PluginError');
  });

  it('includes originalError in details', () => {
    const originalError = new Error('original');
    const error = new PluginError('failed', 'MyPlugin', 'onError', originalError);
    expect(error.details).toEqual({
      pluginName: 'MyPlugin',
      hook: 'onError',
      originalError,
    });
  });

  it('handles undefined originalError', () => {
    const error = new PluginError('failed', 'Plugin', 'hook');
    expect(error.details).toEqual({
      pluginName: 'Plugin',
      hook: 'hook',
      originalError: undefined,
    });
  });

  it('inherits from AiHubError', () => {
    const error = new PluginError('msg', 'name', 'hook');
    expect(error).toBeInstanceOf(AiHubError);
  });
});

describe('ConfigurationError', () => {
  it('creates error with message', () => {
    const error = new ConfigurationError('invalid config');
    expect(error.message).toBe('invalid config');
    expect(error.code).toBe('CONFIGURATION_ERROR');
    expect(error.name).toBe('ConfigurationError');
    expect(error.details).toBeUndefined();
  });

  it('creates error with details', () => {
    const details = { field: 'apiKey', reason: 'missing' };
    const error = new ConfigurationError('config error', details);
    expect(error.details).toEqual(details);
  });

  it('inherits from AiHubError', () => {
    const error = new ConfigurationError('test');
    expect(error).toBeInstanceOf(AiHubError);
  });
});
