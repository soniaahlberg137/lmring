import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from './page';

const { setThemeMock, setLanguageMock } = vi.hoisted(() => ({
  setThemeMock: vi.fn(),
  setLanguageMock: vi.fn(),
}));

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
  ProviderLayout: ({ providers, isLoading }: { providers: unknown[]; isLoading: boolean }) => (
    <div data-testid="provider-layout">
      {isLoading ? 'loading' : 'ready'}:{providers.length}
    </div>
  ),
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
});
