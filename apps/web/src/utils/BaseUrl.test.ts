import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('BaseUrl', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
    if (originalWindow !== undefined) {
      vi.stubGlobal('window', originalWindow);
    } else {
      vi.unstubAllGlobals();
    }
  });

  describe('getBaseUrl', () => {
    describe('server-side (window undefined)', () => {
      beforeEach(() => {
        vi.stubGlobal('window', undefined);
      });

      it('should prioritize BETTER_AUTH_URL on server', async () => {
        vi.doMock('@lmring/env', () => ({
          env: {
            BETTER_AUTH_URL: 'https://auth.example.com',
            NEXT_PUBLIC_APP_URL: 'https://app.example.com',
            VERCEL_URL: 'vercel-preview.vercel.app',
          },
        }));
        const { getBaseUrl } = await import('./BaseUrl');
        expect(getBaseUrl()).toBe('https://auth.example.com');
      });

      it('should use NEXT_PUBLIC_APP_URL if BETTER_AUTH_URL is not set', async () => {
        vi.doMock('@lmring/env', () => ({
          env: {
            NEXT_PUBLIC_APP_URL: 'https://app.example.com',
            VERCEL_URL: 'vercel-preview.vercel.app',
          },
        }));
        const { getBaseUrl } = await import('./BaseUrl');
        expect(getBaseUrl()).toBe('https://app.example.com');
      });

      it('should use VERCEL_PROJECT_PRODUCTION_URL in production', async () => {
        vi.doMock('@lmring/env', () => ({
          env: {
            VERCEL_ENV: 'production',
            VERCEL_PROJECT_PRODUCTION_URL: 'production.vercel.app',
            VERCEL_URL: 'preview.vercel.app',
          },
        }));
        const { getBaseUrl } = await import('./BaseUrl');
        expect(getBaseUrl()).toBe('https://production.vercel.app');
      });

      it('should use VERCEL_URL for preview deployments', async () => {
        vi.doMock('@lmring/env', () => ({
          env: {
            VERCEL_ENV: 'preview',
            VERCEL_URL: 'preview.vercel.app',
          },
        }));
        const { getBaseUrl } = await import('./BaseUrl');
        expect(getBaseUrl()).toBe('https://preview.vercel.app');
      });

      it('should fallback to localhost:3000 when no env vars set', async () => {
        vi.doMock('@lmring/env', () => ({
          env: {},
        }));
        const { getBaseUrl } = await import('./BaseUrl');
        expect(getBaseUrl()).toBe('http://localhost:3000');
      });
    });

    describe('client-side (window defined)', () => {
      beforeEach(() => {
        vi.stubGlobal('window', {});
      });

      it('should use NEXT_PUBLIC_APP_URL on client', async () => {
        vi.doMock('@lmring/env', () => ({
          env: {
            BETTER_AUTH_URL: 'https://auth.example.com',
            NEXT_PUBLIC_APP_URL: 'https://app.example.com',
          },
        }));
        const { getBaseUrl } = await import('./BaseUrl');
        expect(getBaseUrl()).toBe('https://app.example.com');
      });

      it('should not use server-only variables on client', async () => {
        vi.doMock('@lmring/env', () => ({
          env: {
            BETTER_AUTH_URL: 'https://auth.example.com',
            VERCEL_URL: 'preview.vercel.app',
          },
        }));
        const { getBaseUrl } = await import('./BaseUrl');
        expect(getBaseUrl()).toBe('http://localhost:3000');
      });

      it('should fallback to localhost:3000 on client when no public URL', async () => {
        vi.doMock('@lmring/env', () => ({
          env: {},
        }));
        const { getBaseUrl } = await import('./BaseUrl');
        expect(getBaseUrl()).toBe('http://localhost:3000');
      });
    });
  });

  describe('getAuthBaseUrl', () => {
    beforeEach(() => {
      vi.stubGlobal('window', undefined);
    });

    it('should return baseUrl from getBaseUrl', async () => {
      vi.doMock('@lmring/env', () => ({
        env: {
          BETTER_AUTH_URL: 'https://auth.example.com',
        },
      }));
      const { getAuthBaseUrl } = await import('./BaseUrl');
      expect(getAuthBaseUrl()).toBe('https://auth.example.com');
    });

    it('should warn when BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL mismatch', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.doMock('@lmring/env', () => ({
        env: {
          BETTER_AUTH_URL: 'https://auth.example.com',
          NEXT_PUBLIC_APP_URL: 'https://different.example.com',
        },
      }));
      const { getAuthBaseUrl } = await import('./BaseUrl');
      getAuthBaseUrl();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL are different'),
      );
      warnSpy.mockRestore();
    });

    it('should not warn when BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL match', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.doMock('@lmring/env', () => ({
        env: {
          BETTER_AUTH_URL: 'https://app.example.com',
          NEXT_PUBLIC_APP_URL: 'https://app.example.com',
        },
      }));
      const { getAuthBaseUrl } = await import('./BaseUrl');
      getAuthBaseUrl();
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should not warn when only BETTER_AUTH_URL is set', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.doMock('@lmring/env', () => ({
        env: {
          BETTER_AUTH_URL: 'https://auth.example.com',
        },
      }));
      const { getAuthBaseUrl } = await import('./BaseUrl');
      getAuthBaseUrl();
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
