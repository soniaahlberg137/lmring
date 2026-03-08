import type { Page } from '@playwright/test';

interface E2EEnv {
  LMRING_E2E_EMAIL?: string;
  LMRING_E2E_PASSWORD?: string;
}

export interface E2ECredentials {
  email: string;
  password: string;
}

function getProcessEnv(): E2EEnv | undefined {
  return (
    globalThis as typeof globalThis & {
      process?: {
        env?: E2EEnv;
      };
    }
  ).process?.env;
}

export function getE2ECredentials(
  env: E2EEnv | undefined = getProcessEnv(),
): E2ECredentials | null {
  const email = env?.LMRING_E2E_EMAIL;
  const password = env?.LMRING_E2E_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export async function loginWithPassword(
  page: Page,
  credentials = getE2ECredentials(),
): Promise<void> {
  if (!credentials) {
    throw new Error('Missing LMRING_E2E_EMAIL or LMRING_E2E_PASSWORD');
  }

  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/(arena|leaderboard)$/);
}
