import { env } from '@lmring/env';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/libs/Auth';
import { getRequestLocale } from '@/libs/request-locale';
import { getServerTranslations } from '@/libs/server-translations';
import { VerifyEmailForm } from './VerifyEmailForm';

type IVerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; callbackUrl?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return {
    title: t('VerifyEmail.meta_title'),
    description: t('VerifyEmail.meta_description'),
  };
}

export default async function VerifyEmailPage(props: IVerifyEmailPageProps) {
  const [locale, hdrs, searchParams] = await Promise.all([
    getRequestLocale(),
    headers(),
    props.searchParams,
  ]);
  const { email, callbackUrl } = searchParams;

  // If email is not enabled, redirect to sign-in
  if (env.NEXT_PUBLIC_EMAIL_ENABLED !== 'true') {
    redirect('/sign-in');
  }

  // Get the current session and translations in parallel
  const [t, session] = await Promise.all([
    getServerTranslations(locale),
    auth.api.getSession({ headers: hdrs }),
  ]);

  // Use session email if available, otherwise use query param
  const userEmail = session?.user?.email || email;

  // If no email available, redirect to sign-in
  if (!userEmail) {
    redirect('/sign-in');
  }

  // If user is already verified, redirect to arena
  if (session?.user?.emailVerified) {
    redirect(callbackUrl || '/arena');
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('VerifyEmail.meta_title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('VerifyEmail.meta_description')}</p>
      </div>

      <VerifyEmailForm email={userEmail} callbackUrl={callbackUrl || '/arena'} />
    </div>
  );
}
