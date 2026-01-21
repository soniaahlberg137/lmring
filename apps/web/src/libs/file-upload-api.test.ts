import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteFile, deleteFileWithRetry, getFileUrl, uploadFile } from './file-upload-api';

describe('file-upload-api', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              fileId: 'file-123',
              uploadUrl: 'https://storage.example.com/upload',
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              url: 'https://storage.example.com/file-123',
              mimeType: 'text/plain',
            }),
        } as Response);

      const result = await uploadFile(mockFile);

      expect(result).toEqual({
        fileId: 'file-123',
        url: 'https://storage.example.com/file-123',
        mimeType: 'text/plain',
        filename: 'test.txt',
      });
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('should throw error when init fails', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Init failed' }),
      } as Response);

      await expect(uploadFile(mockFile)).rejects.toThrow('Init failed');
    });

    it('should throw default error when init fails without error message', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Parse error')),
      } as Response);

      await expect(uploadFile(mockFile)).rejects.toThrow('Failed to initialize upload');
    });

    it('should throw error when upload fails', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              fileId: 'file-123',
              uploadUrl: 'https://storage.example.com/upload',
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
        } as Response);

      await expect(uploadFile(mockFile)).rejects.toThrow('Failed to upload file to storage');
    });

    it('should throw error when URL fetch fails', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              fileId: 'file-123',
              uploadUrl: 'https://storage.example.com/upload',
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'URL fetch failed' }),
        } as Response);

      await expect(uploadFile(mockFile)).rejects.toThrow('URL fetch failed');
    });

    it('should use base64 when url is not available', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              fileId: 'file-123',
              uploadUrl: 'https://storage.example.com/upload',
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ base64: 'data:text/plain;base64,abc', mimeType: 'text/plain' }),
        } as Response);

      const result = await uploadFile(mockFile);

      expect(result.url).toBe('data:text/plain;base64,abc');
    });
  });

  describe('getFileUrl', () => {
    it('should return file URL result', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            fileId: 'file-123',
            url: 'https://example.com/file',
            mimeType: 'image/png',
          }),
      } as Response);

      const result = await getFileUrl('file-123');

      expect(result).toEqual({
        fileId: 'file-123',
        url: 'https://example.com/file',
        mimeType: 'image/png',
      });
      expect(fetchSpy).toHaveBeenCalledWith('/api/files/file-123/url');
    });

    it('should throw error on failure', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      } as Response);

      await expect(getFileUrl('file-123')).rejects.toThrow('Not found');
    });

    it('should throw default error when no error message', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Parse error')),
      } as Response);

      await expect(getFileUrl('file-123')).rejects.toThrow('Failed to get file URL');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await expect(deleteFile('file-123')).resolves.toBeUndefined();
      expect(fetchSpy).toHaveBeenCalledWith('/api/files/file-123/url', { method: 'DELETE' });
    });

    it('should throw error on failure', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Delete failed' }),
      } as Response);

      await expect(deleteFile('file-123')).rejects.toThrow('Delete failed');
    });

    it('should throw default error when no error message', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Parse error')),
      } as Response);

      await expect(deleteFile('file-123')).rejects.toThrow('Failed to delete file');
    });
  });

  describe('deleteFileWithRetry', () => {
    it('should return success on first attempt', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await deleteFileWithRetry('file-123');

      expect(result).toEqual({ success: true });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response);

      const promise = deleteFileWithRetry('file-123');
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should return failure after all retries', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Always fails' }),
      } as Response);

      const promise = deleteFileWithRetry('file-123', 3);
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toEqual({ success: false, error: 'Always fails' });
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle non-Error exceptions', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockRejectedValue('string error');

      const promise = deleteFileWithRetry('file-123', 1);
      const result = await promise;

      expect(result).toEqual({ success: false, error: 'Unknown error' });
    });

    it('should use custom maxRetries', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' }),
      } as Response);

      const promise = deleteFileWithRetry('file-123', 2);
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result).toEqual({ success: false, error: 'Failed' });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
