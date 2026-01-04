import type { Locale } from '@lmring/i18n';

type MessageLoader = () => Promise<Record<string, string>>;

const loaders: Record<Locale, MessageLoader> = {
  en: () => import('@/locales/en.json').then((module) => module.default),
  zh: () => import('@/locales/zh.json').then((module) => module.default),
  fr: () => import('@/locales/fr.json').then((module) => module.default),
};

export async function loadLocaleMessages(locale: Locale): Promise<Record<string, string>> {
  const loader = loaders[locale];

  if (!loader) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  return loader();
}
