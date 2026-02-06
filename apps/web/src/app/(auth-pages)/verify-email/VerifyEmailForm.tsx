'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { authClient } from '@/libs/AuthClient';

interface VerifyEmailFormProps {
  email: string;
  callbackUrl: string;
}

export function VerifyEmailForm({ email, callbackUrl }: VerifyEmailFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const codeSentRef = useRef(false);

  // Send verification code on mount
  useEffect(() => {
    if (codeSentRef.current) return;
    codeSentRef.current = true;

    authClient.emailOtp
      .sendVerificationOtp({
        email,
        type: 'email-verification',
      })
      .catch(() => {
        // Silently fail, user can request resend
      });
  }, [email]);

  const handleVerifySubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (result.error) {
        setError(result.error.message || 'Invalid verification code');
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to callback URL
      router.push(callbackUrl);
      router.refresh();
    } catch (_err) {
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'email-verification',
      });

      if (result.error) {
        setError(result.error.message || 'Failed to resend code');
      } else {
        setSuccess(t('VerifyEmail.code_sent'));
      }
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{t('VerifyEmail.description', { email })}</p>
      </div>

      <form onSubmit={handleVerifySubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium mb-2">
            {t('VerifyEmail.otp_label')}
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl tracking-widest"
            placeholder={t('VerifyEmail.otp_placeholder')}
            disabled={isSubmitting || isResending}
            autoComplete="one-time-code"
          />
        </div>

        {error ? (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg dark:text-green-400 dark:bg-green-950 dark:border-green-800">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || otp.length !== 6}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? t('VerifyEmail.verifying_button') : t('VerifyEmail.verify_button')}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isSubmitting || isResending}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isResending ? t('VerifyEmail.resending_code') : t('VerifyEmail.resend_code')}
          </button>
        </div>
      </form>
    </div>
  );
}
