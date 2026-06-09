import arcjet, { shield } from '@arcjet/next';

// Cloudflare's public IPv4/IPv6 edge ranges.
// When traffic is proxied Cloudflare -> Vercel, both `NextRequest.ip` and the
// `x-real-ip` / `x-vercel-forwarded-for` headers contain a Cloudflare edge IP.
// Arcjet's `findIp` returns `request.ip` first (before reading any header), so
// without treating these as trusted proxies it always resolves the Cloudflare IP
// and flags verified bots as spoofed -> UNKNOWN_BOT -> 403. Listing them here makes
// Arcjet skip the Cloudflare IP and fall through to the real client IP that
// `proxy.ts` hoists from `cf-connecting-ip` into `x-real-ip`.
// https://www.cloudflare.com/ips/
const CLOUDFLARE_PROXIES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

// Create a base Arcjet instance which can be imported and extended in each route.
export default arcjet({
  // Get your site key from https://launch.arcjet.com/Q6eLbRE
  // Use `process.env` instead of Env to reduce bundle size in middleware
  key: process.env.ARCJET_KEY ?? '',
  // Identify the user by their IP address
  characteristics: ['ip.src'],
  // Trust Cloudflare's edge IPs so the real client IP is resolved (see above).
  proxies: CLOUDFLARE_PROXIES,
  rules: [
    // Protect against common attacks with Arcjet Shield
    shield({
      mode: 'LIVE', // will block requests. Use "DRY_RUN" to log only
    }),
    // Other rules are added in different routes
  ],
});
