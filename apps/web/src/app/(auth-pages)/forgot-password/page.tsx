import { env } from '@lmring/env';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getRequestLocale } from '@/libs/request-locale';
import { getServerTranslations } from '@/libs/server-translations';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return {
    title: t('ForgotPassword.meta_title'),
    description: t('ForgotPassword.meta_description'),
  };
}

export default async function ForgotPasswordPage() {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  // If email is not enabled, redirect to sign-in
  if (env.NEXT_PUBLIC_EMAIL_ENABLED !== 'true') {
    redirect('/sign-in');
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('ForgotPassword.meta_title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('ForgotPassword.meta_description')}</p>
      </div>

      <ForgotPasswordForm />

      <div className="text-center text-sm">
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('ForgotPassword.back_to_sign_in')}
        </Link>
      </div>
    </div>
  );
}
