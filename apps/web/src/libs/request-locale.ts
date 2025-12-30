import type { Locale } from '@lmring/i18n';
import { headers } from 'next/headers';
import { LANGUAGE_HEADER, resolveLocale } from './locale-utils';

export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();

  const headerLocale = headerStore.get(LANGUAGE_HEADER);
  const acceptLanguage = headerStore.get('accept-language');

  return resolveLocale({
    headerLocale,
    acceptLanguage,
  });
}
