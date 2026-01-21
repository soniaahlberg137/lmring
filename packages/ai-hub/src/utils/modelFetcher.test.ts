import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as configs from '../providers/configs';
import { fetchAvailableModels, supportsModelFetching } from './modelFetcher';

describe('supportsModelFetching', () => {
  it('returns false for static-only providers', () => {
    expect(supportsModelFetching('anthropic')).toBe(false);
    expect(supportsModelFetching('azure')).toBe(false);
    expect(supportsModelFetching('vertex')).toBe(false);
    expect(supportsModelFetching('bedrock')).toBe(false);
  });

  it('returns true for dynamic providers', () => {
    expect(supportsModelFetching('openai')).toBe(true);
    expect(supportsModelFetching('mistral')).toBe(true);
    expect(supportsModelFetching('deepseek')).toBe(true);
  });
});

describe('fetchAvailableModels', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('static-only providers', () => {
    it('returns static models for anthropic', async () => {
      vi.spyOn(configs, 'getProviderById').mockReturnValue({
        id: 'anthropic',
        name: 'Anthropic',
        type: 'official',
        models: [
          { id: 'claude-3-opus', name: 'Claude 3 Opus' },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
        ],
      });

      const result = await fetchAvailableModels('anthropic', 'key', 'https://api.anthropic.com');

      expect(result.source).toBe('static');
      expect(result.models).toHaveLength(2);
      expect(result.models[0]).toEqual({ id: 'claude-3-opus', name: 'Claude 3 Opus' });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns empty array when provider has no models', async () => {
      vi.spyOn(configs, 'getProviderById').mockReturnValue({
        id: 'azure',
        name: 'Azure',
        type: 'official',
      });

      const result = await fetchAvailableModels('azure', 'key', 'https://azure.com');

      expect(result.source).toBe('static');
      expect(result.models).toEqual([]);
    });

    it('returns empty array when provider not found', async () => {
      vi.spyOn(configs, 'getProviderById').mockReturnValue(undefined);

      const result = await fetchAvailableModels('bedrock', 'key', 'https://bedrock.aws');

      expect(result.source).toBe('static');
      expect(result.models).toEqual([]);
    });
  });

  describe('dynamic providers', () => {
    it('fetches models from OpenAI-compatible API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { id: 'gpt-4o', name: 'GPT-4o', created: 1700000000, owned_by: 'openai' },
              { id: 'gpt-4', name: 'GPT-4' },
            ],
          }),
      });

      const result = await fetchAvailableModels('openai', 'sk-xxx', 'https://api.openai.com/v1');

      expect(result.source).toBe('dynamic');
      expect(result.models).toHaveLength(2);
      expect(result.models[0]).toEqual({
        id: 'gpt-4o',
        name: 'GPT-4o',
        created: 1700000000,
        owned_by: 'openai',
      });
      expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer sk-xxx',
          'Content-Type': 'application/json',
        },
      });
    });

    it('handles base URL without /v1 suffix', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'model-1' }] }),
      });

      await fetchAvailableModels('deepseek', 'key', 'https://api.deepseek.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/models',
        expect.any(Object),
      );
    });

    it('handles base URL with trailing slash', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'model-1' }] }),
      });

      await fetchAvailableModels('openai', 'key', 'https://api.openai.com/v1/');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.any(Object),
      );
    });

    it('handles base URL with multiple trailing slashes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'model-1' }] }),
      });

      await fetchAvailableModels('openai', 'key', 'https://api.openai.com/v1///');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.any(Object),
      );
    });

    it('handles array response format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 'model-a' }, { id: 'model-b' }]),
      });

      const result = await fetchAvailableModels('custom', 'key', 'https://custom.api/v1');

      expect(result.source).toBe('dynamic');
      expect(result.models).toHaveLength(2);
    });

    it('returns empty array for unexpected response format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: 'invalid' }),
      });

      const result = await fetchAvailableModels('custom', 'key', 'https://custom.api/v1');

      expect(result.source).toBe('dynamic');
      expect(result.models).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('throws on 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid API key'),
      });

      await expect(
        fetchAvailableModels('openai', 'bad-key', 'https://api.openai.com/v1'),
      ).rejects.toThrow('401');
    });

    it('throws when error message contains Unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: () => Promise.resolve('Unauthorized access'),
      });

      await expect(
        fetchAvailableModels('openai', 'bad-key', 'https://api.openai.com/v1'),
      ).rejects.toThrow('Unauthorized');
    });

    it('falls back to static models on 404', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Endpoint not found'),
      });

      vi.spyOn(configs, 'getProviderById').mockReturnValue({
        id: 'custom',
        name: 'Custom',
        type: 'compatible',
        models: [{ id: 'fallback-model', name: 'Fallback' }],
      });

      const result = await fetchAvailableModels('custom', 'key', 'https://custom.api/v1');

      expect(result.source).toBe('static');
      expect(result.models).toHaveLength(1);
    });

    it('falls back to static models on network error with warning', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));

      vi.spyOn(configs, 'getProviderById').mockReturnValue({
        id: 'custom',
        name: 'Custom',
        type: 'compatible',
        models: [{ id: 'static-model', name: 'Static' }],
      });

      const result = await fetchAvailableModels('custom', 'key', 'https://custom.api/v1');

      expect(result.source).toBe('static');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });

    it('does not warn on expected 404 errors', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Not Found'),
      });

      vi.spyOn(configs, 'getProviderById').mockReturnValue(undefined);

      await fetchAvailableModels('custom', 'key', 'https://custom.api/v1');

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not warn when error contains Endpoint not found', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Endpoint not found'),
      });

      vi.spyOn(configs, 'getProviderById').mockReturnValue(undefined);

      await fetchAvailableModels('custom', 'key', 'https://custom.api/v1');

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('handles non-Error thrown', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockRejectedValue('string error');

      vi.spyOn(configs, 'getProviderById').mockReturnValue({
        id: 'custom',
        name: 'Custom',
        type: 'compatible',
        models: [{ id: 'fallback', name: 'Fallback' }],
      });

      const result = await fetchAvailableModels('custom', 'key', 'https://custom.api/v1');

      expect(result.source).toBe('static');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    });
  });
});
