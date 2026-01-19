import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockFindUpSync, mockConfig } = vi.hoisted(() => ({
  mockFindUpSync: vi.fn(),
  mockConfig: vi.fn(),
}));

vi.mock('find-up-simple', () => ({
  findUpSync: mockFindUpSync,
}));

vi.mock('dotenv', () => ({
  config: mockConfig,
}));

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('finds pnpm-workspace.yaml using findUpSync', async () => {
    mockFindUpSync.mockReturnValue('/path/to/project/pnpm-workspace.yaml');

    await import('./config');

    expect(mockFindUpSync).toHaveBeenCalledWith('pnpm-workspace.yaml', {
      cwd: process.cwd(),
      type: 'file',
    });
  });

  it('throws when pnpm-workspace.yaml not found', async () => {
    mockFindUpSync.mockReturnValue(undefined);

    await expect(import('./config')).rejects.toThrow(
      'Could not find pnpm-workspace.yaml. Are you in a pnpm workspace?'
    );
  });

  it('calls dotenv config with correct path', async () => {
    mockFindUpSync.mockReturnValue('/path/to/project/pnpm-workspace.yaml');

    await import('./config');

    expect(mockConfig).toHaveBeenCalledWith({
      path: '/path/to/project/.env',
    });
  });
});
