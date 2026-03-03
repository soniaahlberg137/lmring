import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsStoreProvider } from '@/stores/settings-store';
import { useThemeStore } from '@/stores/theme-store';
import SettingsPage from './page';

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SettingsStoreProvider>{children}</SettingsStoreProvider>;
  };
}

type FetchMockResult = {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

type FetchMockHandler = (input: RequestInfo | URL, init?: RequestInit) => Promise<FetchMockResult>;

function createJsonResponse(data: unknown, ok = true): FetchMockResult {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  };
}

function createDefaultFetchHandler(): FetchMockHandler {
  return async (input, init) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method?.toUpperCase() ?? 'GET';

    if (url.includes('/api/settings/api-keys') && method === 'GET') {
      return createJsonResponse({ keys: [] });
    }

    if (url.includes('/api/settings/api-keys/') && method === 'PATCH') {
      return createJsonResponse({});
    }

    if (url.includes('/api/user/theme')) {
      return createJsonResponse({ themeConfig: null, updatedAt: null });
    }

    return createJsonResponse({});
  };
}

function setFetchMock(handler: FetchMockHandler = createDefaultFetchHandler()) {
  global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    handler(input, init),
  ) as unknown as typeof fetch;
}

function fetchWasCalledWith(pathname: string): boolean {
  const fetchMock = global.fetch as unknown as { mock?: { calls: unknown[][] } };
  return (
    fetchMock.mock?.calls.some(([input]) => {
      if (typeof input === 'string') {
        return input.includes(pathname);
      }

      return false;
    }) ?? false
  );
}

async function renderSettingsPage() {
  render(<SettingsPage />, { wrapper: createWrapper() });

  await waitFor(() => {
    expect(screen.getByText('Settings.title')).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(fetchWasCalledWith('/api/settings/api-keys')).toBe(true);
  });
}

const { setLanguageMock } = vi.hoisted(() => ({
  setLanguageMock: vi.fn(),
}));

const { themeState, setModeMock, setSeedColorMock, setPresetMock, resetThemeMock } = vi.hoisted(
  () => {
    const themeState = {
      mode: 'system' as 'light' | 'dark' | 'system',
      seedColor: { l: 0.5, c: 0.15, h: 240 },
      presetName: 'ocean-blue' as string | null,
      palette: {
        light: { primary: { l: 0.5, c: 0.15, h: 240 } },
        dark: { primary: { l: 0.5, c: 0.15, h: 240 } },
      },
      hydrated: true,
    };

    const setModeMock = vi.fn((mode: 'light' | 'dark' | 'system') => {
      themeState.mode = mode;
    });
    const setSeedColorMock = vi.fn((seedColor: { l: number; c: number; h: number }) => {
      themeState.seedColor = seedColor;
      themeState.presetName = null;
    });
    const setPresetMock = vi.fn((presetName: string) => {
      themeState.presetName = presetName;
    });
    const resetThemeMock = vi.fn(() => {
      themeState.mode = 'system';
      themeState.seedColor = { l: 0.5, c: 0.15, h: 240 };
      themeState.presetName = 'ocean-blue';
    });

    return {
      themeState,
      setModeMock,
      setSeedColorMock,
      setPresetMock,
      resetThemeMock,
    };
  },
);

let capturedProviderLayoutProps: {
  providers: unknown[];
  isLoading: boolean;
  onToggleProvider?: (id: string, enabled?: boolean, apiKeyId?: string) => void;
  onSaveProvider?: (providerId: string, apiKeyId: string) => void;
  onAddProvider?: (provider: unknown) => void;
  onDeleteProvider?: (providerId: string) => void;
} | null = null;

vi.mock('@lmring/i18n', () => ({
  I18nConfig: { locales: ['en', 'zh', 'fr'] },
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/hooks/use-provider-metadata', () => ({
  useProviderMetadata: () => [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'OpenAI provider',
      models: [
        { id: 'gpt-4o', displayName: 'GPT-4o', contextWindowTokens: 128000, maxOutput: 4096 },
      ],
    },
  ],
}));

vi.mock('@/libs/locale-utils', () => ({
  isSupportedLocale: (locale: string) => ['en', 'zh', 'fr'].includes(locale),
}));

vi.mock('@/libs/validation', () => ({
  maskApiKey: () => 'sk-***',
}));

