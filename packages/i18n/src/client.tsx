'use client';

import i18next from 'i18next';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { I18nConfig, type Locale, isValidLocale } from './config';

let globalI18nInstance: typeof i18next | null = null;

export function getI18nInstance() {
  return globalI18nInstance;
}

interface I18nProviderProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, string>;
}

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  const messagesRef = useRef(messages);
  const initializedRef = useRef(false);
  const [instance, setInstance] = useState<typeof i18next | null>(() => globalI18nInstance);

  const validLocale: Locale = useMemo(
    () => (isValidLocale(locale) ? locale : I18nConfig.defaultLocale),
    [locale]
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (initializedRef.current && globalI18nInstance) {
      if (globalI18nInstance.language !== validLocale) {
        globalI18nInstance.addResourceBundle(validLocale, 'translation', messagesRef.current, true, true);
        globalI18nInstance.changeLanguage(validLocale);
      }
      return;
    }

    if (globalI18nInstance) {
      setInstance(globalI18nInstance);
      initializedRef.current = true;
      return;
    }

    const newInstance = i18next.createInstance();
    newInstance.use(initReactI18next).init({
      lng: validLocale,
      fallbackLng: I18nConfig.fallbackLng,
      supportedLngs: I18nConfig.locales as unknown as string[],
      resources: {
        [validLocale]: {
          translation: messagesRef.current,
        },
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    globalI18nInstance = newInstance;
    setInstance(newInstance);
    initializedRef.current = true;
  }, [validLocale]);

  if (!instance) {
    return null;
  }

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}

export { useTranslation } from 'react-i18next';
