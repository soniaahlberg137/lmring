import { describe, expect, it, vi } from 'vitest';

vi.mock('@lmring/i18n', () => ({
  I18nConfig: {
    locales: ['en'] as const,
    defaultLocale: 'en' as const,
  },
}));

import {
  isSupportedLocale,
  LANGUAGE_HEADER,
  LANGUAGE_QUERY_PARAM,
  parseAcceptLanguage,
  resolveLocale,
} from './locale-utils';

describe('locale-utils', () => {
  describe('constants', () => {
    it('should export LANGUAGE_HEADER', () => {
      expect(LANGUAGE_HEADER).toBe('x-language');
    });

    it('should export LANGUAGE_QUERY_PARAM', () => {
      expect(LANGUAGE_QUERY_PARAM).toBe('lang');
    });
  });

  describe('isSupportedLocale', () => {
    it('should return true for valid locale en', () => {
      expect(isSupportedLocale('en')).toBe(true);
    });

    it('should return false for unsupported locale zh', () => {
      expect(isSupportedLocale('zh')).toBe(false);
    });

    it('should return false for unsupported locale fr', () => {
      expect(isSupportedLocale('fr')).toBe(false);
    });

    it('should return false for unsupported locale de', () => {
      expect(isSupportedLocale('de')).toBe(false);
    });

    it('should return false for unsupported locale es', () => {
      expect(isSupportedLocale('es')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isSupportedLocale('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isSupportedLocale(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isSupportedLocale(undefined)).toBe(false);
    });
  });

  describe('parseAcceptLanguage', () => {
    it('should parse simple locale en', () => {
      expect(parseAcceptLanguage('en')).toBe('en');
    });

    it('should return null for unsupported locale zh', () => {
      expect(parseAcceptLanguage('zh')).toBe(null);
    });

    it('should parse locale with region code en-US', () => {
      expect(parseAcceptLanguage('en-US')).toBe('en');
    });

    it('should return null for unsupported locale zh-CN', () => {
      expect(parseAcceptLanguage('zh-CN')).toBe(null);
    });

    it('should parse complex Accept-Language header and return first supported', () => {
      expect(parseAcceptLanguage('en-US,fr;q=0.9,zh;q=0.8')).toBe('en');
    });

    it('should return null when no supported locale in candidates', () => {
      expect(parseAcceptLanguage('de,fr;q=0.9')).toBe(null);
    });

    it('should return null for unsupported locales', () => {
      expect(parseAcceptLanguage('de,es')).toBe(null);
    });

    it('should return null for null input', () => {
      expect(parseAcceptLanguage(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(parseAcceptLanguage(undefined)).toBe(null);
    });

    it('should return null for empty string', () => {
      expect(parseAcceptLanguage('')).toBe(null);
    });

    it('should handle locale codes case-insensitively', () => {
      expect(parseAcceptLanguage('EN')).toBe('en');
    });

    it('should handle whitespace in header', () => {
      expect(parseAcceptLanguage(' en , fr ')).toBe('en');
    });
  });

  describe('resolveLocale', () => {
    it('should return en when headerLocale is en', () => {
      expect(resolveLocale({ headerLocale: 'en' })).toBe('en');
    });

    it('should return default locale when headerLocale is unsupported fr', () => {
      expect(resolveLocale({ headerLocale: 'fr' })).toBe('en');
    });

    it('should return default locale when both are unsupported', () => {
      expect(resolveLocale({ headerLocale: 'de', acceptLanguage: 'zh' })).toBe('en');
    });

    it('should return default locale when headerLocale is null and acceptLanguage is unsupported', () => {
      expect(resolveLocale({ headerLocale: null, acceptLanguage: 'zh' })).toBe('en');
    });

    it('should return default locale when acceptLanguage is unsupported fr', () => {
      expect(resolveLocale({ acceptLanguage: 'fr' })).toBe('en');
    });

    it('should return default locale when both are null', () => {
      expect(resolveLocale({ headerLocale: null, acceptLanguage: null })).toBe('en');
    });

    it('should return default locale when both are undefined', () => {
      expect(resolveLocale({})).toBe('en');
    });

    it('should return default locale when both are unsupported', () => {
      expect(resolveLocale({ headerLocale: 'de', acceptLanguage: 'es' })).toBe('en');
    });

    it('should return en when en appears in Accept-Language after unsupported locale', () => {
      expect(resolveLocale({ acceptLanguage: 'fr-FR,en;q=0.9' })).toBe('en');
    });
  });
});
