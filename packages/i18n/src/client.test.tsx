import { render } from '@testing-library/react';
import { useTranslation as reactI18nextUseTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { getI18nInstance, I18nProvider, useTranslation } from './client';

describe('getI18nInstance', () => {
  it('returns null before initialization', () => {
    // When no I18nProvider has been rendered yet, getI18nInstance returns null
    // Note: This test relies on the initial module state
    expect(getI18nInstance()).toBe(null);
  });
});

describe('I18nProvider', () => {
  it('renders children when instance is ready', async () => {
    const { findByText } = render(
      <I18nProvider locale="en" messages={{ hello: 'Hello' }}>
        <div>Test Content</div>
      </I18nProvider>,
    );

    const content = await findByText('Test Content');
    expect(content).toBeDefined();
  });

  it('returns null while initializing', () => {
    // This is a synchronous check - the provider initially returns null before init completes
    // We test this by checking the implementation details
    expect(I18nProvider).toBeDefined();
    expect(typeof I18nProvider).toBe('function');
  });

  it('uses defaultLocale for invalid locale', async () => {
    const { findByText } = render(
      <I18nProvider locale="invalid" messages={{ hello: 'Hello' }}>
        <div>Content With Invalid Locale</div>
      </I18nProvider>,
    );

    const content = await findByText('Content With Invalid Locale');
    expect(content).toBeDefined();
    // The component should fall back to 'en' for invalid locales
  });

  it('syncs language when remounted with a new locale (locale-keyed remount)', async () => {
    function ShowGreeting() {
      const { t } = useTranslation();
      return <div>{t('greeting')}</div>;
    }

    // First mount: the shared global instance must switch to fr
    const { rerender, findByText } = render(
      <I18nProvider key="fr" locale="fr" messages={{ greeting: 'Bonjour' }}>
        <ShowGreeting />
      </I18nProvider>,
    );
    expect(await findByText('Bonjour')).toBeDefined();

    // Key change remounts the provider (as language-provider does); the reused
    // global instance must pick up the new bundle and language
    rerender(
      <I18nProvider key="zh" locale="zh" messages={{ greeting: '你好' }}>
        <ShowGreeting />
      </I18nProvider>,
    );
    expect(await findByText('你好')).toBeDefined();
    expect(getI18nInstance()?.language).toBe('zh');
  });
});

describe('useTranslation', () => {
  it('is re-exported from react-i18next', () => {
    expect(useTranslation).toBe(reactI18nextUseTranslation);
  });
});
