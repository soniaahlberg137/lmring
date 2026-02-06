'use server';

import { createEmailService } from '@lmring/auth/email';
import { isPlaceholderEmail } from '@lmring/auth/placeholder-email';
import { and, db, eq, ne, session as sessionTable, users, verification } from '@lmring/database';
import { env } from '@lmring/env';
import { headers } from 'next/headers';

import { auth } from '@/libs/Auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendProfileOTP(email: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!isPlaceholderEmail(session.user.email)) {
    return { success: false, error: 'Profile already completed' };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Invalid email address' };
  }

  if (!env.RESEND_API_KEY || env.NEXT_PUBLIC_EMAIL_ENABLED !== 'true') {
    return { success: false, error: 'Email service is not configured' };
  }

  try {
    // Use Better-Auth's internal API to bypass the sendVerificationOTP route
    // which has anti-enumeration behaviour that would swallow errors.
    // The email-otp plugin is conditionally added so its types don't propagate.
    type CreateOTPFn = (opts: {
      body: { email: string; type: 'email-verification' };
    }) => Promise<string>;

    const createOTP = (auth.api as unknown as { createVerificationOTP: CreateOTPFn })
      .createVerificationOTP;

    const otp = await createOTP({
      body: { email, type: 'email-verification' },
    });

    if (!otp) {
      return { success: false, error: 'Failed to generate verification code' };
    }

    const emailService = createEmailService({
      resendApiKey: env.RESEND_API_KEY,
      emailFrom: env.EMAIL_FROM,
    });

    const result = await emailService.sendOTP({
      email,
      otp,
      type: 'email-verification',
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send verification email' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function verifyProfileOTP(
  email: string,
  otp: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!isPlaceholderEmail(session.user.email)) {
    return { success: false, error: 'Profile already completed' };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Invalid email address' };
  }

  if (!otp || otp.length !== 6) {
    return { success: false, error: 'Invalid verification code' };
  }

  try {
    // Better-Auth email-otp stores identifier as `{type}-otp-{email}`
    const identifier = `email-verification-otp-${email.toLowerCase()}`;

    const records = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, identifier));

    const record = records[0];
    if (!record) {
      return { success: false, error: 'Verification code not found. Please request a new code.' };
    }

    if (new Date() > record.expiresAt) {
      await db.delete(verification).where(eq(verification.id, record.id));
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // Stored value format: `{otp}:{attemptCount}`
    const [storedOtp, attemptStr] = record.value.split(':');
    const attempts = Number.parseInt(attemptStr || '0', 10);

    if (attempts >= 5) {
      await db.delete(verification).where(eq(verification.id, record.id));
      return { success: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    if (storedOtp !== otp) {
      await db
        .update(verification)
        .set({ value: `${storedOtp}:${attempts + 1}` })
        .where(eq(verification.id, record.id));

      return { success: false, error: 'Invalid verification code' };
    }

    await db.delete(verification).where(eq(verification.id, record.id));

    // Check email uniqueness
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), ne(users.id, session.user.id)));

    if (existingUser.length > 0) {
      return { success: false, error: 'This email address is already in use' };
    }

    // Update user email and touch session in parallel
    const now = new Date();
    await Promise.all([
      db
        .update(users)
        .set({
          email: email.toLowerCase(),
          emailVerified: true,
          updatedAt: now,
        })
        .where(eq(users.id, session.user.id)),
      db
        .update(sessionTable)
        .set({ updatedAt: now })
        .where(eq(sessionTable.userId, session.user.id)),
    ]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function updateProfileEmail(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!isPlaceholderEmail(session.user.email)) {
    return { success: false, error: 'Profile already completed' };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Invalid email address' };
  }

  try {
    // Check email uniqueness
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), ne(users.id, session.user.id)));

    if (existingUser.length > 0) {
      return { success: false, error: 'This email address is already in use' };
    }

    // Update user email and touch session in parallel
    const now = new Date();
    await Promise.all([
      db
        .update(users)
        .set({
          email: email.toLowerCase(),
          emailVerified: false,
          updatedAt: now,
        })
        .where(eq(users.id, session.user.id)),
      db
        .update(sessionTable)
        .set({ updatedAt: now })
        .where(eq(sessionTable.userId, session.user.id)),
    ]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
