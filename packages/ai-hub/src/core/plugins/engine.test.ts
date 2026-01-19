import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiPlugin, type PluginContext } from '../../types/plugin';
import { PluginError } from '../../utils/errors';
import { PluginEngine } from './engine';

class TestPlugin extends AiPlugin {
  name = 'TestPlugin';
  initCalled = false;
  transformParamsValue: unknown = null;
  transformResultValue: unknown = null;
  onRequestStartCalled = false;
  onRequestEndCalled = false;
  onErrorCalled = false;
  onStreamValue: unknown = null;

  async onInit(_context: PluginContext): Promise<void> {
    this.initCalled = true;
  }

  async transformParams(params: unknown, _context: PluginContext): Promise<unknown> {
    this.transformParamsValue = params;
    return { ...(params as object), transformed: true };
  }

  async transformResult(result: unknown, _context: PluginContext): Promise<unknown> {
    this.transformResultValue = result;
    return { ...(result as object), resultTransformed: true };
  }

  async onRequestStart(_context: PluginContext): Promise<void> {
    this.onRequestStartCalled = true;
  }

  async onRequestEnd(_context: PluginContext, _result: unknown): Promise<void> {
    this.onRequestEndCalled = true;
  }

  async onError(_error: Error, _context: PluginContext): Promise<void> {
    this.onErrorCalled = true;
  }

  async onStream(chunk: unknown, _context: PluginContext): Promise<unknown> {
    this.onStreamValue = chunk;
    return { ...(chunk as object), streamTransformed: true };
  }
}

class ThrowingPlugin extends AiPlugin {
  name = 'ThrowingPlugin';

  async transformParams(_params: unknown, _context: PluginContext): Promise<unknown> {
    throw new Error('Transform failed');
  }
}

