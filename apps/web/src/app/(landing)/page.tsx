import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { WebGLBackground } from '@/components/home/webgl-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { getRequestLocale } from '@/libs/request-locale';

export default async function LandingPage() {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Index' });

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">
      {/* Background */}
      <WebGLBackground />

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 text-center">
        {/* Hero Section */}
        <section className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-10">
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl md:text-8xl">
            <span className="bg-gradient-to-b from-black to-gray-800 bg-clip-text text-transparent drop-shadow-2xl">
              {t('title')}
            </span>
          </h1>

          <div className="max-w-2xl text-center">
            <p className="text-2xl md:text-3xl lg:text-4xl font-normal text-black drop-shadow-md">
              Compare AI models side by side
            </p>
            <p className="text-lg md:text-xl font-normal text-black mt-2 drop-shadow-md">
              and find the best fit for your needs
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row mt-8">
            <Link href="/sign-up/">
              <button
                type="button"
                className="h-12 px-8 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {t('get_started')}
              </button>
            </Link>

            <Link href="/arena/">
              <GradientButton>{t('view_arena')}</GradientButton>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
