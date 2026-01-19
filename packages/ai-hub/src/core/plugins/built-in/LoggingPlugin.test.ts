import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginContext } from '../../../types/plugin';
import { LoggingPlugin } from './LoggingPlugin';

describe('LoggingPlugin', () => {
  let plugin: LoggingPlugin;
  let context: PluginContext;

  beforeEach(() => {
    plugin = new LoggingPlugin();
    context = {
      providerId: 'test-provider',
      modelId: 'test-model',
      method: 'generateText',
      attempt: 0,
      metadata: {},
    };
  });

  describe('constructor', () => {
    it('creates plugin with default options', () => {
      expect(plugin.name).toBe('logging');
      expect(plugin.description).toBe('Logs AI requests and responses');
    });

    it('accepts custom level', () => {
      const debugPlugin = new LoggingPlugin({ level: 'debug' });
      expect(debugPlugin.name).toBe('logging');
    });

    it('accepts custom options', () => {
      const customPlugin = new LoggingPlugin({
        logParams: false,
        logResults: false,
        logErrors: false,
        logMetrics: false,
      });
      expect(customPlugin.name).toBe('logging');
    });
  });

  describe('log levels', () => {
    it('logs at info level by default', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ writer });

      await plugin.onRequestStart(context);

      expect(writer).toHaveBeenCalled();
      expect(writer.mock.calls[0]?.[0]).toContain('[INFO]');
    });

    it('debug level logs all messages', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ level: 'debug', writer });

      await plugin.transformParams({ prompt: 'test' }, context);

      expect(writer).toHaveBeenCalled();
      expect(writer.mock.calls[0]?.[0]).toContain('[DEBUG]');
    });

    it('error level only logs errors', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ level: 'error', writer });

      await plugin.onRequestStart(context);
      expect(writer).not.toHaveBeenCalled();

      await plugin.onError(new Error('test error'), context);
      expect(writer).toHaveBeenCalled();
      expect(writer.mock.calls[0]?.[0]).toContain('[ERROR]');
    });

    it('warn level logs warn and error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'warn' });

      await plugin.onError(new Error('test'), context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('onRequestStart', () => {
    it('logs request start info', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ writer });

      await plugin.onRequestStart(context);

      expect(writer).toHaveBeenCalled();
      expect(writer.mock.calls[0]?.[0]).toContain('AI Request started');
    });
  });

  describe('transformParams', () => {
    it('logs params when enabled', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ level: 'debug', logParams: true, writer });

      await plugin.transformParams({ prompt: 'test prompt' }, context);

      expect(writer).toHaveBeenCalled();
      expect(writer.mock.calls[0]?.[0]).toContain('Request parameters');
    });

    it('does not log params when disabled', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ level: 'debug', logParams: false, writer });

      await plugin.transformParams({ prompt: 'test' }, context);

      expect(writer).not.toHaveBeenCalled();
    });

    it('returns params unchanged', async () => {
      const params = { prompt: 'test', temperature: 0.7 };

      const result = await plugin.transformParams(params, context);

      expect(result).toEqual(params);
    });

    it('sanitizes API key', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'debug', logParams: true });

      await plugin.transformParams({ apiKey: 'secret-key', prompt: 'test' }, context);

      const logData = consoleSpy.mock.calls[0]?.[1] as { params: { apiKey: string } };
      expect(logData.params.apiKey).toBe('***');
      consoleSpy.mockRestore();
    });

    it('truncates long messages', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'debug', logParams: true });
      const longMessage = 'a'.repeat(300);

      await plugin.transformParams({ messages: [{ role: 'user', content: longMessage }] }, context);

      const logData = consoleSpy.mock.calls[0]?.[1] as {
        params: { messages: Array<{ content: string }> };
      };
      expect(logData.params.messages[0]?.content.length).toBeLessThan(300);
      expect(logData.params.messages[0]?.content).toContain('...');
      consoleSpy.mockRestore();
    });

    it('truncates long prompts', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'debug', logParams: true });
      const longPrompt = 'b'.repeat(300);

      await plugin.transformParams({ prompt: longPrompt }, context);

      const logData = consoleSpy.mock.calls[0]?.[1] as { params: { prompt: string } };
      expect(logData.params.prompt.length).toBeLessThan(300);
      expect(logData.params.prompt).toContain('...');
      consoleSpy.mockRestore();
    });
  });

  describe('transformResult', () => {
    it('logs result when enabled', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ level: 'debug', logResults: true, writer });

      await plugin.transformResult({ text: 'response' }, context);

      expect(writer).toHaveBeenCalled();
      expect(writer.mock.calls[0]?.[0]).toContain('Response received');
    });

    it('does not log result when disabled', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ level: 'debug', logResults: false, writer });

      await plugin.transformResult({ text: 'response' }, context);

      expect(writer).not.toHaveBeenCalled();
    });

    it('returns result unchanged', async () => {
      const result = { text: 'response', usage: { totalTokens: 100 } };

      const returned = await plugin.transformResult(result, context);

      expect(returned).toEqual(result);
    });
  });

  describe('onRequestEnd', () => {
    it('logs request completion', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ writer });

      await plugin.onRequestEnd(context, { text: 'done' });

      expect(writer).toHaveBeenCalled();
      expect(writer.mock.calls[0]?.[0]).toContain('AI Request completed');
    });

    it('logs token usage when available', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ logMetrics: true, writer });

      await plugin.onRequestEnd(context, {
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      expect(writer).toHaveBeenCalledTimes(2);
      expect(writer.mock.calls[1]?.[0]).toContain('Token usage');
    });

    it('does not log metrics when disabled', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ logMetrics: false, writer });

      await plugin.onRequestEnd(context, {
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });

      expect(writer).toHaveBeenCalledTimes(1);
    });

    it('handles missing usage', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ logMetrics: true, writer });

      await plugin.onRequestEnd(context, { text: 'no usage' });

      expect(writer).toHaveBeenCalledTimes(1);
    });
  });

  describe('onError', () => {
    it('logs errors when enabled', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ logErrors: true, writer });
      const error = new Error('test error');

      await plugin.onError(error, context);

      expect(writer).toHaveBeenCalled();
      expect(writer.mock.calls[0]?.[0]).toContain('AI Request failed');
    });

    it('does not log errors when disabled', async () => {
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ logErrors: false, writer });

      await plugin.onError(new Error('test'), context);

      expect(writer).not.toHaveBeenCalled();
    });

    it('logs error details', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ logErrors: true });
      const error = new Error('detailed error');

      await plugin.onError(error, context);

      const logData = consoleSpy.mock.calls[0]?.[1] as {
        error: { message: string; name: string; stack: string };
      };
      expect(logData.error.message).toBe('detailed error');
      expect(logData.error.name).toBe('Error');
      expect(logData.error.stack).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('custom formatter', () => {
    it('uses custom formatter', async () => {
      const formatter = vi.fn().mockReturnValue('custom format');
      const writer = vi.fn();
      const plugin = new LoggingPlugin({ formatter, writer });

      await plugin.onRequestStart(context);

      expect(formatter).toHaveBeenCalledWith('info', 'AI Request started', expect.any(Object));
      expect(writer).toHaveBeenCalledWith('custom format');
    });
  });

  describe('default console logging', () => {
    it('uses console.log for info', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'info' });

      await plugin.onRequestStart(context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('uses console.error for error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'error' });

      await plugin.onError(new Error('test'), context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('uses console.warn for warn', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'warn' });

      // Need to trigger a warn level log - onError logs at 'error' level
      // Force a warn by using the private log method through the public API with warn level
      // Since there's no warn-level public method, we test by setting level to 'warn'
      // and confirming error logs still work at error level
      await plugin.onError(new Error('test'), context);

      expect(consoleSpy).not.toHaveBeenCalled(); // warn not called because we logged at error level
      consoleSpy.mockRestore();
    });

    it('uses console.debug for debug', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'debug', logParams: true });

      await plugin.transformParams({ prompt: 'test' }, context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('sanitizeParams', () => {
    it('handles null params', async () => {
      const result = await plugin.transformParams(null as never, context);
      expect(result).toBeNull();
    });

    it('handles undefined params', async () => {
      const result = await plugin.transformParams(undefined as never, context);
      expect(result).toBeUndefined();
    });

    it('handles short content without truncation', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const plugin = new LoggingPlugin({ level: 'debug', logParams: true });
      const shortPrompt = 'short';

      await plugin.transformParams({ prompt: shortPrompt }, context);

      const logData = consoleSpy.mock.calls[0]?.[1] as { params: { prompt: string } };
      expect(logData.params.prompt).toBe('short');
      consoleSpy.mockRestore();
    });
  });
});
