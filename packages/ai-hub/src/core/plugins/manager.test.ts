import { beforeEach, describe, expect, it } from 'vitest';
import { AiPlugin, type PluginContext } from '../../types/plugin';
import { PluginError } from '../../utils/errors';
import { PluginManager } from './manager';

class TestPlugin extends AiPlugin {
  name = 'TestPlugin';
  initCalled = false;

  async onInit(_context: PluginContext): Promise<void> {
    this.initCalled = true;
  }

  async transformParams(params: unknown, _context: PluginContext): Promise<unknown> {
    return params;
  }
}

class PrePlugin extends AiPlugin {
  name = 'PrePlugin';
  enforce = 'pre' as const;
}

class PostPlugin extends AiPlugin {
  name = 'PostPlugin';
  enforce = 'post' as const;
}

class FailingInitPlugin extends AiPlugin {
  name = 'FailingInit';

  async onInit(): Promise<void> {
    throw new Error('Init failed');
  }
}

describe('PluginManager', () => {
  let manager: PluginManager;
  let context: PluginContext;

  beforeEach(() => {
    manager = new PluginManager();
    context = {
      providerId: 'test',
      modelId: 'model',
      method: 'test',
      attempt: 0,
      metadata: {},
    };
  });

  describe('constructor', () => {
    it('creates manager with no plugins', () => {
      expect(manager.getAll()).toEqual([]);
    });

    it('creates manager with initial plugins', () => {
      const plugin = new TestPlugin();
      const mgr = new PluginManager([plugin]);
      expect(mgr.getAll()).toHaveLength(1);
    });
  });

  describe('register', () => {
    it('registers a plugin', () => {
      const plugin = new TestPlugin();
      manager.register(plugin);
      expect(manager.has('TestPlugin')).toBe(true);
    });

    it('throws if plugin has no name', () => {
      const plugin = { name: '' } as AiPlugin;
      expect(() => manager.register(plugin)).toThrow(PluginError);
      expect(() => manager.register(plugin)).toThrow('Plugin must have a name');
    });

    it('throws on duplicate registration', () => {
      const plugin = new TestPlugin();
      manager.register(plugin);
      expect(() => manager.register(plugin)).toThrow(PluginError);
      expect(() => manager.register(plugin)).toThrow('already registered');
    });

    it('sorts plugins after registration', () => {
      const post = new PostPlugin();
      const pre = new PrePlugin();
      const normal = new TestPlugin();

      manager.register(post);
      manager.register(normal);
      manager.register(pre);

      const all = manager.getAll();
      expect(all[0]?.name).toBe('PrePlugin');
      expect(all[1]?.name).toBe('TestPlugin');
      expect(all[2]?.name).toBe('PostPlugin');
    });
  });

  describe('registerBatch', () => {
    it('registers multiple plugins', () => {
      const plugins = [new TestPlugin(), new PrePlugin()];
      manager.registerBatch(plugins);
      expect(manager.getAll()).toHaveLength(2);
    });
  });

  describe('unregister', () => {
    it('removes a plugin by name', () => {
      const plugin = new TestPlugin();
      manager.register(plugin);
      manager.unregister('TestPlugin');
      expect(manager.has('TestPlugin')).toBe(false);
    });

    it('does nothing if plugin not found', () => {
      expect(() => manager.unregister('NonExistent')).not.toThrow();
    });
  });

  describe('get', () => {
    it('returns plugin by name', () => {
      const plugin = new TestPlugin();
      manager.register(plugin);
      expect(manager.get('TestPlugin')).toBe(plugin);
    });

    it('returns undefined for unknown plugin', () => {
      expect(manager.get('Unknown')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('returns true if plugin exists', () => {
      manager.register(new TestPlugin());
      expect(manager.has('TestPlugin')).toBe(true);
    });

    it('returns false if plugin does not exist', () => {
      expect(manager.has('Unknown')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('returns all plugins sorted', () => {
      manager.register(new PostPlugin());
      manager.register(new TestPlugin());
      manager.register(new PrePlugin());

      const all = manager.getAll();
      expect(all).toHaveLength(3);
      expect(all[0]?.enforce).toBe('pre');
      expect(all[1]?.enforce).toBeUndefined();
      expect(all[2]?.enforce).toBe('post');
    });

    it('returns copy of array', () => {
      manager.register(new TestPlugin());
      const all1 = manager.getAll();
      const all2 = manager.getAll();
      expect(all1).not.toBe(all2);
    });
  });

  describe('getByEnforce', () => {
    it('returns plugins with pre enforce', () => {
      manager.register(new PrePlugin());
      manager.register(new TestPlugin());
      manager.register(new PostPlugin());

      const pre = manager.getByEnforce('pre');
      expect(pre).toHaveLength(1);
      expect(pre[0]?.name).toBe('PrePlugin');
    });

    it('returns plugins with post enforce', () => {
      manager.register(new PrePlugin());
      manager.register(new PostPlugin());

      const post = manager.getByEnforce('post');
      expect(post).toHaveLength(1);
      expect(post[0]?.name).toBe('PostPlugin');
    });

    it('returns plugins with no enforce (undefined)', () => {
      manager.register(new PrePlugin());
      manager.register(new TestPlugin());

      const normal = manager.getByEnforce(undefined);
      expect(normal).toHaveLength(1);
      expect(normal[0]?.name).toBe('TestPlugin');
    });
  });

  describe('clear', () => {
    it('removes all plugins', () => {
      manager.register(new TestPlugin());
      manager.register(new PrePlugin());
      manager.clear();
      expect(manager.getAll()).toHaveLength(0);
    });
  });

  describe('initialize', () => {
    it('calls onInit for all plugins', async () => {
      const plugin1 = new TestPlugin();
      plugin1.name = 'Plugin1';
      const plugin2 = new TestPlugin();
      plugin2.name = 'Plugin2';

      manager.register(plugin1);
      manager.register(plugin2);

      await manager.initialize(context);

      expect(plugin1.initCalled).toBe(true);
      expect(plugin2.initCalled).toBe(true);
    });

    it('throws PluginError if init fails', async () => {
      manager.register(new FailingInitPlugin());

      await expect(manager.initialize(context)).rejects.toThrow(PluginError);
    });

    it('includes plugin name in error', async () => {
      manager.register(new FailingInitPlugin());

      try {
        await manager.initialize(context);
      } catch (e) {
        expect((e as PluginError).pluginName).toBe('FailingInit');
        expect((e as PluginError).hook).toBe('onInit');
      }
    });
  });

  describe('getPluginsWithHook', () => {
    it('returns plugins that have the specified hook', () => {
      const plugin = new TestPlugin();
      manager.register(plugin);

      const withTransform = manager.getPluginsWithHook('transformParams');
      expect(withTransform).toHaveLength(1);
    });

    it('returns empty array if no plugins registered', () => {
      const withStream = manager.getPluginsWithHook('onStream');
      expect(withStream).toHaveLength(0);
    });

    it('filters by function type', () => {
      manager.register(new TestPlugin());

      const withName = manager.getPluginsWithHook('name');
      expect(withName).toHaveLength(0);
    });
  });

  describe('sorting order', () => {
    it('maintains pre -> normal -> post order', () => {
      const normal1 = new TestPlugin();
      normal1.name = 'Normal1';
      const normal2 = new TestPlugin();
      normal2.name = 'Normal2';
      const pre1 = new PrePlugin();
      pre1.name = 'Pre1';
      const pre2 = new PrePlugin();
      pre2.name = 'Pre2';
      const post1 = new PostPlugin();
      post1.name = 'Post1';

      manager.register(post1);
      manager.register(normal1);
      manager.register(pre1);
      manager.register(normal2);
      manager.register(pre2);

      const all = manager.getAll();
      expect(all[0]?.enforce).toBe('pre');
      expect(all[1]?.enforce).toBe('pre');
      expect(all[2]?.enforce).toBeUndefined();
      expect(all[3]?.enforce).toBeUndefined();
      expect(all[4]?.enforce).toBe('post');
    });
  });
});
