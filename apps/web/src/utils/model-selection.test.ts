import { describe, expect, it } from 'vitest';
import type { ModelOption } from '@/types/arena';
import { selectRandomModel, selectUniqueRandomModels } from './model-selection';

const mockModels: ModelOption[] = [
  {
    id: 'openai:gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    providerId: 'openai',
  },
  {
    id: 'anthropic:claude-3',
    name: 'Claude 3',
    provider: 'Anthropic',
    providerId: 'anthropic',
  },
  {
    id: 'google:gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    providerId: 'google',
  },
  {
    id: 'mistral:mixtral',
    name: 'Mixtral',
    provider: 'Mistral',
    providerId: 'mistral',
  },
  {
    id: 'meta:llama-3',
    name: 'Llama 3',
    provider: 'Meta',
    providerId: 'meta',
  },
];

describe('selectRandomModel', () => {
  it('should return empty string for empty model list', () => {
    const result = selectRandomModel([]);
    expect(result).toBe('');
  });

  it('should return a model id from the list', () => {
    const modelIds = mockModels.map((m) => m.id);
    const result = selectRandomModel(mockModels);
    expect(modelIds).toContain(result);
  });

  it('should exclude specified model ids', () => {
    const excludeIds = ['openai:gpt-4', 'anthropic:claude-3'];

    // Use deterministic random to test multiple selections
    let callCount = 0;
    const deterministicRandom = () => {
      callCount++;
      return (callCount * 0.2) % 1;
    };

    // Run multiple times to ensure excluded models are not selected
    for (let i = 0; i < 10; i++) {
      const result = selectRandomModel(mockModels, excludeIds, deterministicRandom);
      expect(excludeIds).not.toContain(result);
      expect(result).not.toBe('');
    }
  });

  it('should fall back to full list when all models are excluded', () => {
    const excludeIds = mockModels.map((m) => m.id);
    const result = selectRandomModel(mockModels, excludeIds, () => 0);
    expect(result).toBe(mockModels[0]?.id);
  });

  it('should use custom random function for deterministic selection', () => {
    // Always return 0 -> first model
    expect(selectRandomModel(mockModels, [], () => 0)).toBe('openai:gpt-4');

    // Return 0.5 -> middle model (index 2)
    expect(selectRandomModel(mockModels, [], () => 0.5)).toBe('google:gemini-pro');

    // Return 0.99 -> last model (index 4)
    expect(selectRandomModel(mockModels, [], () => 0.99)).toBe('meta:llama-3');
  });
});

describe('selectUniqueRandomModels', () => {
  it('should return empty array for empty model list', () => {
    const result = selectUniqueRandomModels([], 2);
    expect(result).toEqual([]);
  });

  it('should return requested count of models', () => {
    const result = selectUniqueRandomModels(mockModels, 3);
    expect(result).toHaveLength(3);
  });

  it('should return unique models when enough models available', () => {
    // Use deterministic random that cycles through models
    let callCount = 0;
    const deterministicRandom = () => {
      const value = (callCount * 0.1) % 1;
      callCount++;
      return value;
    };

    const result = selectUniqueRandomModels(mockModels, 3, [], deterministicRandom);

    // Check all are unique
    const uniqueIds = new Set(result);
    expect(uniqueIds.size).toBe(3);

    // Check all are valid model IDs
    const modelIds = mockModels.map((m) => m.id);
    for (const id of result) {
      expect(modelIds).toContain(id);
    }
  });

  it('should allow duplicates when fewer models than requested count', () => {
    const twoModels = mockModels.slice(0, 2);

    // Request 3 models when only 2 are available
    const result = selectUniqueRandomModels(twoModels, 3, [], () => 0);

    expect(result).toHaveLength(3);
    // Third model must be a duplicate since we only have 2 unique options
    const uniqueIds = new Set(result);
    expect(uniqueIds.size).toBeLessThanOrEqual(2);
  });

  it('should respect initial excludeIds', () => {
    const excludeIds = ['openai:gpt-4', 'anthropic:claude-3'];

    // Use deterministic random
    const result = selectUniqueRandomModels(mockModels, 2, excludeIds, () => 0);

    // Neither of the first two returned should be in excludeIds
    for (const id of result) {
      expect(excludeIds).not.toContain(id);
    }
  });

  it('should handle single model list', () => {
    const firstModel = mockModels[0];
    if (!firstModel) {
      throw new Error('Mock models should have at least one model');
    }
    const singleModel = [firstModel];

    const result = selectUniqueRandomModels(singleModel, 2, [], () => 0);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('openai:gpt-4');
    expect(result[1]).toBe('openai:gpt-4');
  });

  it('should return fewer models if count exceeds available after exclusions', () => {
    const twoModels = mockModels.slice(0, 2);
    const excludeIds = ['openai:gpt-4'];

    // Request 3 models, but only 1 is available after exclusion
    const result = selectUniqueRandomModels(twoModels, 3, excludeIds, () => 0);

    // First selection is anthropic:claude-3 (only non-excluded)
    // Second and third fall back to full list starting with openai:gpt-4
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('anthropic:claude-3');
  });

  it('should return count of 0 when count is 0', () => {
    const result = selectUniqueRandomModels(mockModels, 0);
    expect(result).toEqual([]);
  });

  it('should use custom random function for deterministic selection', () => {
    // Always select first available model
    const result1 = selectUniqueRandomModels(mockModels, 2, [], () => 0);
    expect(result1[0]).toBe('openai:gpt-4');
    expect(result1[1]).toBe('anthropic:claude-3'); // First after excluding gpt-4

    // Use different random values
    let callCount = 0;
    const alternatingRandom = () => {
      const value = callCount % 2 === 0 ? 0.99 : 0;
      callCount++;
      return value;
    };
    const result2 = selectUniqueRandomModels(mockModels, 2, [], alternatingRandom);
    expect(result2[0]).toBe('meta:llama-3'); // Last model (0.99)
    expect(result2[1]).toBe('openai:gpt-4'); // First of remaining (0)
  });
});
