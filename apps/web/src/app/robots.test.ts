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
      allow?: string;
      disallow?: string | string[];
    }>;

    const aiRules = rules.slice(1);
    const aiAgents = aiRules.map((r) => r.userAgent);

    // Tier 1: Critical for AI Search Visibility
    expect(aiAgents).toContain('GPTBot');
    expect(aiAgents).toContain('OAI-SearchBot');
    expect(aiAgents).toContain('ChatGPT-User');
    expect(aiAgents).toContain('ClaudeBot');
    expect(aiAgents).toContain('PerplexityBot');

    // Tier 2: Broader AI Ecosystem
    expect(aiAgents).toContain('Google-Extended');
    expect(aiAgents).toContain('GoogleOther');
    expect(aiAgents).toContain('Applebot-Extended');
    expect(aiAgents).toContain('Amazonbot');
    expect(aiAgents).toContain('FacebookBot');

    // Tier 3: Block aggressive/low-value
    expect(aiAgents).toContain('Bytespider');

    // All allowed bots should have allow: '/'
    const allowedRules = aiRules.filter((r) => r.userAgent !== 'Bytespider');
    for (const rule of allowedRules) {
      expect(rule.allow).toBe('/');
    }

    // Bytespider should be blocked
    const bytespiderRule = aiRules.find((r) => r.userAgent === 'Bytespider');
    expect(bytespiderRule?.disallow).toBe('/');
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
