'use client';

import { I18nConfig, type Locale } from '@lmring/i18n';
import { createContext, type ReactNode, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const LANGUAGE_STORAGE_KEY = 'lmring-language';

export type LanguageState = {
  language: Locale;
};

export type LanguageActions = {
  setLanguage: (language: Locale) => void;
};

export type LanguageStore = LanguageState & LanguageActions;

const defaultState: LanguageState = {
  language: I18nConfig.defaultLocale,
};

export const createLanguageStore = (initialState: Partial<LanguageState> = {}) => {
  return createStore<LanguageStore>()(
    persist(
      (set) => ({
        ...defaultState,
        ...initialState,
        setLanguage: (language) =>
          set(() => {
            return { language };
          }, false),
      }),
      {
        name: LANGUAGE_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          language: state.language,
        }),
      },
    ),
  );
};

type LanguageStoreApi = ReturnType<typeof createLanguageStore>;

const LanguageStoreContext = createContext<LanguageStoreApi | null>(null);

export function LanguageStoreProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage: Locale;
}) {
  const storeRef = useRef<LanguageStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createLanguageStore({ language: initialLanguage });
  }

  return (
    <LanguageStoreContext.Provider value={storeRef.current}>
      {children}
    </LanguageStoreContext.Provider>
  );
}

export function useLanguageStore<T>(selector: (state: LanguageStore) => T): T {
  const store = useContext(LanguageStoreContext);

  if (!store) {
    throw new Error('useLanguageStore must be used within LanguageStoreProvider');
  }

  return useStore(store, selector);
}

export const languageSelectors = {
  language: (state: LanguageStore) => state.language,
};