vi.mock('@/stores/language-store', () => ({
  languageSelectors: { language: (state: { language: string }) => state.language },
  useLanguageStore: (
    selector: (state: { language: string; setLanguage: (l: string) => void }) => unknown,
  ) => selector({ language: 'en', setLanguage: setLanguageMock }),
}));

vi.mock('@/stores/theme-store', () => {
  const state = {
    get mode() {
      return themeState.mode;
    },
    get seedColor() {
      return themeState.seedColor;
    },
    get presetName() {
      return themeState.presetName;
    },
    get palette() {
      return themeState.palette;
    },
    get hydrated() {
      return themeState.hydrated;
    },
    setMode: setModeMock,
    setSeedColor: setSeedColorMock,
    setPreset: setPresetMock,
    resetTheme: resetThemeMock,
    hydrateFromLocal: vi.fn(),
  };

  const useThemeStore = ((selector?: (s: typeof state) => unknown) =>
    selector ? selector(state) : state) as {
    (selector?: (s: typeof state) => unknown): unknown;
    getState: () => typeof state;
  };

  useThemeStore.getState = () => state;

  const themeSelectors = {
    mode: (s: typeof state) => s.mode,
    seedColor: (s: typeof state) => s.seedColor,
    presetName: (s: typeof state) => s.presetName,
    palette: (s: typeof state) => s.palette,
    hydrated: (s: typeof state) => s.hydrated,
    setMode: (s: typeof state) => s.setMode,
    setSeedColor: (s: typeof state) => s.setSeedColor,
    setPreset: (s: typeof state) => s.setPreset,
    hydrateFromLocal: (s: typeof state) => s.hydrateFromLocal,
    resetTheme: (s: typeof state) => s.resetTheme,
  };

  return { useThemeStore, themeSelectors };
});

vi.mock('./_components/provider/ProviderLayout', () => ({
  ProviderLayout: (props: {
    providers: unknown[];
    isLoading: boolean;
    onToggleProvider?: (id: string, enabled?: boolean, apiKeyId?: string) => void;
    onSaveProvider?: (providerId: string, apiKeyId: string) => void;
    onAddProvider?: (provider: unknown) => void;
    onDeleteProvider?: (providerId: string) => void;
  }) => {
    capturedProviderLayoutProps = props;
    return (
      <div data-testid="provider-layout">
        {props.isLoading ? 'loading' : 'ready'}:{props.providers.length}
      </div>
    );
  },
}));

// framer-motion is mocked globally via alias in vitest.config.mts

// Mock lucide-react with explicit exports (Proxy causes hanging)
vi.mock('lucide-react', () => {
  const MockIcon = () => <span data-testid="icon" />;
  return {
    BotIcon: MockIcon,
    BoxIcon: MockIcon,
    ChevronRight: MockIcon,
    CombineIcon: MockIcon,
    DatabaseIcon: MockIcon,
    ExternalLinkIcon: MockIcon,
    GithubIcon: MockIcon,
    Globe: MockIcon,
    GlobeIcon: MockIcon,
    HelpCircle: MockIcon,
    HelpCircleIcon: MockIcon,
    Info: MockIcon,
    InfoIcon: MockIcon,
    Key: MockIcon,
    LifeBuoyIcon: MockIcon,
    Monitor: MockIcon,
    Moon: MockIcon,
    Settings: MockIcon,
    Settings2Icon: MockIcon,
    Sun: MockIcon,
    TextIcon: MockIcon,
    Trash2: MockIcon,
    TwitterIcon: MockIcon,
  };
});

