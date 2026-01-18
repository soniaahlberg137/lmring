import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createAuthLogger } from './logger';

describe('logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sanitization', () => {
    it('redacts password field', () => {
      const logger = createAuthLogger();
      logger.info('Test', { password: 'secret123' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.password).toBe('[REDACTED]');
    });

    it('redacts token field', () => {
      const logger = createAuthLogger();
      logger.info('Test', { token: 'abc123' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.token).toBe('[REDACTED]');
    });

    it('redacts secret field', () => {
      const logger = createAuthLogger();
      logger.info('Test', { secret: 'mysecret' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.secret).toBe('[REDACTED]');
    });

    it('redacts accessToken field', () => {
      const logger = createAuthLogger();
      logger.info('Test', { accessToken: 'token123' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.accessToken).toBe('[REDACTED]');
    });

    it('redacts refreshToken field', () => {
      const logger = createAuthLogger();
      logger.info('Test', { refreshToken: 'refresh123' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.refreshToken).toBe('[REDACTED]');
    });

    it('redacts clientSecret field', () => {
      const logger = createAuthLogger();
      logger.info('Test', { clientSecret: 'secret' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.clientSecret).toBe('[REDACTED]');
    });

    it('redacts apiKey field', () => {
      const logger = createAuthLogger();
      logger.info('Test', { apiKey: 'key123' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.apiKey).toBe('[REDACTED]');
    });

    it('redacts fields case-insensitively (contains match)', () => {
      const logger = createAuthLogger();
      logger.info('Test', { userPassword: 'secret', myApiKey: 'key' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.userPassword).toBe('[REDACTED]');
      expect(loggedData.myApiKey).toBe('[REDACTED]');
    });

    it('sanitizes nested objects', () => {
      const logger = createAuthLogger();
      logger.info('Test', {
        user: {
          name: 'John',
          password: 'secret',
        },
      });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.user.name).toBe('John');
      expect(loggedData.user.password).toBe('[REDACTED]');
    });

    it('passes through non-sensitive fields', () => {
      const logger = createAuthLogger();
      logger.info('Test', { userId: '123', email: 'test@example.com' });

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.userId).toBe('123');
      expect(loggedData.email).toBe('test@example.com');
    });

    it('handles undefined context', () => {
      const logger = createAuthLogger();
      logger.info('Test message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.message).toBe('Test message');
    });
  });

  describe('createAuthLogger', () => {
    it('uses console as default logger', () => {
      const logger = createAuthLogger();
      logger.info('Test message');

      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('uses custom base logger when provided', () => {
      const customInfo = vi.fn();
      const customLogger = {
        info: customInfo,
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const logger = createAuthLogger(customLogger);
      logger.info('Test', { data: 'value' });

      expect(customInfo).toHaveBeenCalledWith('Test', { data: 'value' });
    });

    it('does not log debug by default', () => {
      const logger = createAuthLogger();
      logger.debug('Debug message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('logs debug when enableDebug is true', () => {
      const logger = createAuthLogger(undefined, true);
      logger.debug('Debug message');

      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });

  describe('log levels', () => {
    it('logs info messages', () => {
      const logger = createAuthLogger();
      logger.info('Info message', { key: 'value' });

      expect(consoleSpy.log).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('Info message');
    });

    it('logs warn messages', () => {
      const logger = createAuthLogger();
      logger.warn('Warning message', { key: 'value' });

      expect(consoleSpy.warn).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.warn.mock.calls[0][0]);
      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe('Warning message');
    });

    it('logs error messages', () => {
      const logger = createAuthLogger();
      logger.error('Error message', { key: 'value' });

      expect(consoleSpy.error).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(loggedData.level).toBe('error');
      expect(loggedData.message).toBe('Error message');
    });

    it('logs debug messages when enabled', () => {
      const logger = createAuthLogger(undefined, true);
      logger.debug('Debug message', { key: 'value' });

      expect(consoleSpy.debug).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.debug.mock.calls[0][0]);
      expect(loggedData.level).toBe('debug');
      expect(loggedData.message).toBe('Debug message');
    });

    it('includes timestamp in log output', () => {
      const logger = createAuthLogger();
      logger.info('Test');

      const loggedData = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(loggedData.timestamp).toBeDefined();
      expect(() => new Date(loggedData.timestamp)).not.toThrow();
    });
  });
});
