/**
 * Email service for OTP verification using Resend
 */

import { Resend } from 'resend';
import type { AuthLogger } from './logger';
import { authLogger as defaultLogger } from './logger';

export type OTPType = 'sign-in' | 'email-verification' | 'forget-password';

interface EmailConfig {
  resendApiKey: string;
  emailFrom: string;
}

interface SendOTPOptions {
  email: string;
  otp: string;
  type: OTPType;
}

export function createEmailService(config: EmailConfig, logger: AuthLogger = defaultLogger) {
  const resend = new Resend(config.resendApiKey);

  const getSubject = (type: OTPType): string => {
    switch (type) {
      case 'sign-in':
        return 'Your LMRing Sign-in Code';
      case 'email-verification':
        return 'Verify Your LMRing Email';
      case 'forget-password':
        return 'Reset Your LMRing Password';
      default:
        return 'Your LMRing Verification Code';
    }
  };

  const getEmailContent = (otp: string, type: OTPType): { text: string; html: string } => {
    const expirationMinutes = 10;

    const baseText = `Your verification code is: ${otp}\n\nThis code will expire in ${expirationMinutes} minutes.\n\nIf you didn't request this code, you can safely ignore this email.`;

    const typeSpecificText = {
      'sign-in': `You're signing in to your LMRing account.\n\n${baseText}`,
      'email-verification': `Please verify your email address to complete your LMRing account setup.\n\n${baseText}`,
      'forget-password': `You requested to reset your LMRing password.\n\n${baseText}`,
    };

    const text = typeSpecificText[type] || baseText;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${getSubject(type)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="height: 4px; background-color: #2563EB;"></div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px;">
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <p style="margin: 0; font-size: 22px; font-weight: 700; color: #1E293B; letter-spacing: -0.02em;">LMRing</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #E2E8F0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px 32px;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1E293B;">
                ${type === 'sign-in' ? 'Sign-in Verification' : type === 'email-verification' ? 'Email Verification' : 'Password Reset'}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #64748B;">
                ${type === 'sign-in'
                  ? "You're signing in to your LMRing account."
                  : type === 'email-verification'
                    ? 'Please verify your email address to complete your account setup.'
                    : 'You requested to reset your password.'}
              </p>
              <div style="background-color: #F1F5F9; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748B;">Your verification code</p>
                <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1E293B; font-family: 'SF Mono', Menlo, Consolas, monospace;">${otp}</p>
              </div>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748B;">
                This code will expire in <strong style="color: #1E293B;">${expirationMinutes} minutes</strong>.
              </p>
              <div style="height: 1px; background-color: #E2E8F0; margin-bottom: 16px;"></div>
              <p style="margin: 0; font-size: 13px; color: #94A3B8;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                &copy; ${new Date().getFullYear()} LMRing
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return { text, html };
  };

  return {
    async sendOTP({ email, otp, type }: SendOTPOptions): Promise<{ success: boolean; error?: string }> {
      try {
        logger.info('Sending OTP email', {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for logging
          type,
        });

        const { text, html } = getEmailContent(otp, type);

        const result = await resend.emails.send({
          from: config.emailFrom,
          to: email,
          subject: getSubject(type),
          text,
          html,
        });

        if (result.error) {
          logger.error('Failed to send OTP email', {
            error: result.error.message,
            type,
          });
          return { success: false, error: result.error.message };
        }

        logger.info('OTP email sent successfully', {
          emailId: result.data?.id,
          type,
        });

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Exception while sending OTP email', {
          error: errorMessage,
          type,
        });
        return { success: false, error: errorMessage };
      }
    },
  };
}

export type EmailService = ReturnType<typeof createEmailService>;
