'use client';

import { createContext, type ReactNode, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MAX_COMPARISON_CARDS } from '@/constants/arena';
import {
  DEFAULT_MODEL_CONFIG,
  type ModelComparison,
  type ModelConfig,
  type ModelOption,
} from '@/types/arena';

// Type for model override data
export interface ModelOverrideData {
  modelId: string;
  displayName?: string | null;
  groupName?: string | null;
  abilities?: Record<string, boolean> | null;
  supportsStreaming?: boolean | null;
  priceCurrency?: string | null;
  inputPrice?: number | null;
  outputPrice?: number | null;
}

export type ArenaState = {
  comparisons: ModelComparison[];
  globalPrompt: string;
  initialized: boolean;
  availableModels: ModelOption[];
  modelsLastLoadedAt: number | null;
  enabledModelsMap: Map<string, Set<string>>;
  customModelsMap: Map<string, Array<{ modelId: string; displayName: string }>>;
  modelOverridesMap: Map<string, Map<string, ModelOverrideData>>;
};

export type ArenaActions = {
  setGlobalPrompt: (prompt: string) => void;
  initializeComparisons: (availableModels: ModelOption[]) => void;
  addComparison: () => void;
  updateComparison: (index: number, update: Partial<ModelComparison>) => void;
  removeComparison: (index: number) => void;
  selectModel: (index: number, modelId: string) => void;
  toggleSync: (index: number, synced: boolean) => void;
  updateConfig: (index: number, config: ModelConfig) => void;
  setCustomPrompt: (index: number, prompt: string) => void;
  moveLeft: (index: number) => void;
  moveRight: (index: number) => void;
  clearComparison: (index: number) => void;
  setLoading: (index: number, isLoading: boolean) => void;
  setResponse: (
    index: number,
    response: string,
    responseTime?: number,
    tokenCount?: number,
  ) => void;
  setError: (index: number, error: string) => void;
  setAvailableModels: (models: ModelOption[]) => void;
  setModelsLastLoadedAt: (timestamp: number | null) => void;
  setComparisons: (comparisons: ModelComparison[]) => void;
  resetComparisons: (availableModels: ModelOption[]) => void;
  setEnabledModelsMap: (map: Map<string, Set<string>>) => void;
  setCustomModelsMap: (map: Map<string, Array<{ modelId: string; displayName: string }>>) => void;
  setModelOverridesMap: (map: Map<string, Map<string, ModelOverrideData>>) => void;
};

export type ArenaStore = ArenaState & ArenaActions;

function createEmptyComparison(id: string, modelId = ''): ModelComparison {
  return {
    id,
    modelId,
    response: '',
    isLoading: false,
    synced: true,
    customPrompt: '',
    config: { ...DEFAULT_MODEL_CONFIG },
  };
}

const defaultInitState: ArenaState = {
  comparisons: [],
  globalPrompt: '',
  initialized: false,
  availableModels: [],
  modelsLastLoadedAt: null,
  enabledModelsMap: new Map(),
  customModelsMap: new Map(),
  modelOverridesMap: new Map(),
};

