import { beforeEach, describe, expect, it, vi } from 'vitest';

interface AuthConfig {
  deploymentMode: string;
  baseURL: string;
  secret: string;
  githubClientId: string;
  githubClientSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  logger: {
    warn: (message: string, context?: Record<string, unknown>) => void;
    info: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, context?: Record<string, unknown>) => void;
    debug: (message: string, context?: Record<string, unknown>) => void;
  };
}

// Use parameter to allow TypeScript to infer call signature
const mockCreateAuth = vi.fn((_config: AuthConfig) => ({ type: 'auth-instance' }));
const mockLogger = {
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@lmring/auth', () => ({
  createAuth: mockCreateAuth,
}));

vi.mock('@lmring/env', () => ({
  env: {
    DEPLOYMENT_MODE: 'self-hosted',
    BETTER_AUTH_SECRET: 'test-secret',
    GITHUB_CLIENT_ID: 'github-client-id',
    GITHUB_CLIENT_SECRET: 'github-client-secret',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
  },
}));

vi.mock('@/utils/Helpers', () => ({
  getAuthBaseUrl: vi.fn(() => 'https://auth.example.com'),
}));

vi.mock('./Logger', () => ({
  logger: mockLogger,
}));

describe('Auth', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateAuth.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.debug.mockClear();

    // Clear the global auth singleton
    const globalForAuth = globalThis as unknown as { auth: unknown };
    globalForAuth.auth = undefined;
  });

  it('should export auth instance', async () => {
    const { auth } = await import('./Auth');
    expect(auth).toBeDefined();
    expect(auth).toHaveProperty('type', 'auth-instance');
  });

  it('should create auth with correct deployment mode', async () => {
    await import('./Auth');
    expect(mockCreateAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        deploymentMode: 'self-hosted',
      }),
    );
  });

  it('should create auth with correct base URL', async () => {
    await import('./Auth');
    expect(mockCreateAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://auth.example.com',
      }),
    );
  });

  it('should create auth with correct secret', async () => {
    await import('./Auth');
    expect(mockCreateAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: 'test-secret',
      }),
    );
  });

  it('should create auth with OAuth credentials', async () => {
    await import('./Auth');
    expect(mockCreateAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        githubClientId: 'github-client-id',
        githubClientSecret: 'github-client-secret',
        googleClientId: 'google-client-id',
        googleClientSecret: 'google-client-secret',
      }),
    );
  });

  it('should bind logger methods', async () => {
    await import('./Auth');

    const callArgs = mockCreateAuth.mock.calls[0]?.[0];
    const boundLogger = callArgs?.logger;

    expect(boundLogger).toBeDefined();
    expect(boundLogger?.warn).toBeInstanceOf(Function);
    expect(boundLogger?.info).toBeInstanceOf(Function);
    expect(boundLogger?.error).toBeInstanceOf(Function);
    expect(boundLogger?.debug).toBeInstanceOf(Function);
  });

  it('should forward warn calls to logger', async () => {
    await import('./Auth');

    const callArgs = mockCreateAuth.mock.calls[0]?.[0];
    const boundLogger = callArgs?.logger;

    boundLogger?.warn('test warning', { key: 'value' });

    expect(mockLogger.warn).toHaveBeenCalledWith('test warning', { key: 'value' });
  });

  it('should forward info calls to logger', async () => {
    await import('./Auth');

    const callArgs = mockCreateAuth.mock.calls[0]?.[0];
    const boundLogger = callArgs?.logger;

    boundLogger?.info('test info', { data: 123 });

    expect(mockLogger.info).toHaveBeenCalledWith('test info', { data: 123 });
  });

  it('should forward error calls to logger', async () => {
    await import('./Auth');

    const callArgs = mockCreateAuth.mock.calls[0]?.[0];
    const boundLogger = callArgs?.logger;

    boundLogger?.error('test error', { error: 'something went wrong' });

    expect(mockLogger.error).toHaveBeenCalledWith('test error', { error: 'something went wrong' });
  });

  it('should forward debug calls to logger', async () => {
    await import('./Auth');

    const callArgs = mockCreateAuth.mock.calls[0]?.[0];
    const boundLogger = callArgs?.logger;

    boundLogger?.debug('test debug', { debug: true });

    expect(mockLogger.debug).toHaveBeenCalledWith('test debug', { debug: true });
  });

  it('should use singleton pattern in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    // First import
    const { auth: auth1 } = await import('./Auth');

    // Reset modules but keep the global
    vi.resetModules();

    // Re-mock after reset
    vi.doMock('@lmring/auth', () => ({
      createAuth: mockCreateAuth,
    }));
    vi.doMock('@lmring/env', () => ({
      env: {
        DEPLOYMENT_MODE: 'self-hosted',
        BETTER_AUTH_SECRET: 'test-secret',
        GITHUB_CLIENT_ID: 'github-client-id',
        GITHUB_CLIENT_SECRET: 'github-client-secret',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
      },
    }));
    vi.doMock('@/utils/Helpers', () => ({
      getAuthBaseUrl: vi.fn(() => 'https://auth.example.com'),
    }));
    vi.doMock('./Logger', () => ({
      logger: mockLogger,
    }));

    // Second import should get the same instance from global
    const authModule2 = await import('./Auth');
    const auth2 = authModule2.auth;

    expect(auth1).toBe(auth2);

    vi.unstubAllEnvs();
  });
});
