'use client';

import { env } from '@lmring/env';
import { useState } from 'react';
import { sendProfileOTP, updateProfileEmail, verifyProfileOTP } from './actions';

interface CompleteProfileFormProps {
  userName: string;
  translations: {
    emailLabel: string;
    emailPlaceholder: string;
    submitButton: string;
    submittingButton: string;
    verifyTitle: string;
    verifyDescription: string;
    otpLabel: string;
    otpPlaceholder: string;
    verifyButton: string;
    verifyingButton: string;
    resendCode: string;
    resendingCode: string;
  };
}

export function CompleteProfileForm({ userName, translations }: CompleteProfileFormProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [step, setStep] = useState<'email' | 'verify'>('email');

  const emailEnabled = env.NEXT_PUBLIC_EMAIL_ENABLED === 'true';

  const handleEmailSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // If email verification is enabled, send OTP first
      if (emailEnabled) {
        const otpResult = await sendProfileOTP(email);

        if (!otpResult.success) {
          setError(otpResult.error || 'Failed to send verification code');
          setIsSubmitting(false);
          return;
        }

        setStep('verify');
      } else {
        // No email verification, update user directly via server action
        const updateResult = await updateProfileEmail(email);

        if (!updateResult.success) {
          setError(updateResult.error || 'Failed to update email');
          setIsSubmitting(false);
          return;
        }

        window.location.href = '/arena';
        return;
      }
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await verifyProfileOTP(email, otp);

      if (!result.success) {
        setError(result.error || 'Invalid verification code');
        setIsSubmitting(false);
        return;
      }

      window.location.href = '/arena';
      return;
    } catch (_err) {
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsResending(true);

    try {
      const result = await sendProfileOTP(email);

      if (!result.success) {
        setError(result.error || 'Failed to resend code');
      }
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setIsResending(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">{translations.verifyTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {translations.verifyDescription.replace('{{email}}', email)}
          </p>
        </div>

        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium mb-2">
              {translations.otpLabel}
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl tracking-widest"
              placeholder={translations.otpPlaceholder}
              disabled={isSubmitting || isResending}
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isSubmitting ? translations.verifyingButton : translations.verifyButton}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isSubmitting || isResending}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isResending ? translations.resendingCode : translations.resendCode}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {userName && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{userName}</span>!
          </p>
        </div>
      )}

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            {translations.emailLabel}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={translations.emailPlaceholder}
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? translations.submittingButton : translations.submitButton}
        </button>
      </form>
    </div>
  );
}
