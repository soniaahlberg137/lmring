import type { Locale } from '@lmring/i18n';
import { loadLocaleMessages } from './load-locale-messages';

export async function getServerTranslations(locale: Locale) {
  const messages = await loadLocaleMessages(locale);

  return function t(key: string, values?: Record<string, string | number>): string {
    let message = messages[key] || key;

    if (values) {
      for (const [k, v] of Object.entries(values)) {
        message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }

    return message;
  };
}
