import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filesToDataUrls,
  filesToImageAttachments,
  fileToDataUrl,
  fileToImageAttachment,
} from './file-utils';

class MockFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  private static shouldFail = false;
  private static mockResult = 'data:image/png;base64,abc123';

  static setMockResult(result: string) {
    MockFileReader.mockResult = result;
  }

  static setShouldFail(shouldFail: boolean) {
    MockFileReader.shouldFail = shouldFail;
  }

  static reset() {
    MockFileReader.shouldFail = false;
    MockFileReader.mockResult = 'data:image/png;base64,abc123';
  }

  readAsDataURL(_file: File) {
    setTimeout(() => {
      if (MockFileReader.shouldFail) {
        this.onerror?.();
      } else {
        this.result = MockFileReader.mockResult;
        this.onload?.();
      }
    }, 0);
  }
}

describe('file-utils', () => {
  const originalFileReader = globalThis.FileReader;

  beforeEach(() => {
    MockFileReader.reset();
    vi.stubGlobal('FileReader', MockFileReader);
  });

  afterEach(() => {
    vi.stubGlobal('FileReader', originalFileReader);
  });

  describe('fileToDataUrl', () => {
    it('should convert a file to data URL', async () => {
      const file = new File(['test content'], 'test.png', { type: 'image/png' });
      MockFileReader.setMockResult('data:image/png;base64,dGVzdCBjb250ZW50');

      const result = await fileToDataUrl(file);

      expect(result).toBe('data:image/png;base64,dGVzdCBjb250ZW50');
    });

    it('should reject on FileReader error', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      MockFileReader.setShouldFail(true);

      await expect(fileToDataUrl(file)).rejects.toThrow('Failed to read file: test.png');
    });
  });

  describe('filesToDataUrls', () => {
    it('should convert multiple files to data URLs', async () => {
      const files = [
        new File(['content1'], 'file1.png', { type: 'image/png' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
      ];
      MockFileReader.setMockResult('data:image/png;base64,content');

      const results = await filesToDataUrls(files);

      expect(results).toHaveLength(2);
      expect(results[0]).toBe('data:image/png;base64,content');
      expect(results[1]).toBe('data:image/png;base64,content');
    });

    it('should return empty array for empty input', async () => {
      const results = await filesToDataUrls([]);
      expect(results).toEqual([]);
    });
  });

  describe('fileToImageAttachment', () => {
    it('should create ImageAttachment with correct structure', async () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      MockFileReader.setMockResult('data:image/jpeg;base64,xyz789');

      const result = await fileToImageAttachment(file);

      expect(result).toEqual({
        type: 'image',
        data: 'data:image/jpeg;base64,xyz789',
        mediaType: 'image/jpeg',
        filename: 'photo.jpg',
      });
    });

    it('should handle files with empty name', async () => {
      const file = new File(['test'], '', { type: 'image/png' });
      MockFileReader.setMockResult('data:image/png;base64,abc');

      const result = await fileToImageAttachment(file);

      expect(result.filename).toBe('');
    });
  });

  describe('filesToImageAttachments', () => {
    it('should convert multiple files to ImageAttachments', async () => {
      const files = [
        new File(['content1'], 'image1.png', { type: 'image/png' }),
        new File(['content2'], 'image2.gif', { type: 'image/gif' }),
      ];
      MockFileReader.setMockResult('data:image;base64,data');

      const results = await filesToImageAttachments(files);

      expect(results).toHaveLength(2);
      expect(results[0]?.type).toBe('image');
      expect(results[0]?.filename).toBe('image1.png');
      expect(results[0]?.mediaType).toBe('image/png');
      expect(results[1]?.type).toBe('image');
      expect(results[1]?.filename).toBe('image2.gif');
      expect(results[1]?.mediaType).toBe('image/gif');
    });

    it('should return empty array for empty input', async () => {
      const results = await filesToImageAttachments([]);
      expect(results).toEqual([]);
    });
  });
});
