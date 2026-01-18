import { describe, expect, it } from 'vitest';
import {
  AiModelSourceEnum,
  AiModelTypeSchema,
  CreateModelSchema,
  ModelAbilitiesSchema,
  ModelOverrideSchema,
} from './model';

describe('AiModelSourceEnum', () => {
  it('has expected values', () => {
    expect(AiModelSourceEnum.Builtin).toBe('builtin');
    expect(AiModelSourceEnum.Custom).toBe('custom');
    expect(AiModelSourceEnum.Remote).toBe('remote');
  });
});

describe('AiModelTypeSchema', () => {
  it('accepts valid model types', () => {
    expect(AiModelTypeSchema.parse('chat')).toBe('chat');
    expect(AiModelTypeSchema.parse('embedding')).toBe('embedding');
    expect(AiModelTypeSchema.parse('tts')).toBe('tts');
    expect(AiModelTypeSchema.parse('stt')).toBe('stt');
    expect(AiModelTypeSchema.parse('image')).toBe('image');
    expect(AiModelTypeSchema.parse('realtime')).toBe('realtime');
  });

  it('rejects invalid model types', () => {
    expect(() => AiModelTypeSchema.parse('invalid')).toThrow();
    expect(() => AiModelTypeSchema.parse('')).toThrow();
    expect(() => AiModelTypeSchema.parse(123)).toThrow();
  });
});

describe('ModelAbilitiesSchema', () => {
  it('accepts valid abilities', () => {
    const result = ModelAbilitiesSchema.parse({
      vision: true,
      functionCall: true,
      reasoning: false,
    });
    expect(result.vision).toBe(true);
    expect(result.functionCall).toBe(true);
    expect(result.reasoning).toBe(false);
  });

  it('accepts empty object', () => {
    const result = ModelAbilitiesSchema.parse({});
    expect(result).toEqual({});
  });

  it('accepts all ability fields', () => {
    const result = ModelAbilitiesSchema.parse({
      files: true,
      functionCall: true,
      imageOutput: true,
      reasoning: true,
      search: true,
      structuredOutput: true,
      video: true,
      vision: true,
    });
    expect(result.files).toBe(true);
    expect(result.video).toBe(true);
  });

  it('rejects non-boolean values for abilities', () => {
    expect(() => ModelAbilitiesSchema.parse({ vision: 'yes' })).toThrow();
    expect(() => ModelAbilitiesSchema.parse({ functionCall: 1 })).toThrow();
  });
});

describe('CreateModelSchema', () => {
  it('accepts valid model data', () => {
    const result = CreateModelSchema.parse({
      id: 'custom-model',
      providerId: 'openai',
    });
    expect(result.id).toBe('custom-model');
    expect(result.providerId).toBe('openai');
  });

  it('accepts all optional fields', () => {
    const result = CreateModelSchema.parse({
      id: 'custom-model',
      providerId: 'openai',
      displayName: 'Custom Model',
      description: 'A custom model',
      contextWindowTokens: 128000,
      maxOutput: 4096,
      type: 'chat',
      abilities: { vision: true },
      releasedAt: '2024-01-01',
    });
    expect(result.displayName).toBe('Custom Model');
    expect(result.contextWindowTokens).toBe(128000);
    expect(result.type).toBe('chat');
  });

  it('requires id and providerId', () => {
    expect(() => CreateModelSchema.parse({})).toThrow();
    expect(() => CreateModelSchema.parse({ id: 'test' })).toThrow();
    expect(() => CreateModelSchema.parse({ providerId: 'openai' })).toThrow();
  });

  it('validates type field', () => {
    expect(() =>
      CreateModelSchema.parse({
        id: 'test',
        providerId: 'openai',
        type: 'invalid',
      }),
    ).toThrow();
  });
});

describe('ModelOverrideSchema', () => {
  it('accepts valid override data', () => {
    const result = ModelOverrideSchema.parse({
      modelId: 'gpt-4',
    });
    expect(result.modelId).toBe('gpt-4');
  });

  it('accepts all optional fields', () => {
    const result = ModelOverrideSchema.parse({
      modelId: 'gpt-4',
      displayName: 'GPT-4 Custom',
      groupName: 'Premium',
      abilities: { reasoning: true },
      supportsStreaming: true,
      priceCurrency: 'USD',
      inputPrice: 10,
      outputPrice: 30,
    });
    expect(result.displayName).toBe('GPT-4 Custom');
    expect(result.priceCurrency).toBe('USD');
    expect(result.inputPrice).toBe(10);
  });

  it('requires modelId', () => {
    expect(() => ModelOverrideSchema.parse({})).toThrow();
  });

  it('validates priceCurrency', () => {
    expect(ModelOverrideSchema.parse({ modelId: 'test', priceCurrency: 'USD' }).priceCurrency).toBe(
      'USD',
    );
    expect(ModelOverrideSchema.parse({ modelId: 'test', priceCurrency: 'CNY' }).priceCurrency).toBe(
      'CNY',
    );
    expect(() => ModelOverrideSchema.parse({ modelId: 'test', priceCurrency: 'EUR' })).toThrow();
  });
});