vi.mock('@lobehub/icons', () => {
  const Icon = () => <span data-testid="lobe-icon" />;
  const iconNames = [
    'Ai21',
    'AiMass',
    'AlibabaCloud',
    'Anthropic',
    'Aws',
    'Azure',
    'Baichuan',
    'Bfl',
    'Cerebras',
    'Cloudflare',
    'Cohere',
    'DeepSeek',
    'Fal',
    'Fireworks',
    'GiteeAI',
    'Github',
    'Google',
    'Groq',
    'Higress',
    'HuggingFace',
    'Hunyuan',
    'Infinigence',
    'InternLM',
    'Jina',
    'LmStudio',
    'Minimax',
    'Mistral',
    'ModelScope',
    'Moonshot',
    'Nebius',
    'Novita',
    'Nvidia',
    'Ollama',
    'OpenAI',
    'OpenRouter',
    'Perplexity',
    'PPIO',
    'Qiniu',
    'Replicate',
    'SambaNova',
    'Search1API',
    'SenseNova',
    'SiliconCloud',
    'Spark',
    'Stepfun',
    'TencentCloud',
    'Together',
    'Upstage',
    'VertexAI',
    'Vllm',
    'Volcengine',
    'Wenxin',
    'XAI',
    'XiaomiMiMo',
    'Xinference',
    'Yi',
    'Zhipu',
  ] as const;

  const icons = Object.fromEntries(iconNames.map((name) => [name, Icon]));
  return icons;
});

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock theme-storage to avoid async fetch operations during store initialization
vi.mock('@/libs/theme-storage', () => ({
  THEME_STORAGE_KEY: 'lmring-theme-config',
  themePersistStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  fetchThemeConfigFromServer: async () => null,
  isServerSnapshotNewer: () => false,
  loadLocalThemeSnapshot: () => null,
  saveThemeConfigToServer: async () => null,
  saveToLocal: () => {},
  loadFromLocal: () => null,
  clearFromLocal: () => {},
}));

