/**
 * Better-Auth instance for the application
 */

import { createAuth } from '@lmring/auth';
import { env } from '@lmring/env';
import { getAuthBaseUrl } from '@/utils/Helpers';
import { logger } from './Logger';

const createAuthInstance = () => {
  return createAuth({
    deploymentMode: env.DEPLOYMENT_MODE,
    baseURL: getAuthBaseUrl(),
    secret: env.BETTER_AUTH_SECRET,
    githubClientId: env.GITHUB_CLIENT_ID,
    githubClientSecret: env.GITHUB_CLIENT_SECRET,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    linuxdoClientId: env.LINUXDO_CLIENT_ID,
    linuxdoClientSecret: env.LINUXDO_CLIENT_SECRET,
    linuxdoAuthEnabled: env.NEXT_PUBLIC_LINUXDO_AUTH_ENABLED === 'true',
    emailEnabled: env.NEXT_PUBLIC_EMAIL_ENABLED === 'true',
    resendApiKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
    logger: {
      warn: (message: string, context?: Record<string, unknown>) => {
        logger.warn(message, context);
      },
      info: (message: string, context?: Record<string, unknown>) => {
        logger.info(message, context);
      },
      error: (message: string, context?: Record<string, unknown>) => {
        logger.error(message, context);
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        logger.debug(message, context);
      },
    },
  });
};

const globalForAuth = globalThis as unknown as {
  auth: ReturnType<typeof createAuthInstance> | undefined;
};

export const auth = globalForAuth.auth ?? createAuthInstance();

if (process.env.NODE_ENV !== 'production') {
  globalForAuth.auth = auth;
}

export type { Session } from '@lmring/auth';
