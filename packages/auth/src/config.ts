/**
 * Better-Auth configuration generator
 */

import type { AuthLogger } from './logger';
import { authLogger as defaultLogger } from './logger';

interface ConfigOptions {
  deploymentMode: 'saas' | 'selfhost';
  baseURL: string;
  secret: string;
  githubClientId?: string;
  githubClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  linuxdoClientId?: string;
  linuxdoClientSecret?: string;
  linuxdoAuthEnabled?: boolean;
  emailEnabled?: boolean;
  resendApiKey?: string;
  emailFrom?: string;
  logger?: AuthLogger;
}

export function getAuthConfig(options: ConfigOptions) {
  const {
    deploymentMode,
    baseURL,
    secret,
    githubClientId,
    githubClientSecret,
    googleClientId,
    googleClientSecret,
    linuxdoClientId,
    linuxdoClientSecret,
    linuxdoAuthEnabled = false,
    emailEnabled = false,
    resendApiKey,
    emailFrom = 'noreply@lmring.com',
    logger = defaultLogger,
  } = options;

  if (!secret) {
    const error = new Error('BETTER_AUTH_SECRET is required');
    logger.error('Configuration error: Missing BETTER_AUTH_SECRET', {
      error: error.message,
    });
    throw error;
  }

  if (secret.length < 32) {
    const error = new Error('BETTER_AUTH_SECRET must be at least 32 characters long');
    logger.error('Configuration error: BETTER_AUTH_SECRET too short', {
      error: error.message,
      secretLength: secret.length,
      requiredLength: 32,
    });
    throw error;
  }

  const config: any = {
    appName: 'LMRing',
    baseURL,
    secret,
  };

  // Log deployment mode
  logger.info('Better-Auth configuration loaded', {
    deploymentMode,
    baseURL,
    appName: config.appName,
    oauthCallbackBase: `${baseURL}/api/auth/oauth2/callback`,
  });

  // OAuth providers only in SaaS mode
  if (deploymentMode === 'saas') {
    logger.info('SaaS mode enabled - configuring OAuth providers');
    
    const socialProviders: any = {};
    const enabledProviders: string[] = [];
    const missingProviders: string[] = [];

    // GitHub OAuth
    if (githubClientId && githubClientSecret) {
      socialProviders.github = {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
      };
      enabledProviders.push('GitHub');
      logger.info('GitHub OAuth enabled', {
        provider: 'github',
        hasClientId: !!githubClientId,
        hasClientSecret: !!githubClientSecret,
      });
    } else {
      missingProviders.push('GitHub');
      logger.warn('GitHub OAuth credentials not configured - GitHub login will be unavailable', {
        provider: 'github',
        hasClientId: !!githubClientId,
        hasClientSecret: !!githubClientSecret,
        missingFields: [
          !githubClientId && 'GITHUB_CLIENT_ID',
          !githubClientSecret && 'GITHUB_CLIENT_SECRET',
        ].filter(Boolean),
      });
    }

    // Google OAuth
    if (googleClientId && googleClientSecret) {
      socialProviders.google = {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        accessType: 'offline',
      };
      enabledProviders.push('Google');
      logger.info('Google OAuth enabled', {
        provider: 'google',
        hasClientId: !!googleClientId,
        hasClientSecret: !!googleClientSecret,
        accessType: 'offline',
      });
    } else {
      missingProviders.push('Google');
      logger.warn('Google OAuth credentials not configured - Google login will be unavailable', {
        provider: 'google',
        hasClientId: !!googleClientId,
        hasClientSecret: !!googleClientSecret,
        missingFields: [
          !googleClientId && 'GOOGLE_CLIENT_ID',
          !googleClientSecret && 'GOOGLE_CLIENT_SECRET',
        ].filter(Boolean),
      });
    }

    if (Object.keys(socialProviders).length > 0) {
      config.socialProviders = socialProviders;
      logger.info('OAuth providers configured', {
        enabledProviders,
        providerCount: enabledProviders.length,
      });
    } else {
      logger.warn('No OAuth providers configured in SaaS mode', {
        missingProviders,
        recommendation: 'Configure at least one OAuth provider for better user experience',
      });
    }
  } else {
    logger.info('Self-hosted mode enabled - OAuth providers disabled', {
      deploymentMode,
      availableAuthMethods: ['Email/Password'],
    });
  }

  // Linux.do OAuth - available in both SaaS and selfhost when enabled
  const linuxdoConfig = linuxdoAuthEnabled && linuxdoClientId && linuxdoClientSecret
    ? {
        clientId: linuxdoClientId,
        clientSecret: linuxdoClientSecret,
      }
    : undefined;

  if (linuxdoAuthEnabled) {
    if (linuxdoConfig) {
      logger.info('Linux.do OAuth enabled', {
        provider: 'linuxdo',
        hasClientId: !!linuxdoClientId,
        hasClientSecret: !!linuxdoClientSecret,
      });
    } else {
      logger.warn('Linux.do OAuth enabled but credentials not configured', {
        provider: 'linuxdo',
        hasClientId: !!linuxdoClientId,
        hasClientSecret: !!linuxdoClientSecret,
        missingFields: [
          !linuxdoClientId && 'LINUXDO_CLIENT_ID',
          !linuxdoClientSecret && 'LINUXDO_CLIENT_SECRET',
        ].filter(Boolean),
      });
    }
  }

  // Email configuration
  const emailConfig = emailEnabled && resendApiKey
    ? {
        resendApiKey,
        emailFrom,
      }
    : undefined;

  if (emailEnabled) {
    if (emailConfig) {
      logger.info('Email OTP enabled', {
        emailFrom,
        hasResendApiKey: !!resendApiKey,
      });
    } else {
      logger.warn('Email enabled but Resend API key not configured', {
        hasResendApiKey: !!resendApiKey,
        missingFields: [!resendApiKey && 'RESEND_API_KEY'].filter(Boolean),
      });
    }
  }

  logger.debug('Final auth configuration', {
    hasDatabase: !!config.database,
    hasSocialProviders: !!config.socialProviders,
    socialProviderCount: config.socialProviders ? Object.keys(config.socialProviders).length : 0,
    hasLinuxdoOAuth: !!linuxdoConfig,
    hasEmailOTP: !!emailConfig,
  });

  return {
    ...config,
    linuxdoConfig,
    emailConfig,
  };
}
