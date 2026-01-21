import { afterEach, describe, expect, it, vi } from 'vitest';
import { getI18nPath, isServer } from './Helpers';

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

  describe('isServer function', () => {
    const originalWindow = globalThis.window;

    afterEach(() => {
      if (originalWindow !== undefined) {
        vi.stubGlobal('window', originalWindow);
      } else {
        vi.unstubAllGlobals();
      }
    });

    it('should return true when window is undefined (server)', () => {
      vi.stubGlobal('window', undefined);
      expect(isServer()).toBe(true);
    });

    it('should return false when window is defined (client)', () => {
      vi.stubGlobal('window', {});
      expect(isServer()).toBe(false);
    });
  });
});