export const createArenaStore = (initState: Partial<ArenaState> = {}) => {
  return createStore<ArenaStore>()(
    devtools(
      (set, get) => ({
        ...defaultInitState,
        ...initState,

        setGlobalPrompt: (prompt) => set({ globalPrompt: prompt }, false, 'arena/setGlobalPrompt'),

        initializeComparisons: (availableModels) => {
          const state = get();
          if (state.initialized || availableModels.length === 0) return;

          const defaultModelId = availableModels[0]?.id || '';

          set(
            {
              comparisons: [
                createEmptyComparison('1', defaultModelId),
                createEmptyComparison('2', defaultModelId),
              ],
              initialized: true,
              availableModels,
            },
            false,
            'arena/initializeComparisons',
          );
        },

        addComparison: () => {
          const state = get();
          if (state.comparisons.length >= MAX_COMPARISON_CARDS) return;

          const newModelId = state.availableModels[0]?.id || '';

          set(
            {
              comparisons: [
                ...state.comparisons,
                createEmptyComparison(Date.now().toString(), newModelId),
              ],
            },
            false,
            'arena/addComparison',
          );
        },

        updateComparison: (index, update) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) => (i === index ? { ...c, ...update } : c)),
            }),
            false,
            'arena/updateComparison',
          ),

        removeComparison: (index) => {
          const state = get();
          if (state.comparisons.length <= 1) return;

          set(
            {
              comparisons: state.comparisons.filter((_, i) => i !== index),
            },
            false,
            'arena/removeComparison',
          );
        },

        selectModel: (index, modelId) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) => (i === index ? { ...c, modelId } : c)),
            }),
            false,
            'arena/selectModel',
          ),

        toggleSync: (index, synced) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) => (i === index ? { ...c, synced } : c)),
            }),
            false,
            'arena/toggleSync',
          ),

        updateConfig: (index, config) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) => (i === index ? { ...c, config } : c)),
            }),
            false,
            'arena/updateConfig',
          ),

        setCustomPrompt: (index, customPrompt) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) =>
                i === index ? { ...c, customPrompt } : c,
              ),
            }),
            false,
            'arena/setCustomPrompt',
          ),

        moveLeft: (index) => {
          if (index <= 0) return;

          set(
            (state) => {
              const newComparisons = [...state.comparisons];
              const temp = newComparisons[index];
              const prev = newComparisons[index - 1];
              if (temp && prev) {
                newComparisons[index] = prev;
                newComparisons[index - 1] = temp;
              }
              return { comparisons: newComparisons };
            },
            false,
            'arena/moveLeft',
          );
        },

        moveRight: (index) => {
          const state = get();
          if (index >= state.comparisons.length - 1) return;

          set(
            (state) => {
              const newComparisons = [...state.comparisons];
              const temp = newComparisons[index];
              const next = newComparisons[index + 1];
              if (temp && next) {
                newComparisons[index] = next;
                newComparisons[index + 1] = temp;
              }
              return { comparisons: newComparisons };
            },
            false,
            'arena/moveRight',
          );
        },

        clearComparison: (index) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) =>
                i === index ? { ...c, response: '', isLoading: false, error: undefined } : c,
              ),
            }),
            false,
            'arena/clearComparison',
          ),

        setLoading: (index, isLoading) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) => (i === index ? { ...c, isLoading } : c)),
            }),
            false,
            'arena/setLoading',
          ),

        setResponse: (index, response, responseTime, tokenCount) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) =>
                i === index
                  ? {
                      ...c,
                      response,
                      responseTime,
                      tokenCount,
                      isLoading: false,
                      error: undefined,
                    }
                  : c,
              ),
            }),
            false,
            'arena/setResponse',
          ),

        setError: (index, error) =>
          set(
            (state) => ({
              comparisons: state.comparisons.map((c, i) =>
                i === index ? { ...c, error, isLoading: false } : c,
              ),
            }),
            false,
            'arena/setError',
          ),

        setAvailableModels: (models) =>
          set({ availableModels: models }, false, 'arena/setAvailableModels'),

        setModelsLastLoadedAt: (timestamp) =>
          set({ modelsLastLoadedAt: timestamp }, false, 'arena/setModelsLastLoadedAt'),

        setComparisons: (comparisons) => set({ comparisons }, false, 'arena/setComparisons'),

        resetComparisons: (availableModels) => {
          const defaultModelId = availableModels[0]?.id || '';
          set(
            {
              comparisons: [
                createEmptyComparison('1', defaultModelId),
                createEmptyComparison('2', defaultModelId),
              ],
            },
            false,
            'arena/resetComparisons',
          );
        },

        setEnabledModelsMap: (map) =>
          set({ enabledModelsMap: map }, false, 'arena/setEnabledModelsMap'),

        setCustomModelsMap: (map) =>
          set({ customModelsMap: map }, false, 'arena/setCustomModelsMap'),

        setModelOverridesMap: (map) =>
          set({ modelOverridesMap: map }, false, 'arena/setModelOverridesMap'),
      }),
      { name: 'arena-store', enabled: process.env.NODE_ENV === 'development' },
    ),
  );
};

type ArenaStoreApi = ReturnType<typeof createArenaStore>;

const ArenaStoreContext = createContext<ArenaStoreApi | null>(null);

export function ArenaStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ArenaStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createArenaStore();
  }

  return (
    <ArenaStoreContext.Provider value={storeRef.current}>{children}</ArenaStoreContext.Provider>
  );
}

export function useArenaStore<T>(selector: (state: ArenaStore) => T): T {
  const store = useContext(ArenaStoreContext);
  if (!store) {
    throw new Error('useArenaStore must be used within ArenaStoreProvider');
  }
  return useStore(store, selector);
}

export const arenaSelectors = {
  comparisons: (state: ArenaStore) => state.comparisons,
  globalPrompt: (state: ArenaStore) => state.globalPrompt,
  initialized: (state: ArenaStore) => state.initialized,
  availableModels: (state: ArenaStore) => state.availableModels,
  isAnyLoading: (state: ArenaStore) => state.comparisons.some((c) => c.isLoading),
  comparisonCount: (state: ArenaStore) => state.comparisons.length,
  modelsLastLoadedAt: (state: ArenaStore) => state.modelsLastLoadedAt,
  enabledModelsMap: (state: ArenaStore) => state.enabledModelsMap,
  customModelsMap: (state: ArenaStore) => state.customModelsMap,
  modelOverridesMap: (state: ArenaStore) => state.modelOverridesMap,
};
