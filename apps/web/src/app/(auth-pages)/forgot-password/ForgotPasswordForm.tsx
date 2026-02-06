'use client';

import { PASSWORD_RULES, validatePassword } from '@lmring/auth/shared';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from '@/components/auth/AuthIcons';
import { useTranslations } from '@/hooks/use-translations';
import { authClient } from '@/libs/AuthClient';

const SuccessIcon = (
  <svg
    className="w-8 h-8 text-green-600 dark:text-green-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

function PasswordStrengthIndicator({ password }: { password: string }) {
  const validation = useMemo(() => validatePassword(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {validation.checks.map((check) => (
        <div key={check.rule} className="flex items-center gap-2 text-xs">
          {check.passed ? CheckIcon : XIcon}
          <span
            className={
              check.passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            }
          >
            {check.message}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'forget-password',
      });

      if (result.error) {
        setError(result.error.message || 'Failed to send verification code');
        setIsSubmitting(false);
        return;
      }

      setStep('verify');
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('ForgotPassword.passwords_mismatch'));
      return;
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors.join('; '));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to reset password');
        setIsSubmitting(false);
        return;
      }

      setStep('success');
    } catch (_err) {
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsResending(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'forget-password',
      });

      if (result.error) {
        setError(result.error.message || 'Failed to resend code');
      }
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setIsResending(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          {SuccessIcon}
        </div>
        <h2 className="text-xl font-semibold">{t('ForgotPassword.success_title')}</h2>
        <p className="text-sm text-muted-foreground">{t('ForgotPassword.success_description')}</p>
        <Link
          href="/sign-in"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {t('ForgotPassword.sign_in_link')}
        </Link>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">{t('ForgotPassword.verify_title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('ForgotPassword.verify_description', { email })}
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium mb-2">
              {t('ForgotPassword.otp_label')}
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl tracking-widest"
              placeholder={t('ForgotPassword.otp_placeholder')}
              disabled={isSubmitting || isResending}
              autoComplete="one-time-code"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              {t('ForgotPassword.new_password_label')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={PASSWORD_RULES.minLength}
                maxLength={PASSWORD_RULES.maxLength}
                className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t('ForgotPassword.new_password_placeholder')}
                disabled={isSubmitting || isResending}
              />
              {password ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting || isResending}
                >
                  {showPassword ? EyeOffIcon : EyeIcon}
                </button>
              ) : null}
            </div>
            <PasswordStrengthIndicator password={password} />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              {t('ForgotPassword.confirm_password_label')}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={PASSWORD_RULES.minLength}
                maxLength={PASSWORD_RULES.maxLength}
                className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t('ForgotPassword.confirm_password_placeholder')}
                disabled={isSubmitting || isResending}
              />
              {confirmPassword ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting || isResending}
                >
                  {showConfirmPassword ? EyeOffIcon : EyeIcon}
                </button>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isSubmitting ? t('ForgotPassword.resetting_button') : t('ForgotPassword.reset_button')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isSubmitting || isResending}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isResending ? t('ForgotPassword.resending_code') : t('ForgotPassword.resend_code')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            {t('ForgotPassword.email_label')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={t('ForgotPassword.email_placeholder')}
            disabled={isSubmitting}
          />
        </div>

        {error ? (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting
            ? t('ForgotPassword.sending_code_button')
            : t('ForgotPassword.send_code_button')}
        </button>
      </form>
    </div>
  );
}
