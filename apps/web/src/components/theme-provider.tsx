'use client';

import { paletteToCssVars } from '@lmring/theme';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { themeSelectors, useThemeStore } from '@/stores/theme-store';

function ThemeCssBridge(): null {
  const mode = useThemeStore(themeSelectors.mode);
  const palette = useThemeStore(themeSelectors.palette);
  const hydrated = useThemeStore(themeSelectors.hydrated);
  const hydrateFromLocal = useThemeStore(themeSelectors.hydrateFromLocal);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const previousModeRef = useRef<'light' | 'dark' | null>(null);
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    hydrateFromLocal();
  }, [hydrateFromLocal]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemMode = (): void => {
      setSystemMode(mediaQuery.matches ? 'dark' : 'light');
    };

    updateSystemMode();

    mediaQuery.addEventListener('change', updateSystemMode);
    return () => {
      mediaQuery.removeEventListener('change', updateSystemMode);
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (theme !== mode) {
      setTheme(mode);
    }
  }, [hydrated, mode, setTheme, theme]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      const root = document.documentElement;
      const effectiveMode =
        mode === 'system' ? (resolvedTheme === 'dark' ? 'dark' : systemMode) : mode;
      const cssVars = paletteToCssVars(palette[effectiveMode]);

      Object.entries(cssVars).forEach(([key, value]: [string, string]) => {
        root.style.setProperty(key, value);
      });
    } catch (error) {
      console.error('Failed to apply theme CSS variables:', error);
    }
  }, [hydrated, mode, palette, resolvedTheme, systemMode]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const root = document.documentElement;
    const effectiveMode =
      mode === 'system' ? (resolvedTheme === 'dark' ? 'dark' : systemMode) : mode;

    if (previousModeRef.current && previousModeRef.current !== effectiveMode) {
      root.classList.add('theme-transitioning');

      const timer = window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 300);

      previousModeRef.current = effectiveMode;
      return () => {
        window.clearTimeout(timer);
      };
    }

    previousModeRef.current = effectiveMode;
  }, [hydrated, mode, resolvedTheme, systemMode]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // React 19.2 warns on client-rendered executable <script>; the theme init
  // script only needs to run from the SSR HTML, so neutralize the type on
  // client re-renders (e.g. locale-change remounts) — see next-themes#387
  const scriptProps =
    typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={scriptProps}
    >
      <ThemeCssBridge />
      {children}
    </NextThemesProvider>
  );
}
