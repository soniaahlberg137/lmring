'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type messages from '@/locales/en.json';

type MessageKey = keyof typeof messages;

type TranslationValues = Record<string, string | number | boolean | Date | null | undefined>;

export type TranslationFunction = {
  (key: MessageKey): string;
  (key: MessageKey, values: TranslationValues): string;
};

export function useTranslations(): TranslationFunction {
  const { t } = useTranslation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: t changes when language changes in react-i18next
  const translate = useCallback(
    ((key: MessageKey, values?: TranslationValues) => {
      if (values) {
        return t(key, values);
      }
      return t(key);
    }) as TranslationFunction,
    [t],
  );

  return translate;
}
