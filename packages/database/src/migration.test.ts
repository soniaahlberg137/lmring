import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockPostgres, mockDrizzle, mockMigrate, mockEnd } = vi.hoisted(() => ({
  mockEnd: vi.fn(),
  mockPostgres: vi.fn(() => ({ end: mockEnd })),
  mockDrizzle: vi.fn(() => ({ db: 'mock-drizzle-instance' })),
  mockMigrate: vi.fn(),
}));

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

vi.mock('drizzle-orm/postgres-js/migrator', () => ({
  migrate: mockMigrate,
}));

import { runMigrations } from './migration';

describe('runMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMigrate.mockResolvedValue(undefined);
  });

  it('creates postgres client with DATABASE_URL', async () => {
    await runMigrations();

    expect(mockPostgres).toHaveBeenCalledWith(
      'postgresql://user:pass@localhost:5432/testdb',
      expect.any(Object)
    );
  });

  it('uses prepare: false option', async () => {
    await runMigrations();

    expect(mockPostgres).toHaveBeenCalledWith(
      expect.any(String),
      { prepare: false }
    );
  });

  it('calls migrate with correct folder path', async () => {
    await runMigrations();

    expect(mockMigrate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        migrationsFolder: expect.stringContaining('migrations'),
      })
    );
  });

  it('logs success message', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runMigrations();

    expect(consoleSpy).toHaveBeenCalledWith('Database migrations completed successfully');

    consoleSpy.mockRestore();
  });

  it('closes client in finally block', async () => {
    await runMigrations();

    expect(mockEnd).toHaveBeenCalled();
  });

  it('throws and logs error on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockMigrate.mockRejectedValueOnce(new Error('Migration failed'));

    await expect(runMigrations()).rejects.toThrow('Migration failed');

    expect(consoleSpy).toHaveBeenCalledWith(
      'Database migration failed:',
      'Migration failed'
    );

    consoleSpy.mockRestore();
  });

  it('closes client even on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockMigrate.mockRejectedValueOnce(new Error('Migration failed'));

    try {
      await runMigrations();
    } catch {
      // expected
    }

    expect(mockEnd).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
