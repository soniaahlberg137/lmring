/**
 * Client-side authentication hooks and utilities
 */

'use client';

import { emailOTPClient, genericOAuthClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

interface CreateAuthClientOptions {
  baseURL: string;
}

interface AuthClientOptions {
  baseURL: string;
  plugins: [ReturnType<typeof genericOAuthClient>, ReturnType<typeof emailOTPClient>];
}

export type AuthClient = ReturnType<typeof createAuthClient<AuthClientOptions>>;

export function createClient(options: CreateAuthClientOptions): AuthClient {
  const authClient = createAuthClient({
    baseURL: options.baseURL,
    plugins: [genericOAuthClient(), emailOTPClient()],
  });

  return authClient;
}
