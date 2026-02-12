import { and, db, eq, gt, isNotNull, lt } from '@lmring/database';
import { webdevResponses, webdevSessions } from '@lmring/database/schema';
import { Sandbox } from '@vercel/sandbox';
import { logError } from '@/libs/error-logging';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Maximum 1 active session per user at a time */
const MAX_ACTIVE_SESSIONS_PER_USER = 1;

/** Rate limit: max sandbox creations per user per 24h window */
const MAX_SANDBOX_CREATIONS_PER_DAY = 50;

/** Debounce interval for sandbox timeout extension (5 minutes) */
const EXTEND_DEBOUNCE_MS = 5 * 60 * 1000;

/** Extension amount added on each heartbeat (10 minutes) */
const EXTEND_AMOUNT_MS = 10 * 60 * 1000;

// ─── Active session check ───────────────────────────────────────────────────

/**
 * Check if the user already has an active webdev session.
 * Returns the existing session ID if one exists, null otherwise.
 */
export async function getActiveSession(userId: string): Promise<string | null> {
  const existing = await db.query.webdevSessions.findFirst({
    where: and(eq(webdevSessions.userId, userId), eq(webdevSessions.status, 'generating')),
    columns: { id: true },
    orderBy: (t, { desc }) => desc(t.createdAt),
  });

  return existing?.id ?? null;
}

/**
 * Enforce max 1 active session per user.
 * Returns `{ allowed: true }` or `{ allowed: false, existingSessionId }`.
 */
export async function canCreateSession(
  userId: string,
): Promise<{ allowed: true } | { allowed: false; existingSessionId: string }> {
  const activeSessions = await db.query.webdevSessions.findMany({
    where: and(eq(webdevSessions.userId, userId), eq(webdevSessions.status, 'generating')),
    columns: { id: true },
    limit: MAX_ACTIVE_SESSIONS_PER_USER + 1,
  });

  if (activeSessions.length >= MAX_ACTIVE_SESSIONS_PER_USER) {
    const firstSession = activeSessions[0];
    if (firstSession) {
      return { allowed: false, existingSessionId: firstSession.id };
    }
  }

  return { allowed: true };
}

// ─── Rate limiting ──────────────────────────────────────────────────────────

/**
 * Check how many sandboxes a user has created in the last 24 hours.
 * Returns `{ allowed: true, remaining }` or `{ allowed: false, remaining: 0 }`.
 */
export async function checkSandboxRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentResponses = await db.query.webdevResponses.findMany({
    where: and(isNotNull(webdevResponses.sandboxId), gt(webdevResponses.createdAt, oneDayAgo)),
    with: {
      session: {
        columns: { userId: true },
      },
    },
    columns: { id: true },
  });

  const userCount = recentResponses.filter((r) => r.session.userId === userId).length;
  const remaining = Math.max(0, MAX_SANDBOX_CREATIONS_PER_DAY - userCount);

  return {
    allowed: remaining > 0,
    remaining,
    limit: MAX_SANDBOX_CREATIONS_PER_DAY,
  };
}

// ─── Sandbox timeout extension ──────────────────────────────────────────────

/** In-memory debounce tracker for sandbox extensions (per sandboxId) */
const lastExtendedAt = new Map<string, number>();

/**
 * Extend sandbox timeout on user activity. Debounced to avoid excessive API calls.
 * Call this on heartbeat/keepalive from the client.
 *
 * @returns true if extension was attempted, false if debounced
 */
