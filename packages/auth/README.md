# @lmring/auth

Authentication package for LMRing using Better-Auth.

## Features

- Email/Password authentication
- OAuth (GitHub, Google, Linux.do) in SaaS mode
- Email OTP verification via Resend
- Session management & account linking
- Type-safe API with error handling

## Required Environment Variables

- `DEPLOYMENT_MODE` - `saas` or `selfhost`
- `BETTER_AUTH_SECRET` - Min 32 characters
- `BETTER_AUTH_URL` - Your app URL
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - For GitHub OAuth (SaaS only)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth (SaaS only)
- `NEXT_PUBLIC_LINUXDO_AUTH_ENABLED` - Enable Linux.do OAuth (SaaS only)
- `LINUXDO_CLIENT_ID` / `LINUXDO_CLIENT_SECRET` - For Linux.do OAuth (SaaS only)
- `NEXT_PUBLIC_EMAIL_ENABLED` - Enable email OTP login (SaaS only)
- `RESEND_API_KEY` - Resend API key for email OTP (SaaS only)
- `EMAIL_FROM` - Sender email address for OTP emails (SaaS only)

OAuth callback: `{BETTER_AUTH_URL}/api/auth/callback/{provider}`
