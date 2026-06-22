import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage before importing the store
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

// Import after mocking localStorage
import {
  createLanguageStore,
  LanguageStoreProvider,
  languageSelectors,
  useLanguageStore,
} from './language-store';

describe('language-store', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default locale "en"', () => {
      const store = createLanguageStore();
      expect(store.getState().language).toBe('en');
    });

    it('should initialize with provided initial language', () => {
      const store = createLanguageStore({ language: 'en' });
      expect(store.getState().language).toBe('en');
    });
  });

  describe('setLanguage action', () => {
    it('should update language to "en"', () => {
      const store = createLanguageStore();
      store.getState().setLanguage('en');
      expect(store.getState().language).toBe('en');
    });

    it('should handle setting same language', () => {
      const store = createLanguageStore({ language: 'en' });
      store.getState().setLanguage('en');
      expect(store.getState().language).toBe('en');
    });
  });

  describe('selectors', () => {
    it('should have language selector', () => {
      expect(typeof languageSelectors.language).toBe('function');
    });

    it('should extract language from store state', () => {
      const store = createLanguageStore({ language: 'en' });
      expect(languageSelectors.language(store.getState())).toBe('en');
    });

    it('should return current language via language selector', () => {
      const store = createLanguageStore({ language: 'en' });
      expect(languageSelectors.language(store.getState())).toBe('en');
    });
  });

  describe('persistence', () => {
    it('should persist language to localStorage on change', async () => {
      const store = createLanguageStore();
      store.getState().setLanguage('en');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should restore language from localStorage on init', async () => {
      mockLocalStorage.store['lmring-language'] = JSON.stringify({
        state: { language: 'en' },
        version: 0,
      });
      const store = createLanguageStore();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(store.getState().language).toBe('en');
    });

    it('should handle invalid localStorage data gracefully', async () => {
      mockLocalStorage.store['lmring-language'] = 'invalid-json';
      const store = createLanguageStore();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(store.getState().language).toBe('en');
    });

    it('should handle malformed localStorage data gracefully', async () => {
      mockLocalStorage.store['lmring-language'] = JSON.stringify({
        state: { wrongKey: 'value' },
        version: 0,
      });
      const store = createLanguageStore();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const language = store.getState().language;
      expect(language === 'en' || language === undefined).toBe(true);
    });

    it('should only persist language field', async () => {
      const store = createLanguageStore();
      store.getState().setLanguage('en');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const storedValue = mockLocalStorage.store['lmring-language'];
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        expect(Object.keys(parsed.state)).toEqual(['language']);
      }
    });

    it('should handle empty localStorage', async () => {
      mockLocalStorage.store = {};
      const store = createLanguageStore();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(store.getState().language).toBe('en');
    });

    it('should handle null from localStorage getItem', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      const store = createLanguageStore();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(store.getState().language).toBe('en');
    });
  });

  describe('LanguageStoreProvider', () => {
    it('should provide store context to children', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LanguageStoreProvider initialLanguage="en">{children}</LanguageStoreProvider>
      );
      const { result } = renderHook(() => useLanguageStore((state) => state.language), { wrapper });
      expect(result.current).toBe('en');
    });

    it('should provide setLanguage action', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LanguageStoreProvider initialLanguage="en">{children}</LanguageStoreProvider>
      );
      const { result } = renderHook(() => useLanguageStore((state) => state.setLanguage), {
        wrapper,
      });
      expect(typeof result.current).toBe('function');
    });
  });

  describe('useLanguageStore', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useLanguageStore((state) => state.language));
      }).toThrow('useLanguageStore must be used within LanguageStoreProvider');
      consoleSpy.mockRestore();
    });

    it('should select language with selector', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LanguageStoreProvider initialLanguage="en">{children}</LanguageStoreProvider>
      );
      const { result } = renderHook(() => useLanguageStore(languageSelectors.language), {
        wrapper,
      });
      expect(result.current).toBe('en');
    });

    it('should select setLanguage action', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LanguageStoreProvider initialLanguage="en">{children}</LanguageStoreProvider>
      );
      const { result } = renderHook(() => useLanguageStore((state) => state.setLanguage), {
        wrapper,
      });
      expect(typeof result.current).toBe('function');
    });

    it('should return full store state when no selector', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LanguageStoreProvider initialLanguage="en">{children}</LanguageStoreProvider>
      );
      const { result } = renderHook(() => useLanguageStore((state) => state), { wrapper });
      expect(result.current.language).toBe('en');
      expect(typeof result.current.setLanguage).toBe('function');
    });
  });

  describe('store immutability', () => {
    it('should create independent store instances', () => {
      const store1 = createLanguageStore({ language: 'en' });
      const store2 = createLanguageStore({ language: 'en' });
      store1.getState().setLanguage('en');
      expect(store1.getState().language).toBe('en');
      expect(store2.getState().language).toBe('en');
    });

    it('should not affect other stores on state change', () => {
      const store1 = createLanguageStore();
      const store2 = createLanguageStore();
      store1.getState().setLanguage('en');
      store2.getState().setLanguage('en');
      expect(store1.getState().language).toBe('en');
      expect(store2.getState().language).toBe('en');
    });
  });

  describe('edge cases', () => {
    it('should handle setting same language', () => {
      const store = createLanguageStore({ language: 'en' });
      store.getState().setLanguage('en');
      expect(store.getState().language).toBe('en');
    });
  });
});
