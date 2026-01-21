import { describe, expect, it } from 'vitest';
import type { ModelConfig } from './arena';
import { DEFAULT_MODEL_CONFIG } from './arena';

describe('DEFAULT_MODEL_CONFIG', () => {
  it('should have correct maxTokens value', () => {
    expect(DEFAULT_MODEL_CONFIG.maxTokens).toBe(2048);
  });

  it('should have correct temperature value', () => {
    expect(DEFAULT_MODEL_CONFIG.temperature).toBe(0.7);
  });

  it('should conform to ModelConfig type', () => {
    const config: ModelConfig = DEFAULT_MODEL_CONFIG;
    expect(config).toEqual({
      maxTokens: 2048,
      temperature: 0.7,
    });
  });
});
