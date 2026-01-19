import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as GET_ARENA } from '@/app/api/zeroeval/arena-scores/route';
import { GET as GET_BENCHMARKS } from '@/app/api/zeroeval/benchmarks/route';
import { GET as GET_MODEL_DETAIL } from '@/app/api/zeroeval/models/[modelId]/route';
import { GET as GET_MODELS_ALL } from '@/app/api/zeroeval/models/all/route';
import { GET as GET_MODELS_FULL } from '@/app/api/zeroeval/models/full/route';
import { createMockRequest, parseJsonResponse, setupTestEnvironment } from '@/test/helpers';

const mockFetch = vi.fn();
global.fetch = mockFetch;

setupTestEnvironment();

describe('ZeroEval Proxy API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/zeroeval/arena-scores', () => {
    it('should proxy arena scores successfully', async () => {
      const mockData = { scores: [{ model: 'gpt-4o', score: 95 }] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/zeroeval/arena-scores');
      const response = await GET_ARENA(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual(mockData);
    });

    it('should forward query parameters', async () => {
      const mockData = { scores: [] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/zeroeval/arena-scores?model_ids=gpt-4o&arena_names=arena1',
      );
      await GET_ARENA(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('model_ids=gpt-4o'),
        expect.any(Object),
      );
    });

    it('should return upstream error status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/zeroeval/arena-scores');
      const response = await GET_ARENA(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toContain('Upstream error');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = createMockRequest('GET', 'http://localhost:3000/api/zeroeval/arena-scores');
      const response = await GET_ARENA(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch');
    });
  });

  describe('GET /api/zeroeval/benchmarks', () => {
    it('should proxy benchmarks successfully', async () => {
      const mockData = { benchmarks: ['MMLU', 'GSM8K'] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const response = await GET_BENCHMARKS();
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual(mockData);
    });

    it('should return error on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      const response = await GET_BENCHMARKS();
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(503);
      expect(data.error).toContain('Upstream error');
    });
  });

  describe('GET /api/zeroeval/models/all', () => {
    it('should proxy models list successfully', async () => {
      const mockData = { models: ['gpt-4o', 'claude-3'] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/zeroeval/models/all');
      const response = await GET_MODELS_ALL(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual(mockData);
    });

    it('should forward filter parameters', async () => {
      const mockData = { models: [] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/zeroeval/models/all?model_type=chat&input_modality=text',
      );
      await GET_MODELS_ALL(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('model_type=chat'),
        expect.any(Object),
      );
    });
  });

  describe('GET /api/zeroeval/models/full', () => {
    it('should proxy full models list successfully', async () => {
      const mockData = { models: [{ id: 'gpt-4o', details: {} }] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/zeroeval/models/full');
      const response = await GET_MODELS_FULL(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual(mockData);
    });

    it('should default to justCanonicals=true', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/zeroeval/models/full');
      await GET_MODELS_FULL(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('justCanonicals=true'),
        expect.any(Object),
      );
    });

    it('should allow disabling justCanonicals', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/zeroeval/models/full?justCanonicals=false',
      );
      await GET_MODELS_FULL(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('justCanonicals'),
        expect.any(Object),
      );
    });
  });

  describe('GET /api/zeroeval/models/[modelId]', () => {
    it('should proxy model details successfully', async () => {
      const mockData = { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/zeroeval/models/gpt-4o');
      const response = await GET_MODEL_DETAIL(request, {
        params: Promise.resolve({ modelId: 'gpt-4o' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual(mockData);
    });

    it('should encode model ID in URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const modelId = 'gpt-4o/latest';
      const request = createMockRequest(
        'GET',
        `http://localhost:3000/api/zeroeval/models/${encodeURIComponent(modelId)}`,
      );
      await GET_MODEL_DETAIL(request, { params: Promise.resolve({ modelId }) });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(modelId)),
        expect.any(Object),
      );
    });

    it('should return 404 for nonexistent model', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/zeroeval/models/nonexistent',
      );
      const response = await GET_MODEL_DETAIL(request, {
        params: Promise.resolve({ modelId: 'nonexistent' }),
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toContain('Upstream error');
    });
  });
});
