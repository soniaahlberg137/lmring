import { describe, expect, it } from 'vitest';
import type { ProviderConfig } from '../types/provider';
import {
  autoSelectFormat,
  detectFormatFromModel,
  getBaseURLForFormat,
  getModelConfig,
  isModelSupported,
  supportsFormat,
  validateProviderModel,
} from './formatSelector';

describe('detectFormatFromModel', () => {
  it('detects anthropic format for claude models', () => {
    expect(detectFormatFromModel('claude-3-opus')).toBe('anthropic');
    expect(detectFormatFromModel('claude-3-sonnet')).toBe('anthropic');
    expect(detectFormatFromModel('claude-instant-1.2')).toBe('anthropic');
    expect(detectFormatFromModel('Claude-2')).toBe('anthropic');
  });

  it('returns openai for non-anthropic models', () => {
    expect(detectFormatFromModel('gpt-4')).toBe('openai');
    expect(detectFormatFromModel('gpt-3.5-turbo')).toBe('openai');
    expect(detectFormatFromModel('llama-2-70b')).toBe('openai');
  });

  it('is case insensitive', () => {
    expect(detectFormatFromModel('CLAUDE-3-OPUS')).toBe('anthropic');
  });
});

describe('supportsFormat', () => {
  it('returns true if model explicitly supports format', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      models: [{ id: 'model1', name: 'Model 1', supportedFormats: ['anthropic'] }],
    };

    expect(supportsFormat(config, 'anthropic')).toBe(true);
  });

  it('returns true for anthropic format with alternativeBaseURL', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      compatibleConfig: {
        baseURL: 'https://api.test.com/v1',
        alternativeBaseURL: 'https://api.test.com/anthropic',
      },
    };

    expect(supportsFormat(config, 'anthropic')).toBe(true);
  });

  it('returns true for openai format on compatible providers', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
    };

    expect(supportsFormat(config, 'openai')).toBe(true);
  });

  it('returns false for openai format on non-compatible providers', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'official',
    };

    expect(supportsFormat(config, 'openai')).toBe(false);
  });

  it('returns false for anthropic without support', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
    };

    expect(supportsFormat(config, 'anthropic')).toBe(false);
  });
});

describe('autoSelectFormat', () => {
  const compatibleConfig: ProviderConfig = {
    id: 'test',
    name: 'Test',
    type: 'compatible',
    compatibleConfig: {
      baseURL: 'https://api.test.com/v1',
      alternativeBaseURL: 'https://api.test.com/anthropic',
    },
  };

  it('uses explicit preference when supported', () => {
    expect(autoSelectFormat(compatibleConfig, 'gpt-4', true)).toBe('anthropic');
    expect(autoSelectFormat(compatibleConfig, 'claude-3', false)).toBe('openai');
  });

  it('auto-detects format from model name', () => {
    expect(autoSelectFormat(compatibleConfig, 'claude-3-opus')).toBe('anthropic');
    expect(autoSelectFormat(compatibleConfig, 'gpt-4')).toBe('openai');
  });

  it('falls back to openai when detected format not supported', () => {
    const noAnthropicConfig: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
    };

    expect(autoSelectFormat(noAnthropicConfig, 'claude-3')).toBe('openai');
  });

  it('ignores unsupported explicit preference', () => {
    const noAnthropicConfig: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
    };

    expect(autoSelectFormat(noAnthropicConfig, 'gpt-4', true)).toBe('openai');
  });
});

describe('getBaseURLForFormat', () => {
  it('returns undefined for official providers', () => {
    const config: ProviderConfig = { id: 'test', name: 'Test', type: 'official' };
    expect(getBaseURLForFormat(config, 'openai')).toBeUndefined();
  });

  it('returns alternativeBaseURL for anthropic format', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      compatibleConfig: {
        baseURL: 'https://api.test.com/v1',
        alternativeBaseURL: 'https://api.test.com/anthropic',
      },
    };

    expect(getBaseURLForFormat(config, 'anthropic')).toBe('https://api.test.com/anthropic');
  });

  it('returns baseURL for openai format', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      compatibleConfig: {
        baseURL: 'https://api.test.com/v1',
      },
    };

    expect(getBaseURLForFormat(config, 'openai')).toBe('https://api.test.com/v1');
  });

  it('returns baseURL when no alternativeBaseURL for anthropic', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      compatibleConfig: {
        baseURL: 'https://api.test.com/v1',
      },
    };

    expect(getBaseURLForFormat(config, 'anthropic')).toBe('https://api.test.com/v1');
  });
});

