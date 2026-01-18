import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalMetricsTracker, globalMetricsTracker, MetricsCollector } from './metrics';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('start', () => {
    it('records start time', () => {
      vi.setSystemTime(1000);
      collector.start();
      vi.setSystemTime(2000);

      const metrics = collector.getMetrics();
      expect(metrics.totalTime).toBe(1000);
    });
  });

  describe('recordFirstToken', () => {
    it('records time to first token', () => {
      vi.setSystemTime(1000);
      collector.start();
      vi.setSystemTime(1500);
      collector.recordFirstToken();
      vi.setSystemTime(2000);

      const metrics = collector.getMetrics();
      expect(metrics.timeToFirstToken).toBe(500);
    });

    it('only records first call', () => {
      vi.setSystemTime(1000);
      collector.start();
      vi.setSystemTime(1500);
      collector.recordFirstToken();
      vi.setSystemTime(1800);
      collector.recordFirstToken();
      vi.setSystemTime(2000);

      const metrics = collector.getMetrics();
      expect(metrics.timeToFirstToken).toBe(500);
    });

    it('does nothing if start not called', () => {
      collector.recordFirstToken();
      const metrics = collector.getMetrics();
      expect(metrics.timeToFirstToken).toBeUndefined();
    });
  });

  describe('recordTokens', () => {
    it('records prompt tokens', () => {
      collector.start();
      collector.recordTokens({ promptTokens: 100 });
      const metrics = collector.getMetrics();
      expect(metrics.promptTokens).toBe(100);
    });

    it('records completion tokens', () => {
      collector.start();
      collector.recordTokens({ completionTokens: 50 });
      const metrics = collector.getMetrics();
      expect(metrics.completionTokens).toBe(50);
    });

    it('records total tokens', () => {
      collector.start();
      collector.recordTokens({ totalTokens: 150 });
      const metrics = collector.getMetrics();
      expect(metrics.totalTokens).toBe(150);
    });

    it('calculates total tokens from prompt and completion', () => {
      collector.start();
      collector.recordTokens({ promptTokens: 100, completionTokens: 50 });
      const metrics = collector.getMetrics();
      expect(metrics.totalTokens).toBe(150);
    });

    it('prefers explicit total tokens over calculation', () => {
      collector.start();
      collector.recordTokens({ promptTokens: 100, completionTokens: 50, totalTokens: 200 });
      const metrics = collector.getMetrics();
      expect(metrics.totalTokens).toBe(200);
    });
  });

  describe('getMetrics', () => {
    it('returns all metrics', () => {
      vi.setSystemTime(1000);
      collector.start();
      vi.setSystemTime(1200);
      collector.recordFirstToken();
      collector.recordTokens({ promptTokens: 100, completionTokens: 50 });
      vi.setSystemTime(2000);

      const metrics = collector.getMetrics();

      expect(metrics.totalTime).toBe(1000);
      expect(metrics.timeToFirstToken).toBe(200);
      expect(metrics.promptTokens).toBe(100);
      expect(metrics.completionTokens).toBe(50);
      expect(metrics.totalTokens).toBe(150);
      expect(metrics.tokensPerSecond).toBe(50);
    });

    it('calculates tokens per second', () => {
      vi.setSystemTime(0);
      collector.start();
      collector.recordTokens({ completionTokens: 100 });
      vi.setSystemTime(500);

      const metrics = collector.getMetrics();
      expect(metrics.tokensPerSecond).toBe(200);
    });

    it('returns undefined for tokensPerSecond when no completion tokens', () => {
      collector.start();
      const metrics = collector.getMetrics();
      expect(metrics.tokensPerSecond).toBeUndefined();
    });

    it('returns undefined for optional fields when not set', () => {
      collector.start();
      const metrics = collector.getMetrics();
      expect(metrics.timeToFirstToken).toBeUndefined();
      expect(metrics.promptTokens).toBeUndefined();
      expect(metrics.completionTokens).toBeUndefined();
      expect(metrics.totalTokens).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('resets all values', () => {
      vi.setSystemTime(1000);
      collector.start();
      collector.recordFirstToken();
      collector.recordTokens({ promptTokens: 100, completionTokens: 50, totalTokens: 150 });

      collector.reset();

      vi.setSystemTime(2000);
      const metrics = collector.getMetrics();
      expect(metrics.totalTime).toBe(2000);
      expect(metrics.timeToFirstToken).toBeUndefined();
      expect(metrics.promptTokens).toBeUndefined();
    });
  });
});

