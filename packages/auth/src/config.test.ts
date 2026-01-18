import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getAuthConfig } from './config';
import type { AuthLogger } from './logger';

describe('config', () => {
  // Create a mock logger that captures calls
  const createMockLogger = () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  });

  describe('secret validation', () => {
    it('throws error when secret is missing', () => {
      const logger = createMockLogger();

      expect(() =>
        getAuthConfig({
          deploymentMode: 'saas',
          baseURL: 'http://localhost:3000',
          secret: '',
          logger,
        }),
      ).toThrow('BETTER_AUTH_SECRET is required');

      expect(logger.error).toHaveBeenCalled();
    });

    it('throws error when secret is too short', () => {
      const logger = createMockLogger();

      expect(() =>
        getAuthConfig({
          deploymentMode: 'saas',
          baseURL: 'http://localhost:3000',
          secret: 'short', // < 32 chars
          logger,
        }),
      ).toThrow('BETTER_AUTH_SECRET must be at least 32 characters long');

      expect(logger.error).toHaveBeenCalled();
    });

    it('accepts valid secret with 32+ characters', () => {
      const logger = createMockLogger();
      const validSecret = 'a'.repeat(32);

      const config = getAuthConfig({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger,
      });

      expect(config.secret).toBe(validSecret);
    });
  });

  describe('SaaS mode', () => {
    const validSecret = 'a'.repeat(32);

    it('configures both OAuth providers when credentials provided', () => {
      const logger = createMockLogger();

      const config = getAuthConfig({
        deploymentMode: 'saas',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        githubClientId: 'github-id',
        githubClientSecret: 'github-secret',
        googleClientId: 'google-id',
        googleClientSecret: 'google-secret',
        logger,
      });

      expect(config.socialProviders.github).toEqual({
        clientId: 'github-id',
        clientSecret: 'github-secret',
      });
      expect(config.socialProviders.google).toEqual({
        clientId: 'google-id',
        clientSecret: 'google-secret',
        accessType: 'offline',
      });
    });

    it('configures only GitHub when only GitHub credentials provided', () => {
      const logger = createMockLogger();

      const config = getAuthConfig({
        deploymentMode: 'saas',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        githubClientId: 'github-id',
        githubClientSecret: 'github-secret',
        logger,
      });

      expect(config.socialProviders.github).toBeDefined();
      expect(config.socialProviders.google).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled(); // Warning for missing Google
    });

    it('configures only Google when only Google credentials provided', () => {
      const logger = createMockLogger();

      const config = getAuthConfig({
        deploymentMode: 'saas',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        googleClientId: 'google-id',
        googleClientSecret: 'google-secret',
        logger,
      });

      expect(config.socialProviders.google).toBeDefined();
      expect(config.socialProviders.github).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled(); // Warning for missing GitHub
    });

    it('logs warning when no OAuth providers configured in SaaS mode', () => {
      const logger = createMockLogger();

      const config = getAuthConfig({
        deploymentMode: 'saas',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger,
      });

      expect(config.socialProviders).toBeUndefined();
      // Should warn about no OAuth providers
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No OAuth providers configured'),
        expect.any(Object),
      );
    });

    it('warns when GitHub has partial credentials', () => {
      const logger = createMockLogger();

      getAuthConfig({
        deploymentMode: 'saas',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        githubClientId: 'github-id',
        // Missing githubClientSecret
        logger,
      });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('GitHub OAuth credentials not configured'),
        expect.any(Object),
      );
    });
  });

  describe('self-hosted mode', () => {
    const validSecret = 'a'.repeat(32);

    it('does not configure OAuth providers in selfhost mode', () => {
      const logger = createMockLogger();

      const config = getAuthConfig({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        githubClientId: 'github-id',
        githubClientSecret: 'github-secret',
        logger,
      });

      expect(config.socialProviders).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Self-hosted mode enabled'),
        expect.any(Object),
      );
    });
  });

  describe('config output', () => {
    const validSecret = 'a'.repeat(32);

    it('sets appName to LMRing', () => {
      const logger = createMockLogger();

      const config = getAuthConfig({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger,
      });

      expect(config.appName).toBe('LMRing');
    });

    it('includes baseURL in config', () => {
      const logger = createMockLogger();

      const config = getAuthConfig({
        deploymentMode: 'selfhost',
        baseURL: 'https://example.com',
        secret: validSecret,
        logger,
      });

      expect(config.baseURL).toBe('https://example.com');
    });

    it('logs debug info about final configuration', () => {
      const logger = createMockLogger();

      getAuthConfig({
        deploymentMode: 'saas',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        githubClientId: 'github-id',
        githubClientSecret: 'github-secret',
        logger,
      });

      expect(logger.debug).toHaveBeenCalledWith(
        'Final auth configuration',
        expect.any(Object),
      );
    });
  });
});
