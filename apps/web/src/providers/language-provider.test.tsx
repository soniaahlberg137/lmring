import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@lmring/i18n/client', () => ({
  I18nProvider: ({ children, locale }: { children: ReactNode; locale: string }) => (
    <div data-testid="i18n-provider" data-locale={locale}>
      {children}
    </div>
  ),
}));

import * as loadLocaleMessagesModule from '@/libs/load-locale-messages';
import { useLanguageStore } from '@/stores/language-store';
import { LanguageProvider } from './language-provider';

describe('LanguageProvider', () => {
  const mockPostMessage = vi.fn();
  const mockRegister = vi.fn();

  const deleteServiceWorker = () => {
    const nav = navigator as { serviceWorker?: ServiceWorkerContainer };
    delete nav.serviceWorker;
  };

  const setServiceWorker = (value: object | undefined) => {
    if (value === undefined) {
      deleteServiceWorker();
    } else {
      Object.defineProperty(navigator, 'serviceWorker', {
        value,
        configurable: true,
        writable: true,
      });
    }
  };

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    deleteServiceWorker();

    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000/' },
      writable: true,
    });

    Object.defineProperty(window, 'history', {
      value: {
        replaceState: vi.fn(),
        state: {},
      },
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    deleteServiceWorker();
  });

  describe('rendering', () => {
    it('renders children correctly', () => {
      const { getByTestId } = render(
        <LanguageProvider initialLanguage="en" initialMessages={{ key: 'value' }}>
          <div data-testid="child">Test Child</div>
        </LanguageProvider>,
      );

      expect(getByTestId('child')).toBeDefined();
      expect(getByTestId('child').textContent).toBe('Test Child');
    });

    it('renders with initial language and messages', () => {
      const { getByTestId } = render(
        <LanguageProvider initialLanguage="fr" initialMessages={{ greeting: 'Bonjour' }}>
          <div>Content</div>
        </LanguageProvider>,
      );

      const provider = getByTestId('i18n-provider');
      expect(provider.getAttribute('data-locale')).toBe('fr');
    });
  });

  describe('service worker integration', () => {
    it('skips registration when serviceWorker not supported', () => {
      render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <div>Test</div>
        </LanguageProvider>,
      );

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('registers service worker with path /language-sw.js', async () => {
      mockRegister.mockResolvedValue({});
      setServiceWorker({
        controller: null,
        ready: Promise.resolve({ active: null }),
        register: mockRegister,
      });

      render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <div>Test</div>
        </LanguageProvider>,
      );

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('/language-sw.js', { scope: '/' });
      });
    });

    it('handles registration error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRegister.mockRejectedValue(new Error('Registration failed'));
      setServiceWorker({
        controller: null,
        ready: Promise.resolve({ active: null }),
        register: mockRegister,
      });

      render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <div>Test</div>
        </LanguageProvider>,
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to register language service worker',
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('uses controller.postMessage when available', async () => {
      mockRegister.mockResolvedValue({});
      setServiceWorker({
        controller: { postMessage: mockPostMessage },
        ready: Promise.resolve({ active: null }),
        register: mockRegister,
      });

      render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <div>Test</div>
        </LanguageProvider>,
      );

      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledWith({
          type: 'SET_LANGUAGE',
          payload: 'en',
        });
      });
    });

    it('waits for ready promise when no controller', async () => {
      const mockActivePostMessage = vi.fn();
      mockRegister.mockResolvedValue({});
      setServiceWorker({
        controller: null,
        ready: Promise.resolve({ active: { postMessage: mockActivePostMessage } }),
        register: mockRegister,
      });

      render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <div>Test</div>
        </LanguageProvider>,
      );

      await waitFor(() => {
        expect(mockActivePostMessage).toHaveBeenCalledWith({
          type: 'SET_LANGUAGE',
          payload: 'en',
        });
      });
    });

    it('notifies service worker when language changes', async () => {
      mockRegister.mockResolvedValue({});
      setServiceWorker({
        controller: { postMessage: mockPostMessage },
        ready: Promise.resolve({ active: null }),
        register: mockRegister,
      });

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <button type="button" data-testid="change-lang" onClick={() => setLanguage('fr')}>
            Change
          </button>
        );
      };

      const { getByTestId } = render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <TestComponent />
        </LanguageProvider>,
      );

      mockPostMessage.mockClear();

      await act(async () => {
        getByTestId('change-lang').click();
      });

      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledWith({
          type: 'SET_LANGUAGE',
          payload: 'fr',
        });
      });
    });
  });

  describe('URL cleanup', () => {
    it('removes lang query param matching current language', async () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000/?lang=en' },
        writable: true,
      });

      render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <div>Test</div>
        </LanguageProvider>,
      );

      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost:3000/');
      });
    });

    it('preserves URL when lang param differs', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000/?lang=fr' },
        writable: true,
      });

      render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <div>Test</div>
        </LanguageProvider>,
      );

      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it('calls history.replaceState correctly', async () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000/page?lang=en&other=value' },
        writable: true,
      });

      render(
        <LanguageProvider initialLanguage="en" initialMessages={{}}>
          <div>Test</div>
        </LanguageProvider>,
      );

      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalledWith(
          {},
          '',
          'http://localhost:3000/page?other=value',
        );
      });
    });
  });

  describe('dynamic message loading', () => {
    it('loads new messages when language changes', async () => {
      const loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockResolvedValue({ newKey: 'newValue' });

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <button type="button" data-testid="change-lang" onClick={() => setLanguage('fr')}>
            Change
          </button>
        );
      };

      const { getByTestId } = render(
        <LanguageProvider initialLanguage="en" initialMessages={{ key: 'value' }}>
          <TestComponent />
        </LanguageProvider>,
      );

      await act(async () => {
        getByTestId('change-lang').click();
      });

      await waitFor(() => {
        expect(loadLocaleSpy).toHaveBeenCalledWith('fr');
      });
    });

    it('skips loading when language equals current locale', async () => {
      const loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockResolvedValue({ key: 'value' });

      render(
        <LanguageProvider initialLanguage="en" initialMessages={{ key: 'value' }}>
          <div>Test</div>
        </LanguageProvider>,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(loadLocaleSpy).not.toHaveBeenCalled();
    });

    it('skips loading for previously failed locales', async () => {
      const loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockRejectedValue(new Error('Load failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <>
            <button type="button" data-testid="change-to-zh" onClick={() => setLanguage('zh')}>
              Change to zh
            </button>
            <button type="button" data-testid="back-to-en" onClick={() => setLanguage('en')}>
              Back to en
            </button>
          </>
        );
      };

      const { getByTestId } = render(
        <LanguageProvider initialLanguage="en" initialMessages={{ key: 'value' }}>
          <TestComponent />
        </LanguageProvider>,
      );

      await act(async () => {
        getByTestId('change-to-zh').click();
      });

      await waitFor(() => {
        expect(loadLocaleSpy).toHaveBeenCalledWith('zh');
      });

      loadLocaleSpy.mockClear();

      await act(async () => {
        getByTestId('back-to-en').click();
      });

      await new Promise((r) => setTimeout(r, 10));

      await act(async () => {
        getByTestId('change-to-zh').click();
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(loadLocaleSpy).not.toHaveBeenCalledWith('zh');

      consoleErrorSpy.mockRestore();
    });

    it('clears failed locale on successful load', async () => {
      let callCount = 0;
      const loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockImplementation(async (locale) => {
          callCount++;
          if (locale === 'zh' && callCount === 1) {
            throw new Error('First attempt failed');
          }
          return { key: 'value' };
        });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <>
            <button type="button" data-testid="change-to-zh" onClick={() => setLanguage('zh')}>
              Change to zh
            </button>
            <button type="button" data-testid="back-to-en" onClick={() => setLanguage('en')}>
              Back to en
            </button>
          </>
        );
      };

      const { getByTestId } = render(
        <LanguageProvider initialLanguage="en" initialMessages={{ key: 'value' }}>
          <TestComponent />
        </LanguageProvider>,
      );

      await act(async () => {
        getByTestId('change-to-zh').click();
      });

      await waitFor(() => {
        expect(loadLocaleSpy).toHaveBeenCalledWith('zh');
      });

      loadLocaleSpy.mockClear();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('falls back to default locale on load failure', async () => {
      const loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockImplementation(async (locale) => {
          if (locale === 'zh') {
            throw new Error('Load failed');
          }
          return { fallback: 'messages' };
        });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <button type="button" data-testid="change-to-zh" onClick={() => setLanguage('zh')}>
            Change
          </button>
        );
      };

      const { getByTestId } = render(
        <LanguageProvider initialLanguage="fr" initialMessages={{ initial: 'value' }}>
          <TestComponent />
        </LanguageProvider>,
      );

      await act(async () => {
        getByTestId('change-to-zh').click();
      });

      await waitFor(() => {
        expect(loadLocaleSpy).toHaveBeenCalledWith('en');
      });

      consoleErrorSpy.mockRestore();
    });

    it('adds failed locale to prevent retry loops', async () => {
      const loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockRejectedValue(new Error('Load failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <>
            <button type="button" data-testid="to-zh" onClick={() => setLanguage('zh')}>
              To zh
            </button>
            <button type="button" data-testid="to-fr" onClick={() => setLanguage('fr')}>
              To fr
            </button>
          </>
        );
      };

      const { getByTestId } = render(
        <LanguageProvider initialLanguage="en" initialMessages={{ key: 'value' }}>
          <TestComponent />
        </LanguageProvider>,
      );

      await act(async () => {
        getByTestId('to-zh').click();
      });

      await waitFor(() => {
        expect(loadLocaleSpy).toHaveBeenCalledWith('zh');
      });

      const _zhCallCount = loadLocaleSpy.mock.calls.filter((c) => c[0] === 'zh').length;

      loadLocaleSpy.mockClear();

      await act(async () => {
        getByTestId('to-fr').click();
      });

      await new Promise((r) => setTimeout(r, 50));

      await act(async () => {
        getByTestId('to-zh').click();
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(loadLocaleSpy.mock.calls.filter((c) => c[0] === 'zh').length).toBe(0);

      consoleErrorSpy.mockRestore();
    });

    it('handles fallback loading failure gracefully', async () => {
      const _loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockRejectedValue(new Error('All loads failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <button type="button" data-testid="change" onClick={() => setLanguage('zh')}>
            Change
          </button>
        );
      };

      const { getByTestId } = render(
        <LanguageProvider initialLanguage="fr" initialMessages={{ key: 'value' }}>
          <TestComponent />
        </LanguageProvider>,
      );

      await act(async () => {
        getByTestId('change').click();
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load locale messages for',
          'zh',
          expect.any(Error),
        );
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load fallback locale messages',
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('race conditions', () => {
    it('cancels pending load on unmount', async () => {
      let resolveLoad: (value: Record<string, string>) => void;
      const loadPromise = new Promise<Record<string, string>>((resolve) => {
        resolveLoad = resolve;
      });

      const loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockReturnValue(loadPromise);

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <button type="button" data-testid="change" onClick={() => setLanguage('fr')}>
            Change
          </button>
        );
      };

      const { getByTestId, unmount } = render(
        <LanguageProvider initialLanguage="en" initialMessages={{ key: 'value' }}>
          <TestComponent />
        </LanguageProvider>,
      );

      await act(async () => {
        getByTestId('change').click();
      });

      expect(loadLocaleSpy).toHaveBeenCalledWith('fr');

      unmount();

      await act(async () => {
        resolveLoad?.({ new: 'messages' });
      });
    });

    it('handles rapid language changes', async () => {
      const loadLocaleSpy = vi
        .spyOn(loadLocaleMessagesModule, 'loadLocaleMessages')
        .mockImplementation(async (locale) => {
          await new Promise((r) => setTimeout(r, 10));
          return { locale };
        });

      const TestComponent = () => {
        const setLanguage = useLanguageStore((s) => s.setLanguage);
        return (
          <>
            <button type="button" data-testid="to-fr" onClick={() => setLanguage('fr')}>
              Fr
            </button>
            <button type="button" data-testid="to-zh" onClick={() => setLanguage('zh')}>
              Zh
            </button>
          </>
        );
      };

      const { getByTestId } = render(
        <LanguageProvider initialLanguage="en" initialMessages={{ key: 'value' }}>
          <TestComponent />
        </LanguageProvider>,
      );

      await act(async () => {
        getByTestId('to-fr').click();
      });

      await act(async () => {
        getByTestId('to-zh').click();
      });

      await waitFor(() => {
        expect(loadLocaleSpy).toHaveBeenCalledWith('fr');
        expect(loadLocaleSpy).toHaveBeenCalledWith('zh');
      });
    });
  });
});
