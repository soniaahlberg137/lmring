import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSandboxCredentials, getWebDevConfig } from '../webdev-config';

describe('getWebDevConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.VERCEL_TOKEN;
    delete process.env.VERCEL_TEAM_ID;
    delete process.env.VERCEL_PROJECT_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Tier 1: Running on Vercel', () => {
    it('should return enabled with production limits when VERCEL and VERCEL_ENV=production', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(true);
      expect(config.provider).toBe('vercel-sandbox');
      expect(config.limits?.maxDurationMinutes).toBe(300);
      expect(config.reason).toBeUndefined();
    });

    it('should return enabled with preview limits when VERCEL and VERCEL_ENV=preview', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'preview';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(true);
      expect(config.provider).toBe('vercel-sandbox');
      expect(config.limits?.maxDurationMinutes).toBe(45);
    });

    it('should return enabled with dev limits when VERCEL and VERCEL_ENV=development', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'development';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(true);
      expect(config.limits?.maxDurationMinutes).toBe(45);
    });

    it('should default to non-production limits when VERCEL_ENV is not set', () => {
      process.env.VERCEL = '1';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(true);
      expect(config.limits?.maxDurationMinutes).toBe(45);
    });

    it('should take priority over OIDC token and explicit token', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';
      process.env.VERCEL_OIDC_TOKEN = 'oidc-token';
      process.env.VERCEL_TOKEN = 'access-token';
      process.env.VERCEL_TEAM_ID = 'team-123';
      process.env.VERCEL_PROJECT_ID = 'proj-456';

      const config = getWebDevConfig();

      expect(config.limits?.maxDurationMinutes).toBe(300);
    });
  });

  describe('Tier 2: Local dev with OIDC token', () => {
    it('should return enabled when VERCEL_OIDC_TOKEN is present', () => {
      process.env.VERCEL_OIDC_TOKEN = 'oidc-token-value';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(true);
      expect(config.provider).toBe('vercel-sandbox');
      expect(config.limits?.maxDurationMinutes).toBe(45);
      expect(config.reason).toBeUndefined();
    });

    it('should take priority over explicit token', () => {
      process.env.VERCEL_OIDC_TOKEN = 'oidc';
      process.env.VERCEL_TOKEN = 'token';
      process.env.VERCEL_TEAM_ID = 'team';
      process.env.VERCEL_PROJECT_ID = 'proj';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(true);
      expect(config.limits?.maxDurationMinutes).toBe(45);
    });
  });

  describe('Tier 3: Explicit access token', () => {
    it('should return enabled when all three tokens are present', () => {
      process.env.VERCEL_TOKEN = 'my-token';
      process.env.VERCEL_TEAM_ID = 'team-123';
      process.env.VERCEL_PROJECT_ID = 'proj-456';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(true);
      expect(config.provider).toBe('vercel-sandbox');
      expect(config.limits?.maxDurationMinutes).toBe(45);
    });

    it('should return disabled when VERCEL_TOKEN is missing', () => {
      process.env.VERCEL_TEAM_ID = 'team-123';
      process.env.VERCEL_PROJECT_ID = 'proj-456';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(false);
    });

    it('should return disabled when VERCEL_TEAM_ID is missing', () => {
      process.env.VERCEL_TOKEN = 'my-token';
      process.env.VERCEL_PROJECT_ID = 'proj-456';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(false);
    });

    it('should return disabled when VERCEL_PROJECT_ID is missing', () => {
      process.env.VERCEL_TOKEN = 'my-token';
      process.env.VERCEL_TEAM_ID = 'team-123';

      const config = getWebDevConfig();

      expect(config.enabled).toBe(false);
    });
  });

  describe('Tier 4: Not configured', () => {
    it('should return disabled when no env vars are set', () => {
      const config = getWebDevConfig();

      expect(config.enabled).toBe(false);
      expect(config.provider).toBe('disabled');
      expect(config.reason).toBe('VERCEL_SANDBOX_NOT_CONFIGURED');
      expect(config.limits).toBeUndefined();
    });
  });
});

describe('getSandboxCredentials', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.VERCEL_TOKEN;
    delete process.env.VERCEL_TEAM_ID;
    delete process.env.VERCEL_PROJECT_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return credentials when all three env vars are set', () => {
    process.env.VERCEL_TOKEN = 'my-token';
    process.env.VERCEL_TEAM_ID = 'team-123';
    process.env.VERCEL_PROJECT_ID = 'proj-456';

    const creds = getSandboxCredentials();

    expect(creds).toEqual({
      token: 'my-token',
      teamId: 'team-123',
      projectId: 'proj-456',
    });
  });

  it('should return undefined when VERCEL_TOKEN is missing', () => {
    process.env.VERCEL_TEAM_ID = 'team-123';
    process.env.VERCEL_PROJECT_ID = 'proj-456';

    expect(getSandboxCredentials()).toBeUndefined();
  });

  it('should return undefined when VERCEL_TEAM_ID is missing', () => {
    process.env.VERCEL_TOKEN = 'my-token';
    process.env.VERCEL_PROJECT_ID = 'proj-456';

    expect(getSandboxCredentials()).toBeUndefined();
  });

  it('should return undefined when VERCEL_PROJECT_ID is missing', () => {
    process.env.VERCEL_TOKEN = 'my-token';
    process.env.VERCEL_TEAM_ID = 'team-123';

    expect(getSandboxCredentials()).toBeUndefined();
  });

  it('should return undefined when no env vars are set', () => {
    expect(getSandboxCredentials()).toBeUndefined();
  });
});
