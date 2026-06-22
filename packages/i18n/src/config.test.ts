import { describe, expect, it } from 'vitest';
import { I18nConfig, isValidLocale } from './config';

describe('I18nConfig', () => {
  it('has locales array with en only', () => {
    expect(I18nConfig.locales).toEqual(['en']);
  });

  it('has defaultLocale as en', () => {
    expect(I18nConfig.defaultLocale).toBe('en');
  });

  it('has fallbackLng as en', () => {
    expect(I18nConfig.fallbackLng).toBe('en');
  });
});

describe('isValidLocale', () => {
  it('returns true for "en"', () => {
    expect(isValidLocale('en')).toBe(true);
  });

  it('returns false for "zh"', () => {
    expect(isValidLocale('zh')).toBe(false);
  });

  it('returns false for "fr"', () => {
    expect(isValidLocale('fr')).toBe(false);
  });

  it('returns false for "de"', () => {
    expect(isValidLocale('de')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidLocale('')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidLocale(undefined)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidLocale(null as unknown as string | undefined)).toBe(false);
  });

  it('returns false for uppercase "EN"', () => {
    expect(isValidLocale('EN')).toBe(false);
  });
});
