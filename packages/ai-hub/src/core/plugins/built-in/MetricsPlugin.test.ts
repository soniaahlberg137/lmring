import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginContext } from '../../../types/plugin';
import { globalMetricsTracker } from '../../arena/metrics';
import { MetricsPlugin } from './MetricsPlugin';

describe('MetricsPlugin', () => {
  let plugin: MetricsPlugin;
  let context: PluginContext;

  beforeEach(() => {
    plugin = new MetricsPlugin();
    context = {
      providerId: 'test-provider',
      modelId: 'test-model',
      method: 'generateText',
      attempt: 0,
      metadata: {},
    };
    globalMetricsTracker.clear();
  });

  describe('constructor', () => {
    it('creates plugin with default options', () => {
      expect(plugin.name).toBe('metrics');
      expect(plugin.description).toBe('Tracks performance metrics for AI requests');
    });

    it('accepts custom options', () => {
      const customPlugin = new MetricsPlugin({
        trackGlobally: false,
        trackStreaming: false,
      });
      expect(customPlugin.name).toBe('metrics');
    });
  });

  describe('onRequestStart', () => {
    it('starts metrics collection', async () => {
      await plugin.onRequestStart(context);

      expect(context.metadata.metricsCollector).toBeDefined();
      expect(context.metadata.requestStartTime).toBeDefined();
    });

    it('resets previous collector state', async () => {
      await plugin.onRequestStart(context);
      const _collector = context.metadata.metricsCollector;

      // Start a second request with same context keys
      const context2 = {
        ...context,
        metadata: {},
      };
      await plugin.onRequestStart(context2);

      // Should still work
      expect((context2.metadata as Record<string, unknown>).metricsCollector).toBeDefined();
    });
  });

  describe('onStream', () => {
    it('records first token on first chunk', async () => {
      await plugin.onRequestStart(context);
      const chunk = { text: 'Hello' };

      const result = await plugin.onStream(chunk, context);

      expect(result).toBe(chunk);
      expect(context.metadata.firstTokenRecorded).toBe(true);
    });

    it('does not record on subsequent chunks', async () => {
      await plugin.onRequestStart(context);
      context.metadata.firstTokenRecorded = true;

      const chunk = { text: 'World' };
      await plugin.onStream(chunk, context);

      // Should still be true, not recorded again
      expect(context.metadata.firstTokenRecorded).toBe(true);
    });

    it('skips tracking when trackStreaming is false', async () => {
      const noStreamPlugin = new MetricsPlugin({ trackStreaming: false });
      await noStreamPlugin.onRequestStart(context);

      const chunk = { text: 'Hello' };
      await noStreamPlugin.onStream(chunk, context);

      expect(context.metadata.firstTokenRecorded).toBeUndefined();
    });

    it('handles missing collector', async () => {
      const chunk = { text: 'Hello' };
      const result = await plugin.onStream(chunk, context);

      expect(result).toBe(chunk);
    });
  });

  describe('onRequestEnd', () => {
    it('records token usage from result', async () => {
      await plugin.onRequestStart(context);

      const result = {
        text: 'response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
      await plugin.onRequestEnd(context, result);

      expect(context.metadata.metrics).toBeDefined();
      expect((context.metadata.metrics as Record<string, unknown>).promptTokens).toBe(10);
      expect((context.metadata.metrics as Record<string, unknown>).completionTokens).toBe(20);
    });

    it('tracks globally by default', async () => {
      await plugin.onRequestStart(context);
      await plugin.onRequestEnd(context, { text: 'done' });

      const metrics = globalMetricsTracker.getMetrics('test-provider', 'test-model');
      expect(metrics).toHaveLength(1);
    });

    it('does not track globally when disabled', async () => {
      const localPlugin = new MetricsPlugin({ trackGlobally: false });
      await localPlugin.onRequestStart(context);
      await localPlugin.onRequestEnd(context, { text: 'done' });

      const metrics = globalMetricsTracker.getMetrics('test-provider', 'test-model');
      expect(metrics).toBeUndefined();
    });

    it('calls onMetrics callback', async () => {
      const onMetrics = vi.fn();
      const callbackPlugin = new MetricsPlugin({ onMetrics });

      await callbackPlugin.onRequestStart(context);
      await callbackPlugin.onRequestEnd(context, { text: 'done' });

      expect(onMetrics).toHaveBeenCalledWith(expect.any(Object), context);
    });

    it('handles missing collector', async () => {
      await plugin.onRequestEnd(context, { text: 'done' });

      expect(context.metadata.metrics).toBeUndefined();
    });

    it('handles result without usage', async () => {
      await plugin.onRequestStart(context);
      await plugin.onRequestEnd(context, { text: 'no usage' });

      expect(context.metadata.metrics).toBeDefined();
      expect((context.metadata.metrics as Record<string, unknown>).promptTokens).toBeUndefined();
    });
  });

  describe('onError', () => {
    it('records metrics with error flag', async () => {
      await plugin.onRequestStart(context);
      const error = new Error('test error');

      await plugin.onError(error, context);

      expect((context.metadata.metrics as Record<string, unknown>).failed).toBe(true);
      expect((context.metadata.metrics as Record<string, unknown>).error).toBe('test error');
    });

    it('tracks globally on error', async () => {
      await plugin.onRequestStart(context);
      await plugin.onError(new Error('test'), context);

      const metrics = globalMetricsTracker.getMetrics('test-provider', 'test-model');
      expect(metrics).toHaveLength(1);
    });

    it('calls onMetrics callback on error', async () => {
      const onMetrics = vi.fn();
      const callbackPlugin = new MetricsPlugin({ onMetrics });

      await callbackPlugin.onRequestStart(context);
      await callbackPlugin.onError(new Error('test'), context);

      expect(onMetrics).toHaveBeenCalled();
    });

    it('handles missing collector', async () => {
      await plugin.onError(new Error('test'), context);

      expect(context.metadata.metrics).toBeUndefined();
    });
  });

  describe('getMetrics', () => {
    it('returns global metrics by default', async () => {
      await plugin.onRequestStart(context);
      await plugin.onRequestEnd(context, { text: 'done' });

      const metrics = plugin.getMetrics('test-provider', 'test-model');
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics).toHaveLength(1);
    });

    it('returns local metrics when trackGlobally is false', async () => {
      const localPlugin = new MetricsPlugin({ trackGlobally: false });

      await localPlugin.onRequestStart(context);
      await localPlugin.onRequestEnd(context, { text: 'done' });

      const metrics = localPlugin.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
    });

    it('filters local metrics by providerId', async () => {
      const localPlugin = new MetricsPlugin({ trackGlobally: false });

      await localPlugin.onRequestStart(context);
      await localPlugin.onRequestEnd(context, { text: 'done' });

      const metrics = localPlugin.getMetrics('test-provider') as Record<string, unknown>;
      const keys = Object.keys(metrics);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys[0]).toContain('test-provider');
    });

    it('filters local metrics by modelId', async () => {
      const localPlugin = new MetricsPlugin({ trackGlobally: false });

      await localPlugin.onRequestStart(context);
      await localPlugin.onRequestEnd(context, { text: 'done' });

      const metrics = localPlugin.getMetrics(undefined, 'test-model') as Record<string, unknown>;
      const keys = Object.keys(metrics);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys[0]).toContain('test-model');
    });

    it('returns empty when no matches', async () => {
      const localPlugin = new MetricsPlugin({ trackGlobally: false });

      await localPlugin.onRequestStart(context);
      await localPlugin.onRequestEnd(context, { text: 'done' });

      const metrics = localPlugin.getMetrics('unknown-provider') as Record<string, unknown>;
      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });

  describe('clearMetrics', () => {
    it('clears local collectors', async () => {
      const localPlugin = new MetricsPlugin({ trackGlobally: false });

      await localPlugin.onRequestStart(context);
      await localPlugin.onRequestEnd(context, { text: 'done' });

      localPlugin.clearMetrics();

      const metrics = localPlugin.getMetrics() as Record<string, unknown>;
      expect(Object.keys(metrics)).toHaveLength(0);
    });

    it('clears global metrics when trackGlobally is true', async () => {
      await plugin.onRequestStart(context);
      await plugin.onRequestEnd(context, { text: 'done' });

      plugin.clearMetrics();

      const globalMetrics = globalMetricsTracker.getMetrics() as Map<string, unknown>;
      expect(globalMetrics.size).toBe(0);
    });
  });

  describe('multiple requests', () => {
    it('tracks multiple requests separately', async () => {
      await plugin.onRequestStart(context);
      await plugin.onRequestEnd(context, { usage: { totalTokens: 10 } });

      const context2 = { ...context, metadata: {} };
      await plugin.onRequestStart(context2);
      await plugin.onRequestEnd(context2, { usage: { totalTokens: 20 } });

      const metrics = globalMetricsTracker.getMetrics('test-provider', 'test-model');
      expect(metrics).toHaveLength(2);
    });

    it('tracks different models separately', async () => {
      await plugin.onRequestStart(context);
      await plugin.onRequestEnd(context, { text: 'done' });

      const context2 = { ...context, modelId: 'other-model', metadata: {} };
      await plugin.onRequestStart(context2);
      await plugin.onRequestEnd(context2, { text: 'done' });

      const metrics1 = globalMetricsTracker.getMetrics('test-provider', 'test-model');
      const metrics2 = globalMetricsTracker.getMetrics('test-provider', 'other-model');

      expect(metrics1).toHaveLength(1);
      expect(metrics2).toHaveLength(1);
    });
  });
});
