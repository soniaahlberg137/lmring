import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Toaster } from 'sonner';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { ThemeProvider } from '@/components/theme-provider';
import { thinScrollbar } from '@/libs/scrollbar';
import { loadLocaleMessages } from '@/libs/load-locale-messages';
import { getRequestLocale } from '@/libs/request-locale';
import { LanguageProvider } from '@/providers/language-provider';
import '@/styles/global.css';
import '@/styles/arena.css';

export const metadata: Metadata = {
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    { rel: 'icon', url: '/favicon.ico' },
  ],
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const messages = await loadLocaleMessages(locale);

  return (
    <html lang={locale} className="scroll-smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className={`min-h-screen ${thinScrollbar}`}>
        <LanguageProvider initialLanguage={locale} initialMessages={messages}>
          <ThemeProvider>
            <PostHogProvider>{props.children}</PostHogProvider>
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
