import { describe, expect, it, vi } from 'vitest';
import { getRequestLocale } from './request-locale';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((name: string) => {
      if (name === 'X-Language') return 'zh';
      if (name === 'accept-language') return 'en-US,en;q=0.9';
      return null;
    }),
  }),
}));

vi.mock('./locale-utils', () => ({
  LANGUAGE_HEADER: 'X-Language',
  resolveLocale: vi.fn(({ headerLocale, acceptLanguage }) => {
    if (headerLocale === 'zh') return 'zh';
    if (headerLocale === 'fr') return 'fr';
    if (acceptLanguage?.includes('en')) return 'en';
    return 'en';
  }),
}));

describe('request-locale', () => {
  describe('getRequestLocale', () => {
    it('should return resolved locale from headers', async () => {
      const locale = await getRequestLocale();
      expect(locale).toBe('zh');
    });

    it('should call resolveLocale with header values', async () => {
      const { resolveLocale } = await import('./locale-utils');

      await getRequestLocale();

      expect(resolveLocale).toHaveBeenCalledWith({
        headerLocale: 'zh',
        acceptLanguage: 'en-US,en;q=0.9',
      });
    });
  });
});
