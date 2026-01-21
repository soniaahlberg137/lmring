import { afterEach, describe, expect, it, vi } from 'vitest';
import { addApiKey, deleteApiKey, getApiKeys, getProviderApiKey } from './arena-api';

describe('arena-api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getApiKeys', () => {
    it('should return API keys on success', async () => {
      const mockKeys = {
        keys: [
          {
            id: 'key-1',
            providerName: 'openai',
            proxyUrl: '',
            configSource: 'manual',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockKeys),
      } as Response);

      const result = await getApiKeys();

      expect(result).toEqual(mockKeys);
    });

    it('should throw error on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response);

      await expect(getApiKeys()).rejects.toThrow('Unauthorized');
    });

    it('should throw default error when no error message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(getApiKeys()).rejects.toThrow('Failed to get API keys');
    });

    it('should call correct endpoint', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ keys: [] }),
      } as Response);

      await getApiKeys();

      expect(fetchSpy).toHaveBeenCalledWith('/api/settings/api-keys');
    });
  });

  describe('addApiKey', () => {
    it('should add API key successfully', async () => {
      const mockResponse = {
        message: 'API key added',
        id: 'key-123',
        providerName: 'openai',
        proxyUrl: '',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await addApiKey('openai', 'sk-1234567890');

      expect(result).toEqual(mockResponse);
    });

    it('should add API key with proxy URL', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'API key added',
            id: 'key-123',
            providerName: 'openai',
            proxyUrl: 'https://proxy.example.com',
          }),
      } as Response);

      await addApiKey('openai', 'sk-1234567890', 'https://proxy.example.com');

      expect(fetchSpy).toHaveBeenCalledWith('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: 'openai',
          apiKey: 'sk-1234567890',
          proxyUrl: 'https://proxy.example.com',
        }),
      });
    });

    it('should throw error on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' }),
      } as Response);

      await expect(addApiKey('openai', 'invalid')).rejects.toThrow('Invalid API key');
    });

    it('should throw default error when no error message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(addApiKey('openai', 'sk-123')).rejects.toThrow('Failed to add API key');
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key successfully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'API key deleted' }),
      } as Response);

      const result = await deleteApiKey('key-123');

      expect(result).toEqual({ message: 'API key deleted' });
    });

    it('should call correct endpoint with key ID', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Deleted' }),
      } as Response);

      await deleteApiKey('key-456');

      expect(fetchSpy).toHaveBeenCalledWith('/api/settings/api-keys?id=key-456', {
        method: 'DELETE',
      });
    });

    it('should throw error on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Key not found' }),
      } as Response);

      await expect(deleteApiKey('invalid-key')).rejects.toThrow('Key not found');
    });

    it('should throw default error when no error message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(deleteApiKey('key-123')).rejects.toThrow('Failed to delete API key');
    });
  });

  describe('getProviderApiKey', () => {
    it('should return provider API key data', async () => {
      const mockKeyData = {
        id: 'key-123',
        providerName: 'openai',
        apiKey: 'sk-1234567890',
        proxyUrl: '',
        configSource: 'manual',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockKeyData),
      } as Response);

      const result = await getProviderApiKey('openai');

      expect(result).toEqual(mockKeyData);
    });

    it('should call correct endpoint with provider name', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'key-123',
            providerName: 'anthropic',
            apiKey: 'sk-ant-123',
            proxyUrl: '',
            configSource: 'manual',
          }),
      } as Response);

      await getProviderApiKey('anthropic');

      expect(fetchSpy).toHaveBeenCalledWith('/api/settings/api-keys/anthropic');
    });

    it('should throw error on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Provider not found' }),
      } as Response);

      await expect(getProviderApiKey('unknown')).rejects.toThrow('Provider not found');
    });

    it('should throw default error when no error message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(getProviderApiKey('openai')).rejects.toThrow('Failed to get API key');
    });
  });
});
