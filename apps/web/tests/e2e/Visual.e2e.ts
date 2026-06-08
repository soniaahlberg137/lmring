import { expect, takeSnapshot, test } from '@chromatic-com/playwright';

const TITLE_TIMEOUT = 30_000;

test.describe('Visual testing', () => {
  test.describe('Static pages', () => {
    test('should take screenshot of the homepage', async ({ page }, testInfo) => {
      await page.goto('/');

      await expect(page).toHaveTitle(/LMRing|lmring/, { timeout: TITLE_TIMEOUT });

      await takeSnapshot(page, testInfo);
    });

    test('should take screenshot of the leaderboard page', async ({ page }, testInfo) => {
      await page.goto('/leaderboard');

      await expect(page).toHaveTitle(/AI Model Leaderboard|LMRing|lmring/, {
        timeout: TITLE_TIMEOUT,
      });

      await takeSnapshot(page, testInfo);
    });

    test('should take screenshot of the sign-in page', async ({ page }, testInfo) => {
      await page.goto('/sign-in');

      await expect(page).toHaveTitle(/Sign in|LMRing|lmring/, { timeout: TITLE_TIMEOUT });

      await takeSnapshot(page, testInfo);
    });

    test('should take screenshot of the French homepage', async ({ page, context }, testInfo) => {
      await context.setExtraHTTPHeaders({ 'x-language': 'fr' });
      await page.goto('/');

      await expect(page).toHaveTitle(/LMRing|lmring/, { timeout: TITLE_TIMEOUT });
      // The x-language header drives the server-rendered <html lang>, so assert on it
      // to verify French actually took effect (the title is locale-independent here).
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr', { timeout: TITLE_TIMEOUT });

      await takeSnapshot(page, testInfo);
    });
  });
});
