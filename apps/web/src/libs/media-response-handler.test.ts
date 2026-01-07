import { describe, expect, it } from 'vitest';
import { base64ToFile, detectBase64Media, replaceBase64WithUrls } from './media-response-handler';

describe('media-response-handler', () => {
  describe('detectBase64Media', () => {
    it('should detect markdown images with base64 data', () => {
      const content =
        'Here is an image: ![test image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==)';
      const detected = detectBase64Media(content);

      expect(detected).toHaveLength(1);
      const first = detected[0];
      expect(first).toBeDefined();
      expect(first?.type).toBe('image');
      expect(first?.mimeType).toBe('image/png');
      expect(first?.base64Data).toContain('data:image/png;base64,');
    });

    it('should detect multiple markdown images', () => {
      const content = `
        First image: ![img1](data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAEP/9k=)
        Second image: ![img2](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)
      `;
      const detected = detectBase64Media(content);

      expect(detected).toHaveLength(2);
      expect(detected[0]?.mimeType).toBe('image/jpeg');
      expect(detected[1]?.mimeType).toBe('image/gif');
    });

    it('should return empty array for content without base64 images', () => {
      const content = 'Just regular text with a normal image ![alt](https://example.com/image.png)';
      const detected = detectBase64Media(content);

      expect(detected).toHaveLength(0);
    });

    it('should return empty array for empty content', () => {
      const detected = detectBase64Media('');
      expect(detected).toHaveLength(0);
    });

    it('should capture correct start and end indices', () => {
      const prefix = 'Before: ';
      const imageMarkdown = '![test](data:image/png;base64,ABC123)';
      const suffix = ' After';
      const content = prefix + imageMarkdown + suffix;

      const detected = detectBase64Media(content);

      expect(detected).toHaveLength(1);
      const first = detected[0];
      expect(first).toBeDefined();
      expect(first?.startIndex).toBe(prefix.length);
      expect(first?.endIndex).toBe(prefix.length + imageMarkdown.length);
      expect(first?.originalMatch).toBe(imageMarkdown);
    });
  });

  describe('base64ToFile', () => {
    it('should convert base64 PNG data URL to File', () => {
      // 1x1 transparent PNG
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const file = base64ToFile(dataUrl, 'test.png');

      expect(file.name).toBe('test.png');
      expect(file.type).toBe('image/png');
      expect(file.size).toBeGreaterThan(0);
    });

    it('should convert base64 JPEG data URL to File', () => {
      // Minimal JPEG
      const dataUrl =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAEP/9k=';
      const file = base64ToFile(dataUrl, 'test.jpg');

      expect(file.name).toBe('test.jpg');
      expect(file.type).toBe('image/jpeg');
    });

    it('should handle missing base64 data gracefully', () => {
      const dataUrl = 'data:image/png;base64,';
      const file = base64ToFile(dataUrl, 'empty.png');

      expect(file.name).toBe('empty.png');
      expect(file.size).toBe(0);
    });
  });

  describe('replaceBase64WithUrls', () => {
    it('should replace base64 markdown images with URL versions', () => {
      const originalMatch = '![test](data:image/png;base64,ABC123)';
      const content = `Before ${originalMatch} after`;

      const uploadResults = new Map([
        [
          originalMatch,
          {
            type: 'image' as const,
            key: 'users/123/file.png',
            mimeType: 'image/png',
            filename: 'ai-generated.png',
            url: 'https://storage.example.com/users/123/file.png',
            sizeBytes: 1234,
          },
        ],
      ]);

      const result = replaceBase64WithUrls(content, uploadResults);

      expect(result).toBe(
        'Before ![ai-generated.png](https://storage.example.com/users/123/file.png) after',
      );
      expect(result).not.toContain('base64');
    });

    it('should replace multiple base64 images', () => {
      const match1 = '![img1](data:image/png;base64,AAA)';
      const match2 = '![img2](data:image/jpeg;base64,BBB)';
      const content = `${match1} and ${match2}`;

      const uploadResults = new Map([
        [
          match1,
          {
            type: 'image' as const,
            key: 'users/123/file1.png',
            mimeType: 'image/png',
            filename: 'file1.png',
            url: 'https://storage.example.com/file1.png',
            sizeBytes: 100,
          },
        ],
        [
          match2,
          {
            type: 'image' as const,
            key: 'users/123/file2.jpg',
            mimeType: 'image/jpeg',
            filename: 'file2.jpg',
            url: 'https://storage.example.com/file2.jpg',
            sizeBytes: 200,
          },
        ],
      ]);

      const result = replaceBase64WithUrls(content, uploadResults);

      expect(result).toBe(
        '![file1.png](https://storage.example.com/file1.png) and ![file2.jpg](https://storage.example.com/file2.jpg)',
      );
    });

    it('should return original content when no uploads match', () => {
      const content = 'Some content without matches';
      const uploadResults = new Map();

      const result = replaceBase64WithUrls(content, uploadResults);

      expect(result).toBe(content);
    });
  });
});
