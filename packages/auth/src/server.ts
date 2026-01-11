/**
 * Server-side authentication instance
 */

import { betterAuth, generateId } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  db,
  users,
  session,
  account,
  verification,
  syncUserProviderIdFromAccount,
} from '@lmring/database';
import { getAuthConfig } from './config';
import { UserStatus } from './status';
import type { AuthLogger } from './logger';
import { authLogger as defaultLogger } from './logger';
import { AuthErrorCodes, createAuthError } from './errors';
import { validatePassword } from './password-validation';

interface CreateAuthOptions {
  deploymentMode: 'saas' | 'selfhost';
  baseURL: string;
  secret: string;
  githubClientId?: string;
  githubClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  logger?: AuthLogger;
}

export function createAuth(options: CreateAuthOptions) {
  const logger = options.logger || defaultLogger;
  type AccountRecord = typeof account.$inferSelect;
  type OAuthProviderId = 'github' | 'google';

  const isSupportedProvider = (providerId: string): providerId is OAuthProviderId =>
    providerId === 'github' || providerId === 'google';

  const syncProviderIdForUser = async (userId: string, providerId: OAuthProviderId, source: string) => {
    try {
      const synced = await syncUserProviderIdFromAccount(userId, providerId);
      if (synced) {
        logger.debug('Synced OAuth provider id to user record', {
          source,
          userId,
          providerId,
        });
      } else {
        logger.warn('No OAuth account record found for user during provider sync', {
          source,
          userId,
          providerId,
        });
      }
    } catch (error) {
      logger.error('Failed to sync OAuth provider id to user record', {
        source,
        userId,
        providerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const syncProviderIdFromAccountRecord = async (
    accountRecord: AccountRecord | null | undefined,
    source: string,
  ) => {
    if (!accountRecord || !isSupportedProvider(accountRecord.providerId)) return;

    await syncProviderIdForUser(accountRecord.userId, accountRecord.providerId, source);
  };

  logger.info('Initializing Better-Auth server instance', {
    deploymentMode: options.deploymentMode,
  });

  try {
    const config = getAuthConfig({ ...options, logger });

    logger.info('Creating database adapter', {
      provider: 'pg',
    });

    // Prepare the complete betterAuth configuration
    const betterAuthConfig = {
      ...config,
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
          user: users,
          session: session,
          account: account,
          verification: verification,
        },
      }),
      advanced: {
        // Use new API: advanced.database.generateId
        database: {
          generateId: (options: { model: string; size?: number }) => {
            // Let database generate UUID for user IDs
            if (options.model === 'user') return undefined;
            // For other tables (session, account, verification), use Better-Auth's generator
            return options.size ? generateId(options.size) : generateId();
          },
        },
      },
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        freshAge: 60 * 10, // 10 minutes
      },
      // Account linking configuration
      account: {
        accountLinking: {
          enabled: true,
          trustedProviders: ['github', 'google'],
        },
      },
      // User creation hooks to set default role and status
      user: {
        // Field mapping: map Better-Auth required fields to our database schema
        fields: {
          name: 'fullName',          // Better-Auth's "name" -> our "fullName"
          image: 'avatarUrl',        // Better-Auth's "image" -> our "avatarUrl"
          emailVerified: 'emailVerified', // Keep as is (snake_case in DB)
        },
        additionalFields: {
          username: {
            type: 'string',
            required: false,
            input: false,
          },
          githubId: {
            type: 'string',
            required: false,
            input: false,
          },
          googleId: {
            type: 'string',
            required: false,
            input: false,
          },
          linuxdoId: {
            type: 'string',
            required: false,
            input: false,
          },
          inviterId: {
            type: 'string',
            required: false,
            input: false,
          },
          deletedAt: {
            type: 'date',
            required: false,
            input: false,
          },
          role: {
            type: 'string',
            defaultValue: 'user',
            required: true,
          },
          status: {
            type: 'string',
            defaultValue: 'active',
            required: true,
          },
        },
      },
      // Hooks to validate user status during sign-in
      hooks: {
        before: createAuthMiddleware(async (ctx) => {
          // Validate password complexity on sign-up
          if (ctx.path === '/sign-up/email' && ctx.method === 'POST') {
            const password = (ctx.body as { password?: string })?.password;
            if (password) {
              const validation = validatePassword(password);
              if (!validation.valid) {
                logger.warn('Password validation failed during sign-up', {
                  path: ctx.path,
                  errors: validation.errors,
                });
                throw createAuthError(AuthErrorCodes.WEAK_PASSWORD, validation.errors.join('; '));
              }
            }
          }

          // Match sign-in endpoints
          if (
            ctx.path === '/sign-in/email' ||
            ctx.path === '/sign-in/social' ||
            ctx.path?.includes('/callback')
          ) {
            logger.debug('Authentication attempt started', {
              path: ctx.path,
              method: ctx.method,
              body: ctx.body,
            });
          }
        }),
        after: createAuthMiddleware(async (ctx) => {
          // Match sign-in endpoints
          if (
            ctx.path === '/sign-in/email' ||
            ctx.path === '/sign-in/social' ||
            ctx.path?.includes('/callback')
          ) {
            // Check if user was successfully authenticated
            const sessionInfo = ctx.context.newSession ?? ctx.context.session;

            if (sessionInfo?.user) {
              const user = sessionInfo.user as any;

              logger.debug('User authentication successful, checking status', {
                userId: user.id,
                status: user.status,
                role: user.role,
              });

              // Check user status
              if (user.status === UserStatus.DISABLED) {
                logger.warn('Disabled user attempted to sign in', {
                  userId: user.id,
                  status: user.status,
                  errorCode: AuthErrorCodes.USER_DISABLED,
                });

                // Throw error to prevent sign-in
                throw createAuthError(AuthErrorCodes.USER_DISABLED);
              }

              if (user.status === UserStatus.PENDING) {
                logger.warn('Pending user attempted to sign in', {
                  userId: user.id,
                  status: user.status,
                  errorCode: AuthErrorCodes.USER_PENDING,
                });

                throw createAuthError(AuthErrorCodes.USER_PENDING);
              }

              // Log successful sign-in for active users
              if (user.status === UserStatus.ACTIVE) {
                logger.info('User signed in successfully', {
                  userId: user.id,
                  role: user.role,
                  status: user.status,
                  provider: ctx.path?.includes('social') ? 'oauth' : 'email',
                });

                // When returning from an OAuth callback, mirror provider account id onto user record
                // This keeps users.githubId/googleId in sync for app code that relies on these fields
                if (ctx.path?.includes('/callback')) {
                  const isGithub = ctx.path.includes('/callback/github');
                  const isGoogle = ctx.path.includes('/callback/google');

                  const providerId = isGithub ? 'github' : isGoogle ? 'google' : undefined;

                  if (providerId) {
                    await syncProviderIdForUser(user.id, providerId, 'middleware:callback');
                  }
                }
              }
            } else {
              logger.debug('Authentication attempt completed without user context', {
                path: ctx.path,
              });
            }
          }
        }),
      },
      databaseHooks: {
        account: {
          create: {
            after: async (createdAccount: AccountRecord) => {
              await syncProviderIdFromAccountRecord(
                createdAccount as AccountRecord | null | undefined,
                'databaseHook:create',
              );
            },
          },
          update: {
            after: async (updatedAccount: AccountRecord) => {
              await syncProviderIdFromAccountRecord(
                updatedAccount as AccountRecord | null | undefined,
                'databaseHook:update',
              );
            },
          },
        },
      },
    };

    const auth = betterAuth(betterAuthConfig);

    logger.info('Better-Auth server instance created successfully', {
      sessionExpiresIn: '7 days',
      sessionUpdateAge: '1 day',
      sessionFreshAge: '10 minutes',
      emailPasswordEnabled: true,
      accountLinkingEnabled: true,
    });

    return auth;
  } catch (error) {
    logger.error('Failed to create Better-Auth server instance', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
