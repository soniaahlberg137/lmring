import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { account, users } from './schema';

/**
 * Synchronize the OAuth provider user id from the account table
 * into the users table (githubId/googleId/linuxdoId fields).
 */
export async function syncUserProviderIdFromAccount(
  userId: string,
  providerId: 'github' | 'google' | 'linuxdo',
): Promise<boolean> {
  const acc = await db.query.account.findFirst({
    columns: { accountId: true },
    where: (fields, { and, eq }) => and(eq(fields.userId, userId), eq(fields.providerId, providerId)),
  });

  if (!acc?.accountId) return false;

  if (providerId === 'github') {
    await db.update(users).set({ githubId: acc.accountId }).where(eq(users.id, userId));
  } else if (providerId === 'google') {
    await db.update(users).set({ googleId: acc.accountId }).where(eq(users.id, userId));
  } else if (providerId === 'linuxdo') {
    await db.update(users).set({ linuxdoId: acc.accountId }).where(eq(users.id, userId));
  }

  return true;
}

