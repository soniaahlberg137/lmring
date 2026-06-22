import { describe, expect, it, vi } from 'vitest';
import { getServerTranslations } from './server-translations';

vi.mock('./load-locale-messages', () => ({
  loadLocaleMessages: vi.fn().mockImplementation((locale: string) => {
    const messages: Record<string, Record<string, string>> = {
      en: {
        greeting: 'Hello',
        welcome: 'Welcome, {name}!',
        items: 'You have {count} items',
        complex: 'Hello {name}, you have {count} messages',
      },
      zh: {
        greeting: '你好',
        welcome: '欢迎，{name}！',
      },
    };
    return Promise.resolve(messages[locale] || {});
  }),
}));

describe('server-translations', () => {
  describe('getServerTranslations', () => {
    it('should return translation function', async () => {
      const t = await getServerTranslations('en');
      expect(typeof t).toBe('function');
    });

    it('should translate simple key', async () => {
      const t = await getServerTranslations('en');
      expect(t('greeting')).toBe('Hello');
    });

    it('should translate key with single interpolation', async () => {
      const t = await getServerTranslations('en');
      expect(t('welcome', { name: 'John' })).toBe('Welcome, John!');
    });

    it('should translate key with multiple interpolations', async () => {
      const t = await getServerTranslations('en');
      expect(t('complex', { name: 'John', count: 5 })).toBe('Hello John, you have 5 messages');
    });

    it('should handle numeric values', async () => {
      const t = await getServerTranslations('en');
      expect(t('items', { count: 42 })).toBe('You have 42 items');
    });

    it('should return key for missing translation', async () => {
      const t = await getServerTranslations('en');
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('should replace all occurrences of same placeholder', async () => {
      await getServerTranslations('en');
      const mockMessages = { repeat: '{name} and {name}' };
      vi.doMock('./load-locale-messages', () => ({
        loadLocaleMessages: () => Promise.resolve(mockMessages),
      }));

      const tRepeat = await getServerTranslations('en');
      const result = tRepeat('greeting');
      expect(result).toBe('Hello');
    });

    it('should handle empty values object', async () => {
      const t = await getServerTranslations('en');
      expect(t('greeting', {})).toBe('Hello');
    });

    it('should preserve placeholders if value not provided', async () => {
      const t = await getServerTranslations('en');
      expect(t('welcome', { other: 'value' })).toBe('Welcome, {name}!');
    });
  });
});
