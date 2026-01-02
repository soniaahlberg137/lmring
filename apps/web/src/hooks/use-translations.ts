import type messages from '@/locales/en.json';
import { useTranslations as useNextIntlTranslations } from 'next-intl';

type MessageKey = keyof typeof messages;

type TranslationValues = Record<string, string | number | boolean | Date | null | undefined>;

type TranslationFunction = {
  (key: MessageKey): string;
  (key: MessageKey, values: TranslationValues): string;
  rich: (
    key: MessageKey,
    values?: Record<string, string | number | ((chunks: React.ReactNode) => React.ReactNode)>,
  ) => React.ReactNode;
  raw: (key: MessageKey) => string;
  has: (key: MessageKey) => boolean;
};

export function useTranslations(): TranslationFunction {
  const t = useNextIntlTranslations();
  return t as unknown as TranslationFunction;
}
