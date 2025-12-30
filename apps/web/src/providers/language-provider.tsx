'use client';

import type { Locale } from '@lmring/i18n';
import type { Messages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
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
  initialMessages: Messages;
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

function DynamicIntlProvider({
  children,
  initialLanguage,
  initialMessages,
}: {
  children: ReactNode;
  initialLanguage: Locale;
  initialMessages: Messages;
}) {
  const language = useLanguageStore(languageSelectors.language);
  const [messages, setMessages] = useState<Messages>(initialMessages);
  const [currentLocale, setCurrentLocale] = useState<Locale>(initialLanguage);

  useEffect(() => {
    if (language === currentLocale) {
      return;
    }

    let cancelled = false;

    loadLocaleMessages(language)
      .then((loadedMessages) => {
        if (cancelled) {
          return;
        }
        setMessages(loadedMessages);
        setCurrentLocale(language);
      })
      .catch((error) => {
        console.error('Failed to load locale messages', error);
      });

    return () => {
      cancelled = true;
    };
  }, [language, currentLocale]);

  return (
    <NextIntlClientProvider
      key={currentLocale}
      locale={currentLocale}
      messages={messages}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
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
      <DynamicIntlProvider initialLanguage={initialLanguage} initialMessages={initialMessages}>
        {children}
      </DynamicIntlProvider>
    </LanguageStoreProvider>
  );
}
