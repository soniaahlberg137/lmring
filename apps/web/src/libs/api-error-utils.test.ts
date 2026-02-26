import { describe, expect, it } from 'vitest';
import { extractApiErrorMessage, type StructuredApiError } from './api-error-utils';

// Helper to create a fake APICallError-like object with the correct marker
function createFakeAPICallError(opts: {
  message: string;
  url: string;
  statusCode?: number;
  responseBody?: string;
  isRetryable?: boolean;
}) {
  const marker = 'vercel.ai.error.AI_APICallError';
  const symbol = Symbol.for(marker);
  const error = new Error(opts.message);
  Object.defineProperty(error, 'name', { value: 'AI_APICallError' });
  Object.defineProperty(error, symbol, { value: true });
  Object.defineProperty(error, 'url', { value: opts.url });
  Object.defineProperty(error, 'statusCode', { value: opts.statusCode });
  Object.defineProperty(error, 'responseBody', { value: opts.responseBody });
  Object.defineProperty(error, 'isRetryable', {
    value:
      opts.isRetryable ??
      (opts.statusCode != null &&
        (opts.statusCode === 408 ||
          opts.statusCode === 409 ||
          opts.statusCode === 429 ||
          opts.statusCode >= 500)),
  });
  Object.defineProperty(error, 'requestBodyValues', { value: {} });
  return error;
}

describe('extractApiErrorMessage', () => {
  describe('with APICallError instances', () => {
    it('should extract OpenAI error format', () => {
      const error = createFakeAPICallError({
        message: 'Bad Request',
        url: 'https://api.openai.com/v1/chat/completions',
        statusCode: 400,
        responseBody: JSON.stringify({
          error: { message: 'Store must be set to false', type: 'invalid_request_error' },
        }),
      });

      const result = extractApiErrorMessage(error);
      const parsed: StructuredApiError = JSON.parse(result);

      expect(parsed.statusCode).toBe(400);
      expect(parsed.detail).toBe('Store must be set to false');
      expect(parsed.provider).toBe('api.openai.com');
      expect(parsed.isRetryable).toBe(false);
    });

    it('should extract Anthropic error format', () => {
      const error = createFakeAPICallError({
        message: 'Overloaded',
        url: 'https://api.anthropic.com/v1/messages',
        statusCode: 529,
        responseBody: JSON.stringify({
          type: 'error',
          error: { type: 'overloaded_error', message: 'Overloaded' },
        }),
      });

      const result = extractApiErrorMessage(error);
      const parsed: StructuredApiError = JSON.parse(result);

      expect(parsed.statusCode).toBe(529);
      expect(parsed.detail).toBe('Overloaded');
      expect(parsed.provider).toBe('api.anthropic.com');
      expect(parsed.isRetryable).toBe(true);
    });

    it('should extract simple detail format', () => {
      const error = createFakeAPICallError({
        message: 'API error',
        url: 'https://node-hk.sssaicode.com/v1/chat/completions',
        statusCode: 400,
        responseBody: JSON.stringify({ detail: 'Store must be set to false' }),
      });

      const result = extractApiErrorMessage(error);
      const parsed: StructuredApiError = JSON.parse(result);

      expect(parsed.statusCode).toBe(400);
      expect(parsed.detail).toBe('Store must be set to false');
      expect(parsed.provider).toBe('node-hk.sssaicode.com');
    });

    it('should fall back to error.message when responseBody is not parseable', () => {
      const error = createFakeAPICallError({
        message: 'Something went wrong',
        url: 'https://api.openai.com/v1/chat/completions',
        statusCode: 500,
        responseBody: 'not json',
      });

      const result = extractApiErrorMessage(error);
      const parsed: StructuredApiError = JSON.parse(result);

      expect(parsed.detail).toBe('Something went wrong');
      expect(parsed.statusCode).toBe(500);
      expect(parsed.isRetryable).toBe(true);
    });

    it('should handle missing responseBody', () => {
      const error = createFakeAPICallError({
        message: 'Connection refused',
        url: 'https://api.example.com/v1/chat',
        statusCode: undefined,
        responseBody: undefined,
      });

      const result = extractApiErrorMessage(error);
      const parsed: StructuredApiError = JSON.parse(result);

      expect(parsed.detail).toBe('Connection refused');
      expect(parsed.statusCode).toBeUndefined();
    });

    it('should mark 429 as retryable', () => {
      const error = createFakeAPICallError({
        message: 'Rate limited',
        url: 'https://api.openai.com/v1/chat/completions',
        statusCode: 429,
        responseBody: JSON.stringify({
          error: { message: 'Rate limit exceeded' },
        }),
      });

      const result = extractApiErrorMessage(error);
      const parsed: StructuredApiError = JSON.parse(result);

      expect(parsed.isRetryable).toBe(true);
    });
  });

  describe('with plain Error', () => {
    it('should return error.message', () => {
      const error = new Error('Network timeout');
      const result = extractApiErrorMessage(error);
      expect(result).toBe('Network timeout');
    });
  });

  describe('with unknown errors', () => {
    it('should return "Unknown error" for non-Error values', () => {
      expect(extractApiErrorMessage('string error')).toBe('Unknown error');
      expect(extractApiErrorMessage(null)).toBe('Unknown error');
      expect(extractApiErrorMessage(undefined)).toBe('Unknown error');
      expect(extractApiErrorMessage(42)).toBe('Unknown error');
    });
  });
});
