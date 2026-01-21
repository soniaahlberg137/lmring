import { describe, expect, it, vi } from 'vitest';

vi.mock('@lmring/i18n', () => ({
  I18nConfig: {
    locales: ['en', 'zh', 'fr'] as const,
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

    it('should return true for valid locale zh', () => {
      expect(isSupportedLocale('zh')).toBe(true);
    });

    it('should return true for valid locale fr', () => {
      expect(isSupportedLocale('fr')).toBe(true);
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

    it('should parse simple locale zh', () => {
      expect(parseAcceptLanguage('zh')).toBe('zh');
    });

    it('should parse locale with region code en-US', () => {
      expect(parseAcceptLanguage('en-US')).toBe('en');
    });

    it('should parse locale with region code zh-CN', () => {
      expect(parseAcceptLanguage('zh-CN')).toBe('zh');
    });

    it('should parse complex Accept-Language header with quality values', () => {
      expect(parseAcceptLanguage('en-US,fr;q=0.9,zh;q=0.8')).toBe('en');
    });

    it('should return first supported locale from multiple candidates', () => {
      expect(parseAcceptLanguage('de,fr;q=0.9')).toBe('fr');
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
      expect(parseAcceptLanguage('ZH')).toBe('zh');
    });

    it('should handle whitespace in header', () => {
      expect(parseAcceptLanguage(' en , fr ')).toBe('en');
    });
  });

  describe('resolveLocale', () => {
    it('should return headerLocale when it is a supported locale', () => {
      expect(resolveLocale({ headerLocale: 'fr' })).toBe('fr');
    });

    it('should return acceptLanguage locale when headerLocale is not supported', () => {
      expect(resolveLocale({ headerLocale: 'de', acceptLanguage: 'zh' })).toBe('zh');
    });

    it('should return acceptLanguage locale when headerLocale is null', () => {
      expect(resolveLocale({ headerLocale: null, acceptLanguage: 'zh' })).toBe('zh');
    });

    it('should return acceptLanguage locale when headerLocale is undefined', () => {
      expect(resolveLocale({ acceptLanguage: 'fr' })).toBe('fr');
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

    it('should parse Accept-Language header format', () => {
      expect(resolveLocale({ acceptLanguage: 'fr-FR,en;q=0.9' })).toBe('fr');
    });
  });
});
