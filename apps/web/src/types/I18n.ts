import type { Locale } from '@lmring/i18n';
import type messages from '@/locales/en.json';

type Messages = typeof messages;

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }

  interface IntlMessages extends Messages {}
}
