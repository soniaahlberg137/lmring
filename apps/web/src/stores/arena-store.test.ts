import { describe, expect, it } from 'vitest';
import { DEFAULT_MODEL_CONFIG, type ModelConfig, type ModelOption } from '@/types/arena';
import { arenaSelectors, createArenaStore, type ModelOverrideData } from './arena-store';

describe('arena-store', () => {
  const mockModels: ModelOption[] = [
    {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      providerId: 'openai',
    },
    {
      id: 'anthropic:claude-3',
      name: 'Claude 3',
      provider: 'Anthropic',
      providerId: 'anthropic',
    },
    {
      id: 'google:gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      providerId: 'google',
    },
  ];

  describe('initial state', () => {
    it('should have empty comparisons', () => {
      const store = createArenaStore();
      expect(store.getState().comparisons).toEqual([]);
    });

    it('should have empty globalPrompt', () => {
      const store = createArenaStore();
      expect(store.getState().globalPrompt).toBe('');
    });

    it('should have initialized as false', () => {
      const store = createArenaStore();
      expect(store.getState().initialized).toBe(false);
    });

    it('should have empty availableModels', () => {
      const store = createArenaStore();
      expect(store.getState().availableModels).toEqual([]);
    });

    it('should have null modelsLastLoadedAt', () => {
      const store = createArenaStore();
      expect(store.getState().modelsLastLoadedAt).toBeNull();
    });

    it('should have mainContentReady as false', () => {
      const store = createArenaStore();
      expect(store.getState().mainContentReady).toBe(false);
    });

    it('should have empty maps', () => {
      const store = createArenaStore();
      expect(store.getState().enabledModelsMap.size).toBe(0);
      expect(store.getState().customModelsMap.size).toBe(0);
      expect(store.getState().modelOverridesMap.size).toBe(0);
    });

    it('should accept initial state', () => {
      const store = createArenaStore({
        globalPrompt: 'Test prompt',
        mainContentReady: true,
      });

      expect(store.getState().globalPrompt).toBe('Test prompt');
      expect(store.getState().mainContentReady).toBe(true);
    });
  });

  describe('initializeComparisons', () => {
    it('should initialize with two comparisons using first available model', () => {
      const store = createArenaStore();

      store.getState().initializeComparisons(mockModels);

      const state = store.getState();
      expect(state.comparisons).toHaveLength(2);
      expect(state.comparisons[0]?.modelId).toBe('openai:gpt-4');
      expect(state.comparisons[1]?.modelId).toBe('openai:gpt-4');
      expect(state.initialized).toBe(true);
      expect(state.availableModels).toEqual(mockModels);
    });

    it('should create comparisons with default config', () => {
      const store = createArenaStore();

      store.getState().initializeComparisons(mockModels);

      const comparison = store.getState().comparisons[0];
      expect(comparison?.config).toEqual(DEFAULT_MODEL_CONFIG);
      expect(comparison?.synced).toBe(true);
      expect(comparison?.customPrompt).toBe('');
      expect(comparison?.response).toBe('');
      expect(comparison?.isLoading).toBe(false);
    });

    it('should not reinitialize if already initialized', () => {
      const store = createArenaStore();

      store.getState().initializeComparisons(mockModels);
      store.getState().selectModel(0, 'anthropic:claude-3');
      store.getState().initializeComparisons(mockModels);

      // Should still have the modified model
      expect(store.getState().comparisons[0]?.modelId).toBe('anthropic:claude-3');
    });

    it('should not initialize with empty models', () => {
      const store = createArenaStore();

      store.getState().initializeComparisons([]);

      expect(store.getState().initialized).toBe(false);
      expect(store.getState().comparisons).toHaveLength(0);
    });
  });

  describe('addComparison', () => {
    it('should add a new comparison', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().addComparison();

      expect(store.getState().comparisons).toHaveLength(3);
    });

    it('should use first available model for new comparison', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().addComparison();

      const newComparison = store.getState().comparisons[2];
      expect(newComparison?.modelId).toBe('openai:gpt-4');
    });

    it('should not exceed MAX_COMPARISON_CARDS (5)', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      // Add 3 more to reach 5
      store.getState().addComparison();
      store.getState().addComparison();
      store.getState().addComparison();

      expect(store.getState().comparisons).toHaveLength(5);

      // Try to add another
      store.getState().addComparison();

      expect(store.getState().comparisons).toHaveLength(5);
    });
  });

  describe('removeComparison', () => {
    it('should remove comparison at index', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      const originalId = store.getState().comparisons[0]?.id;
      store.getState().removeComparison(0);

      expect(store.getState().comparisons).toHaveLength(1);
      expect(store.getState().comparisons[0]?.id).not.toBe(originalId);
    });

    it('should not remove if only one comparison left', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().removeComparison(0);
      store.getState().removeComparison(0);

      expect(store.getState().comparisons).toHaveLength(1);
    });
  });

  describe('updateComparison', () => {
    it('should update comparison fields', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().updateComparison(0, {
        response: 'Test response',
        responseTime: 1500,
      });

      const comparison = store.getState().comparisons[0];
      expect(comparison?.response).toBe('Test response');
      expect(comparison?.responseTime).toBe(1500);
    });

    it('should not affect other comparisons', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().updateComparison(0, { response: 'Updated' });

      expect(store.getState().comparisons[1]?.response).toBe('');
    });
  });

  describe('clearComparison', () => {
    it('should clear response and loading state', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);
      store.getState().updateComparison(0, {
        response: 'Test response',
        isLoading: true,
        error: 'Some error',
      });

      store.getState().clearComparison(0);

      const comparison = store.getState().comparisons[0];
      expect(comparison?.response).toBe('');
      expect(comparison?.isLoading).toBe(false);
      expect(comparison?.error).toBeUndefined();
    });
  });

  describe('selectModel', () => {
    it('should update model for comparison', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().selectModel(0, 'anthropic:claude-3');

      expect(store.getState().comparisons[0]?.modelId).toBe('anthropic:claude-3');
    });

    it('should not affect other comparisons', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().selectModel(0, 'anthropic:claude-3');

      expect(store.getState().comparisons[1]?.modelId).toBe('openai:gpt-4');
    });
  });

  describe('setGlobalPrompt', () => {
    it('should set global prompt', () => {
      const store = createArenaStore();

      store.getState().setGlobalPrompt('Test prompt');

      expect(store.getState().globalPrompt).toBe('Test prompt');
    });
  });

  describe('setCustomPrompt', () => {
    it('should set custom prompt for comparison', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().setCustomPrompt(0, 'Custom prompt');

      expect(store.getState().comparisons[0]?.customPrompt).toBe('Custom prompt');
    });
  });

  describe('updateConfig', () => {
    it('should update comparison config', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      const newConfig: ModelConfig = {
        maxTokens: 4096,
        temperature: 0.5,
        topP: 0.9,
      };

      store.getState().updateConfig(0, newConfig);

      expect(store.getState().comparisons[0]?.config).toEqual(newConfig);
    });
  });

  describe('toggleSync', () => {
    it('should toggle sync state', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().toggleSync(0, false);

      expect(store.getState().comparisons[0]?.synced).toBe(false);
    });
  });

  describe('setResponse', () => {
    it('should set response with metrics', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);
      store.getState().setLoading(0, true);

      store.getState().setResponse(0, 'Response text', 1500, 100);

      const comparison = store.getState().comparisons[0];
      expect(comparison?.response).toBe('Response text');
      expect(comparison?.responseTime).toBe(1500);
      expect(comparison?.tokenCount).toBe(100);
      expect(comparison?.isLoading).toBe(false);
      expect(comparison?.error).toBeUndefined();
    });
  });

  describe('setError', () => {
    it('should set error and clear loading', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);
      store.getState().setLoading(0, true);

      store.getState().setError(0, 'Error message');

      const comparison = store.getState().comparisons[0];
      expect(comparison?.error).toBe('Error message');
      expect(comparison?.isLoading).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      store.getState().setLoading(0, true);

      expect(store.getState().comparisons[0]?.isLoading).toBe(true);
    });
  });

  describe('moveLeft / moveRight', () => {
    it('moveLeft should swap with previous comparison', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);
      store.getState().selectModel(0, 'openai:gpt-4');
      store.getState().selectModel(1, 'anthropic:claude-3');

      store.getState().moveLeft(1);

      expect(store.getState().comparisons[0]?.modelId).toBe('anthropic:claude-3');
      expect(store.getState().comparisons[1]?.modelId).toBe('openai:gpt-4');
    });

    it('moveLeft should do nothing for index 0', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);
      store.getState().selectModel(0, 'openai:gpt-4');
      store.getState().selectModel(1, 'anthropic:claude-3');

      store.getState().moveLeft(0);

      expect(store.getState().comparisons[0]?.modelId).toBe('openai:gpt-4');
    });

    it('moveRight should swap with next comparison', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);
      store.getState().selectModel(0, 'openai:gpt-4');
      store.getState().selectModel(1, 'anthropic:claude-3');

      store.getState().moveRight(0);

      expect(store.getState().comparisons[0]?.modelId).toBe('anthropic:claude-3');
      expect(store.getState().comparisons[1]?.modelId).toBe('openai:gpt-4');
    });

    it('moveRight should do nothing for last index', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);
      store.getState().selectModel(0, 'openai:gpt-4');
      store.getState().selectModel(1, 'anthropic:claude-3');

      store.getState().moveRight(1);

      expect(store.getState().comparisons[1]?.modelId).toBe('anthropic:claude-3');
    });
  });

  describe('setAvailableModels', () => {
    it('should set available models', () => {
      const store = createArenaStore();

      store.getState().setAvailableModels(mockModels);

      expect(store.getState().availableModels).toEqual(mockModels);
    });
  });

  describe('setModelsLastLoadedAt', () => {
    it('should set timestamp', () => {
      const store = createArenaStore();
      const now = Date.now();

      store.getState().setModelsLastLoadedAt(now);

      expect(store.getState().modelsLastLoadedAt).toBe(now);
    });

    it('should accept null', () => {
      const store = createArenaStore({ modelsLastLoadedAt: Date.now() });

      store.getState().setModelsLastLoadedAt(null);

      expect(store.getState().modelsLastLoadedAt).toBeNull();
    });
  });

  describe('setComparisons', () => {
    it('should set comparisons directly', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      const newComparisons = store.getState().comparisons.map((c, i) => ({
        ...c,
        response: `Response ${i}`,
      }));

      store.getState().setComparisons(newComparisons);

      expect(store.getState().comparisons[0]?.response).toBe('Response 0');
      expect(store.getState().comparisons[1]?.response).toBe('Response 1');
    });
  });

  describe('resetComparisons', () => {
    it('should reset to two default comparisons', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);
      store.getState().addComparison();
      store.getState().addComparison();
      store.getState().updateComparison(0, { response: 'Test' });

      store.getState().resetComparisons(mockModels);

      const state = store.getState();
      expect(state.comparisons).toHaveLength(2);
      expect(state.comparisons[0]?.response).toBe('');
      expect(state.comparisons[0]?.modelId).toBe('openai:gpt-4');
    });
  });

  describe('model maps', () => {
    it('setEnabledModelsMap should set map', () => {
      const store = createArenaStore();
      const map = new Map([['openai', new Set(['gpt-4', 'gpt-3.5'])]]);

      store.getState().setEnabledModelsMap(map);

      expect(store.getState().enabledModelsMap).toBe(map);
    });

    it('setCustomModelsMap should set map', () => {
      const store = createArenaStore();
      const map = new Map([['openai', [{ modelId: 'custom-1', displayName: 'Custom' }]]]);

      store.getState().setCustomModelsMap(map);

      expect(store.getState().customModelsMap).toBe(map);
    });

    it('setModelOverridesMap should set map', () => {
      const store = createArenaStore();
      const override: ModelOverrideData = {
        modelId: 'gpt-4',
        displayName: 'GPT-4 Override',
      };
      const innerMap = new Map([['gpt-4', override]]);
      const map = new Map([['openai', innerMap]]);

      store.getState().setModelOverridesMap(map);

      expect(store.getState().modelOverridesMap).toBe(map);
    });
  });

  describe('setMainContentReady', () => {
    it('should set mainContentReady flag', () => {
      const store = createArenaStore();

      store.getState().setMainContentReady(true);

      expect(store.getState().mainContentReady).toBe(true);
    });
  });

  describe('selectors', () => {
    it('comparisons selector should return comparisons', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      expect(arenaSelectors.comparisons(store.getState())).toBe(store.getState().comparisons);
    });

    it('globalPrompt selector should return globalPrompt', () => {
      const store = createArenaStore({ globalPrompt: 'Test' });

      expect(arenaSelectors.globalPrompt(store.getState())).toBe('Test');
    });

    it('initialized selector should return initialized', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      expect(arenaSelectors.initialized(store.getState())).toBe(true);
    });

    it('availableModels selector should return availableModels', () => {
      const store = createArenaStore();
      store.getState().setAvailableModels(mockModels);

      expect(arenaSelectors.availableModels(store.getState())).toEqual(mockModels);
    });

    it('isAnyLoading selector should return true if any comparison is loading', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      expect(arenaSelectors.isAnyLoading(store.getState())).toBe(false);

      store.getState().setLoading(0, true);

      expect(arenaSelectors.isAnyLoading(store.getState())).toBe(true);
    });

    it('comparisonCount selector should return count', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      expect(arenaSelectors.comparisonCount(store.getState())).toBe(2);

      store.getState().addComparison();

      expect(arenaSelectors.comparisonCount(store.getState())).toBe(3);
    });

    it('modelsLastLoadedAt selector should return timestamp', () => {
      const store = createArenaStore();
      const now = Date.now();
      store.getState().setModelsLastLoadedAt(now);

      expect(arenaSelectors.modelsLastLoadedAt(store.getState())).toBe(now);
    });

    it('mainContentReady selector should return flag', () => {
      const store = createArenaStore({ mainContentReady: true });

      expect(arenaSelectors.mainContentReady(store.getState())).toBe(true);
    });

    it('arenaState composite selector should return all state', () => {
      const store = createArenaStore();
      store.getState().initializeComparisons(mockModels);

      const state = arenaSelectors.arenaState(store.getState());

      expect(state).toHaveProperty('comparisons');
      expect(state).toHaveProperty('initialized');
      expect(state).toHaveProperty('availableModels');
      expect(state).toHaveProperty('modelsLastLoadedAt');
      expect(state).toHaveProperty('enabledModelsMap');
      expect(state).toHaveProperty('customModelsMap');
      expect(state).toHaveProperty('modelOverridesMap');
    });

    it('arenaActions composite selector should return all actions', () => {
      const store = createArenaStore();

      const actions = arenaSelectors.arenaActions(store.getState());

      expect(actions).toHaveProperty('initializeComparisons');
      expect(actions).toHaveProperty('addComparison');
      expect(actions).toHaveProperty('selectModel');
      expect(actions).toHaveProperty('toggleSync');
      expect(actions).toHaveProperty('updateConfig');
      expect(actions).toHaveProperty('setCustomPrompt');
      expect(actions).toHaveProperty('moveLeft');
      expect(actions).toHaveProperty('moveRight');
      expect(actions).toHaveProperty('removeComparison');
      expect(actions).toHaveProperty('setAvailableModels');
      expect(actions).toHaveProperty('setModelsLastLoadedAt');
      expect(actions).toHaveProperty('setComparisons');
      expect(actions).toHaveProperty('resetComparisons');
      expect(actions).toHaveProperty('setEnabledModelsMap');
      expect(actions).toHaveProperty('setCustomModelsMap');
      expect(actions).toHaveProperty('setModelOverridesMap');
      expect(actions).toHaveProperty('setMainContentReady');
    });
  });
});
