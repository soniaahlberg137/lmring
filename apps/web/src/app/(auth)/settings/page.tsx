'use client';

import { I18nConfig, type Locale } from '@lmring/i18n';
import {
  Button,
  Card,
  CardContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
} from '@lmring/ui';
import {
  Ai21,
  AiMass,
  AlibabaCloud,
  Anthropic,
  Aws,
  Azure,
  Baichuan,
  Bfl,
  Cerebras,
  Cloudflare,
  Cohere,
  DeepSeek,
  Fireworks,
  GiteeAI,
  Github,
  Google,
  Groq,
  Higress,
  HuggingFace,
  Hunyuan,
  Infinigence,
  InternLM,
  Jina,
  LmStudio,
  Minimax,
  Mistral,
  ModelScope,
  Moonshot,
  Nebius,
  Novita,
  Nvidia,
  Ollama,
  OpenAI,
  OpenRouter,
  Perplexity,
  PPIO,
  Qiniu,
  Replicate,
  SambaNova,
  Search1API,
  SenseNova,
  SiliconCloud,
  Spark,
  Stepfun,
  TencentCloud,
  Together,
  Upstage,
  VertexAI,
  Vllm,
  Volcengine,
  Wenxin,
  XAI,
  Xinference,
  Yi,
  Zhipu,
} from '@lobehub/icons';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BotIcon,
  BoxIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  GithubIcon,
  GlobeIcon,
  HelpCircleIcon,
  InfoIcon,
  LifeBuoyIcon,
  Settings2Icon,
  TwitterIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { useProviderMetadata } from '@/hooks/use-provider-metadata';
import { isSupportedLocale } from '@/libs/locale-utils';
import { maskApiKey } from '@/libs/validation';
import { languageSelectors, useLanguageStore } from '@/stores/language-store';
import { ProviderLayout } from './_components/provider/ProviderLayout';
import type { ApiKeyRecord, Provider } from './_components/provider/types';

// biome-ignore lint/suspicious/noExplicitAny: @lobehub/icons has incompatible CompoundedIcon types per icon
const ICON_MAP: Record<string, any> = {
  openai: OpenAI,
  anthropic: Anthropic,
  azure: Azure,
  vertex: VertexAI,
  xai: XAI,
  deepseek: DeepSeek,
  mistral: Mistral,
  openrouter: OpenRouter,
  silicon: SiliconCloud,
  dashscope: AlibabaCloud,
  zhipu: Zhipu,
  baichuan: Baichuan,
  moonshot: Moonshot,
  yi: Yi,
  minimax: Minimax,
  step: Stepfun,
  ollama: Ollama,
  bedrock: Aws,
  google: Google,
  groq: Groq,
  perplexity: Perplexity,
  cohere: Cohere,
  togetherai: Together,
  fireworksai: Fireworks,
  sambanova: SambaNova,
  github: Github,
  huggingface: HuggingFace,
  nvidia: Nvidia,
  cerebras: Cerebras,
  cloudflare: Cloudflare,
  nebius: Nebius,
  upstage: Upstage,
  novita: Novita,
  ai21: Ai21,
  bfl: Bfl,
  infiniai: Infinigence,
  jina: Jina,
  search1api: Search1API,
  replicate: Replicate,
  hunyuan: Hunyuan,
  spark: Spark,
  volcengine: Volcengine,
  wenxin: Wenxin,
  sensenova: SenseNova,
  internlm: InternLM,
  giteeai: GiteeAI,
  modelscope: ModelScope,
  qiniu: Qiniu,
  ppio: PPIO,
  tencentcloud: TencentCloud,
  lmstudio: LmStudio,
  vllm: Vllm,
  xinference: Xinference,
  higress: Higress,
  taichu: AiMass,
};

type Tab = 'general' | 'provider' | 'system-model' | 'storage' | 'help' | 'about';

