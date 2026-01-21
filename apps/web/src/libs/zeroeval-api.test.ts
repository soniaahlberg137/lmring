import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type ArenaScores,
  calculateCategoryArenaScores,
  calculateChatArenaScore,
  calculateCodeArenaScore,
  formatMetricValue,
  getArenaScores,
  getArenaScoresForCategory,
  getBenchmarks,
  getModelDetail,
  getModelsAll,
  getModelsFull,
  getNumericValue,
  getOrganizationColor,
  getOrganizationGradient,
  isNewModel,
  sortModels,
} from './zeroeval-api';

describe('zeroeval-api', () => {
  describe('formatMetricValue', () => {
    it('should return "—" for null', () => {
      expect(formatMetricValue(null, 'number')).toBe('—');
    });

    it('should return "—" for undefined', () => {
      expect(formatMetricValue(undefined, 'number')).toBe('—');
    });

    it('should return "—" for empty string', () => {
      expect(formatMetricValue('', 'number')).toBe('—');
    });

    it('should return "—" for NaN', () => {
      expect(formatMetricValue('not-a-number', 'number')).toBe('—');
    });

    it('should format percentage correctly', () => {
      expect(formatMetricValue(0.856, 'percentage')).toBe('85.6%');
      expect(formatMetricValue(0.5, 'percentage')).toBe('50.0%');
      expect(formatMetricValue(1, 'percentage')).toBe('100.0%');
    });

    it('should format percentage from string', () => {
      expect(formatMetricValue('0.75', 'percentage')).toBe('75.0%');
    });

    it('should format currency correctly', () => {
      expect(formatMetricValue(2.5, 'currency')).toBe('$2.50');
      expect(formatMetricValue(10, 'currency')).toBe('$10.00');
      expect(formatMetricValue(0.01, 'currency')).toBe('$0.01');
    });

    it('should format context in millions', () => {
      expect(formatMetricValue(1000000, 'context')).toBe('1.0M');
      expect(formatMetricValue(2500000, 'context')).toBe('2.5M');
    });

    it('should format context in thousands', () => {
      expect(formatMetricValue(128000, 'context')).toBe('128K');
      expect(formatMetricValue(1000, 'context')).toBe('1K');
    });

    it('should format context below 1000 as plain number', () => {
      expect(formatMetricValue(500, 'context')).toBe('500');
      expect(formatMetricValue(999, 'context')).toBe('999');
    });

    it('should format number with 2 decimal places', () => {
      const result = formatMetricValue(50.123, 'number');
      expect(result).toContain('50');
    });

    it('should format number from string', () => {
      const result = formatMetricValue('123.456', 'number');
      expect(result).toContain('123');
    });
  });

  describe('getNumericValue', () => {
    it('should return -Infinity for null', () => {
      expect(getNumericValue(null)).toBe(-Infinity);
    });

    it('should return -Infinity for undefined', () => {
      expect(getNumericValue(undefined)).toBe(-Infinity);
    });

    it('should return -Infinity for empty string', () => {
      expect(getNumericValue('')).toBe(-Infinity);
    });

    it('should parse string to number', () => {
      expect(getNumericValue('3.14')).toBe(3.14);
      expect(getNumericValue('100')).toBe(100);
    });

    it('should return number as-is', () => {
      expect(getNumericValue(42)).toBe(42);
      expect(getNumericValue(3.14)).toBe(3.14);
    });

    it('should return -Infinity for NaN string', () => {
      expect(getNumericValue('not-a-number')).toBe(-Infinity);
    });
  });

  describe('isNewModel', () => {
    it('should return true for model released within 30 days', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15);
      expect(isNewModel(recentDate.toISOString(), '2020-01-01')).toBe(true);
    });

    it('should return false for model released more than 30 days ago', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      expect(isNewModel(oldDate.toISOString(), '2020-01-01')).toBe(false);
    });

    it('should use announcementDate when releaseDate is null', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);
      expect(isNewModel(null, recentDate.toISOString())).toBe(true);
    });

    it('should return false when both dates are old', () => {
      expect(isNewModel(null, '2020-01-01')).toBe(false);
    });

    it('should return true for model released exactly 30 days ago', () => {
      const exactDate = new Date();
      exactDate.setDate(exactDate.getDate() - 30);
      expect(isNewModel(exactDate.toISOString(), '2020-01-01')).toBe(true);
    });

    it('should return false for model released 31 days ago', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      expect(isNewModel(oldDate.toISOString(), '2020-01-01')).toBe(false);
    });
  });

  describe('sortModels', () => {
    const models = [
      { id: 'a', score: 50 },
      { id: 'b', score: 100 },
      { id: 'c', score: 75 },
      { id: 'd', score: null },
    ];

    it('should sort descending by default', () => {
      const sorted = sortModels(models, 'score');
      expect(sorted[0]?.id).toBe('b');
      expect(sorted[1]?.id).toBe('c');
      expect(sorted[2]?.id).toBe('a');
      expect(sorted[3]?.id).toBe('d');
    });

    it('should sort ascending when specified', () => {
      const sorted = sortModels(models, 'score', 'asc');
      expect(sorted[0]?.id).toBe('a');
      expect(sorted[1]?.id).toBe('c');
      expect(sorted[2]?.id).toBe('b');
      expect(sorted[3]?.id).toBe('d');
    });

    it('should push null values to end', () => {
      const sorted = sortModels(models, 'score', 'desc');
      expect(sorted[sorted.length - 1]?.score).toBeNull();
    });

    it('should handle all null values', () => {
      const nullModels = [
        { id: 'a', score: null },
        { id: 'b', score: null },
      ];
      const sorted = sortModels(nullModels, 'score');
      expect(sorted).toHaveLength(2);
    });

    it('should not mutate original array', () => {
      const original = [...models];
      sortModels(models, 'score');
      expect(models).toEqual(original);
    });
  });

  describe('getOrganizationColor', () => {
    it('should return correct color for openai', () => {
      expect(getOrganizationColor('openai')).toBe('#10B981');
    });

    it('should return correct color for anthropic', () => {
      expect(getOrganizationColor('anthropic')).toBe('#F59E0B');
    });

    it('should return correct color for google', () => {
      expect(getOrganizationColor('google')).toBe('#3B82F6');
    });

    it('should be case insensitive', () => {
      expect(getOrganizationColor('OpenAI')).toBe('#10B981');
      expect(getOrganizationColor('OPENAI')).toBe('#10B981');
    });

    it('should return fallback color for unknown org', () => {
      expect(getOrganizationColor('unknown-org')).toBe('#94A3B8');
    });

    it('should return correct colors for other known orgs', () => {
      expect(getOrganizationColor('meta')).toBe('#8B5CF6');
      expect(getOrganizationColor('mistral')).toBe('#F97316');
      expect(getOrganizationColor('deepseek')).toBe('#06B6D4');
      expect(getOrganizationColor('xai')).toBe('#EC4899');
    });
  });

  describe('getOrganizationGradient', () => {
    it('should return gradient for openai', () => {
      const [start, end] = getOrganizationGradient('openai');
      expect(start).toBe('#10B981');
      expect(end).toBe('#059669');
    });

    it('should return gradient for anthropic', () => {
      const [start, end] = getOrganizationGradient('anthropic');
      expect(start).toBe('#F59E0B');
      expect(end).toBe('#D97706');
    });

    it('should return same color twice for unknown org', () => {
      const [start, end] = getOrganizationGradient('unknown-org');
      expect(start).toBe('#94A3B8');
      expect(end).toBe('#94A3B8');
    });

    it('should be case insensitive', () => {
      const [start, end] = getOrganizationGradient('Google');
      expect(start).toBe('#3B82F6');
      expect(end).toBe('#2563EB');
    });
  });

  describe('calculateCodeArenaScore', () => {
    it('should calculate average of all code arena scores', () => {
      const scores: ArenaScores = {
        'text-to-website': 0.8,
        threejs: 0.7,
        'text-to-game': 0.6,
        'p5-animation': 0.5,
        'text-to-svg': 0.4,
        dataviz: 0.3,
        tonejs: 0.2,
      };
      const result = calculateCodeArenaScore(scores);
      expect(result).toBeCloseTo(50, 0);
    });

    it('should calculate average of partial scores', () => {
      const scores: ArenaScores = {
        'text-to-website': 0.8,
        threejs: 0.6,
      };
      const result = calculateCodeArenaScore(scores);
      expect(result).toBeCloseTo(70, 0);
    });

    it('should return null for empty scores', () => {
      expect(calculateCodeArenaScore({})).toBeNull();
    });

    it('should ignore null/undefined values', () => {
      const scores: ArenaScores = {
        'text-to-website': 0.8,
        threejs: undefined,
      };
      const result = calculateCodeArenaScore(scores);
      expect(result).toBe(80);
    });
  });

  describe('calculateChatArenaScore', () => {
    it('should return score multiplied by 100', () => {
      const scores: ArenaScores = { 'chat-arena': 0.85 };
      expect(calculateChatArenaScore(scores)).toBe(85);
    });

    it('should return null for missing chat-arena', () => {
      expect(calculateChatArenaScore({})).toBeNull();
    });

    it('should handle score of 0', () => {
      const scores: ArenaScores = { 'chat-arena': 0 };
      expect(calculateChatArenaScore(scores)).toBe(0);
    });

    it('should return null for undefined chat-arena', () => {
      const scores: ArenaScores = { 'chat-arena': undefined };
      expect(calculateChatArenaScore(scores)).toBeNull();
    });
  });

  describe('calculateCategoryArenaScores', () => {
    it('should convert arena scores for vision category', () => {
      const scores: ArenaScores = {
        'chat-arena': 0.85,
        'text-to-website': 0.75,
      };
      const result = calculateCategoryArenaScores(scores, 'vision');
      expect(result['chat-arena']).toBe(85);
      expect(result['text-to-website']).toBe(75);
    });

    it('should convert arena scores for image-generation category', () => {
      const scores: ArenaScores = {
        'text-to-image': 0.9,
        'image-to-image': 0.8,
      };
      const result = calculateCategoryArenaScores(scores, 'image-generation');
      expect(result['text-to-image']).toBe(90);
      expect(result['image-to-image']).toBe(80);
    });

    it('should handle empty scores', () => {
      const result = calculateCategoryArenaScores({}, 'vision');
      expect(result).toEqual({});
    });

    it('should skip null/undefined values', () => {
      const scores: ArenaScores = {
        'chat-arena': 0.5,
        'text-to-website': undefined,
      };
      const result = calculateCategoryArenaScores(scores, 'vision');
      expect(result['chat-arena']).toBe(50);
      expect(result['text-to-website']).toBeUndefined();
    });

    it('should work with all category', () => {
      const scores: ArenaScores = {
        'chat-arena': 0.7,
        'text-to-website': 0.6,
      };
      const result = calculateCategoryArenaScores(scores, 'all');
      expect(result['chat-arena']).toBe(70);
      expect(result['text-to-website']).toBe(60);
    });
  });

  describe('getModelsAll', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch models without params', async () => {
      const mockModels = [
        { model_id: 'openai/gpt-4', name: 'GPT-4', organization: 'OpenAI' },
        { model_id: 'anthropic/claude-3', name: 'Claude 3', organization: 'Anthropic' },
      ];
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockModels), { status: 200 }),
      );

      const result = await getModelsAll();

      expect(result).toEqual(mockModels);
      expect(fetch).toHaveBeenCalledWith(
        '/api/zeroeval/models/all',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should fetch models with model_type param', async () => {
      const mockModels = [{ model_id: 'llm-1', name: 'LLM Model' }];
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockModels), { status: 200 }),
      );

      await getModelsAll({ model_type: 'llm' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/zeroeval/models/all?model_type=llm',
        expect.any(Object),
      );
    });

    it('should fetch models with input_modality param', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      await getModelsAll({ input_modality: 'image' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/zeroeval/models/all?input_modality=image',
        expect.any(Object),
      );
    });

    it('should fetch models with output_modality param', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      await getModelsAll({ output_modality: 'text' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/zeroeval/models/all?output_modality=text',
        expect.any(Object),
      );
    });

    it('should fetch models with all params combined', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      await getModelsAll({ model_type: 'llm', input_modality: 'text', output_modality: 'text' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/zeroeval/models/all?'),
        expect.any(Object),
      );
      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('model_type=llm');
      expect(calledUrl).toContain('input_modality=text');
      expect(calledUrl).toContain('output_modality=text');
    });
  });

  describe('getModelsFull', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch full models with justCanonicals=true by default', async () => {
      const mockModels = [{ model_id: 'openai/gpt-4', params: 1000000000 }];
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockModels), { status: 200 }),
      );

      const result = await getModelsFull();

      expect(result).toEqual(mockModels);
      expect(fetch).toHaveBeenCalledWith('/api/zeroeval/models/full', expect.any(Object));
    });

    it('should fetch full models with justCanonicals=false', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      await getModelsFull(false);

      expect(fetch).toHaveBeenCalledWith(
        '/api/zeroeval/models/full?justCanonicals=false',
        expect.any(Object),
      );
    });
  });

  describe('getModelDetail', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch model detail for given model ID', async () => {
      const mockDetail = {
        model_id: 'openai/gpt-4',
        name: 'GPT-4',
        description: 'Large language model',
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockDetail), { status: 200 }),
      );

      const result = await getModelDetail('openai/gpt-4');

      expect(result).toEqual(mockDetail);
      expect(fetch).toHaveBeenCalledWith('/api/zeroeval/models/openai%2Fgpt-4', expect.any(Object));
    });

    it('should URL encode model ID with special characters', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await getModelDetail('model/with spaces & symbols');

      expect(fetch).toHaveBeenCalledWith(
        '/api/zeroeval/models/model%2Fwith%20spaces%20%26%20symbols',
        expect.any(Object),
      );
    });
  });

  describe('getBenchmarks', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch all benchmarks', async () => {
      const mockBenchmarks = [
        { benchmark_id: 'gpqa', name: 'GPQA', max_score: 100 },
        { benchmark_id: 'mmmu', name: 'MMMU', max_score: 100 },
      ];
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockBenchmarks), { status: 200 }),
      );

      const result = await getBenchmarks();

      expect(result).toEqual(mockBenchmarks);
      expect(fetch).toHaveBeenCalledWith('/api/zeroeval/benchmarks', expect.any(Object));
    });
  });

  describe('getArenaScores', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return empty object for empty modelIds array', async () => {
      const result = await getArenaScores([]);

      expect(result).toEqual({});
    });

    it('should fetch arena scores for valid modelIds', async () => {
      const mockScores = {
        'openai/gpt-4': { 'chat-arena': 0.85, 'text-to-website': 0.9 },
        'anthropic/claude-3': { 'chat-arena': 0.87 },
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockScores), { status: 200 }),
      );

      const result = await getArenaScores(['openai/gpt-4', 'anthropic/claude-3']);

      expect(result).toEqual(mockScores);
      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('/api/zeroeval/arena-scores?');
      expect(calledUrl).toContain('model_ids=openai%2Fgpt-4%2Canthropic%2Fclaude-3');
      expect(calledUrl).toContain('arena_names=');
    });
  });

  describe('getArenaScoresForCategory', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return empty object for empty modelIds array', async () => {
      const result = await getArenaScoresForCategory([], 'vision');

      expect(result).toEqual({});
    });

    it('should fetch arena scores with category-specific arena names', async () => {
      const mockScores = {
        'openai/gpt-4': { 'text-to-image': 0.9 },
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockScores), { status: 200 }),
      );

      const result = await getArenaScoresForCategory(['openai/gpt-4'], 'image-generation');

      expect(result).toEqual(mockScores);
      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('/api/zeroeval/arena-scores?');
      expect(calledUrl).toContain('model_ids=openai%2Fgpt-4');
      expect(calledUrl).toContain('arena_names=text-to-image%2Cimage-to-image');
    });

    it('should use correct arena names for video-generation category', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await getArenaScoresForCategory(['model-1'], 'video-generation');

      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('arena_names=text-to-video%2Cimage-to-video%2Cvideo-editing');
    });
  });
});
