import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockDbConnection = { db: 'mock-connection' };

const { mockCreateDbConnection } = vi.hoisted(() => ({
  mockCreateDbConnection: vi.fn(() => mockDbConnection),
}));

vi.mock('./connection', () => ({
  createDbConnection: mockCreateDbConnection,
}));

vi.mock('@lmring/env', () => ({
  env: {
    NODE_ENV: 'development',
  },
}));

describe('db singleton', () => {
  const originalGlobalThis = { ...globalThis };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Clean up any existing drizzle property
    delete (globalThis as Record<string, unknown>).drizzle;
  });

  afterEach(() => {
    // Restore globalThis
    delete (globalThis as Record<string, unknown>).drizzle;
  });

  it('creates connection using createDbConnection', async () => {
    const module = await import('./db');

    expect(mockCreateDbConnection).toHaveBeenCalled();
    expect(module.db).toBeDefined();
  });

  it('stores in globalThis when NODE_ENV !== production', async () => {
    await import('./db');

    expect((globalThis as Record<string, unknown>).drizzle).toBeDefined();
  });
});

describe('db singleton production mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete (globalThis as Record<string, unknown>).drizzle;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).drizzle;
  });

  it('does not store in globalThis when NODE_ENV === production', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NODE_ENV: 'production',
      },
    }));

    await import('./db');

    expect((globalThis as Record<string, unknown>).drizzle).toBeUndefined();
  });
});
