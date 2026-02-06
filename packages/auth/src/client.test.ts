import { describe, expect, it, vi } from 'vitest';

// Mock better-auth/react
vi.mock('better-auth/react', () => ({
  createAuthClient: vi.fn((options: { baseURL: string }) => ({
    baseURL: options.baseURL,
    signIn: vi.fn(),
    signOut: vi.fn(),
    useSession: vi.fn(),
  })),
}));

import { createClient } from './client';
import { createAuthClient } from 'better-auth/react';

describe('client', () => {
  describe('createClient', () => {
    it('creates auth client with baseURL', () => {
      const client = createClient({ baseURL: 'http://localhost:3000' });

      expect(createAuthClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:3000',
        })
      );
      expect(client).toBeDefined();
    });

    it('passes different baseURL correctly', () => {
      createClient({ baseURL: 'https://example.com' });

      expect(createAuthClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://example.com',
        })
      );
    });

    it('returns auth client object', () => {
      const client = createClient({ baseURL: 'http://localhost:3000' });

      expect(client.baseURL).toBe('http://localhost:3000');
    });
  });
});
