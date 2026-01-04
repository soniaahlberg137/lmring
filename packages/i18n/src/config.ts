export const I18nConfig = {
  locales: ['en', 'zh', 'fr'] as const,
  defaultLocale: 'en' as const,
  fallbackLng: 'en' as const,
} as const;

export type Locale = (typeof I18nConfig.locales)[number];

export function isValidLocale(locale: string | undefined): locale is Locale {
  return locale != null && (I18nConfig.locales as readonly string[]).includes(locale);
}
