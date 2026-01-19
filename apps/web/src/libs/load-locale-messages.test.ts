import { describe, expect, it, vi } from 'vitest';
import { loadLocaleMessages } from './load-locale-messages';

vi.mock('@/locales/en.json', () => ({
  default: { greeting: 'Hello', goodbye: 'Goodbye' },
}));

vi.mock('@/locales/zh.json', () => ({
  default: { greeting: '你好', goodbye: '再见' },
}));

vi.mock('@/locales/fr.json', () => ({
  default: { greeting: 'Bonjour', goodbye: 'Au revoir' },
}));

describe('load-locale-messages', () => {
  describe('loadLocaleMessages', () => {
    it('should load English messages', async () => {
      const messages = await loadLocaleMessages('en');
      expect(messages).toEqual({ greeting: 'Hello', goodbye: 'Goodbye' });
    });

    it('should load Chinese messages', async () => {
      const messages = await loadLocaleMessages('zh');
      expect(messages).toEqual({ greeting: '你好', goodbye: '再见' });
    });

    it('should load French messages', async () => {
      const messages = await loadLocaleMessages('fr');
      expect(messages).toEqual({ greeting: 'Bonjour', goodbye: 'Au revoir' });
    });

    it('should throw error for unsupported locale', async () => {
      await expect(loadLocaleMessages('de' as 'en')).rejects.toThrow('Unsupported locale: de');
    });

    it('should throw error for invalid locale', async () => {
      await expect(loadLocaleMessages('invalid' as 'en')).rejects.toThrow(
        'Unsupported locale: invalid',
      );
    });
  });
});
