import { beforeEach, describe, expect, it, vi } from 'vitest';

interface CookieOptions {
  path?: string;
  httpOnly?: boolean;
}

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

interface CookiesConfig {
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (cookiesToSet: CookieToSet[]) => void;
  };
}

// Use parameters to allow TypeScript to infer call signature
const mockCreateServerClient = vi.fn((_url: string, _key: string, _config: CookiesConfig) => ({
  client: 'server',
}));
const mockCookieStore = {
  getAll: vi.fn(() => [{ name: 'test', value: 'cookie' }]),
  set: vi.fn(),
};
const mockCookies = vi.fn(() => Promise.resolve(mockCookieStore));

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}));

describe('Supabase.server', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateServerClient.mockClear();
    mockCookies.mockClear();
    mockCookieStore.getAll.mockClear();
    mockCookieStore.set.mockClear();
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    }));

    const { createClient } = await import('./Supabase.server');
    await expect(createClient()).rejects.toThrow(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
    );
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      },
    }));

    const { createClient } = await import('./Supabase.server');
    await expect(createClient()).rejects.toThrow(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
    );
  });

  it('should throw error when both environment variables are missing', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      },
    }));

    const { createClient } = await import('./Supabase.server');
    await expect(createClient()).rejects.toThrow(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
    );
  });

  it('should create server client with correct URL and key', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    }));

    const { createClient } = await import('./Supabase.server');
    const client = await createClient();

    expect(mockCookies).toHaveBeenCalled();
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
    expect(client).toEqual({ client: 'server' });
  });

  it('should implement getAll cookie method that returns cookies', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    }));

    const { createClient } = await import('./Supabase.server');
    await createClient();

    const cookiesArg = mockCreateServerClient.mock.calls[0]?.[2];
    const result = cookiesArg?.cookies?.getAll();

    expect(mockCookieStore.getAll).toHaveBeenCalled();
    expect(result).toEqual([{ name: 'test', value: 'cookie' }]);
  });

  it('should implement setAll cookie method that sets cookies', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    }));

    const { createClient } = await import('./Supabase.server');
    await createClient();

    const cookiesArg = mockCreateServerClient.mock.calls[0]?.[2];
    const cookiesToSet = [
      { name: 'auth', value: 'token123', options: { path: '/' } },
      { name: 'session', value: 'sess456', options: { httpOnly: true } },
    ];
    cookiesArg?.cookies?.setAll(cookiesToSet);

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith('auth', 'token123', { path: '/' });
    expect(mockCookieStore.set).toHaveBeenCalledWith('session', 'sess456', { httpOnly: true });
  });

  it('should handle errors silently in setAll for Server Components', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    }));

    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Cannot set cookies in Server Component');
    });

    const { createClient } = await import('./Supabase.server');
    await createClient();

    const cookiesArg = mockCreateServerClient.mock.calls[0]?.[2];
    const cookiesToSet = [{ name: 'auth', value: 'token123', options: {} }];

    // Should not throw
    expect(() => cookiesArg?.cookies?.setAll(cookiesToSet)).not.toThrow();
  });
});
