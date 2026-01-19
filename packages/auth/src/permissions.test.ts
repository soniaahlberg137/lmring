import { describe, expect, it } from 'vitest';
import type { AuthUser } from './types';
import {
  UserRole,
  isAdmin,
  hasRole,
  requireAdmin,
  requireRole,
  canPerformAdminActions,
  getRoleDisplayName,
} from './permissions';

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

describe('permissions', () => {
  describe('isAdmin', () => {
    it('returns false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(isAdmin(undefined)).toBe(false);
    });

    it('returns true for admin user', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(isAdmin(admin)).toBe(true);
    });

    it('returns false for regular user', () => {
      const user = createMockUser({ role: 'user' });
      expect(isAdmin(user)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('returns true when user has matching role', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(hasRole(admin, UserRole.ADMIN)).toBe(true);
    });

    it('returns false when user has different role', () => {
      const user = createMockUser({ role: 'user' });
      expect(hasRole(user, UserRole.ADMIN)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(hasRole(null, UserRole.USER)).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(hasRole(undefined, UserRole.USER)).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('throws for null user', () => {
      expect(() => requireAdmin(null)).toThrow('Authentication required');
    });

    it('throws for undefined user', () => {
      expect(() => requireAdmin(undefined)).toThrow('Authentication required');
    });

    it('throws for non-admin user', () => {
      const user = createMockUser({ role: 'user' });
      expect(() => requireAdmin(user)).toThrow('Admin privileges required');
    });

    it('passes for admin user', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(() => requireAdmin(admin)).not.toThrow();
    });
  });

  describe('requireRole', () => {
    it('throws for null user', () => {
      expect(() => requireRole(null, UserRole.USER)).toThrow('Authentication required');
    });

    it('throws for undefined user', () => {
      expect(() => requireRole(undefined, UserRole.USER)).toThrow('Authentication required');
    });

    it('throws for wrong role', () => {
      const user = createMockUser({ role: 'user' });
      expect(() => requireRole(user, UserRole.ADMIN)).toThrow("Role 'admin' required");
    });

    it('passes for correct role', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(() => requireRole(admin, UserRole.ADMIN)).not.toThrow();
    });
  });

  describe('canPerformAdminActions', () => {
    it('returns true for admin user', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(canPerformAdminActions(admin)).toBe(true);
    });

    it('returns false for regular user', () => {
      const user = createMockUser({ role: 'user' });
      expect(canPerformAdminActions(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(canPerformAdminActions(null)).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    it('returns "Administrator" for admin role', () => {
      expect(getRoleDisplayName(UserRole.ADMIN)).toBe('Administrator');
    });

    it('returns "User" for user role', () => {
      expect(getRoleDisplayName(UserRole.USER)).toBe('User');
    });

    it('returns "Unknown" for unknown role', () => {
      expect(getRoleDisplayName('unknown' as any)).toBe('Unknown');
    });
  });
});
