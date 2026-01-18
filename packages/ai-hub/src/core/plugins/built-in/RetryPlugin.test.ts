import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginContext } from '../../../types/plugin';
import { RetryPlugin } from './RetryPlugin';

describe('RetryPlugin', () => {
  let plugin: RetryPlugin;
  let context: PluginContext;

  beforeEach(() => {
    plugin = new RetryPlugin();
    context = {
      providerId: 'test',
      modelId: 'model',
      method: 'generateText',
      attempt: 0,
      metadata: {},
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('uses default options', () => {
      expect(plugin.name).toBe('retry');
    });

    it('accepts custom options', () => {
      const custom = new RetryPlugin({
        maxAttempts: 5,
        backoff: 'linear',
        initialDelay: 500,
      });
      expect(custom.name).toBe('retry');
    });
  });

  describe('isRetryable', () => {
    it('retries rate limit errors by default', async () => {
      const error = new Error('rate limit exceeded');
      const promise = plugin.onError(error, context);
      vi.advanceTimersByTime(2000);
      await promise;

      expect(context.metadata.retryAttempt).toBe(1);
    });

    it('retries timeout errors by default', async () => {
      const error = new Error('request timeout');
      const promise = plugin.onError(error, context);
      vi.advanceTimersByTime(2000);
      await promise;

      expect(context.metadata.retryAttempt).toBe(1);
    });

    it('retries 429 errors by default', async () => {
      const error = new Error('HTTP 429 Too Many Requests');
      const promise = plugin.onError(error, context);
      vi.advanceTimersByTime(2000);
      await promise;

      expect(context.metadata.retryAttempt).toBe(1);
    });

    it('does not retry non-retryable errors', async () => {
      const error = new Error('invalid input');
      await plugin.onError(error, context);
      expect(context.metadata.retryAttempt).toBeUndefined();
    });

    it('uses custom retryable errors', async () => {
      const custom = new RetryPlugin({ retryableErrors: ['custom error'] });
      const error = new Error('this is a custom error');
      const promise = custom.onError(error, context);
      vi.advanceTimersByTime(2000);
      await promise;

      expect(context.metadata.retryAttempt).toBe(1);
    });

    it('supports regex patterns', async () => {
      const custom = new RetryPlugin({ retryableErrors: [/^ERR_/] });
      const error = new Error('ERR_CONNECTION_RESET');
      const promise = custom.onError(error, context);
      vi.advanceTimersByTime(2000);
      await promise;

      expect(context.metadata.retryAttempt).toBe(1);
    });
  });

  describe('backoff strategies', () => {
    type MockSpy = ReturnType<typeof vi.fn>;

    it('calculates exponential backoff', async () => {
      const sleepSpy = vi.spyOn(plugin as never, 'sleep' as never) as unknown as MockSpy;
      sleepSpy.mockResolvedValue(undefined);

      await plugin.onError(new Error('rate limit'), context);
      const firstDelay = sleepSpy.mock.calls[0]?.[0] as number;

      context.metadata.retryAttempt = 1;
      await plugin.onError(new Error('rate limit'), context);
      const secondDelay = sleepSpy.mock.calls[1]?.[0] as number;

      expect(secondDelay).toBeGreaterThan(firstDelay);
      sleepSpy.mockRestore();
    });

    it('calculates linear backoff', async () => {
      const linear = new RetryPlugin({ backoff: 'linear', initialDelay: 1000 });
      const sleepSpy = vi.spyOn(linear as never, 'sleep' as never) as unknown as MockSpy;
      sleepSpy.mockResolvedValue(undefined);

      await linear.onError(new Error('rate limit'), context);
      const firstDelay = sleepSpy.mock.calls[0]?.[0] as number;

      context.metadata.retryAttempt = 1;
      await linear.onError(new Error('rate limit'), context);
      const secondDelay = sleepSpy.mock.calls[1]?.[0] as number;

      expect(secondDelay).toBeGreaterThan(firstDelay);
      sleepSpy.mockRestore();
    });

    it('calculates fixed backoff', async () => {
      const fixed = new RetryPlugin({ backoff: 'fixed', initialDelay: 1000 });
      const sleepSpy = vi.spyOn(fixed as never, 'sleep' as never) as unknown as MockSpy;
      sleepSpy.mockResolvedValue(undefined);

      await fixed.onError(new Error('rate limit'), context);
      const firstDelay = sleepSpy.mock.calls[0]?.[0] as number;

      context.metadata.retryAttempt = 1;
      await fixed.onError(new Error('rate limit'), context);
      const secondDelay = sleepSpy.mock.calls[1]?.[0] as number;

      expect(Math.abs(firstDelay - secondDelay)).toBeLessThan(300);
      sleepSpy.mockRestore();
    });

    it('caps delay at maxDelay', async () => {
      const capped = new RetryPlugin({
        backoff: 'exponential',
        initialDelay: 10000,
        maxDelay: 5000,
      });
      const sleepSpy = vi.spyOn(capped as never, 'sleep' as never) as unknown as MockSpy;
      sleepSpy.mockResolvedValue(undefined);

      await capped.onError(new Error('rate limit'), context);
      const delay = sleepSpy.mock.calls[0]?.[0] as number;

      expect(delay).toBeLessThanOrEqual(5000 * 1.1);
      sleepSpy.mockRestore();
    });
  });

  describe('max attempts', () => {
    type MockSpy = ReturnType<typeof vi.fn>;

    it('stops after max attempts', async () => {
      const limited = new RetryPlugin({ maxAttempts: 2 });
      const sleepSpy = vi.spyOn(limited as never, 'sleep' as never) as unknown as MockSpy;
      sleepSpy.mockResolvedValue(undefined);

      await limited.onError(new Error('rate limit'), context);
      expect(context.metadata.retryAttempt).toBe(1);

      await limited.onError(new Error('rate limit'), context);
      expect(context.metadata.retryAttempt).toBeUndefined();
    });

    it('respects custom maxAttempts', async () => {
      const custom = new RetryPlugin({ maxAttempts: 5 });
      const sleepSpy = vi.spyOn(custom as never, 'sleep' as never) as unknown as MockSpy;
      sleepSpy.mockResolvedValue(undefined);

      for (let i = 0; i < 4; i++) {
        await custom.onError(new Error('rate limit'), context);
      }

      expect(context.metadata.retryAttempt).toBe(4);
    });
  });

  describe('onRetry callback', () => {
    type MockSpy = ReturnType<typeof vi.fn>;

    it('calls onRetry callback', async () => {
      const onRetry = vi.fn();
      const withCallback = new RetryPlugin({ onRetry });
      const sleepSpy = vi.spyOn(withCallback as never, 'sleep' as never) as unknown as MockSpy;
      sleepSpy.mockResolvedValue(undefined);

      await withCallback.onError(new Error('rate limit'), context);

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), context);
    });
  });

  describe('getAttemptCount', () => {
    it('returns attempt count from context', () => {
      context.metadata.retryAttempt = 3;
      expect(plugin.getAttemptCount(context)).toBe(3);
    });

    it('returns 0 if no attempts', () => {
      expect(plugin.getAttemptCount(context)).toBe(0);
    });
  });

  describe('reset', () => {
    it('is a no-op', () => {
      expect(() => plugin.reset()).not.toThrow();
    });
  });
});
