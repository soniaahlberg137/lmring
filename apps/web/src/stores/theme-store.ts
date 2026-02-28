'use client';

import {
  generatePalette,
  getPreset,
  type OklchColor,
  type PersistedThemeConfig,
  presets,
  type ThemePalette,
} from '@lmring/theme';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  fetchThemeConfigFromServer,
  isServerSnapshotNewer,
  loadLocalThemeSnapshot,
  saveThemeConfigToServer,
  THEME_STORAGE_KEY,
  type ThemePersistedState,
  themePersistStorage,
} from '@/libs/theme-storage';

export interface ThemeState {
  mode: PersistedThemeConfig['mode'];
  seedColor: OklchColor;
  presetName: string | null;
  palette: ThemePalette;
  hydrated: boolean;
}

export interface ThemeActions {
  setMode: (mode: PersistedThemeConfig['mode']) => void;
  setSeedColor: (seedColor: OklchColor) => void;
  setPreset: (presetName: string) => void;
  hydrateFromLocal: () => void;
  resetTheme: () => void;
}

export type ThemeStore = ThemeState & ThemeActions;

const FALLBACK_PRESET_NAME = 'ocean-blue';

function getDefaultPreset(): { name: string; hue: number; chroma: number; lightness: number } {
  return presets.find((preset) => preset.name === FALLBACK_PRESET_NAME) ?? presets[0]!;
}

function presetToSeedColor(presetName: string): OklchColor | null {
  const preset = presets.find((item) => item.name === presetName);
  if (!preset) {
    return null;
  }

  return {
    l: preset.lightness,
    c: preset.chroma,
    h: preset.hue,
  };
}

function buildPalette(seedColor: OklchColor, presetName: string | null): ThemePalette {
  if (presetName) {
    try {
      return getPreset(presetName);
    } catch {
      return generatePalette(seedColor);
    }
  }

  return generatePalette(seedColor);
}

const defaultPreset = getDefaultPreset();
const defaultSeedColor: OklchColor = {
  l: defaultPreset.lightness,
  c: defaultPreset.chroma,
  h: defaultPreset.hue,
};

const defaultState: ThemeState = {
  mode: 'system',
  seedColor: defaultSeedColor,
  presetName: defaultPreset.name,
  palette: buildPalette(defaultSeedColor, defaultPreset.name),
  hydrated: false,
};

function toPersistedState(state: ThemeState): ThemePersistedState {
  return {
    mode: state.mode,
    seedColor: state.seedColor,
    presetName: state.presetName,
  };
}

function syncCurrentThemeToServer(state: ThemeState): void {
  void saveThemeConfigToServer(toPersistedState(state));
}

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,

        setMode: (mode) => {
          set({ mode }, false, 'theme/setMode');
          syncCurrentThemeToServer(get());
        },

        setSeedColor: (seedColor) => {
          set(
            {
              seedColor,
              presetName: null,
              palette: generatePalette(seedColor),
            },
            false,
            'theme/setSeedColor',
          );
          syncCurrentThemeToServer(get());
        },

        setPreset: (presetName) => {
          const seedColor = presetToSeedColor(presetName);
          if (!seedColor) {
            return;
          }

          set(
            {
              presetName,
              seedColor,
              palette: buildPalette(seedColor, presetName),
            },
            false,
            'theme/setPreset',
          );
          syncCurrentThemeToServer(get());
        },

        hydrateFromLocal: () => {
          if (typeof window === 'undefined') {
            return;
          }

          if (useThemeStore.persist.hasHydrated()) {
            if (!get().hydrated) {
              set({ hydrated: true }, false, 'theme/markHydrated');
            }
          } else {
            void useThemeStore.persist.rehydrate();
          }

          void (async () => {
            const serverSnapshot = await fetchThemeConfigFromServer();
            if (!serverSnapshot) {
              return;
            }

            const localSnapshot = loadLocalThemeSnapshot();
            if (!isServerSnapshotNewer(localSnapshot, serverSnapshot)) {
              return;
            }

            set(
              {
                mode: serverSnapshot.config.mode,
                seedColor: serverSnapshot.config.seedColor,
                presetName: serverSnapshot.config.presetName,
                palette: buildPalette(
                  serverSnapshot.config.seedColor,
                  serverSnapshot.config.presetName,
                ),
                hydrated: true,
              },
              false,
              'theme/hydrateFromServer',
            );
          })();
        },

        resetTheme: () => {
          set(
            (state) => ({
              mode: defaultState.mode,
              seedColor: defaultState.seedColor,
              presetName: defaultState.presetName,
              palette: defaultState.palette,
              hydrated: state.hydrated,
            }),
            false,
            'theme/resetTheme',
          );
          syncCurrentThemeToServer(get());
        },
      }),
      {
        name: THEME_STORAGE_KEY,
        storage: themePersistStorage,
        partialize: (state) => toPersistedState(state),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Failed to rehydrate theme store:', error);
          }

          if (!state) {
            return;
          }

          state.palette = buildPalette(state.seedColor, state.presetName);
          state.hydrated = true;
        },
      },
    ),
    { name: 'theme-store', enabled: process.env.NODE_ENV === 'development' },
  ),
);

export const themeSelectors = {
  mode: (state: ThemeStore) => state.mode,
  seedColor: (state: ThemeStore) => state.seedColor,
  presetName: (state: ThemeStore) => state.presetName,
  palette: (state: ThemeStore) => state.palette,
  hydrated: (state: ThemeStore) => state.hydrated,
  setMode: (state: ThemeStore) => state.setMode,
  setSeedColor: (state: ThemeStore) => state.setSeedColor,
  setPreset: (state: ThemeStore) => state.setPreset,
  hydrateFromLocal: (state: ThemeStore) => state.hydrateFromLocal,
  resetTheme: (state: ThemeStore) => state.resetTheme,
};