describe('GlobalMetricsTracker', () => {
  let tracker: GlobalMetricsTracker;

  beforeEach(() => {
    tracker = new GlobalMetricsTracker();
  });

  describe('record', () => {
    it('records metrics for provider/model', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100 });
      const metrics = tracker.getMetrics('openai', 'gpt-4');
      expect(metrics).toHaveLength(1);
      expect((metrics as unknown[])[0]).toEqual({ totalTime: 100 });
    });

    it('appends metrics for same provider/model', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100 });
      tracker.record('openai', 'gpt-4', { totalTime: 200 });
      const metrics = tracker.getMetrics('openai', 'gpt-4');
      expect(metrics).toHaveLength(2);
    });
  });

  describe('getMetrics', () => {
    it('returns metrics for specific provider/model', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100 });
      tracker.record('anthropic', 'claude-3', { totalTime: 200 });

      const metrics = tracker.getMetrics('openai', 'gpt-4');
      expect(metrics).toHaveLength(1);
    });

    it('returns all metrics for provider', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100 });
      tracker.record('openai', 'gpt-3.5', { totalTime: 50 });
      tracker.record('anthropic', 'claude-3', { totalTime: 200 });

      const metrics = tracker.getMetrics('openai');
      expect(metrics instanceof Map).toBe(true);
      expect((metrics as Map<string, unknown>).size).toBe(2);
    });

    it('returns all metrics when no filters', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100 });
      tracker.record('anthropic', 'claude-3', { totalTime: 200 });

      const metrics = tracker.getMetrics();
      expect(metrics instanceof Map).toBe(true);
      expect((metrics as Map<string, unknown>).size).toBe(2);
    });

    it('returns undefined for unknown provider/model', () => {
      expect(tracker.getMetrics('unknown', 'model')).toBeUndefined();
    });
  });

  describe('getAverageMetrics', () => {
    it('calculates average metrics', () => {
      tracker.record('openai', 'gpt-4', {
        totalTime: 100,
        completionTokens: 10,
        tokensPerSecond: 5,
      });
      tracker.record('openai', 'gpt-4', {
        totalTime: 200,
        completionTokens: 20,
        tokensPerSecond: 10,
      });

      const avg = tracker.getAverageMetrics('openai', 'gpt-4');

      expect(avg?.totalTime).toBe(150);
      expect(avg?.completionTokens).toBe(15);
      expect(avg?.tokensPerSecond).toBe(7.5);
    });

    it('handles timeToFirstToken average', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100, timeToFirstToken: 10 });
      tracker.record('openai', 'gpt-4', { totalTime: 200, timeToFirstToken: 20 });

      const avg = tracker.getAverageMetrics('openai', 'gpt-4');
      expect(avg?.timeToFirstToken).toBe(15);
    });

    it('excludes undefined values from average', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100, timeToFirstToken: 10 });
      tracker.record('openai', 'gpt-4', { totalTime: 200 });

      const avg = tracker.getAverageMetrics('openai', 'gpt-4');
      expect(avg?.timeToFirstToken).toBe(10);
    });

    it('returns undefined for unknown provider/model', () => {
      expect(tracker.getAverageMetrics('unknown', 'model')).toBeUndefined();
    });

    it('returns undefined for empty metrics', () => {
      expect(tracker.getAverageMetrics('openai', 'gpt-4')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('clears specific provider/model', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100 });
      tracker.record('openai', 'gpt-3.5', { totalTime: 50 });

      tracker.clear('openai', 'gpt-4');

      expect(tracker.getMetrics('openai', 'gpt-4')).toBeUndefined();
      expect(tracker.getMetrics('openai', 'gpt-3.5')).toHaveLength(1);
    });

    it('clears all for provider', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100 });
      tracker.record('openai', 'gpt-3.5', { totalTime: 50 });
      tracker.record('anthropic', 'claude-3', { totalTime: 200 });

      tracker.clear('openai');

      expect(tracker.getMetrics('openai', 'gpt-4')).toBeUndefined();
      expect(tracker.getMetrics('openai', 'gpt-3.5')).toBeUndefined();
      expect(tracker.getMetrics('anthropic', 'claude-3')).toHaveLength(1);
    });

    it('clears all metrics', () => {
      tracker.record('openai', 'gpt-4', { totalTime: 100 });
      tracker.record('anthropic', 'claude-3', { totalTime: 200 });

      tracker.clear();

      expect((tracker.getMetrics() as Map<string, unknown>).size).toBe(0);
    });
  });
});

describe('globalMetricsTracker', () => {
  beforeEach(() => {
    globalMetricsTracker.clear();
  });

  it('is an instance of GlobalMetricsTracker', () => {
    expect(globalMetricsTracker).toBeInstanceOf(GlobalMetricsTracker);
  });

  it('maintains state across calls', () => {
    globalMetricsTracker.record('test', 'model', { totalTime: 100 });
    expect(globalMetricsTracker.getMetrics('test', 'model')).toHaveLength(1);
  });
});
