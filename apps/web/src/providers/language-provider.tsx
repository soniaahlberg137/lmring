'use client';

import { I18nConfig, type Locale } from '@lmring/i18n';
import { I18nProvider } from '@lmring/i18n/client';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { loadLocaleMessages } from '@/libs/load-locale-messages';
import { LANGUAGE_QUERY_PARAM } from '@/libs/locale-utils';
import {
  LanguageStoreProvider,
  languageSelectors,
  useLanguageStore,
} from '@/stores/language-store';

const LANGUAGE_SW_PATH = '/language-sw.js';
const LANGUAGE_SW_MESSAGE = 'SET_LANGUAGE';

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage: Locale;
  initialMessages: Record<string, string>;
}

function notifyServiceWorker(language: Locale) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const message = { type: LANGUAGE_SW_MESSAGE, payload: language };

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
    return;
  }

  void navigator.serviceWorker.ready
    .then((registration) => {
      registration.active?.postMessage(message);
    })
    .catch((error) => {
      console.error('Failed to sync language with service worker', error);
    });
}

function LanguageServiceWorkerBridge() {
  const language = useLanguageStore(languageSelectors.language);
  const isRegisteringRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    if (isRegisteringRef.current) {
      return;
    }

    isRegisteringRef.current = true;

    navigator.serviceWorker.register(LANGUAGE_SW_PATH, { scope: '/' }).catch((error) => {
      console.error('Failed to register language service worker', error);
      isRegisteringRef.current = false;
    });
  }, []);

  useEffect(() => {
    notifyServiceWorker(language);
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.get(LANGUAGE_QUERY_PARAM) !== language) {
      return;
    }

    url.searchParams.delete(LANGUAGE_QUERY_PARAM);
    window.history.replaceState(window.history.state, '', url.toString());
  }, [language]);

  return null;
}

function DynamicI18nProvider({
  children,
  initialLanguage,
  initialMessages,
}: {
  children: ReactNode;
  initialLanguage: Locale;
  initialMessages: Record<string, string>;
}) {
  const language = useLanguageStore(languageSelectors.language);
  const [messages, setMessages] = useState<Record<string, string>>(initialMessages);
  const [currentLocale, setCurrentLocale] = useState<Locale>(initialLanguage);
  const failedLocalesRef = useRef<Set<Locale>>(new Set());

  useEffect(() => {
    if (language === currentLocale) {
      return;
    }

    // Skip if this locale has already failed to load
    if (failedLocalesRef.current.has(language)) {
      return;
    }

    let cancelled = false;

    loadLocaleMessages(language)
      .then((loadedMessages) => {
        if (cancelled) {
          return;
        }
        // Clear from failed set on successful load
        failedLocalesRef.current.delete(language);
        setMessages(loadedMessages);
        setCurrentLocale(language);
      })
      .catch((error) => {
        console.error('Failed to load locale messages for', language, error);

        if (cancelled) {
          return;
        }

        // Mark this locale as failed to prevent retry loops
        failedLocalesRef.current.add(language);

        // Fallback to default locale if not already on it
        if (currentLocale !== I18nConfig.defaultLocale) {
          loadLocaleMessages(I18nConfig.defaultLocale)
            .then((fallbackMessages) => {
              if (cancelled) {
                return;
              }
              setMessages(fallbackMessages);
              setCurrentLocale(I18nConfig.defaultLocale);
            })
            .catch((fallbackError) => {
              console.error('Failed to load fallback locale messages', fallbackError);
            });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language, currentLocale]);

  return (
    <I18nProvider key={currentLocale} locale={currentLocale} messages={messages}>
      {children}
    </I18nProvider>
  );
}

export function LanguageProvider({
  children,
  initialLanguage,
  initialMessages,
}: LanguageProviderProps) {
  return (
    <LanguageStoreProvider initialLanguage={initialLanguage}>
      <LanguageServiceWorkerBridge />
      <DynamicI18nProvider initialLanguage={initialLanguage} initialMessages={initialMessages}>
        {children}
      </DynamicI18nProvider>
    </LanguageStoreProvider>
  );
}
