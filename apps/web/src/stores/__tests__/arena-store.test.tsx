import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ModelOption } from '@/types/arena';
import { ArenaStoreProvider, createArenaStore, useArenaStore } from '../arena-store';

const createMockModels = (count: number): ModelOption[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `provider-${i}:model-${i}`,
    name: `Model ${i}`,
    provider: `Provider ${i}`,
    providerId: `provider-${i}`,
    description: `Test model ${i}`,
    type: 'pro' as const,
    isNew: false,
    isCustom: false,
  }));
};

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ArenaStoreProvider>{children}</ArenaStoreProvider>;
  };
}

describe('arena-store', () => {
  describe('createArenaStore', () => {
    it('should create store with default initial state', () => {
      const store = createArenaStore();
      const state = store.getState();

      expect(state.comparisons).toEqual([]);
      expect(state.globalPrompt).toBe('');
      expect(state.initialized).toBe(false);
      expect(state.availableModels).toEqual([]);
      expect(state.modelsLastLoadedAt).toBeNull();
    });

    it('should create store with custom initial state', () => {
      const store = createArenaStore({
        globalPrompt: 'test prompt',
        initialized: true,
      });
      const state = store.getState();

      expect(state.globalPrompt).toBe('test prompt');
      expect(state.initialized).toBe(true);
    });
  });

  describe('initializeComparisons', () => {
    it('should initialize with two comparisons using first available model', () => {
      const store = createArenaStore();
      const models = createMockModels(3);

      store.getState().initializeComparisons(models);

      const state = store.getState();
      expect(state.initialized).toBe(true);
      expect(state.comparisons).toHaveLength(2);
      expect(state.comparisons[0]?.modelId).toBe('provider-0:model-0');
      expect(state.comparisons[1]?.modelId).toBe('provider-0:model-0');
      expect(state.availableModels).toEqual(models);
    });

    it('should not reinitialize if already initialized', () => {
      const store = createArenaStore();
      const models1 = createMockModels(3);
      const models2 = createMockModels(5);

      store.getState().initializeComparisons(models1);
      store.getState().initializeComparisons(models2);

      const state = store.getState();
      expect(state.comparisons).toHaveLength(2);
      expect(state.availableModels).toEqual(models1);
    });

    it('should not initialize with empty models array', () => {
      const store = createArenaStore();

      store.getState().initializeComparisons([]);

      const state = store.getState();
      expect(state.initialized).toBe(false);
      expect(state.comparisons).toHaveLength(0);
    });
  });

  describe('resetComparisons', () => {
    it('should reset comparisons with first available model selected', () => {
      const store = createArenaStore();
      const models = createMockModels(3);

      // First initialize
      store.getState().initializeComparisons(models);

      // Change model selections
      store.getState().selectModel(0, 'provider-2:model-2');
      store.getState().selectModel(1, 'provider-1:model-1');

      // Reset comparisons
      store.getState().resetComparisons(models);

      const state = store.getState();
      expect(state.comparisons).toHaveLength(2);
      expect(state.comparisons[0]?.modelId).toBe('provider-0:model-0');
      expect(state.comparisons[1]?.modelId).toBe('provider-0:model-0');
    });

    it('should use updated models list when resetting', () => {
      const store = createArenaStore();
      const oldModels = createMockModels(3);
      const newModels = [
        {
          id: 'new-provider:new-model',
          name: 'New Model',
          provider: 'New Provider',
          providerId: 'new-provider',
          description: 'New test model',
          type: 'pro' as const,
          isNew: true,
          isCustom: false,
        },
        ...createMockModels(2),
      ];

      // Initialize with old models
      store.getState().initializeComparisons(oldModels);

      // Reset with new models - should use first model from new list
      store.getState().resetComparisons(newModels);

      const state = store.getState();
      expect(state.comparisons[0]?.modelId).toBe('new-provider:new-model');
      expect(state.comparisons[1]?.modelId).toBe('new-provider:new-model');
    });

    it('should reset comparisons with empty string if no models available', () => {
      const store = createArenaStore();
      const models = createMockModels(2);

      store.getState().initializeComparisons(models);
      store.getState().resetComparisons([]);

      const state = store.getState();
      expect(state.comparisons[0]?.modelId).toBe('');
      expect(state.comparisons[1]?.modelId).toBe('');
    });

    it('should reset comparison config and custom prompt', () => {
      const store = createArenaStore();
      const models = createMockModels(2);

      store.getState().initializeComparisons(models);
      store.getState().setCustomPrompt(0, 'custom prompt');
      store.getState().updateConfig(0, { temperature: 0.8, topP: 0.9, maxTokens: 1000 });

      store.getState().resetComparisons(models);

      const state = store.getState();
      expect(state.comparisons[0]?.customPrompt).toBe('');
      expect(state.comparisons[0]?.config.temperature).toBe(0.7);
    });
  });

  describe('selectModel', () => {
    it('should update model selection for specific comparison', () => {
      const store = createArenaStore();
      const models = createMockModels(3);

      store.getState().initializeComparisons(models);
      store.getState().selectModel(1, 'provider-2:model-2');

      const state = store.getState();
      expect(state.comparisons[0]?.modelId).toBe('provider-0:model-0');
      expect(state.comparisons[1]?.modelId).toBe('provider-2:model-2');
    });
  });

  describe('setModelsLastLoadedAt', () => {
    it('should set models last loaded timestamp', () => {
      const store = createArenaStore();
      const timestamp = Date.now();

      store.getState().setModelsLastLoadedAt(timestamp);

      expect(store.getState().modelsLastLoadedAt).toBe(timestamp);
    });

    it('should allow setting to null to trigger refresh', () => {
      const store = createArenaStore();

      store.getState().setModelsLastLoadedAt(Date.now());
      store.getState().setModelsLastLoadedAt(null);

      expect(store.getState().modelsLastLoadedAt).toBeNull();
    });
  });

  describe('setAvailableModels', () => {
    it('should update available models', () => {
      const store = createArenaStore();
      const models = createMockModels(5);

      store.getState().setAvailableModels(models);

      expect(store.getState().availableModels).toEqual(models);
      expect(store.getState().availableModels).toHaveLength(5);
    });
  });

  describe('addComparison', () => {
    it('should add new comparison with first available model', () => {
      const store = createArenaStore();
      const models = createMockModels(3);

      store.getState().initializeComparisons(models);
      store.getState().addComparison();

      const state = store.getState();
      expect(state.comparisons).toHaveLength(3);
      expect(state.comparisons[2]?.modelId).toBe('provider-0:model-0');
    });

    it('should not exceed max comparison cards', () => {
      const store = createArenaStore();
      const models = createMockModels(3);

      store.getState().initializeComparisons(models);

      // Try to add more than max (MAX_COMPARISON_CARDS is 5)
      for (let i = 0; i < 10; i++) {
        store.getState().addComparison();
      }

      const state = store.getState();
      expect(state.comparisons.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('useArenaStore hook', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  afterEach(() => {
    // Cleanup
  });

  it('should provide store state through hook', () => {
    const { result } = renderHook(() => useArenaStore((state) => state.initialized), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(false);
  });

  it('should update when state changes', () => {
    const { result } = renderHook(
      () => ({
        comparisons: useArenaStore((state) => state.comparisons),
        initializeComparisons: useArenaStore((state) => state.initializeComparisons),
      }),
      { wrapper: createWrapper() },
    );

    const models = createMockModels(2);

    act(() => {
      result.current.initializeComparisons(models);
    });

    expect(result.current.comparisons).toHaveLength(2);
    expect(result.current.comparisons[0]?.modelId).toBe('provider-0:model-0');
  });

  it('should handle resetComparisons with new models correctly', () => {
    const { result } = renderHook(
      () => ({
        comparisons: useArenaStore((state) => state.comparisons),
        initializeComparisons: useArenaStore((state) => state.initializeComparisons),
        resetComparisons: useArenaStore((state) => state.resetComparisons),
        selectModel: useArenaStore((state) => state.selectModel),
      }),
      { wrapper: createWrapper() },
    );

    const initialModels = createMockModels(3);
    const updatedModels = [
      {
        id: 'updated-provider:updated-model',
        name: 'Updated Model',
        provider: 'Updated Provider',
        providerId: 'updated-provider',
        description: 'Updated test model',
        type: 'pro' as const,
        isNew: false,
        isCustom: false,
      },
      ...createMockModels(2),
    ];

    // Initialize
    act(() => {
      result.current.initializeComparisons(initialModels);
    });

    // Change model selection
    act(() => {
      result.current.selectModel(0, 'provider-2:model-2');
    });

    expect(result.current.comparisons[0]?.modelId).toBe('provider-2:model-2');

    // Reset with new models - simulates navigation to new chat after model refresh
    act(() => {
      result.current.resetComparisons(updatedModels);
    });

    // Should use first model from updated list
    expect(result.current.comparisons[0]?.modelId).toBe('updated-provider:updated-model');
    expect(result.current.comparisons[1]?.modelId).toBe('updated-provider:updated-model');
  });
});

describe('Navigation scenario: new chat model selection', () => {
  it('should correctly select models after reset with refreshed model list', () => {
    const store = createArenaStore();

    // Simulate initial page load
    const initialModels = createMockModels(3);
    store.getState().initializeComparisons(initialModels);
    store.getState().setModelsLastLoadedAt(Date.now());

    // User changes model selections
    store.getState().selectModel(0, 'provider-1:model-1');
    store.getState().selectModel(1, 'provider-2:model-2');

    // Simulate navigation to new chat (clearing cache)
    store.getState().setModelsLastLoadedAt(null);

    // Simulate models refresh completing with potentially updated list
    const refreshedModels = [
      {
        id: 'refreshed:model-a',
        name: 'Refreshed Model A',
        provider: 'Refreshed Provider',
        providerId: 'refreshed',
        description: 'Refreshed model',
        type: 'pro' as const,
        isNew: false,
        isCustom: false,
      },
      ...createMockModels(2),
    ];

    // This is what the new effect does - reset after models are loaded
    store.getState().setAvailableModels(refreshedModels);
    store.getState().resetComparisons(refreshedModels);
    store.getState().setModelsLastLoadedAt(Date.now());

    const state = store.getState();

    // Verify models are correctly selected from refreshed list
    expect(state.comparisons[0]?.modelId).toBe('refreshed:model-a');
    expect(state.comparisons[1]?.modelId).toBe('refreshed:model-a');
    expect(state.modelsLastLoadedAt).not.toBeNull();
  });

  it('should maintain model selection if navigating to existing conversation', () => {
    const store = createArenaStore();
    const models = createMockModels(3);

    store.getState().initializeComparisons(models);
    store.getState().selectModel(0, 'provider-1:model-1');
    store.getState().selectModel(1, 'provider-2:model-2');

    // Navigating to existing conversation should NOT reset
    // (this is handled by the page component, not the store)
    const state = store.getState();
    expect(state.comparisons[0]?.modelId).toBe('provider-1:model-1');
    expect(state.comparisons[1]?.modelId).toBe('provider-2:model-2');
  });

  it('should handle empty model list gracefully during reset', () => {
    const store = createArenaStore();
    const models = createMockModels(3);

    store.getState().initializeComparisons(models);

    // Edge case: reset called with empty list
    store.getState().resetComparisons([]);

    const state = store.getState();
    expect(state.comparisons).toHaveLength(2);
    expect(state.comparisons[0]?.modelId).toBe('');
    expect(state.comparisons[1]?.modelId).toBe('');
  });
});
