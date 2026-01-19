import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockPostgres, mockDrizzle } = vi.hoisted(() => {
  const mockDbClient = { query: vi.fn() };
  return {
    mockPostgres: vi.fn(() => mockDbClient),
    mockDrizzle: vi.fn(() => ({ db: 'mock-drizzle-instance' })),
  };
});

vi.mock('@lmring/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
  },
}));

vi.mock('postgres', () => ({
  default: mockPostgres,
}));

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: mockDrizzle,
}));

vi.mock('./schema', () => ({
  users: {},
  account: {},
}));

import { createDbConnection } from './connection';

describe('createDbConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates drizzle connection', () => {
    const result = createDbConnection();
    expect(result).toEqual({ db: 'mock-drizzle-instance' });
    expect(mockDrizzle).toHaveBeenCalled();
  });

  it('adds search_path=public to URL without options', () => {
    createDbConnection();

    const calls = mockPostgres.mock.calls as unknown[][];
    expect(calls.length).toBeGreaterThan(0);
    const calledUrl = calls[0]?.[0] as string;
    expect(calledUrl).toContain('options=-c+search_path%3Dpublic');
  });

  it('uses prepare: false', () => {
    createDbConnection();

    const calls = mockPostgres.mock.calls as unknown[][];
    expect(calls.length).toBeGreaterThan(0);
    const options = calls[0]?.[1] as { prepare: boolean };
    expect(options.prepare).toBe(false);
  });
});

describe('createDbConnection error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws "Database connection failed" on error', () => {
    mockPostgres.mockImplementationOnce(() => {
      throw new Error('Connection refused');
    });

    expect(() => createDbConnection()).toThrow('Database connection failed');
  });

  it('logs error message on failure', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockPostgres.mockImplementationOnce(() => {
      throw new Error('Connection refused');
    });

    try {
      createDbConnection();
    } catch {
      // expected
    }

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to create database connection:',
      'Connection refused'
    );

    consoleSpy.mockRestore();
  });
});
