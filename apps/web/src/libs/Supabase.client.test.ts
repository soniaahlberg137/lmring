import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateBrowserClient = vi.fn(() => ({ client: 'browser' }));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

describe('Supabase.client', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateBrowserClient.mockClear();
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    }));

    const { createClient } = await import('./Supabase.client');
    expect(() => createClient()).toThrow(
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

    const { createClient } = await import('./Supabase.client');
    expect(() => createClient()).toThrow(
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

    const { createClient } = await import('./Supabase.client');
    expect(() => createClient()).toThrow(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
    );
  });

  it('should create browser client with correct URL and key', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    }));

    const { createClient } = await import('./Supabase.client');
    const client = createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
    );
    expect(client).toEqual({ client: 'browser' });
  });

  it('should call createBrowserClient exactly once per createClient call', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    }));

    const { createClient } = await import('./Supabase.client');
    createClient();
    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(2);
  });
});
