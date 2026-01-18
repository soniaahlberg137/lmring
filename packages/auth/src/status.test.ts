import { describe, expect, it } from 'vitest';
import type { AuthUser } from './types';
import {
  UserStatus,
  isActive,
  isDisabled,
  isPending,
  hasStatus,
  requireActive,
  canSignIn,
  getStatusDisplayName,
  getStatusDescription,
} from './status';

// Helper to create mock user
const createMockUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  email: 'test@example.com',
  username: null,
  fullName: 'Test User',
  avatarUrl: null,
  role: 'user',
  status: 'active',
  githubId: null,
  googleId: null,
  linuxdoId: null,
  inviterId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('status', () => {
  describe('isActive', () => {
    it('returns true for active user', () => {
      const user = createMockUser({ status: 'active' });
      expect(isActive(user)).toBe(true);
    });

    it('returns false for disabled user', () => {
      const user = createMockUser({ status: 'disabled' });
      expect(isActive(user)).toBe(false);
    });

    it('returns false for pending user', () => {
      const user = createMockUser({ status: 'pending' });
      expect(isActive(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(isActive(null)).toBe(false);
    });
  });

  describe('isDisabled', () => {
    it('returns true for disabled user', () => {
      const user = createMockUser({ status: 'disabled' });
      expect(isDisabled(user)).toBe(true);
    });

    it('returns false for active user', () => {
      const user = createMockUser({ status: 'active' });
      expect(isDisabled(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(isDisabled(null)).toBe(false);
    });
  });

  describe('isPending', () => {
    it('returns true for pending user', () => {
      const user = createMockUser({ status: 'pending' });
      expect(isPending(user)).toBe(true);
    });

    it('returns false for active user', () => {
      const user = createMockUser({ status: 'active' });
      expect(isPending(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(isPending(null)).toBe(false);
    });
  });

  describe('hasStatus', () => {
    it('returns true when user has matching status', () => {
      const user = createMockUser({ status: 'active' });
      expect(hasStatus(user, UserStatus.ACTIVE)).toBe(true);
    });

    it('returns false when user has different status', () => {
      const user = createMockUser({ status: 'disabled' });
      expect(hasStatus(user, UserStatus.ACTIVE)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(hasStatus(null, UserStatus.ACTIVE)).toBe(false);
    });
  });

  describe('requireActive', () => {
    it('throws for null user', () => {
      expect(() => requireActive(null)).toThrow('Authentication required');
    });

    it('throws for disabled user', () => {
      const user = createMockUser({ status: 'disabled' });
      expect(() => requireActive(user)).toThrow('Account is disabled');
    });

    it('throws for pending user', () => {
      const user = createMockUser({ status: 'pending' });
      expect(() => requireActive(user)).toThrow('Account is pending activation');
    });

    it('throws for unknown status', () => {
      const user = createMockUser({ status: 'unknown' as any });
      expect(() => requireActive(user)).toThrow('Account is not active');
    });

    it('passes for active user', () => {
      const user = createMockUser({ status: 'active' });
      expect(() => requireActive(user)).not.toThrow();
    });
  });

  describe('canSignIn', () => {
    it('returns true for active user', () => {
      const user = createMockUser({ status: 'active' });
      expect(canSignIn(user)).toBe(true);
    });

    it('returns false for disabled user', () => {
      const user = createMockUser({ status: 'disabled' });
      expect(canSignIn(user)).toBe(false);
    });

    it('returns false for pending user', () => {
      const user = createMockUser({ status: 'pending' });
      expect(canSignIn(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(canSignIn(null)).toBe(false);
    });
  });

  describe('getStatusDisplayName', () => {
    it('returns "Active" for active status', () => {
      expect(getStatusDisplayName(UserStatus.ACTIVE)).toBe('Active');
    });

    it('returns "Disabled" for disabled status', () => {
      expect(getStatusDisplayName(UserStatus.DISABLED)).toBe('Disabled');
    });

    it('returns "Pending" for pending status', () => {
      expect(getStatusDisplayName(UserStatus.PENDING)).toBe('Pending');
    });

    it('returns "Unknown" for unknown status', () => {
      expect(getStatusDisplayName('unknown' as any)).toBe('Unknown');
    });
  });

  describe('getStatusDescription', () => {
    it('returns correct description for active status', () => {
      expect(getStatusDescription(UserStatus.ACTIVE)).toBe(
        'Account is active and can access all features',
      );
    });

    it('returns correct description for disabled status', () => {
      expect(getStatusDescription(UserStatus.DISABLED)).toBe(
        'Account has been disabled and cannot sign in',
      );
    });

    it('returns correct description for pending status', () => {
      expect(getStatusDescription(UserStatus.PENDING)).toBe('Account is pending activation');
    });

    it('returns "Unknown status" for unknown status', () => {
      expect(getStatusDescription('unknown' as any)).toBe('Unknown status');
    });
  });
});
