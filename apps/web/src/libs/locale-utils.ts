import { I18nConfig, type Locale } from '@lmring/i18n';

export const LANGUAGE_HEADER = 'x-language';
export const LANGUAGE_QUERY_PARAM = 'lang';

export function isSupportedLocale(locale: string | null | undefined): locale is Locale {
  if (!locale) {
    return false;
  }

  return (I18nConfig.locales as readonly string[]).includes(locale);
}

export function parseAcceptLanguage(headerValue: string | null | undefined): Locale | null {
  if (!headerValue) {
    return null;
  }

  const candidates = headerValue.split(',');

  for (const candidate of candidates) {
    const [langPart] = candidate.trim().split(';');
    if (!langPart) {
      continue;
    }

    const normalized = langPart.toLowerCase();

    if (isSupportedLocale(normalized)) {
      return normalized;
    }

    const shortCode = normalized.split('-')[0];
    if (!shortCode) {
      continue;
    }
    const matched = (I18nConfig.locales as readonly string[]).find((locale) =>
      locale.startsWith(shortCode),
    );

    if (matched) {
      return matched as Locale;
    }
  }

  return null;
}

export function resolveLocale({
  headerLocale,
  acceptLanguage,
}: {
  headerLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isSupportedLocale(headerLocale)) {
    return headerLocale;
  }

  const accepted = parseAcceptLanguage(acceptLanguage);
  if (accepted) {
    return accepted;
  }

  return I18nConfig.defaultLocale;
}
