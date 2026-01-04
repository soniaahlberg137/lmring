import { I18nConfig, type Locale, isValidLocale } from './config';

export function getLocaleFromRequest(requestLocale: string | undefined): Locale {
  return isValidLocale(requestLocale) ? requestLocale : I18nConfig.defaultLocale;
}
