import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from './page';

const { setThemeMock, setLanguageMock } = vi.hoisted(() => ({
  setThemeMock: vi.fn(),
  setLanguageMock: vi.fn(),
}));

let capturedProviderLayoutProps: {
  providers: unknown[];
  isLoading: boolean;
  onToggleProvider?: (id: string, enabled?: boolean, apiKeyId?: string) => void;
  onSaveProvider?: (providerId: string, apiKeyId: string) => void;
  onAddProvider?: (provider: unknown) => void;
  onDeleteProvider?: (providerId: string) => void;
} | null = null;

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: setThemeMock }),
}));

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

// @lmring/ui is mocked globally via alias in vitest.config.mts

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProviderLayoutProps = null;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [] }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders tabs and triggers theme/language changes', async () => {
    render(<SettingsPage />);

    expect(screen.getByText('Settings.title')).toBeInTheDocument();
    expect(screen.getByText('Settings.tabs_general')).toBeInTheDocument();
    expect(screen.getByText('Settings.tabs_provider')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/api-keys', expect.any(Object));
    });

    // Click on the '中文' language option (SelectItem calls onValueChange via Context)
    fireEvent.click(screen.getByText('中文'));
    expect(setLanguageMock).toHaveBeenCalledWith('zh');

    fireEvent.click(screen.getByText('Settings.general_theme_light'));
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });

  it('switches between main tabs', () => {
    render(<SettingsPage />);

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
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to load API keys:', expect.any(Error));
    });

    expect(screen.getByText('Settings.title')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('handles non-ok API response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.getByText('Settings.title')).toBeInTheDocument();
  });

  it('shows all theme options', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Settings.general_theme_light')).toBeInTheDocument();
    expect(screen.getByText('Settings.general_theme_dark')).toBeInTheDocument();
    expect(screen.getByText('Settings.general_theme_auto')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Settings.general_theme_dark'));
    expect(setThemeMock).toHaveBeenCalledWith('dark');

    fireEvent.click(screen.getByText('Settings.general_theme_auto'));
    expect(setThemeMock).toHaveBeenCalledWith('system');
  });

  it('renders about tab with telemetry toggle', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Settings.tabs_about'));

    expect(screen.getByText('Settings.about_telemetry')).toBeInTheDocument();
    expect(screen.getByText('Settings.about_telemetry_description')).toBeInTheDocument();
    expect(screen.getByText('Settings.about_changelog')).toBeInTheDocument();
  });

  it('renders help tab with resource links', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Settings.tabs_help'));

    expect(screen.getByText('Settings.help_resources')).toBeInTheDocument();
    expect(screen.getByText('Settings.help_how_it_works')).toBeInTheDocument();
    expect(screen.getByText('Settings.help_about_us')).toBeInTheDocument();
  });

  it('does not call setLanguage for unsupported locale', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Settings.title')).toBeInTheDocument();
    });

    expect(setLanguageMock).not.toHaveBeenCalledWith('es');
  });
});

describe('SettingsPage Provider Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProviderLayoutProps = null;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [] }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    cleanup();
  });

  it('passes handler callbacks to ProviderLayout', async () => {
    render(<SettingsPage />);
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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    }) as unknown as typeof fetch;

    render(<SettingsPage />);
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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    }) as unknown as typeof fetch;

    render(<SettingsPage />);
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
