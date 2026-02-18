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
  if (process.env.VERCEL) {
    return {
      enabled: true,
      provider: 'vercel-sandbox',
      limits: {
        maxDurationMinutes: process.env.VERCEL_ENV === 'production' ? 300 : 45,
      },
    };
  }

  if (process.env.VERCEL_OIDC_TOKEN) {
    return {
      enabled: true,
      provider: 'vercel-sandbox',
      limits: { maxDurationMinutes: 45 },
    };
  }

  if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
    return {
      enabled: true,
      provider: 'vercel-sandbox',
      limits: { maxDurationMinutes: 45 },
    };
  }

  return {
    enabled: false,
    provider: 'disabled',
    reason: 'VERCEL_SANDBOX_NOT_CONFIGURED',
  };
}

/**
 * Return credentials for the `@vercel/sandbox` SDK when running with an
 * explicit access token (Tier 3).  Returns `undefined` when the env vars
 * are not set, which lets the SDK fall back to OIDC (Tiers 1 & 2).
 */
export function getSandboxCredentials():
  | { token: string; teamId: string; projectId: string }
  | undefined {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (token && teamId && projectId) {
    return { token, teamId, projectId };
  }
  return undefined;
}
