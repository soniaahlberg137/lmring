/**
 * Better-Auth client instance for client-side authentication
 */

'use client';

import type { AuthClient } from '@lmring/auth';
import { createClient } from '@lmring/auth/client';
import { getAuthBaseUrl } from '@/utils/Helpers';

export const authClient: AuthClient = createClient({
  baseURL: getAuthBaseUrl(),
});

// Export useSession hook from the auth client instance
export const { useSession } = authClient;
