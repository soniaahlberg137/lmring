import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lmring/env', () => ({
  env: {},
}));

describe('sitemap.ts', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return an array of sitemap entries', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: sitemap } = await import('./sitemap');
    const result = sitemap();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include homepage entry', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_APP_URL: 'https://example.com',
      },
    }));

    const { default: sitemap } = await import('./sitemap');
    const result = sitemap();

    const homepage = result.find((entry) => entry.url.endsWith('/'));
    expect(homepage).toBeDefined();
  });

  it('should have correct changeFrequency for homepage', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: sitemap } = await import('./sitemap');
    const result = sitemap();
    const homepage = result[0];

    expect(homepage?.changeFrequency).toBe('daily');
  });

  it('should have correct priority for homepage', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: sitemap } = await import('./sitemap');
    const result = sitemap();
    const homepage = result[0];

    expect(homepage?.priority).toBe(1.0);
  });

  it('should have lastModified date', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: sitemap } = await import('./sitemap');
    const result = sitemap();
    const homepage = result[0];

    expect(homepage?.lastModified).toBeInstanceOf(Date);
  });

  it('should use localhost as fallback URL', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: sitemap } = await import('./sitemap');
    const result = sitemap();
    const homepage = result[0];

    expect(homepage?.url).toBe('http://localhost:3000/');
  });

  it('should use configured app URL', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_APP_URL: 'https://myapp.com',
      },
    }));

    const { default: sitemap } = await import('./sitemap');
    const result = sitemap();
    const homepage = result[0];

    expect(homepage?.url).toBe('https://myapp.com/');
  });
});
