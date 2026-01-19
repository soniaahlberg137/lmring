import { describe, expect, it } from 'vitest';
import { getLocaleFromRequest } from './server';

describe('getLocaleFromRequest', () => {
  it('returns "en" for valid "en" input', () => {
    expect(getLocaleFromRequest('en')).toBe('en');
  });

  it('returns "zh" for valid "zh" input', () => {
    expect(getLocaleFromRequest('zh')).toBe('zh');
  });

  it('returns "fr" for valid "fr" input', () => {
    expect(getLocaleFromRequest('fr')).toBe('fr');
  });

  it('returns default "en" for undefined', () => {
    expect(getLocaleFromRequest(undefined)).toBe('en');
  });

  it('returns default "en" for invalid locale', () => {
    expect(getLocaleFromRequest('de')).toBe('en');
  });

  it('returns default "en" for empty string', () => {
    expect(getLocaleFromRequest('')).toBe('en');
  });
});
