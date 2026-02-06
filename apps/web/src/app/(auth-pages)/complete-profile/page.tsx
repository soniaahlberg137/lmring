import { isPlaceholderEmail } from '@lmring/auth';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/libs/Auth';
import { getRequestLocale } from '@/libs/request-locale';
import { getServerTranslations } from '@/libs/server-translations';
import { CompleteProfileForm } from './CompleteProfileForm';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  return {
    title: t('CompleteProfile.meta_title'),
    description: t('CompleteProfile.meta_description'),
  };
}

export default async function CompleteProfilePage() {
  const locale = await getRequestLocale();
  const t = await getServerTranslations(locale);

  // Get the current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If not logged in, redirect to sign-in
  if (!session?.user) {
    redirect('/sign-in');
  }

  // If user already has a real email, redirect to arena
  if (session.user.email && !isPlaceholderEmail(session.user.email)) {
    redirect('/arena');
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('CompleteProfile.meta_title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('CompleteProfile.meta_description')}
        </p>
      </div>

      <CompleteProfileForm
        userName={session.user.name || ''}
        translations={{
          emailLabel: t('CompleteProfile.email_label'),
          emailPlaceholder: t('CompleteProfile.email_placeholder'),
          submitButton: t('CompleteProfile.submit_button'),
          submittingButton: t('CompleteProfile.submitting_button'),
          verifyTitle: t('CompleteProfile.verify_title'),
          verifyDescription: t('CompleteProfile.verify_description'),
          otpLabel: t('CompleteProfile.otp_label'),
          otpPlaceholder: t('CompleteProfile.otp_placeholder'),
          verifyButton: t('CompleteProfile.verify_button'),
          verifyingButton: t('CompleteProfile.verifying_button'),
          resendCode: t('CompleteProfile.resend_code'),
          resendingCode: t('CompleteProfile.resending_code'),
        }}
      />
    </div>
  );
}
