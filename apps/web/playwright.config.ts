import '@lmring/env/config';
import type { ChromaticConfig } from '@chromatic-com/playwright';
import { defineConfig, devices } from '@playwright/test';

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT || 3000;

const DEFAULT_REMOTE_BASE_URL = 'https://www.lmring.com';

// Prefer explicit PLAYWRIGHT_BASE_URL, otherwise default to the deployed site.
// To run against local app, set PLAYWRIGHT_BASE_URL=http://localhost:${PORT}
const baseURL = process.env.PLAYWRIGHT_BASE_URL || DEFAULT_REMOTE_BASE_URL;
const localBaseURL = `http://localhost:${PORT}`;
const shouldStartLocalWebServer = baseURL === localBaseURL;

// Boot the production standalone build for CI e2e runs.
// `output: 'standalone'` in a monorepo nests the server at
// `.next/standalone/apps/web/server.js` and ships it WITHOUT `.next/static`
// or `public/`, so we copy those assets in before starting the server.
const STANDALONE_DIR = '.next/standalone/apps/web';
const CI_STANDALONE_COMMAND = [
  `cp -r .next/static ${STANDALONE_DIR}/.next/static`,
  `cp -r public ${STANDALONE_DIR}/public`,
  `node ${STANDALONE_DIR}/server.js`,
].join(' && ');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig<ChromaticConfig>({
  testDir: './tests',
  // Look for files with the .spec.js or .e2e.js extension
  testMatch: '*.@(spec|e2e).?(c|m)[jt]s?(x)',
  // Timeout per test
  timeout: process.env.CI ? 30 * 1000 : 60 * 1000,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Retry flaky tests against remote sites
  retries: process.env.CI ? 2 : 1,
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: process.env.CI ? 'github' : 'list',

  expect: {
    // Set timeout for async expect matchers
    timeout: 20 * 1000,
  },

  // Run your local dev server before starting the tests:
  // https://playwright.dev/docs/test-advanced#launching-a-development-web-server-during-the-tests
  webServer: shouldStartLocalWebServer
    ? {
        // In CI we run the production standalone build. With `output: 'standalone'`
        // in a monorepo, Next emits the server under `.next/standalone/apps/web/`,
        // and it does NOT bundle `.next/static` or `public/` — those must be copied
        // in next to the server, otherwise client chunks 404, the page never
        // hydrates, and `networkidle` / `toHaveTitle` fail with an empty document.
        // See https://nextjs.org/docs/app/api-reference/config/next-config-js/output
        command: process.env.CI ? CI_STANDALONE_COMMAND : 'pnpm run dev',
        url: localBaseURL,
        timeout: 2 * 60 * 1000,
        reuseExistingServer: !process.env.CI,
        env: {
          NEXT_PUBLIC_SENTRY_DISABLED: 'true',
        },
      }
    : undefined,

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Use baseURL so to make navigations relative.
    // More information: https://playwright.dev/docs/api/class-testoptions#test-options-base-url
    baseURL,

    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: process.env.CI ? 'on' : 'retain-on-failure',

    // Record videos when retrying the failed test.
    video: process.env.CI ? 'retain-on-failure' : undefined,

    // Disable automatic screenshots at test completion when using Chromatic test fixture.
    disableAutoSnapshot: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.CI
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
        ]
      : []),
  ],
});
