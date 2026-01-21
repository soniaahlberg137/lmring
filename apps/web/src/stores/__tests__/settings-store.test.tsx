import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ApiKeyRecord,
  createSettingsStore,
  SettingsStoreProvider,
  settingsSelectors,
  useSettingsStore,
} from '../settings-store';

const createMockApiKey = (overrides: Partial<ApiKeyRecord> = {}): ApiKeyRecord => ({
  id: 'test-id-1',
  providerName: 'openai',
  proxyUrl: '',
  enabled: false,
  configSource: 'manual',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  hasApiKey: true,
  isCustom: false,
  providerType: 'openai',
  ...overrides,
});

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SettingsStoreProvider>{children}</SettingsStoreProvider>;
  };
}

describe('settings-store', () => {
  describe('createSettingsStore', () => {
    it('should create store with default initial state', () => {
      const store = createSettingsStore();
      const state = store.getState();

      expect(state.activeTab).toBe('general');
      expect(state.telemetryEnabled).toBe(false);
      expect(state.apiKeysLoaded).toBe(false);
      expect(state.savedApiKeys).toEqual([]);
    });

    it('should create store with custom initial state', () => {
      const store = createSettingsStore({
        activeTab: 'provider',
        telemetryEnabled: true,
      });
      const state = store.getState();

      expect(state.activeTab).toBe('provider');
      expect(state.telemetryEnabled).toBe(true);
    });
  });

  describe('setSavedApiKeys', () => {
    it('should set saved API keys', () => {
      const store = createSettingsStore();
      const apiKeys = [
        createMockApiKey(),
        createMockApiKey({ id: 'test-id-2', providerName: 'anthropic' }),
      ];

      store.getState().setSavedApiKeys(apiKeys);

      expect(store.getState().savedApiKeys).toEqual(apiKeys);
      expect(store.getState().savedApiKeys).toHaveLength(2);
    });
  });

  describe('addApiKey', () => {
    it('should add new API key', () => {
      const store = createSettingsStore();
      const newKey = createMockApiKey();

      store.getState().addApiKey(newKey);

      expect(store.getState().savedApiKeys).toHaveLength(1);
      expect(store.getState().savedApiKeys[0]).toEqual(newKey);
    });

    it('should update existing API key by provider name', () => {
      const store = createSettingsStore();
      const existingKey = createMockApiKey({ enabled: false });
      const updatedKey = createMockApiKey({ id: 'new-id', enabled: true });

      store.getState().addApiKey(existingKey);
      store.getState().addApiKey(updatedKey);

      expect(store.getState().savedApiKeys).toHaveLength(1);
      expect(store.getState().savedApiKeys[0]?.enabled).toBe(true);
      expect(store.getState().savedApiKeys[0]?.id).toBe('new-id');
    });

    it('should match provider name case-insensitively', () => {
      const store = createSettingsStore();
      const existingKey = createMockApiKey({ providerName: 'OpenAI' });
      const updatedKey = createMockApiKey({ providerName: 'openai', enabled: true });

      store.getState().addApiKey(existingKey);
      store.getState().addApiKey(updatedKey);

      expect(store.getState().savedApiKeys).toHaveLength(1);
      expect(store.getState().savedApiKeys[0]?.enabled).toBe(true);
    });
  });

  describe('updateApiKey', () => {
    it('should update API key by id', () => {
      const store = createSettingsStore();
      const apiKey = createMockApiKey({ id: 'key-1', enabled: false });

      store.getState().setSavedApiKeys([apiKey]);
      store.getState().updateApiKey('key-1', { enabled: true });

      expect(store.getState().savedApiKeys[0]?.enabled).toBe(true);
    });

    it('should update updatedAt timestamp', () => {
      const store = createSettingsStore();
      const oldDate = '2024-01-01T00:00:00Z';
      const apiKey = createMockApiKey({ id: 'key-1', updatedAt: oldDate });

      store.getState().setSavedApiKeys([apiKey]);
      store.getState().updateApiKey('key-1', { enabled: true });

      expect(store.getState().savedApiKeys[0]?.updatedAt).not.toBe(oldDate);
    });

    it('should not modify other API keys', () => {
      const store = createSettingsStore();
      const key1 = createMockApiKey({ id: 'key-1', providerName: 'openai', enabled: false });
      const key2 = createMockApiKey({ id: 'key-2', providerName: 'anthropic', enabled: false });

      store.getState().setSavedApiKeys([key1, key2]);
      store.getState().updateApiKey('key-1', { enabled: true });

      expect(store.getState().savedApiKeys[0]?.enabled).toBe(true);
      expect(store.getState().savedApiKeys[1]?.enabled).toBe(false);
    });

    it('should do nothing if id not found', () => {
      const store = createSettingsStore();
      const apiKey = createMockApiKey({ id: 'key-1' });

      store.getState().setSavedApiKeys([apiKey]);
      store.getState().updateApiKey('non-existent', { enabled: true });

      expect(store.getState().savedApiKeys[0]?.enabled).toBe(false);
    });
  });

  describe('removeApiKey', () => {
    it('should remove API key by id', () => {
      const store = createSettingsStore();
      const key1 = createMockApiKey({ id: 'key-1', providerName: 'openai' });
      const key2 = createMockApiKey({ id: 'key-2', providerName: 'anthropic' });

      store.getState().setSavedApiKeys([key1, key2]);
      store.getState().removeApiKey('key-1');

      expect(store.getState().savedApiKeys).toHaveLength(1);
      expect(store.getState().savedApiKeys[0]?.providerName).toBe('anthropic');
    });

    it('should do nothing if id not found', () => {
      const store = createSettingsStore();
      const apiKey = createMockApiKey();

      store.getState().setSavedApiKeys([apiKey]);
      store.getState().removeApiKey('non-existent');

      expect(store.getState().savedApiKeys).toHaveLength(1);
    });
  });

  describe('loadApiKeys', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should load API keys from API', async () => {
      const mockKeys = [
        createMockApiKey(),
        createMockApiKey({ id: 'key-2', providerName: 'anthropic' }),
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ keys: mockKeys }),
      } as Response);

      const store = createSettingsStore();
      await store.getState().loadApiKeys();

      expect(store.getState().savedApiKeys).toEqual(mockKeys);
      expect(store.getState().apiKeysLoaded).toBe(true);
    });

    it('should not reload if already loaded', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ keys: [] }),
      } as Response);

      const store = createSettingsStore({ apiKeysLoaded: true });
      await store.getState().loadApiKeys();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      const store = createSettingsStore();
      await store.getState().loadApiKeys();

      expect(store.getState().savedApiKeys).toEqual([]);
      expect(store.getState().apiKeysLoaded).toBe(true);
    });

    it('should handle network error gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const store = createSettingsStore();
      await store.getState().loadApiKeys();

      expect(store.getState().savedApiKeys).toEqual([]);
      expect(store.getState().apiKeysLoaded).toBe(true);
    });
  });
});

