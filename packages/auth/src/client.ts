/**
 * Client-side authentication hooks and utilities
 */

'use client';

import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient, emailOTPClient } from 'better-auth/client/plugins';

interface CreateAuthClientOptions {
  baseURL: string;
}

export function createClient(options: CreateAuthClientOptions) {
  const authClient = createAuthClient({
    baseURL: options.baseURL,
    plugins: [
      genericOAuthClient(),
      emailOTPClient(),
    ],
  });

  return authClient;
}

export type AuthClient = ReturnType<typeof createClient>;
