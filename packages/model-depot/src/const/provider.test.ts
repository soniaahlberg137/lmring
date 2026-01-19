import { describe, expect, it } from 'vitest';
import {
  isValidProvider,
  ModelProvider,
  PROVIDER_OPTIONS,
  PROVIDER_TYPE_TO_DEPOT_ID,
  ProviderDisplayNames,
  resolveProviderType,
} from './provider';

describe('ModelProvider enum', () => {
  it('contains expected official providers', () => {
    expect(ModelProvider.OpenAI).toBe('openai');
    expect(ModelProvider.Anthropic).toBe('anthropic');
    expect(ModelProvider.Azure).toBe('azure');
    expect(ModelProvider.Google).toBe('google');
    expect(ModelProvider.DeepSeek).toBe('deepseek');
  });

  it('contains expected compatible providers', () => {
    expect(ModelProvider.Groq).toBe('groq');
    expect(ModelProvider.Perplexity).toBe('perplexity');
    expect(ModelProvider.TogetherAI).toBe('togetherai');
  });

  it('contains expected Chinese providers', () => {
    expect(ModelProvider.Zhipu).toBe('zhipu');
    expect(ModelProvider.Moonshot).toBe('moonshot');
    expect(ModelProvider.Hunyuan).toBe('hunyuan');
  });

  it('contains expected local providers', () => {
    expect(ModelProvider.Ollama).toBe('ollama');
    expect(ModelProvider.LMStudio).toBe('lmstudio');
    expect(ModelProvider.VLLM).toBe('vllm');
  });
});

describe('ProviderDisplayNames', () => {
  it('maps providers to display names', () => {
    expect(ProviderDisplayNames[ModelProvider.OpenAI]).toBe('OpenAI');
    expect(ProviderDisplayNames[ModelProvider.Anthropic]).toBe('Anthropic');
    expect(ProviderDisplayNames[ModelProvider.Azure]).toBe('Azure OpenAI');
    expect(ProviderDisplayNames[ModelProvider.Vertex]).toBe('Vertex AI');
  });

  it('has display name for every provider', () => {
    const providerValues = Object.values(ModelProvider);
    for (const provider of providerValues) {
      expect(ProviderDisplayNames[provider]).toBeDefined();
      expect(typeof ProviderDisplayNames[provider]).toBe('string');
    }
  });
});

describe('isValidProvider', () => {
  it('returns true for valid providers', () => {
    expect(isValidProvider('openai')).toBe(true);
    expect(isValidProvider('anthropic')).toBe(true);
    expect(isValidProvider('groq')).toBe(true);
    expect(isValidProvider('zhipu')).toBe(true);
    expect(isValidProvider('ollama')).toBe(true);
  });

  it('returns false for invalid providers', () => {
    expect(isValidProvider('invalid')).toBe(false);
    expect(isValidProvider('unknown')).toBe(false);
    expect(isValidProvider('')).toBe(false);
    expect(isValidProvider('OPENAI')).toBe(false);
  });
});

describe('PROVIDER_TYPE_TO_DEPOT_ID', () => {
  it('maps UI types to depot IDs', () => {
    expect(PROVIDER_TYPE_TO_DEPOT_ID.OpenAI).toBe('openai');
    expect(PROVIDER_TYPE_TO_DEPOT_ID['OpenAI-Response']).toBe('openai');
    expect(PROVIDER_TYPE_TO_DEPOT_ID.Gemini).toBe('google');
    expect(PROVIDER_TYPE_TO_DEPOT_ID.Anthropic).toBe('anthropic');
    expect(PROVIDER_TYPE_TO_DEPOT_ID['Azure OpenAI']).toBe('azure');
    expect(PROVIDER_TYPE_TO_DEPOT_ID['New API']).toBe('openai');
    expect(PROVIDER_TYPE_TO_DEPOT_ID.CherryIn).toBe('openai');
  });
});

describe('PROVIDER_OPTIONS', () => {
  it('contains keys from PROVIDER_TYPE_TO_DEPOT_ID', () => {
    expect(PROVIDER_OPTIONS).toContain('OpenAI');
    expect(PROVIDER_OPTIONS).toContain('Gemini');
    expect(PROVIDER_OPTIONS).toContain('Anthropic');
    expect(PROVIDER_OPTIONS.length).toBe(Object.keys(PROVIDER_TYPE_TO_DEPOT_ID).length);
  });
});

describe('resolveProviderType', () => {
  it('returns providerType for custom providers', () => {
    expect(resolveProviderType({ id: 'custom-1', providerType: 'anthropic', isCustom: true })).toBe(
      'anthropic',
    );
    expect(resolveProviderType({ id: 'my-api', providerType: 'openai', isCustom: true })).toBe(
      'openai',
    );
  });

  it('ignores providerType when not custom', () => {
    expect(resolveProviderType({ id: 'openai', providerType: 'anthropic', isCustom: false })).toBe(
      'openai',
    );
    expect(resolveProviderType({ id: 'groq', providerType: 'openai' })).toBe('groq');
  });

  it('returns id for valid built-in providers', () => {
    expect(resolveProviderType({ id: 'openai' })).toBe('openai');
    expect(resolveProviderType({ id: 'anthropic' })).toBe('anthropic');
    expect(resolveProviderType({ id: 'OPENAI' })).toBe('openai');
    expect(resolveProviderType({ id: 'Groq' })).toBe('groq');
  });

  it('returns openai as fallback for unknown providers', () => {
    expect(resolveProviderType({ id: 'unknown' })).toBe('openai');
    expect(resolveProviderType({ id: 'custom-provider' })).toBe('openai');
    expect(resolveProviderType({ id: '' })).toBe('openai');
  });

  it('handles custom provider without providerType', () => {
    expect(resolveProviderType({ id: 'unknown', isCustom: true })).toBe('openai');
    expect(resolveProviderType({ id: 'unknown', providerType: null, isCustom: true })).toBe(
      'openai',
    );
  });
});
