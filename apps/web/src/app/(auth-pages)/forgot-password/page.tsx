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

      <ForgotPasswordForm
        translations={{
          emailLabel: t('ForgotPassword.email_label'),
          emailPlaceholder: t('ForgotPassword.email_placeholder'),
          sendCodeButton: t('ForgotPassword.send_code_button'),
          sendingCodeButton: t('ForgotPassword.sending_code_button'),
          verifyTitle: t('ForgotPassword.verify_title'),
          verifyDescription: t('ForgotPassword.verify_description'),
          otpLabel: t('ForgotPassword.otp_label'),
          otpPlaceholder: t('ForgotPassword.otp_placeholder'),
          newPasswordLabel: t('ForgotPassword.new_password_label'),
          newPasswordPlaceholder: t('ForgotPassword.new_password_placeholder'),
          confirmPasswordLabel: t('ForgotPassword.confirm_password_label'),
          confirmPasswordPlaceholder: t('ForgotPassword.confirm_password_placeholder'),
          resetButton: t('ForgotPassword.reset_button'),
          resettingButton: t('ForgotPassword.resetting_button'),
          resendCode: t('ForgotPassword.resend_code'),
          resendingCode: t('ForgotPassword.resending_code'),
          successTitle: t('ForgotPassword.success_title'),
          successDescription: t('ForgotPassword.success_description'),
          signInLink: t('ForgotPassword.sign_in_link'),
          passwordsMismatch: t('ForgotPassword.passwords_mismatch'),
        }}
      />

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
