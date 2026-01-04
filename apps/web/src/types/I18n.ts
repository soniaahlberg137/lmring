import type { Locale } from '@lmring/i18n';
import type messages from '@/locales/en.json';

export type Messages = typeof messages;
export type MessageKey = keyof Messages;
export type { Locale };