describe('isModelSupported', () => {
  it('returns true when no models specified', () => {
    const config: ProviderConfig = { id: 'test', name: 'Test', type: 'compatible' };
    expect(isModelSupported(config, 'any-model')).toBe(true);
  });

  it('returns true when empty models array', () => {
    const config: ProviderConfig = { id: 'test', name: 'Test', type: 'compatible', models: [] };
    expect(isModelSupported(config, 'any-model')).toBe(true);
  });

  it('returns true for exact id match', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      models: [{ id: 'gpt-4', name: 'GPT-4' }],
    };
    expect(isModelSupported(config, 'gpt-4')).toBe(true);
  });

  it('returns true for name match', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      models: [{ id: 'model-id', name: 'GPT-4' }],
    };
    expect(isModelSupported(config, 'GPT-4')).toBe(true);
  });

  it('returns true for case-insensitive id match', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      models: [{ id: 'GPT-4', name: 'GPT-4' }],
    };
    expect(isModelSupported(config, 'gpt-4')).toBe(true);
  });

  it('returns false when model not in list', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      models: [{ id: 'gpt-4', name: 'GPT-4' }],
    };
    expect(isModelSupported(config, 'gpt-3.5')).toBe(false);
  });
});

describe('getModelConfig', () => {
  it('returns undefined when no models', () => {
    const config: ProviderConfig = { id: 'test', name: 'Test', type: 'compatible' };
    expect(getModelConfig(config, 'gpt-4')).toBeUndefined();
  });

  it('returns model config by id', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      models: [{ id: 'gpt-4', name: 'GPT-4', supportedFormats: ['openai'] }],
    };

    const result = getModelConfig(config, 'gpt-4');
    expect(result?.id).toBe('gpt-4');
    expect(result?.supportedFormats).toEqual(['openai']);
  });

  it('returns model config by name', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      models: [{ id: 'model-id', name: 'GPT-4' }],
    };

    expect(getModelConfig(config, 'GPT-4')).toBeDefined();
  });

  it('returns undefined for non-existent model', () => {
    const config: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      models: [{ id: 'gpt-4', name: 'GPT-4' }],
    };

    expect(getModelConfig(config, 'unknown')).toBeUndefined();
  });
});

describe('validateProviderModel', () => {
  const config: ProviderConfig = {
    id: 'test',
    name: 'Test',
    type: 'compatible',
    models: [{ id: 'gpt-4', name: 'GPT-4', supportedFormats: ['openai'] }],
  };

  it('returns valid for supported model and format', () => {
    const result = validateProviderModel(config, 'gpt-4', 'openai');
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('returns invalid for unsupported model', () => {
    const result = validateProviderModel(config, 'unknown-model', 'openai');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not supported by provider');
  });

  it('returns invalid for unsupported format', () => {
    const result = validateProviderModel(config, 'gpt-4', 'anthropic');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Format anthropic is not supported');
  });

  it('returns invalid when model does not support format', () => {
    const restrictedConfig: ProviderConfig = {
      id: 'test',
      name: 'Test',
      type: 'compatible',
      compatibleConfig: {
        baseURL: 'https://test.com',
        alternativeBaseURL: 'https://test.com/anthropic',
      },
      models: [{ id: 'gpt-4', name: 'GPT-4', supportedFormats: ['openai'] }],
    };

    const result = validateProviderModel(restrictedConfig, 'gpt-4', 'anthropic');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not support anthropic format');
  });
});
