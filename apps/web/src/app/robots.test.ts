import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lmring/env', () => ({
  env: {},
}));

describe('robots.ts', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return correct robots.txt configuration', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: robots } = await import('./robots');
    const result = robots();
    const rules = result.rules as { userAgent: string; allow: string; disallow: string };

    expect(rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: '/arena',
    });
  });

  it('should include sitemap URL with base URL', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_APP_URL: 'https://example.com',
      },
    }));

    const { default: robots } = await import('./robots');
    const result = robots();

    expect(result.sitemap).toContain('sitemap.xml');
  });

  it('should allow all routes by default except /arena', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: robots } = await import('./robots');
    const result = robots();
    const rules = result.rules as { userAgent: string; allow: string; disallow: string };

    expect(rules.allow).toBe('/');
    expect(rules.disallow).toBe('/arena');
  });

  it('should target all user agents', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: robots } = await import('./robots');
    const result = robots();
    const rules = result.rules as { userAgent: string; allow: string; disallow: string };

    expect(rules.userAgent).toBe('*');
  });

  it('should use localhost as fallback for sitemap URL', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: robots } = await import('./robots');
    const result = robots();

    expect(result.sitemap).toBe('http://localhost:3000/sitemap.xml');
  });
});
