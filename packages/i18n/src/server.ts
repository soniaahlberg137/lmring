import { I18nConfig, type Locale, isValidLocale } from './config';

export type MessageLoader = (locale: Locale) => Promise<Record<string, string>>;

let messageLoader: MessageLoader | null = null;

export function setMessageLoader(loader: MessageLoader) {
  messageLoader = loader;
}

export async function getMessages(locale: string): Promise<Record<string, string>> {
  const validLocale: Locale = isValidLocale(locale) ? locale : I18nConfig.defaultLocale;

  if (!messageLoader) {
    console.warn('Message loader not set. Call setMessageLoader first.');
    return {};
  }

  return messageLoader(validLocale);
}

export function getLocaleFromRequest(requestLocale: string | undefined): Locale {
  return isValidLocale(requestLocale) ? requestLocale : I18nConfig.defaultLocale;
}