describe('PluginEngine', () => {
  let engine: PluginEngine;
  let plugin: TestPlugin;
  let context: PluginContext;

  beforeEach(() => {
    plugin = new TestPlugin();
    engine = new PluginEngine([plugin]);
    context = {
      providerId: 'test-provider',
      modelId: 'test-model',
      method: 'generateText',
      attempt: 0,
      metadata: {},
    };
  });

  describe('constructor', () => {
    it('creates engine with empty plugins', () => {
      const emptyEngine = new PluginEngine();
      expect(emptyEngine.getPlugins()).toEqual([]);
    });

    it('creates engine with plugins', () => {
      expect(engine.getPlugins()).toHaveLength(1);
    });
  });

  describe('addPlugin', () => {
    it('adds plugin to engine', () => {
      const newPlugin = new TestPlugin();
      newPlugin.name = 'NewPlugin';
      engine.addPlugin(newPlugin);
      expect(engine.getPlugins()).toHaveLength(2);
    });
  });

  describe('removePlugin', () => {
    it('removes plugin by name', () => {
      engine.removePlugin('TestPlugin');
      expect(engine.getPlugins()).toHaveLength(0);
    });
  });

  describe('executeSequential', () => {
    it('executes transformParams sequentially', async () => {
      const result = await engine.executeSequential('transformParams', { input: 'test' }, context);
      expect(result).toEqual({ input: 'test', transformed: true });
      expect(plugin.transformParamsValue).toEqual({ input: 'test' });
    });

    it('executes transformResult sequentially', async () => {
      const result = await engine.executeSequential('transformResult', { output: 'test' }, context);
      expect(result).toEqual({ output: 'test', resultTransformed: true });
    });

    it('chains multiple plugins', async () => {
      const plugin2 = new TestPlugin();
      plugin2.name = 'Plugin2';
      engine.addPlugin(plugin2);

      const result = await engine.executeSequential('transformParams', { input: 'test' }, context);

      expect(result).toEqual({ input: 'test', transformed: true });
      expect(plugin.transformParamsValue).toEqual({ input: 'test' });
      expect(plugin2.transformParamsValue).toEqual({ input: 'test', transformed: true });
    });

    it('throws PluginError on failure', async () => {
      const throwingEngine = new PluginEngine([new ThrowingPlugin()]);

      await expect(
        throwingEngine.executeSequential('transformParams', {}, context),
      ).rejects.toThrow(PluginError);
    });

    it('includes plugin name and hook in PluginError', async () => {
      const throwingEngine = new PluginEngine([new ThrowingPlugin()]);

      try {
        await throwingEngine.executeSequential('transformParams', {}, context);
      } catch (e) {
        expect(e).toBeInstanceOf(PluginError);
        expect((e as PluginError).pluginName).toBe('ThrowingPlugin');
        expect((e as PluginError).hook).toBe('transformParams');
      }
    });
  });

  describe('executeParallel', () => {
    it('executes onRequestStart for all plugins', async () => {
      const plugin2 = new TestPlugin();
      plugin2.name = 'Plugin2';
      engine.addPlugin(plugin2);

      await engine.executeParallel('onRequestStart', context);

      expect(plugin.onRequestStartCalled).toBe(true);
      expect(plugin2.onRequestStartCalled).toBe(true);
    });

    it('executes onRequestEnd with result', async () => {
      await engine.executeParallel('onRequestEnd', context, { data: 'result' });
      expect(plugin.onRequestEndCalled).toBe(true);
    });

    it('executes onError with error', async () => {
      const error = new Error('test error');
      await engine.executeParallel('onError', context, error);
      expect(plugin.onErrorCalled).toBe(true);
    });

    it('does not throw when plugin fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class FailingParallelPlugin extends AiPlugin {
        name = 'FailingParallel';
        async onRequestStart(): Promise<void> {
          throw new Error('Parallel fail');
        }
      }

      const failingEngine = new PluginEngine([new FailingParallelPlugin()]);
      await expect(
        failingEngine.executeParallel('onRequestStart', context),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('executeStream', () => {
    it('transforms stream chunks', async () => {
      const result = await engine.executeStream('onStream', { chunk: 'data' }, context);
      expect(result).toEqual({ chunk: 'data', streamTransformed: true });
    });

    it('chains stream transformations', async () => {
      const plugin2 = new TestPlugin();
      plugin2.name = 'Plugin2';
      engine.addPlugin(plugin2);

      const result = await engine.executeStream('onStream', { chunk: 'data' }, context);

      expect(result).toEqual({ chunk: 'data', streamTransformed: true });
    });

    it('continues with original chunk on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class FailingStreamPlugin extends AiPlugin {
        name = 'FailingStream';
        async onStream(): Promise<unknown> {
          throw new Error('Stream fail');
        }
      }

      const failingEngine = new PluginEngine([new FailingStreamPlugin()]);
      const result = await failingEngine.executeStream('onStream', { chunk: 'data' }, context);

      expect(result).toEqual({ chunk: 'data' });
      consoleSpy.mockRestore();
    });
  });

  describe('initialize', () => {
    it('calls onInit for all plugins', async () => {
      const plugin2 = new TestPlugin();
      plugin2.name = 'Plugin2';
      engine.addPlugin(plugin2);

      await engine.initialize(context);

      expect(plugin.initCalled).toBe(true);
      expect(plugin2.initCalled).toBe(true);
    });
  });

  describe('executeLifecycle', () => {
    it('executes full lifecycle', async () => {
      const executor = vi.fn().mockResolvedValue({ result: 'success' });

      const result = await engine.executeLifecycle('generateText', { input: 'test' }, executor, {
        providerId: 'test',
        modelId: 'model',
      });

      expect(plugin.initCalled).toBe(true);
      expect(plugin.transformParamsValue).toBeDefined();
      expect(plugin.onRequestStartCalled).toBe(true);
      expect(plugin.onRequestEndCalled).toBe(true);
      expect(result).toEqual({ result: 'success', resultTransformed: true });
    });

    it('calls onError on executor failure', async () => {
      const error = new Error('Executor failed');
      const executor = vi.fn().mockRejectedValue(error);

      await expect(engine.executeLifecycle('generateText', {}, executor, context)).rejects.toThrow(
        'Executor failed',
      );

      expect(plugin.onErrorCalled).toBe(true);
    });

    it('uses default context values', async () => {
      const executor = vi.fn().mockResolvedValue({});

      await engine.executeLifecycle('test', {}, executor);

      expect(executor).toHaveBeenCalled();
    });

    it('transforms params before executor', async () => {
      const executor = vi.fn().mockResolvedValue({});

      await engine.executeLifecycle('test', { original: true }, executor, context);

      expect(executor).toHaveBeenCalledWith({ original: true, transformed: true });
    });

    it('transforms result after executor', async () => {
      const executor = vi.fn().mockResolvedValue({ output: 'data' });

      const result = await engine.executeLifecycle('test', {}, executor, context);

      expect(result).toEqual({ output: 'data', resultTransformed: true });
    });
  });

  describe('getPlugins', () => {
    it('returns all registered plugins', () => {
      const plugins = engine.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0]?.name).toBe('TestPlugin');
    });
  });
});
