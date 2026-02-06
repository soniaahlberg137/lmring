/**
 * Placeholder email utilities for OAuth providers that don't supply email addresses.
 * LinuxDo users get a placeholder email (e.g. linuxdo_123@placeholder.local) at signup
 * and must complete their profile by providing a real email.
 */

export const PLACEHOLDER_EMAIL_DOMAIN = 'placeholder.local';

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
}
