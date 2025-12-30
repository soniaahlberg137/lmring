import { describe, expect, it, vi } from 'vitest';
import { getI18nPath } from './Helpers';

vi.mock('@lmring/env', () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  },
}));

describe('Helpers', () => {
  describe('getI18nPath function', () => {
    it('should not change the path for default language', () => {
      const url = '/random-url';
      expect(getI18nPath(url)).toBe(url);
    });

    it('should not modify the path for other locales', () => {
      const url = '/random-url';
      expect(getI18nPath(url)).toBe(url);
    });
  });
});