export async function extendSandboxTimeout(sandboxId: string): Promise<boolean> {
  const now = Date.now();
  const lastTime = lastExtendedAt.get(sandboxId) ?? 0;

  if (now - lastTime < EXTEND_DEBOUNCE_MS) {
    return false; // Debounced — skip
  }

  lastExtendedAt.set(sandboxId, now);

  try {
    const sandbox = await Sandbox.get({ sandboxId });
    const currentTimeout = sandbox.timeout;

    if (currentTimeout > 0) {
      const newExpiry = new Date(Date.now() + currentTimeout + EXTEND_AMOUNT_MS);

      // Update DB expiry
      await db
        .update(webdevResponses)
        .set({ expiresAt: newExpiry })
        .where(eq(webdevResponses.sandboxId, sandboxId));
    }

    return true;
  } catch (error) {
    // Sandbox may have expired or been stopped — clean up tracking
    lastExtendedAt.delete(sandboxId);
    logError('WebDev sandbox timeout extension failed', error, { sandboxId });
    return false;
  }
}

// ─── Cleanup utilities ──────────────────────────────────────────────────────

/**
 * Stop a single sandbox and update its DB record.
 * Tolerates already-stopped sandboxes.
 */
export async function cleanupSandbox(sandboxId: string): Promise<void> {
  try {
    const sandbox = await Sandbox.get({ sandboxId });
    await sandbox.stop();
  } catch {
    // Sandbox may already be stopped or expired
  }

  // Update DB regardless (idempotent)
  await db
    .update(webdevResponses)
    .set({
      status: 'expired',
      sandboxId: null,
      previewUrl: null,
    })
    .where(eq(webdevResponses.sandboxId, sandboxId));

  // Clean up in-memory extension tracker
  lastExtendedAt.delete(sandboxId);
}

/**
 * Destroy all active sandboxes for a given session.
 * Used when a user navigates away or session resets.
 */
export async function cleanupSessionSandboxes(sessionId: string): Promise<number> {
  const responses = await db.query.webdevResponses.findMany({
    where: and(eq(webdevResponses.sessionId, sessionId), isNotNull(webdevResponses.sandboxId)),
    columns: { sandboxId: true },
  });

  const results = await Promise.allSettled(
    responses
      .filter((r): r is typeof r & { sandboxId: string } => r.sandboxId !== null)
      .map((r) => cleanupSandbox(r.sandboxId)),
  );

  return results.filter((r) => r.status === 'fulfilled').length;
}

/**
 * Destroy all active sandboxes for a given user.
 * Used on beforeunload / page close.
 */
export async function cleanupUserSandboxes(userId: string): Promise<number> {
  const responses = await db.query.webdevResponses.findMany({
    where: isNotNull(webdevResponses.sandboxId),
    with: {
      session: {
        columns: { userId: true },
      },
    },
    columns: { sandboxId: true },
  });

  const userResponses = responses.filter((r) => r.session.userId === userId);

  const results = await Promise.allSettled(
    userResponses
      .filter((r): r is typeof r & { sandboxId: string } => r.sandboxId !== null)
      .map((r) => cleanupSandbox(r.sandboxId)),
  );

  return results.filter((r) => r.status === 'fulfilled').length;
}

// ─── Stale sandbox cleanup (server-side cron/background job) ────────────────

/**
 * Clean up stale sandboxes whose expiresAt has passed.
 * Designed to be called from a cron job or background task.
 *
 * @returns Number of sandboxes cleaned up
 */
export async function cleanupStaleSandboxes(): Promise<number> {
  const now = new Date();

  const staleResponses = await db.query.webdevResponses.findMany({
    where: and(isNotNull(webdevResponses.sandboxId), lt(webdevResponses.expiresAt, now)),
    columns: { id: true, sandboxId: true },
  });

  if (staleResponses.length === 0) return 0;

  const results = await Promise.allSettled(
    staleResponses
      .filter((r): r is typeof r & { sandboxId: string } => r.sandboxId !== null)
      .map((r) => cleanupSandbox(r.sandboxId)),
  );

  const cleaned = results.filter((r) => r.status === 'fulfilled').length;

  if (cleaned > 0) {
    console.log(`[webdev-cleanup] Cleaned up ${cleaned} stale sandboxes`);
  }

  return cleaned;
}
