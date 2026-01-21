import { describe, expect, it } from 'vitest';
import { sanitizeCallbackUrl } from './redirect';

describe('sanitizeCallbackUrl', () => {
  describe('valid relative paths', () => {
    it('should return valid relative path starting with /', () => {
      expect(sanitizeCallbackUrl('/arena')).toBe('/arena');
    });

    it('should return nested paths', () => {
      expect(sanitizeCallbackUrl('/settings/profile')).toBe('/settings/profile');
    });

    it('should return paths with query parameters', () => {
      expect(sanitizeCallbackUrl('/search?q=test')).toBe('/search?q=test');
    });

    it('should return root path', () => {
      expect(sanitizeCallbackUrl('/')).toBe('/');
    });
  });

  describe('invalid inputs returning fallback', () => {
    it('should return fallback for undefined', () => {
      expect(sanitizeCallbackUrl(undefined)).toBe('/arena');
    });

    it('should return fallback for empty string', () => {
      expect(sanitizeCallbackUrl('')).toBe('/arena');
    });

    it('should return fallback for whitespace-only string', () => {
      expect(sanitizeCallbackUrl('   ')).toBe('/arena');
    });

    it('should return fallback for paths not starting with /', () => {
      expect(sanitizeCallbackUrl('arena')).toBe('/arena');
    });
  });

  describe('external URL attack prevention', () => {
    it('should block https:// URLs', () => {
      expect(sanitizeCallbackUrl('https://evil.com')).toBe('/arena');
    });

    it('should block http:// URLs', () => {
      expect(sanitizeCallbackUrl('http://evil.com')).toBe('/arena');
    });

    it('should block protocol-relative URLs (//)', () => {
      expect(sanitizeCallbackUrl('//evil.com')).toBe('/arena');
    });

    it('should block protocol-relative URLs with path', () => {
      expect(sanitizeCallbackUrl('//evil.com/path')).toBe('/arena');
    });
  });

  describe('encoded attack prevention', () => {
    it('should block encoded double slash (/%2F/)', () => {
      expect(sanitizeCallbackUrl('/%2F/evil.com')).toBe('/arena');
    });

    it('should allow double-encoded strings (decoded once remains valid)', () => {
      expect(sanitizeCallbackUrl('/%252F/evil.com')).toBe('/%252F/evil.com');
    });

    it('should return fallback for malformed encoding', () => {
      expect(sanitizeCallbackUrl('/%invalid')).toBe('/arena');
    });
  });

  describe('custom fallback parameter', () => {
    it('should use custom fallback for invalid input', () => {
      expect(sanitizeCallbackUrl(undefined, '/home')).toBe('/home');
    });

    it('should use custom fallback for external URLs', () => {
      expect(sanitizeCallbackUrl('https://evil.com', '/dashboard')).toBe('/dashboard');
    });

    it('should still return valid paths with custom fallback', () => {
      expect(sanitizeCallbackUrl('/valid-path', '/home')).toBe('/valid-path');
    });
  });

  describe('whitespace trimming', () => {
    it('should trim leading whitespace', () => {
      expect(sanitizeCallbackUrl('  /arena')).toBe('/arena');
    });

    it('should trim trailing whitespace', () => {
      expect(sanitizeCallbackUrl('/arena  ')).toBe('/arena');
    });

    it('should trim both leading and trailing whitespace', () => {
      expect(sanitizeCallbackUrl('  /arena  ')).toBe('/arena');
    });
  });
});
