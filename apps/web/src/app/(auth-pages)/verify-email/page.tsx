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
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);
  const { email, callbackUrl } = await props.searchParams;

  // If email is not enabled, redirect to sign-in
  if (env.NEXT_PUBLIC_EMAIL_ENABLED !== 'true') {
    redirect('/sign-in');
  }

  // Get the current session to check if user is logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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

      <VerifyEmailForm
        email={userEmail}
        callbackUrl={callbackUrl || '/arena'}
        translations={{
          description: t('VerifyEmail.description'),
          otpLabel: t('VerifyEmail.otp_label'),
          otpPlaceholder: t('VerifyEmail.otp_placeholder'),
          verifyButton: t('VerifyEmail.verify_button'),
          verifyingButton: t('VerifyEmail.verifying_button'),
          resendCode: t('VerifyEmail.resend_code'),
          resendingCode: t('VerifyEmail.resending_code'),
          codeSent: t('VerifyEmail.code_sent'),
        }}
      />
    </div>
  );
}
