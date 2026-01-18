import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock external dependencies
vi.mock('better-auth', () => ({
  betterAuth: vi.fn(() => ({
    api: {},
    handler: vi.fn(),
  })),
  generateId: vi.fn(() => 'mock-id'),
}));

vi.mock('better-auth/api', () => ({
  createAuthMiddleware: vi.fn((handler) => handler),
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

vi.mock('@lmring/database', () => ({
  db: {},
  users: {},
  session: {},
  account: {},
  verification: {},
  syncUserProviderIdFromAccount: vi.fn(),
}));

import { createAuth } from './server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

describe('server', () => {
  const validSecret = 'a'.repeat(32);
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuth', () => {
    it('initializes Better-Auth with valid config', () => {
      const auth = createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      expect(betterAuth).toHaveBeenCalled();
      expect(auth).toBeDefined();
    });

    it('creates database adapter with drizzle', () => {
      createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      expect(drizzleAdapter).toHaveBeenCalled();
    });

    it('logs initialization messages', () => {
      createAuth({
        deploymentMode: 'saas',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing Better-Auth server instance',
        expect.any(Object),
      );
    });

    it('throws on invalid secret', () => {
      expect(() =>
        createAuth({
          deploymentMode: 'selfhost',
          baseURL: 'http://localhost:3000',
          secret: 'short',
          logger: mockLogger,
        }),
      ).toThrow();
    });

    it('logs error when initialization fails', () => {
      expect(() =>
        createAuth({
          deploymentMode: 'selfhost',
          baseURL: 'http://localhost:3000',
          secret: '',
          logger: mockLogger,
        }),
      ).toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('configures email/password authentication', () => {
      createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      const betterAuthCall = (betterAuth as any).mock.calls[0][0];
      expect(betterAuthCall.emailAndPassword).toEqual({
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
      });
    });

    it('configures session settings', () => {
      createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      const betterAuthCall = (betterAuth as any).mock.calls[0][0];
      expect(betterAuthCall.session).toEqual({
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        freshAge: 60 * 10, // 10 minutes
      });
    });

    it('configures account linking', () => {
      createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      const betterAuthCall = (betterAuth as any).mock.calls[0][0];
      expect(betterAuthCall.account.accountLinking).toEqual({
        enabled: true,
        trustedProviders: ['github', 'google'],
      });
    });

    it('configures user field mapping', () => {
      createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      const betterAuthCall = (betterAuth as any).mock.calls[0][0];
      expect(betterAuthCall.user.fields).toEqual({
        name: 'fullName',
        image: 'avatarUrl',
        emailVerified: 'emailVerified',
      });
    });

    it('configures hooks for authentication flow', () => {
      createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      const betterAuthCall = (betterAuth as any).mock.calls[0][0];
      expect(betterAuthCall.hooks).toBeDefined();
      expect(betterAuthCall.hooks.before).toBeDefined();
      expect(betterAuthCall.hooks.after).toBeDefined();
    });

    it('configures database hooks for account sync', () => {
      createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      const betterAuthCall = (betterAuth as any).mock.calls[0][0];
      expect(betterAuthCall.databaseHooks).toBeDefined();
      expect(betterAuthCall.databaseHooks.account.create.after).toBeDefined();
      expect(betterAuthCall.databaseHooks.account.update.after).toBeDefined();
    });

    it('logs success message on creation', () => {
      createAuth({
        deploymentMode: 'selfhost',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        logger: mockLogger,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Better-Auth server instance created successfully',
        expect.any(Object),
      );
    });

    it('passes OAuth credentials in saas mode', () => {
      createAuth({
        deploymentMode: 'saas',
        baseURL: 'http://localhost:3000',
        secret: validSecret,
        githubClientId: 'github-id',
        githubClientSecret: 'github-secret',
        googleClientId: 'google-id',
        googleClientSecret: 'google-secret',
        logger: mockLogger,
      });

      const betterAuthCall = (betterAuth as any).mock.calls[0][0];
      expect(betterAuthCall.socialProviders.github).toBeDefined();
      expect(betterAuthCall.socialProviders.google).toBeDefined();
    });
  });
});
