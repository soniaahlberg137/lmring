import { describe, expect, it, vi } from 'vitest';
import { loadLocaleMessages } from './load-locale-messages';

vi.mock('@/locales/en.json', () => ({
  default: { greeting: 'Hello', goodbye: 'Goodbye' },
}));

describe('load-locale-messages', () => {
  describe('loadLocaleMessages', () => {
    it('should load English messages', async () => {
      const messages = await loadLocaleMessages('en');
      expect(messages).toEqual({ greeting: 'Hello', goodbye: 'Goodbye' });
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
