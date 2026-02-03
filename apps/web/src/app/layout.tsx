import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { ThemeProvider } from '@/components/theme-provider';
import { loadLocaleMessages } from '@/libs/load-locale-messages';
import { getRequestLocale } from '@/libs/request-locale';
import { QueryProvider } from '@/providers';
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
  const messages = await loadLocaleMessages(locale);

  return (
    <html
      lang={locale}
      className="scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className={`min-h-screen`}>
        <LanguageProvider initialLanguage={locale} initialMessages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <PostHogProvider>{props.children}</PostHogProvider>
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
