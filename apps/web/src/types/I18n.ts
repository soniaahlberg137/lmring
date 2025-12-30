import type { Locale } from '@lmring/i18n';
import type messages from '@/locales/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
