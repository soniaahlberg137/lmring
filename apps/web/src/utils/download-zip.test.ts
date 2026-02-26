import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadFilesAsZip, promptToFilename } from './download-zip';

describe('download-zip', () => {
  describe('promptToFilename', () => {
    it('should slugify a simple prompt', () => {
      expect(promptToFilename('A todo app')).toBe('a-todo-app');
    });

    it('should replace special characters with hyphens', () => {
      expect(promptToFilename('Hello, World! @#$%')).toBe('hello-world');
    });

    it('should truncate to 50 characters', () => {
      const longPrompt = 'a'.repeat(100);
      expect(promptToFilename(longPrompt).length).toBe(50);
    });

    it('should not end with trailing hyphens after truncation', () => {
      // 49 a's + special char → slug is 49 a's, no trailing hyphen
      const prompt = `${'a'.repeat(49)}!${'b'.repeat(10)}`;
      const result = promptToFilename(prompt);
      expect(result).not.toMatch(/-$/);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should fall back to webdev-project for empty string', () => {
      expect(promptToFilename('')).toBe('webdev-project');
    });

    it('should fall back to webdev-project for whitespace-only string', () => {
      expect(promptToFilename('   ')).toBe('webdev-project');
    });

    it('should fall back to webdev-project for special-chars-only string', () => {
      expect(promptToFilename('!@#$%^&*()')).toBe('webdev-project');
    });

    it('should strip leading and trailing hyphens', () => {
      expect(promptToFilename('---hello---')).toBe('hello');
    });

    it('should collapse multiple special characters into a single hyphen', () => {
      expect(promptToFilename('hello   world!!!test')).toBe('hello-world-test');
    });
  });

  describe('downloadFilesAsZip', () => {
    let createElementSpy: ReturnType<typeof vi.spyOn>;
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let appendChildSpy: ReturnType<typeof vi.spyOn>;
    let removeChildSpy: ReturnType<typeof vi.spyOn>;
    let clickSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      clickSpy = vi.fn();
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickSpy,
      } as unknown as HTMLAnchorElement);
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create a zip and trigger download', () => {
      const files = {
        'index.html': '<html></html>',
        'style.css': 'body {}',
      };

      downloadFilesAsZip(files, 'project.zip');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('should throw for empty files record', () => {
      expect(() => downloadFilesAsZip({}, 'empty.zip')).toThrow('No files to download');
    });

    it('should normalize paths by stripping leading slashes', () => {
      const files = {
        '/src/index.ts': 'console.log("hello")',
        '///multi-slash.txt': 'content',
      };

      downloadFilesAsZip(files, 'test.zip');

      // Verify that the Blob was created (zip was built successfully)
      expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should set the correct download filename', () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      createElementSpy.mockReturnValue(mockAnchor);

      downloadFilesAsZip({ 'file.txt': 'content' }, 'my-project.zip');

      expect(mockAnchor.download).toBe('my-project.zip');
    });

    it('should create a Blob with application/zip type', () => {
      downloadFilesAsZip({ 'file.txt': 'hello' }, 'test.zip');

      const blobArg = createObjectURLSpy.mock.calls[0]?.[0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('application/zip');
    });
  });
});
