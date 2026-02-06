import { describe, expect, it } from 'vitest';
import { isPlaceholderEmail, PLACEHOLDER_EMAIL_DOMAIN } from './placeholder-email';

describe('placeholder-email', () => {
  describe('PLACEHOLDER_EMAIL_DOMAIN', () => {
    it('should be placeholder.local', () => {
      expect(PLACEHOLDER_EMAIL_DOMAIN).toBe('placeholder.local');
    });
  });

  describe('isPlaceholderEmail', () => {
    it('should return true for linuxdo placeholder emails', () => {
      expect(isPlaceholderEmail('linuxdo_123@placeholder.local')).toBe(true);
      expect(isPlaceholderEmail('linuxdo_99999@placeholder.local')).toBe(true);
    });

    it('should return true for any email ending with @placeholder.local', () => {
      expect(isPlaceholderEmail('anything@placeholder.local')).toBe(true);
    });

    it('should return false for real emails', () => {
      expect(isPlaceholderEmail('user@example.com')).toBe(false);
      expect(isPlaceholderEmail('test@gmail.com')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isPlaceholderEmail(null)).toBe(false);
      expect(isPlaceholderEmail(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isPlaceholderEmail('')).toBe(false);
    });

    it('should return false for emails that contain but do not end with placeholder.local', () => {
      expect(isPlaceholderEmail('placeholder.local@example.com')).toBe(false);
      expect(isPlaceholderEmail('user@placeholder.local.evil.com')).toBe(false);
    });
  });
});