// @lmring/theme is mocked globally via alias in vitest.config.mts (avoids culori ESM hanging)
// @lmring/ui is mocked globally via alias in vitest.config.mts

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProviderLayoutProps = null;
    setFetchMock();
    useThemeStore.getState().resetTheme();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders tabs and triggers theme/language changes', async () => {
    await renderSettingsPage();

    expect(screen.getByText('Settings.title')).toBeInTheDocument();
    expect(screen.getByText('Settings.tabs_general')).toBeInTheDocument();
    expect(screen.getByText('Settings.tabs_provider')).toBeInTheDocument();

    // Click on the '中文' language option (SelectItem calls onValueChange via Context)
    fireEvent.click(screen.getByText('中文'));
    expect(setLanguageMock).toHaveBeenCalledWith('zh');

    fireEvent.click(screen.getByText('Settings.theme_mode_light'));
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('switches between main tabs', async () => {
    await renderSettingsPage();

    fireEvent.click(screen.getByText('Settings.tabs_system_model'));
    expect(screen.getByText('Settings.system_model_title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Settings.tabs_storage'));
    expect(screen.getByText('Settings.storage_title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Settings.tabs_help'));
    expect(screen.getByText('Settings.help_title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Settings.tabs_about'));
    expect(screen.getByText('Settings.about_title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Settings.tabs_provider'));
    expect(screen.getByTestId('provider-layout')).toBeInTheDocument();
  });

  it('handles API keys loading error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    setFetchMock(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method?.toUpperCase() ?? 'GET';

      if (url.includes('/api/settings/api-keys') && method === 'GET') {
        throw new Error('Network error');
      }

      return createJsonResponse({ themeConfig: null, updatedAt: null });
    });

    await renderSettingsPage();

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to load API keys:', expect.any(Error));
    });

    expect(screen.getByText('Settings.title')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('handles non-ok API response', async () => {
    setFetchMock(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method?.toUpperCase() ?? 'GET';

      if (url.includes('/api/settings/api-keys') && method === 'GET') {
        return createJsonResponse({ error: 'Unauthorized' }, false);
      }

      return createJsonResponse({ themeConfig: null, updatedAt: null });
    });

    await renderSettingsPage();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.getByText('Settings.title')).toBeInTheDocument();
  });

  it('shows all theme options', async () => {
    await renderSettingsPage();

    expect(screen.getByText('Settings.theme_mode_light')).toBeInTheDocument();
    expect(screen.getByText('Settings.theme_mode_dark')).toBeInTheDocument();
    expect(screen.getByText('Settings.theme_mode_system')).toBeInTheDocument();
    expect(screen.getByText('Settings.theme_presets')).toBeInTheDocument();
    expect(screen.getByText('Settings.theme_preview')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Settings.theme_mode_dark'));
    expect(useThemeStore.getState().mode).toBe('dark');

    fireEvent.click(screen.getByText('Settings.theme_mode_system'));
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('renders about tab with telemetry toggle', async () => {
    await renderSettingsPage();

    fireEvent.click(screen.getByText('Settings.tabs_about'));

    expect(screen.getByText('Settings.about_telemetry')).toBeInTheDocument();
    expect(screen.getByText('Settings.about_telemetry_description')).toBeInTheDocument();
    expect(screen.getByText('Settings.about_changelog')).toBeInTheDocument();
  });

  it('renders help tab with resource links', async () => {
    await renderSettingsPage();

    fireEvent.click(screen.getByText('Settings.tabs_help'));

    expect(screen.getByText('Settings.help_resources')).toBeInTheDocument();
    expect(screen.getByText('Settings.help_how_it_works')).toBeInTheDocument();
    expect(screen.getByText('Settings.help_about_us')).toBeInTheDocument();
  });

  it('does not call setLanguage for unsupported locale', async () => {
    await renderSettingsPage();

    expect(setLanguageMock).not.toHaveBeenCalledWith('es');
  });
});

describe('SettingsPage Provider Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProviderLayoutProps = null;
    setFetchMock();
    useThemeStore.getState().resetTheme();
  });

  afterEach(() => {
    cleanup();
  });

  it('passes handler callbacks to ProviderLayout', async () => {
    await renderSettingsPage();
    fireEvent.click(screen.getByText('Settings.tabs_provider'));

    await waitFor(() => {
      expect(capturedProviderLayoutProps).not.toBeNull();
      expect(capturedProviderLayoutProps?.isLoading).toBe(false);
    });

    expect(typeof capturedProviderLayoutProps?.onToggleProvider).toBe('function');
    expect(typeof capturedProviderLayoutProps?.onSaveProvider).toBe('function');
    expect(typeof capturedProviderLayoutProps?.onAddProvider).toBe('function');
    expect(typeof capturedProviderLayoutProps?.onDeleteProvider).toBe('function');
  });

  it('transforms savedApiKeys to providers with correct connection status', async () => {
    setFetchMock(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method?.toUpperCase() ?? 'GET';

      if (url.includes('/api/settings/api-keys') && method === 'GET') {
        return createJsonResponse({
          keys: [
            {
              id: 'key-1',
              providerName: 'openai',
              enabled: true,
              hasApiKey: true,
            },
            {
              id: 'key-2',
              providerName: 'anthropic',
              enabled: false,
              hasApiKey: true,
            },
          ],
        });
      }

      if (url.includes('/api/user/theme')) {
        return createJsonResponse({ themeConfig: null, updatedAt: null });
      }

      return createJsonResponse({});
    });

    await renderSettingsPage();
    fireEvent.click(screen.getByText('Settings.tabs_provider'));

    await waitFor(() => {
      expect(capturedProviderLayoutProps).not.toBeNull();
      expect(capturedProviderLayoutProps?.isLoading).toBe(false);
      expect(capturedProviderLayoutProps?.providers.length).toBeGreaterThan(0);
    });

    const openaiProvider = (
      capturedProviderLayoutProps?.providers as {
        id: string;
        connected: boolean;
        apiKeyId?: string;
      }[]
    )?.find((p) => p.id === 'openai');
    expect(openaiProvider?.connected).toBe(true);
    expect(openaiProvider?.apiKeyId).toBe('key-1');
  });

  it('creates custom providers from isCustom=true keys', async () => {
    setFetchMock(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method?.toUpperCase() ?? 'GET';

      if (url.includes('/api/settings/api-keys') && method === 'GET') {
        return createJsonResponse({
          keys: [
            {
              id: 'custom-key',
              providerName: 'my-custom-provider',
              enabled: true,
              hasApiKey: true,
              isCustom: true,
              providerType: 'openai',
            },
          ],
        });
      }

      if (url.includes('/api/user/theme')) {
        return createJsonResponse({ themeConfig: null, updatedAt: null });
      }

      return createJsonResponse({});
    });

    await renderSettingsPage();
    fireEvent.click(screen.getByText('Settings.tabs_provider'));

    await waitFor(() => {
      expect(capturedProviderLayoutProps).not.toBeNull();
      expect(capturedProviderLayoutProps?.isLoading).toBe(false);
      expect(capturedProviderLayoutProps?.providers.length).toBeGreaterThan(0);
    });

    const customProvider = (
      capturedProviderLayoutProps?.providers as {
        id: string;
        isCustom?: boolean;
        providerType?: string;
      }[]
    )?.find((p) => p.id === 'my-custom-provider');
    expect(customProvider).toBeDefined();
    expect(customProvider?.isCustom).toBe(true);
    expect(customProvider?.providerType).toBe('openai');
  });
});
