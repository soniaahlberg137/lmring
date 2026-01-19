import * as Sentry from '@sentry/nextjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApiError, logError } from './error-logging';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('error-logging', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logError', () => {
    it('should log Error instance to console', () => {
      const error = new Error('Test error');
      logError('Error occurred', error);

      expect(console.error).toHaveBeenCalledWith('Error occurred', error);
    });

    it('should capture Error instance to Sentry', () => {
      const error = new Error('Test error');
      logError('Error occurred', error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: { message: 'Error occurred' },
      });
    });

    it('should capture Error with extra context', () => {
      const error = new Error('Test error');
      logError('Error occurred', error, { userId: '123', action: 'test' });

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: { message: 'Error occurred', userId: '123', action: 'test' },
      });
    });

    it('should capture non-Error to Sentry as message', () => {
      logError('Error occurred', 'string error');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Error occurred', {
        level: 'error',
        extra: { error: 'string error' },
      });
    });

    it('should capture non-Error with extra context', () => {
      logError('Error occurred', { code: 500 }, { endpoint: '/api/test' });

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Error occurred', {
        level: 'error',
        extra: { error: { code: 500 }, endpoint: '/api/test' },
      });
    });

    it('should handle null error', () => {
      logError('Null error', null);

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Null error', {
        level: 'error',
        extra: { error: null },
      });
    });

    it('should handle undefined error', () => {
      logError('Undefined error', undefined);

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Undefined error', {
        level: 'error',
        extra: { error: undefined },
      });
    });
  });

  describe('handleApiError', () => {
    it('should call logError', () => {
      const error = new Error('API error');
      handleApiError('API call failed', error);

      expect(console.error).toHaveBeenCalledWith('API call failed', error);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should return internal server error response', () => {
      const result = handleApiError('API call failed', new Error('Test'));

      expect(result).toEqual({ error: 'Internal server error' });
    });

    it('should pass extra context to logError', () => {
      const error = new Error('API error');
      handleApiError('API call failed', error, { requestId: 'req-123' });

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: { message: 'API call failed', requestId: 'req-123' },
      });
    });

    it('should always return same error response', () => {
      const result1 = handleApiError('Error 1', new Error('First'));
      const result2 = handleApiError('Error 2', 'Second');

      expect(result1).toEqual({ error: 'Internal server error' });
      expect(result2).toEqual({ error: 'Internal server error' });
    });
  });
});
