import { describe, expect, it } from 'vitest';
import { AuthError, AuthErrorCodes, createAuthError, isAuthError } from './errors';

describe('errors', () => {
  describe('AuthError', () => {
    it('creates error with message, code, and statusCode', () => {
      const error = new AuthError('Test error', AuthErrorCodes.INVALID_CREDENTIALS, 401);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(AuthErrorCodes.INVALID_CREDENTIALS);
      expect(error.statusCode).toBe(401);
    });

    it('sets name to "AuthError"', () => {
      const error = new AuthError('Test', AuthErrorCodes.INVALID_CREDENTIALS);
      expect(error.name).toBe('AuthError');
    });

    it('defaults statusCode to 400', () => {
      const error = new AuthError('Test', AuthErrorCodes.OAUTH_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('has proper stack trace', () => {
      const error = new AuthError('Test', AuthErrorCodes.INVALID_CREDENTIALS);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AuthError');
    });
  });

  describe('createAuthError', () => {
    it('creates error with default message for INVALID_CREDENTIALS', () => {
      const error = createAuthError(AuthErrorCodes.INVALID_CREDENTIALS);
      expect(error.message).toBe('Invalid email or password');
      expect(error.code).toBe(AuthErrorCodes.INVALID_CREDENTIALS);
      expect(error.statusCode).toBe(401);
    });

    it('creates error with default message for USER_DISABLED', () => {
      const error = createAuthError(AuthErrorCodes.USER_DISABLED);
      expect(error.message).toBe('Your account has been disabled. Please contact support.');
      expect(error.statusCode).toBe(403);
    });

    it('creates error with default message for USER_PENDING', () => {
      const error = createAuthError(AuthErrorCodes.USER_PENDING);
      expect(error.message).toBe('Your account is pending activation. Please check your email.');
      expect(error.statusCode).toBe(403);
    });

    it('creates error with default message for EMAIL_NOT_VERIFIED', () => {
      const error = createAuthError(AuthErrorCodes.EMAIL_NOT_VERIFIED);
      expect(error.message).toBe('Please verify your email address before signing in');
      expect(error.statusCode).toBe(403);
    });

    it('creates error with default message for SESSION_EXPIRED', () => {
      const error = createAuthError(AuthErrorCodes.SESSION_EXPIRED);
      expect(error.message).toBe('Your session has expired. Please sign in again.');
      expect(error.statusCode).toBe(401);
    });

    it('creates error with default message for OAUTH_ERROR', () => {
      const error = createAuthError(AuthErrorCodes.OAUTH_ERROR);
      expect(error.message).toBe('OAuth authentication failed. Please try again.');
      expect(error.statusCode).toBe(400);
    });

    it('creates error with default message for ACCOUNT_LINKING_FAILED', () => {
      const error = createAuthError(AuthErrorCodes.ACCOUNT_LINKING_FAILED);
      expect(error.message).toBe('Failed to link account. Please try again.');
      expect(error.statusCode).toBe(400);
    });

    it('creates error with default message for INVALID_TOKEN', () => {
      const error = createAuthError(AuthErrorCodes.INVALID_TOKEN);
      expect(error.message).toBe('Invalid or expired token');
      expect(error.statusCode).toBe(401);
    });

    it('creates error with default message for MISSING_CREDENTIALS', () => {
      const error = createAuthError(AuthErrorCodes.MISSING_CREDENTIALS);
      expect(error.message).toBe('Email and password are required');
      expect(error.statusCode).toBe(400);
    });

    it('creates error with default message for PASSWORD_TOO_SHORT', () => {
      const error = createAuthError(AuthErrorCodes.PASSWORD_TOO_SHORT);
      expect(error.message).toBe('Password must be at least 8 characters long');
      expect(error.statusCode).toBe(400);
    });

    it('creates error with default message for PASSWORD_TOO_LONG', () => {
      const error = createAuthError(AuthErrorCodes.PASSWORD_TOO_LONG);
      expect(error.message).toBe('Password must be less than 128 characters long');
      expect(error.statusCode).toBe(400);
    });

    it('creates error with default message for WEAK_PASSWORD', () => {
      const error = createAuthError(AuthErrorCodes.WEAK_PASSWORD);
      expect(error.message).toBe(
        'Password must contain uppercase, lowercase, number, and special character',
      );
      expect(error.statusCode).toBe(400);
    });

    it('creates error with default message for EMAIL_ALREADY_EXISTS', () => {
      const error = createAuthError(AuthErrorCodes.EMAIL_ALREADY_EXISTS);
      expect(error.message).toBe('An account with this email already exists');
      expect(error.statusCode).toBe(409);
    });

    it('creates error with default message for CONFIGURATION_ERROR', () => {
      const error = createAuthError(AuthErrorCodes.CONFIGURATION_ERROR);
      expect(error.message).toBe('Authentication configuration error');
      expect(error.statusCode).toBe(500);
    });

    it('uses custom message when provided', () => {
      const error = createAuthError(AuthErrorCodes.INVALID_CREDENTIALS, 'Custom error message');
      expect(error.message).toBe('Custom error message');
      expect(error.code).toBe(AuthErrorCodes.INVALID_CREDENTIALS);
    });

    it('uses custom statusCode when provided', () => {
      const error = createAuthError(AuthErrorCodes.INVALID_CREDENTIALS, undefined, 500);
      expect(error.statusCode).toBe(500);
    });

    it('uses both custom message and statusCode', () => {
      const error = createAuthError(AuthErrorCodes.OAUTH_ERROR, 'Custom OAuth error', 502);
      expect(error.message).toBe('Custom OAuth error');
      expect(error.statusCode).toBe(502);
    });
  });

  describe('isAuthError', () => {
    it('returns true for AuthError instance', () => {
      const error = new AuthError('Test', AuthErrorCodes.INVALID_CREDENTIALS);
      expect(isAuthError(error)).toBe(true);
    });

    it('returns true for error created by createAuthError', () => {
      const error = createAuthError(AuthErrorCodes.USER_DISABLED);
      expect(isAuthError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isAuthError(error)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isAuthError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isAuthError(undefined)).toBe(false);
    });

    it('returns false for string', () => {
      expect(isAuthError('error string')).toBe(false);
    });

    it('returns false for plain object', () => {
      expect(isAuthError({ message: 'error', code: 'ERROR' })).toBe(false);
    });
  });
});