describe('useSettingsStore hook', () => {
  it('should provide store state through hook', () => {
    const { result } = renderHook(() => useSettingsStore(settingsSelectors.apiKeysLoaded), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(false);
  });

  it('should update when state changes', () => {
    const { result } = renderHook(
      () => ({
        savedApiKeys: useSettingsStore(settingsSelectors.savedApiKeys),
        setSavedApiKeys: useSettingsStore((state) => state.setSavedApiKeys),
      }),
      { wrapper: createWrapper() },
    );

    const mockKeys = [createMockApiKey()];

    act(() => {
      result.current.setSavedApiKeys(mockKeys);
    });

    expect(result.current.savedApiKeys).toEqual(mockKeys);
  });
});

describe('Provider toggle scenario', () => {
  it('should toggle provider enabled state', () => {
    const store = createSettingsStore();
    const apiKey = createMockApiKey({ id: 'key-1', enabled: false });

    store.getState().setSavedApiKeys([apiKey]);

    // Enable provider
    store.getState().updateApiKey('key-1', { enabled: true });
    expect(store.getState().savedApiKeys[0]?.enabled).toBe(true);

    // Disable provider
    store.getState().updateApiKey('key-1', { enabled: false });
    expect(store.getState().savedApiKeys[0]?.enabled).toBe(false);
  });

  /**
   * 修改原因：原测试创建了两个独立的 wrapper，导致两个独立的 store 实例。
   * SettingsStoreProvider 在每个 wrapper 内部创建新的 store，所以它们不共享状态。
   * 修复：测试同一个 store 实例的行为，验证 store 状态更新后可以正确读取。
   */
  it('should sync enabled state when using same store instance', () => {
    // Both settings and arena page use the same store via SettingsStoreProvider
    // This test verifies the store itself works correctly
    const store = createSettingsStore();
    const apiKey = createMockApiKey({ id: 'key-1', enabled: false });

    // Simulate settings page setting initial keys
    store.getState().setSavedApiKeys([apiKey]);

    // Simulate settings page updating enabled state
    store.getState().updateApiKey('key-1', { enabled: true });

    // Reading from the same store should see updated state
    expect(store.getState().savedApiKeys[0]?.enabled).toBe(true);
  });

  it('should handle custom provider toggle', () => {
    const store = createSettingsStore();
    const customProvider = createMockApiKey({
      id: 'custom-key-1',
      providerName: 'my-custom-provider',
      isCustom: true,
      providerType: 'openai',
      enabled: true,
    });

    store.getState().setSavedApiKeys([customProvider]);

    // Disable custom provider
    store.getState().updateApiKey('custom-key-1', { enabled: false });

    expect(store.getState().savedApiKeys[0]?.enabled).toBe(false);
    expect(store.getState().savedApiKeys[0]?.isCustom).toBe(true);
  });
});

describe('settingsSelectors', () => {
  /**
   * 修改原因：settings-store 使用 persist middleware，partialize 只持久化 telemetryEnabled 和 activeTab。
   * 测试环境中 localStorage 可能返回默认值，覆盖 initState 传入的值。
   * 修复：使用 setActiveTab() 方法设置值，而不是依赖 initState。
   */
  it('should select activeTab', () => {
    const store = createSettingsStore();
    store.getState().setActiveTab('provider');
    expect(settingsSelectors.activeTab(store.getState())).toBe('provider');
  });

  /**
   * 修改原因：同上，persist middleware 会从 localStorage 读取初始值。
   * 修复：使用 setTelemetryEnabled() 方法设置值。
   */
  it('should select telemetryEnabled', () => {
    const store = createSettingsStore();
    store.getState().setTelemetryEnabled(true);
    expect(settingsSelectors.telemetryEnabled(store.getState())).toBe(true);
  });

  it('should select apiKeysLoaded', () => {
    const store = createSettingsStore({ apiKeysLoaded: true });
    expect(settingsSelectors.apiKeysLoaded(store.getState())).toBe(true);
  });

  it('should select savedApiKeys', () => {
    const store = createSettingsStore();
    const apiKeys = [createMockApiKey()];
    store.getState().setSavedApiKeys(apiKeys);
    expect(settingsSelectors.savedApiKeys(store.getState())).toEqual(apiKeys);
  });
});
