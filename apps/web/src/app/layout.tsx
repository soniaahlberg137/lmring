import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { JsonLd } from '@/components/seo/JsonLd';
import { ThemeProvider } from '@/components/theme-provider';
import { loadLocaleMessages } from '@/libs/load-locale-messages';
import { getRequestLocale } from '@/libs/request-locale';
import { LanguageProvider } from '@/providers/language-provider';
import '@/styles/global.css';
import '@/styles/arena.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://lmring.com'),
  title: {
    default: 'LMRing - AI Model Comparison Platform | Compare LLMs Side by Side',
    template: '%s | LMRing',
  },
  description:
    'Compare and evaluate AI large language models side-by-side. LMRing offers real-time benchmarks, community-driven ELO rankings, and comprehensive analysis to help you find the best AI model.',
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    { rel: 'icon', url: '/favicon.ico' },
  ],
  openGraph: {
    type: 'website',
    siteName: 'LMRing',
    title: 'LMRing - AI Model Comparison Platform',
    description:
      'Compare and evaluate AI large language models side-by-side with real benchmarks, community rankings, and comprehensive analysis.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LMRing - AI Model Comparison Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LMRing - AI Model Comparison Platform',
    description:
      'Compare and evaluate AI large language models side-by-side with real benchmarks and community rankings.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  const messages = await loadLocaleMessages(locale);

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${inter.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <JsonLd />
      </head>
      <body suppressHydrationWarning className={`min-h-screen`}>
        <LanguageProvider initialLanguage={locale} initialMessages={messages}>
          <ThemeProvider>
            {props.children}
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
