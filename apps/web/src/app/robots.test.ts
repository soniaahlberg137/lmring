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
    const rules = result.rules as Array<{
      userAgent: string;
      allow: string;
      disallow?: string[];
    }>;

    expect(rules[0]).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/arena/', '/settings/', '/account/', '/api/'],
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

  it('should allow all routes by default except restricted paths', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: robots } = await import('./robots');
    const result = robots();
    const rules = result.rules as Array<{
      userAgent: string;
      allow: string;
      disallow?: string[];
    }>;

    const firstRule = rules[0];
    expect(firstRule?.allow).toBe('/');
    expect(firstRule?.disallow).toEqual(['/arena/', '/settings/', '/account/', '/api/']);
  });

  it('should target all user agents in the first rule', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: robots } = await import('./robots');
    const result = robots();
    const rules = result.rules as Array<{
      userAgent: string;
      allow: string;
    }>;

    expect(rules[0]?.userAgent).toBe('*');
  });

  it('should include AI bot rules', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {},
    }));

    const { default: robots } = await import('./robots');
    const result = robots();
    const rules = result.rules as Array<{
      userAgent: string;
      allow: string;
    }>;

    const aiAgents = rules.slice(1).map((r) => r.userAgent);
    expect(aiAgents).toContain('GPTBot');
    expect(aiAgents).toContain('Google-Extended');
    expect(aiAgents).toContain('ClaudeBot');
    expect(aiAgents).toContain('PerplexityBot');

    for (const rule of rules.slice(1)) {
      expect(rule.allow).toBe('/');
    }
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
