import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
  get length() {
    return Object.keys(mockLocalStorage.store).length;
  },
  key: vi.fn((index: number) => Object.keys(mockLocalStorage.store)[index] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import store after mocking
import {
  type ApiKeyRecord,
  createSettingsStore,
  type SettingsTab,
  settingsSelectors,
} from './settings-store';

describe('settings-store', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should have default activeTab as "general"', () => {
      const store = createSettingsStore();
      expect(store.getState().activeTab).toBe('general');
    });

    it('should have telemetryEnabled as false', () => {
      const store = createSettingsStore();
      expect(store.getState().telemetryEnabled).toBe(false);
    });

    it('should have apiKeysLoaded as false', () => {
      const store = createSettingsStore();
      expect(store.getState().apiKeysLoaded).toBe(false);
    });

    it('should have empty savedApiKeys array', () => {
      const store = createSettingsStore();
      expect(store.getState().savedApiKeys).toEqual([]);
    });

    it('should accept initial state', () => {
      const store = createSettingsStore({
        activeTab: 'provider',
        telemetryEnabled: true,
      });

      expect(store.getState().activeTab).toBe('provider');
      expect(store.getState().telemetryEnabled).toBe(true);
    });
  });

  describe('setActiveTab', () => {
    const tabs: SettingsTab[] = ['general', 'provider', 'system-model', 'storage', 'help', 'about'];

    it.each(tabs)('should set activeTab to "%s"', (tab) => {
      const store = createSettingsStore();

      store.getState().setActiveTab(tab);

      expect(store.getState().activeTab).toBe(tab);
    });
  });

  describe('setTelemetryEnabled', () => {
    it('should enable telemetry', () => {
      const store = createSettingsStore();

      store.getState().setTelemetryEnabled(true);

      expect(store.getState().telemetryEnabled).toBe(true);
    });

    it('should disable telemetry', () => {
      const store = createSettingsStore({ telemetryEnabled: true });

      store.getState().setTelemetryEnabled(false);

      expect(store.getState().telemetryEnabled).toBe(false);
    });
  });

  describe('API key management', () => {
    const mockApiKey: ApiKeyRecord = {
      id: 'key-1',
      providerName: 'OpenAI',
      enabled: true,
      configSource: 'user',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      hasApiKey: true,
    };

    describe('addApiKey', () => {
      it('should add new API key', () => {
        const store = createSettingsStore();

        store.getState().addApiKey(mockApiKey);

        expect(store.getState().savedApiKeys).toHaveLength(1);
        expect(store.getState().savedApiKeys[0]).toEqual(mockApiKey);
      });

      it('should update existing key with same provider name', () => {
        const store = createSettingsStore();

        store.getState().addApiKey(mockApiKey);

        const updatedKey: ApiKeyRecord = {
          ...mockApiKey,
          id: 'key-2',
          enabled: false,
        };

        store.getState().addApiKey(updatedKey);

        expect(store.getState().savedApiKeys).toHaveLength(1);
        expect(store.getState().savedApiKeys[0]?.enabled).toBe(false);
        expect(store.getState().savedApiKeys[0]?.id).toBe('key-2');
      });

      it('should be case-insensitive for provider name matching', () => {
        const store = createSettingsStore();

        store.getState().addApiKey(mockApiKey);

        const updatedKey: ApiKeyRecord = {
          ...mockApiKey,
          providerName: 'openai', // lowercase
          enabled: false,
        };

        store.getState().addApiKey(updatedKey);

        expect(store.getState().savedApiKeys).toHaveLength(1);
        expect(store.getState().savedApiKeys[0]?.enabled).toBe(false);
      });

      it('should add multiple keys for different providers', () => {
        const store = createSettingsStore();

        store.getState().addApiKey(mockApiKey);
        store.getState().addApiKey({
          ...mockApiKey,
          id: 'key-2',
          providerName: 'Anthropic',
        });

        expect(store.getState().savedApiKeys).toHaveLength(2);
      });
    });

    describe('updateApiKey', () => {
      it('should update API key by id', () => {
        const store = createSettingsStore();
        store.getState().addApiKey(mockApiKey);

        store.getState().updateApiKey('key-1', { enabled: false });

        const key = store.getState().savedApiKeys[0];
        expect(key?.enabled).toBe(false);
      });

      it('should update updatedAt timestamp', () => {
        const store = createSettingsStore();
        store.getState().addApiKey(mockApiKey);

        const beforeUpdate = store.getState().savedApiKeys[0]?.updatedAt;

        // Small delay to ensure different timestamp
        store.getState().updateApiKey('key-1', { enabled: false });

        const afterUpdate = store.getState().savedApiKeys[0]?.updatedAt;
        expect(afterUpdate).not.toBe(beforeUpdate);
      });

      it('should not modify other keys', () => {
        const store = createSettingsStore();
        store.getState().addApiKey(mockApiKey);
        store.getState().addApiKey({
          ...mockApiKey,
          id: 'key-2',
          providerName: 'Anthropic',
        });

        store.getState().updateApiKey('key-1', { enabled: false });

        const key2 = store.getState().savedApiKeys.find((k) => k.id === 'key-2');
        expect(key2?.enabled).toBe(true);
      });

      it('should do nothing for non-existent id', () => {
        const store = createSettingsStore();
        store.getState().addApiKey(mockApiKey);

        store.getState().updateApiKey('non-existent', { enabled: false });

        expect(store.getState().savedApiKeys[0]?.enabled).toBe(true);
      });
    });

    describe('removeApiKey', () => {
      it('should remove API key by id', () => {
        const store = createSettingsStore();
        store.getState().addApiKey(mockApiKey);

        store.getState().removeApiKey('key-1');

        expect(store.getState().savedApiKeys).toHaveLength(0);
      });

      it('should only remove specified key', () => {
        const store = createSettingsStore();
        store.getState().addApiKey(mockApiKey);
        store.getState().addApiKey({
          ...mockApiKey,
          id: 'key-2',
          providerName: 'Anthropic',
        });

        store.getState().removeApiKey('key-1');

        expect(store.getState().savedApiKeys).toHaveLength(1);
        expect(store.getState().savedApiKeys[0]?.id).toBe('key-2');
      });

      it('should do nothing for non-existent id', () => {
        const store = createSettingsStore();
        store.getState().addApiKey(mockApiKey);

        store.getState().removeApiKey('non-existent');

        expect(store.getState().savedApiKeys).toHaveLength(1);
      });
    });

    describe('setSavedApiKeys', () => {
      it('should set all API keys', () => {
        const store = createSettingsStore();
        const keys: ApiKeyRecord[] = [
          mockApiKey,
          { ...mockApiKey, id: 'key-2', providerName: 'Anthropic' },
        ];

        store.getState().setSavedApiKeys(keys);

        expect(store.getState().savedApiKeys).toHaveLength(2);
        expect(store.getState().savedApiKeys).toEqual(keys);
      });

      it('should replace existing keys', () => {
        const store = createSettingsStore();
        store.getState().addApiKey(mockApiKey);

        store.getState().setSavedApiKeys([]);

        expect(store.getState().savedApiKeys).toHaveLength(0);
      });
    });

    describe('setApiKeysLoaded', () => {
      it('should set apiKeysLoaded flag', () => {
        const store = createSettingsStore();

        store.getState().setApiKeysLoaded(true);

        expect(store.getState().apiKeysLoaded).toBe(true);
      });
    });
  });

  describe('loadApiKeys (async)', () => {
    it('should load API keys successfully', async () => {
      const store = createSettingsStore();
      const mockKeys: ApiKeyRecord[] = [
        {
          id: 'key-1',
          providerName: 'OpenAI',
          enabled: true,
          configSource: 'user',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ keys: mockKeys }),
      });

      await store.getState().loadApiKeys();

      expect(mockFetch).toHaveBeenCalledWith('/api/settings/api-keys');
      expect(store.getState().savedApiKeys).toEqual(mockKeys);
      expect(store.getState().apiKeysLoaded).toBe(true);
    });

    it('should not reload if already loaded', async () => {
      const store = createSettingsStore({ apiKeysLoaded: true });

      await store.getState().loadApiKeys();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle empty response', async () => {
      const store = createSettingsStore();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ keys: undefined }),
      });

      await store.getState().loadApiKeys();

      expect(store.getState().savedApiKeys).toEqual([]);
      expect(store.getState().apiKeysLoaded).toBe(true);
    });

    it('should handle non-ok response', async () => {
      const store = createSettingsStore();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await store.getState().loadApiKeys();

      expect(store.getState().apiKeysLoaded).toBe(true);
      expect(store.getState().savedApiKeys).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const store = createSettingsStore();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await store.getState().loadApiKeys();

      expect(store.getState().apiKeysLoaded).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('persistence', () => {
    it('should persist telemetryEnabled to localStorage', async () => {
      const store = createSettingsStore();

      store.getState().setTelemetryEnabled(true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const storedValue = mockLocalStorage.store['lmring-settings'];
      expect(storedValue).toBeDefined();
      const parsed = JSON.parse(storedValue as string);
      expect(parsed.state.telemetryEnabled).toBe(true);
    });

    it('should persist activeTab to localStorage', async () => {
      const store = createSettingsStore();

      store.getState().setActiveTab('provider');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const storedValue = mockLocalStorage.store['lmring-settings'];
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        expect(parsed.state.activeTab).toBe('provider');
      }
    });

    it('should NOT persist savedApiKeys or apiKeysLoaded', async () => {
      const store = createSettingsStore();

      store.getState().addApiKey({
        id: 'key-1',
        providerName: 'OpenAI',
        enabled: true,
        configSource: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      store.getState().setApiKeysLoaded(true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const storedValue = mockLocalStorage.store['lmring-settings'];
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        expect(parsed.state.savedApiKeys).toBeUndefined();
        expect(parsed.state.apiKeysLoaded).toBeUndefined();
      }
    });

    it('should restore persisted state from localStorage', async () => {
      mockLocalStorage.store['lmring-settings'] = JSON.stringify({
        state: {
          telemetryEnabled: true,
          activeTab: 'storage',
        },
        version: 0,
      });

      const store = createSettingsStore();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(store.getState().telemetryEnabled).toBe(true);
      expect(store.getState().activeTab).toBe('storage');
    });
  });

  describe('selectors', () => {
    it('activeTab selector should return activeTab', () => {
      const store = createSettingsStore({ activeTab: 'help' });
      expect(settingsSelectors.activeTab(store.getState())).toBe('help');
    });

    it('telemetryEnabled selector should return telemetryEnabled', () => {
      const store = createSettingsStore({ telemetryEnabled: true });
      expect(settingsSelectors.telemetryEnabled(store.getState())).toBe(true);
    });

    it('apiKeysLoaded selector should return apiKeysLoaded', () => {
      const store = createSettingsStore({ apiKeysLoaded: true });
      expect(settingsSelectors.apiKeysLoaded(store.getState())).toBe(true);
    });

    it('savedApiKeys selector should return savedApiKeys', () => {
      const keys: ApiKeyRecord[] = [
        {
          id: 'key-1',
          providerName: 'OpenAI',
          enabled: true,
          configSource: 'user',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      const store = createSettingsStore({ savedApiKeys: keys });
      expect(settingsSelectors.savedApiKeys(store.getState())).toEqual(keys);
    });
  });
});