// Language display names mapping
const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  fr: 'Français',
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('Settings');
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Tab>('general');
  const [telemetryEnabled, setTelemetryEnabled] = React.useState(false);
  const [apiKeysLoaded, setApiKeysLoaded] = React.useState(false);
  const [savedApiKeys, setSavedApiKeys] = React.useState<ApiKeyRecord[]>([]);
  const providerMetadata = useProviderMetadata();
  const locale = useLanguageStore(languageSelectors.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const handleLanguageChange = (newLocale: string) => {
    if (!isSupportedLocale(newLocale)) {
      return;
    }
    setLanguage(newLocale);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    const loadApiKeys = async () => {
      try {
        const response = await fetch('/api/settings/api-keys', {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setSavedApiKeys(data.keys || []);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Failed to load API keys:', error);
      } finally {
        if (!controller.signal.aborted) {
          setApiKeysLoaded(true);
        }
      }
    };

    loadApiKeys();

    return () => {
      controller.abort();
    };
  }, []);

  const initialProviders: Provider[] = React.useMemo(() => {
    const savedKeysMap = new Map(savedApiKeys.map((key) => [key.providerName.toLowerCase(), key]));

    const builtInProviders = providerMetadata.map((p) => {
      const savedKey = savedKeysMap.get(p.id.toLowerCase());
      return {
        id: p.id,
        name: p.name,
        connected: savedKey?.enabled ?? false,
        Icon: ICON_MAP[p.id]?.Avatar || ICON_MAP[p.id],
        CombineIcon: ICON_MAP[p.id]?.Combine,
        TextIcon: ICON_MAP[p.id]?.Text,
        BrandIcon: ICON_MAP[p.id]?.Brand || ICON_MAP[p.id]?.BrandColor,
        description: p.description,
        type: savedKey?.enabled ? ('enabled' as const) : ('disabled' as const),
        tags: [p.name],
        models: p.models.map((m) => ({
          id: m.id,
          name: m.displayName || m.id,
          contextLength: m.contextWindowTokens,
          maxOutputTokens: m.maxOutput,
        })),
        apiKeyId: savedKey?.id,
        apiKey: savedKey?.hasApiKey ? maskApiKey('sk-xxxxxxxxxxxx') : undefined,
        proxyUrl: savedKey?.proxyUrl,
        hasApiKey: savedKey?.hasApiKey ?? false,
        isCustom: false,
        providerType: p.id,
      };
    });

    const builtInIds = new Set(providerMetadata.map((p) => p.id.toLowerCase()));
    const customProviders = savedApiKeys
      .filter((key) => key.isCustom && !builtInIds.has(key.providerName.toLowerCase()))
      .map((key) => {
        const providerType = key.providerType || 'openai';
        return {
          id: key.providerName,
          name: key.providerName,
          connected: key.enabled,
          Icon: ICON_MAP[providerType]?.Avatar || ICON_MAP[providerType] || BoxIcon,
          description: `Custom ${providerType} provider`,
          type: key.enabled ? ('enabled' as const) : ('disabled' as const),
          tags: [providerType],
          models: [],
          apiKeyId: key.id,
          apiKey: key.hasApiKey ? maskApiKey('sk-xxxxxxxxxxxx') : undefined,
          proxyUrl: key.proxyUrl,
          hasApiKey: key.hasApiKey ?? false,
          isCustom: true,
          providerType,
        };
      });

    return [...customProviders, ...builtInProviders];
  }, [providerMetadata, savedApiKeys]);

  const [providers, setProviders] = React.useState<Provider[]>([]);

  React.useEffect(() => {
    if (apiKeysLoaded) {
      setProviders(initialProviders);
    }
  }, [initialProviders, apiKeysLoaded]);

  const handleToggleProvider = React.useCallback(
    (id: string, enabled?: boolean, apiKeyId?: string) => {
      setProviders((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const newEnabled = enabled !== undefined ? enabled : !p.connected;
            return {
              ...p,
              connected: newEnabled,
              type: newEnabled ? 'enabled' : 'disabled',
              apiKeyId: apiKeyId || p.apiKeyId,
            };
          }
          return p;
        }),
      );
    },
    [],
  );

  const handleSaveProvider = React.useCallback((providerId: string, apiKeyId: string) => {
    setProviders((prev) => prev.map((p) => (p.id === providerId ? { ...p, apiKeyId } : p)));
    setSavedApiKeys((prev) => {
      const existing = prev.find((k) => k.providerName.toLowerCase() === providerId.toLowerCase());
      if (existing) {
        return prev.map((k) =>
          k.providerName.toLowerCase() === providerId.toLowerCase() ? { ...k, id: apiKeyId } : k,
        );
      }
      return [
        ...prev,
        {
          id: apiKeyId,
          providerName: providerId,
          proxyUrl: '',
          enabled: false,
          configSource: 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const handleAddProvider = React.useCallback((provider: Provider) => {
    setProviders((prev) => [provider, ...prev]);

    if (provider.apiKeyId) {
      setSavedApiKeys((prev) => [
        ...prev,
        {
          id: provider.apiKeyId as string,
          providerName: provider.id,
          proxyUrl: provider.proxyUrl || '',
          enabled: false,
          configSource: 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCustom: provider.isCustom,
          providerType: provider.providerType,
        },
      ]);
    }
  }, []);

  const handleDeleteProvider = React.useCallback((providerId: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== providerId));
    setSavedApiKeys((prev) =>
      prev.filter((k) => k.providerName.toLowerCase() !== providerId.toLowerCase()),
    );
  }, []);

  const renderSidebarItem = (id: Tab, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => {
        setActiveTab(id);
      }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id
          ? 'bg-secondary text-secondary-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="h-full flex bg-background overflow-hidden">
      <div className="w-64 flex-none border-r border-border bg-muted/40 flex flex-col">
        <div className="p-4 pb-2">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="px-3 space-y-1">
          {renderSidebarItem('general', t('tabs.general'), <Settings2Icon className="h-4 w-4" />)}
          {renderSidebarItem('provider', t('tabs.provider'), <BotIcon className="h-4 w-4" />)}
          {renderSidebarItem(
            'system-model',
            t('tabs.system_model'),
            <BoxIcon className="h-4 w-4" />,
          )}
          {renderSidebarItem('storage', t('tabs.storage'), <DatabaseIcon className="h-4 w-4" />)}
          {renderSidebarItem('help', t('tabs.help'), <LifeBuoyIcon className="h-4 w-4" />)}
          {renderSidebarItem('about', t('tabs.about'), <InfoIcon className="h-4 w-4" />)}
        </div>
        <div className="mt-auto p-4">
          <div className="text-xs text-muted-foreground">{t('powered_by', { name: 'LMRing' })}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {activeTab === 'provider' ? (
          <ProviderLayout
            providers={providers}
            isLoading={!apiKeysLoaded}
            onToggleProvider={handleToggleProvider}
            onSaveProvider={handleSaveProvider}
            onAddProvider={handleAddProvider}
            onDeleteProvider={handleDeleteProvider}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-lg font-medium mb-1">{t('general.title')}</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-base">{t('general.theme')}</Label>
                        <div className="grid grid-cols-3 gap-4 max-w-md">
                          <button
                            type="button"
                            className="cursor-pointer group text-left"
                            onClick={() => setTheme('light')}
                          >
                            <div
                              className={`border-2 rounded-lg p-1 mb-2 group-hover:border-primary transition-colors overflow-hidden ${
                                mounted && theme === 'light' ? 'border-primary' : 'border-muted'
                              }`}
                            >
                              <div className="bg-[#f4f4f5] h-16 rounded w-full relative">
                                <div className="absolute top-2 left-2 w-8 h-2 bg-white rounded-sm shadow-sm" />
                                <div className="absolute top-6 left-2 w-12 h-8 bg-white rounded-sm shadow-sm" />
                              </div>
                            </div>
                            <div className="text-center text-sm font-medium flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">☀</span>{' '}
                              {t('general.theme_light')}
                            </div>
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer group text-left"
                            onClick={() => setTheme('dark')}
                          >
                            <div
                              className={`border-2 rounded-lg p-1 mb-2 group-hover:border-primary transition-colors overflow-hidden ${
                                mounted && theme === 'dark' ? 'border-primary' : 'border-muted'
                              }`}
                            >
                              <div className="bg-[#18181b] h-16 rounded w-full relative">
                                <div className="absolute top-2 left-2 w-8 h-2 bg-zinc-800 rounded-sm" />
                                <div className="absolute top-6 left-2 w-12 h-8 bg-zinc-800 rounded-sm" />
                              </div>
                            </div>
                            <div className="text-center text-sm font-medium flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">🌙</span>{' '}
                              {t('general.theme_dark')}
                            </div>
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer group text-left"
                            onClick={() => setTheme('system')}
                          >
                            <div
                              className={`border-2 rounded-lg p-1 mb-2 group-hover:border-primary transition-colors overflow-hidden ${
                                mounted && theme === 'system' ? 'border-primary' : 'border-muted'
                              }`}
                            >
                              <div className="bg-gradient-to-br from-[#f4f4f5] to-[#18181b] h-16 rounded w-full flex relative">
                                <div className="w-1/2 h-full relative">
                                  <div className="absolute top-2 left-2 w-4 h-2 bg-white rounded-sm shadow-sm" />
                                </div>
                                <div className="w-1/2 h-full relative">
                                  <div className="absolute top-2 right-2 w-4 h-2 bg-zinc-800 rounded-sm" />
                                </div>
                              </div>
                            </div>
                            <div className="text-center text-sm font-medium flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">💻</span>{' '}
                              {t('general.theme_auto')}
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base">{t('general.language')}</Label>
                        <div className="max-w-md">
                          <Select value={locale} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select language">
                                {LANGUAGE_NAMES[locale] || locale.toUpperCase()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {I18nConfig.locales.map((loc) => (
                                <SelectItem key={loc} value={loc}>
                                  {LANGUAGE_NAMES[loc] || loc.toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'system-model' && (
                  <motion.div
                    key="system-model"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-lg font-medium mb-1">{t('system_model.title')}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t('system_model.description')}
                      </p>
                    </div>

                    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 mb-4">
                          <InfoIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          {t('system_model.under_development')}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {t('system_model.coming_soon')}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'storage' && (
                  <motion.div
                    key="storage"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-lg font-medium mb-1">{t('storage.title')}</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between py-4 border-b">
                        <div className="space-y-0.5">
                          <div className="font-medium">{t('storage.import_data')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('storage.import_data_description')}
                          </div>
                        </div>
                        <Button variant="outline" className="gap-2">
                          <DatabaseIcon className="h-4 w-4" /> {t('storage.import')}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'help' && (
                  <motion.div
                    key="help"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-lg font-medium mb-1">{t('help.title')}</h2>
                      <p className="text-sm text-muted-foreground">{t('help.description')}</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('help.resources')}
                        </h3>
                        <div className="grid gap-4">
                          <Link href="/how-it-works" target="_blank" rel="noopener noreferrer">
                            <Card className="cursor-pointer hover:shadow-md transition-all">
                              <CardContent className="p-4 flex items-center gap-4">
                                <HelpCircleIcon className="h-8 w-8 text-primary" />
                                <div>
                                  <h4 className="font-medium">{t('help.how_it_works')}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {t('help.how_it_works_description')}
                                  </p>
                                </div>
                                <ExternalLinkIcon className="h-4 w-4 ml-auto text-muted-foreground" />
                              </CardContent>
                            </Card>
                          </Link>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('help.about_us')}
                        </h3>
                        <div className="grid gap-4">
                          <a
                            href="https://github.com/llm-ring"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Card className="cursor-pointer hover:shadow-md transition-all">
                              <CardContent className="p-4 flex items-center gap-4">
                                <InfoIcon className="h-8 w-8 text-primary" />
                                <div>
                                  <h4 className="font-medium">{t('help.about_lmring')}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {t('help.about_lmring_description')}
                                  </p>
                                </div>
                                <ExternalLinkIcon className="h-4 w-4 ml-auto text-muted-foreground" />
                              </CardContent>
                            </Card>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-lg font-medium mb-1">{t('about.title')}</h2>
                    </div>

                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">LMRing</h3>
                          <p className="text-sm text-muted-foreground">v2.0.0-next.135</p>
                        </div>
                        <a
                          href="https://github.com/llm-ring/lmring/releases"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline">{t('about.changelog')}</Button>
                        </a>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('about.contact_us')}
                        </h3>
                        <div className="space-y-2">
                          <a
                            href="https://lmring.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:underline"
                          >
                            <GlobeIcon className="h-4 w-4" /> {t('about.official_website')}{' '}
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                          <a
                            href="https://github.com/llm-ring"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:underline"
                          >
                            <GithubIcon className="h-4 w-4" /> {t('about.contact_us')}{' '}
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('about.community')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <a
                            href="https://github.com/llm-ring/lmring/discussions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                          >
                            <Button variant="secondary" className="w-full justify-start gap-2">
                              <GithubIcon className="h-4 w-4" /> GitHub
                            </Button>
                          </a>
                          <Button
                            variant="secondary"
                            className="w-full justify-start gap-2"
                            disabled
                          >
                            <div className="h-4 w-4 bg-indigo-500 rounded-full" /> Discord{' '}
                            {t('about.coming_soon')}
                          </Button>
                          <Button
                            variant="secondary"
                            className="w-full justify-start gap-2"
                            disabled
                          >
                            <TwitterIcon className="h-4 w-4" /> X / Twitter {t('about.coming_soon')}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('about.legal')}
                        </h3>
                        <div className="space-y-2">
                          <a
                            href="https://github.com/llm-ring/lmring/blob/main/TERMS.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:underline"
                          >
                            {t('about.terms')} <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                          <a
                            href="https://github.com/llm-ring/lmring/blob/main/PRIVACY.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:underline"
                          >
                            {t('about.privacy')} <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">{t('about.telemetry')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('about.telemetry_description')}
                          </div>
                        </div>
                        <Switch checked={telemetryEnabled} onCheckedChange={setTelemetryEnabled} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
