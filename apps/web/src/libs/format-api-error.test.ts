import { describe, expect, it } from 'vitest';
import { formatErrorForDisplay, tryParseStructuredError } from './format-api-error';

describe('tryParseStructuredError', () => {
  it('should parse valid structured error JSON', () => {
    const json = JSON.stringify({
      statusCode: 400,
      detail: 'Store must be set to false',
      provider: 'api.openai.com',
      isRetryable: false,
    });

    const result = tryParseStructuredError(json);

    expect(result).not.toBeNull();
    expect(result?.statusCode).toBe(400);
    expect(result?.detail).toBe('Store must be set to false');
    expect(result?.provider).toBe('api.openai.com');
    expect(result?.isRetryable).toBe(false);
  });

  it('should return null for non-JSON strings', () => {
    expect(tryParseStructuredError('plain error message')).toBeNull();
    expect(tryParseStructuredError('not json at all')).toBeNull();
  });

  it('should return null for JSON without detail field', () => {
    expect(tryParseStructuredError(JSON.stringify({ message: 'no detail' }))).toBeNull();
    expect(tryParseStructuredError(JSON.stringify({ error: 'no detail' }))).toBeNull();
  });

  it('should return null for non-object JSON', () => {
    expect(tryParseStructuredError('"just a string"')).toBeNull();
    expect(tryParseStructuredError('42')).toBeNull();
    expect(tryParseStructuredError('null')).toBeNull();
  });
});

describe('formatErrorForDisplay', () => {
  describe('with structured error strings', () => {
    it('should format 400 Bad Request', () => {
      const json = JSON.stringify({
        statusCode: 400,
        detail: 'Store must be set to false',
        provider: 'node-hk.sssaicode.com',
        isRetryable: false,
      });

      const result = formatErrorForDisplay(json);

      expect(result.title).toBe('Bad Request (400)');
      expect(result.detail).toBe('Store must be set to false [node-hk.sssaicode.com]');
      expect(result.isRetryable).toBe(false);
    });

    it('should format 401 Authentication Failed', () => {
      const json = JSON.stringify({
        statusCode: 401,
        detail: 'Invalid API key',
        provider: 'api.openai.com',
        isRetryable: false,
      });

      const result = formatErrorForDisplay(json);

      expect(result.title).toBe('Authentication Failed (401)');
      expect(result.detail).toBe('Invalid API key [api.openai.com]');
    });

    it('should format 429 Rate Limited as retryable', () => {
      const json = JSON.stringify({
        statusCode: 429,
        detail: 'Rate limit exceeded',
        provider: 'api.openai.com',
        isRetryable: true,
      });

      const result = formatErrorForDisplay(json);

      expect(result.title).toBe('Rate Limited (429)');
      expect(result.isRetryable).toBe(true);
    });

    it('should format 500+ server errors', () => {
      const json = JSON.stringify({
        statusCode: 503,
        detail: 'Service temporarily unavailable',
        isRetryable: true,
      });

      const result = formatErrorForDisplay(json);

      expect(result.title).toBe('Service Unavailable (503)');
      expect(result.detail).toBe('Service temporarily unavailable');
      expect(result.isRetryable).toBe(true);
    });

    it('should handle unknown status codes', () => {
      const json = JSON.stringify({
        statusCode: 418,
        detail: "I'm a teapot",
        isRetryable: false,
      });

      const result = formatErrorForDisplay(json);

      expect(result.title).toBe('Request failed');
      expect(result.detail).toBe("I'm a teapot");
    });

    it('should handle structured error without provider', () => {
      const json = JSON.stringify({
        statusCode: 400,
        detail: 'Bad request',
      });

      const result = formatErrorForDisplay(json);

      expect(result.detail).toBe('Bad request');
      expect(result.detail).not.toContain('[');
    });
  });

  describe('with plain error strings', () => {
    it('should extract detail from embedded JSON', () => {
      const result = formatErrorForDisplay(
        'AI_APICallError: {"detail":"Store must be set to false"}',
      );

      expect(result.title).toBe('Request failed');
      expect(result.detail).toBe('Store must be set to false');
    });

    it('should extract error.message from embedded JSON', () => {
      const result = formatErrorForDisplay(
        'Error: {"error":{"message":"Invalid API key provided"}}',
      );

      expect(result.detail).toBe('Invalid API key provided');
    });

    it('should return plain strings as-is when no JSON found', () => {
      const result = formatErrorForDisplay('Network timeout');

      expect(result.title).toBe('Request failed');
      expect(result.detail).toBe('Network timeout');
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('with null/undefined', () => {
    it('should handle null', () => {
      const result = formatErrorForDisplay(null);

      expect(result.title).toBe('Request failed');
      expect(result.detail).toBe('');
      expect(result.isRetryable).toBe(false);
    });

    it('should handle undefined', () => {
      const result = formatErrorForDisplay(undefined);

      expect(result.title).toBe('Request failed');
      expect(result.detail).toBe('');
    });

    it('should handle empty string', () => {
      const result = formatErrorForDisplay('');

      expect(result.title).toBe('Request failed');
      expect(result.detail).toBe('');
    });
  });
});
