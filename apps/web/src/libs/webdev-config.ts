/**
 * WebDev Preview feature configuration.
 * Detects whether Vercel Sandbox is available in the current environment.
 *
 * This module is server-only — it reads sensitive environment variables
 * and must never be imported from client components.
 */

export interface WebDevConfig {
  enabled: boolean;
  provider: 'vercel-sandbox' | 'disabled';
  reason?: 'VERCEL_SANDBOX_NOT_CONFIGURED';
  limits?: {
    maxDurationMinutes: number;
  };
}

/**
 * Determine whether the WebDev Preview feature is available.
 *
 * Priority order:
 * 1. Running on Vercel → OIDC token is auto-managed
 * 2. Local dev with `vercel env pull` → VERCEL_OIDC_TOKEN present
 * 3. Explicit access token → VERCEL_TOKEN + VERCEL_TEAM_ID + VERCEL_PROJECT_ID
 * 4. Not configured → feature disabled
 */
export function getWebDevConfig(): WebDevConfig {
  // 1. Running on Vercel — OIDC auto-available
  if (process.env.VERCEL) {
    return {
      enabled: true,
      provider: 'vercel-sandbox',
      limits: {
        // Hobby = 45 min, Pro/Enterprise = 300 min (5 hr)
        maxDurationMinutes: process.env.VERCEL_ENV === 'production' ? 300 : 45,
      },
    };
  }

  // 2. Local dev with pulled OIDC token (via `vercel env pull`)
  if (process.env.VERCEL_OIDC_TOKEN) {
    return {
      enabled: true,
      provider: 'vercel-sandbox',
      limits: { maxDurationMinutes: 45 },
    };
  }

  // 3. Explicit access token configuration
  if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
    return {
      enabled: true,
      provider: 'vercel-sandbox',
      limits: { maxDurationMinutes: 45 },
    };
  }

  // 4. Not configured
  return {
    enabled: false,
    provider: 'disabled',
    reason: 'VERCEL_SANDBOX_NOT_CONFIGURED',
  };
}
