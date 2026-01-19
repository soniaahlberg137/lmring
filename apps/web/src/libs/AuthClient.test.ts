import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseSession = vi.fn();
const mockCreateClient = vi.fn(() => ({
  useSession: mockUseSession,
}));

vi.mock('@lmring/auth/client', () => ({
  createClient: mockCreateClient,
}));

vi.mock('@/utils/Helpers', () => ({
  getAuthBaseUrl: vi.fn(() => 'https://auth.example.com'),
}));

describe('AuthClient', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateClient.mockClear();
  });

  it('should export authClient instance', async () => {
    const { authClient } = await import('./AuthClient');
    expect(authClient).toBeDefined();
    expect(authClient).toHaveProperty('useSession');
  });

  it('should export useSession hook', async () => {
    const { useSession } = await import('./AuthClient');
    expect(useSession).toBeDefined();
    expect(useSession).toBe(mockUseSession);
  });

  it('should create client with correct base URL', async () => {
    await import('./AuthClient');
    expect(mockCreateClient).toHaveBeenCalledWith({
      baseURL: 'https://auth.example.com',
    });
  });

  it('should create client exactly once', async () => {
    vi.resetModules();
    mockCreateClient.mockClear();

    await import('./AuthClient');

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });
});
