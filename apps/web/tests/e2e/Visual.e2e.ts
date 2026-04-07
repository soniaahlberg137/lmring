import { expect, takeSnapshot, test } from '@chromatic-com/playwright';

test.describe('Visual testing', () => {
  test.describe('Static pages', () => {
    test('should take screenshot of the homepage', async ({ page }, testInfo) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page).toHaveTitle(/LMRing|lmring/);

      await takeSnapshot(page, testInfo);
    });

    test('should take screenshot of the leaderboard page', async ({ page }, testInfo) => {
      await page.goto('/leaderboard', { waitUntil: 'networkidle' });

      await expect(page).toHaveTitle(/AI Model Leaderboard|LMRing|lmring/);

      await takeSnapshot(page, testInfo);
    });

    test('should take screenshot of the sign-in page', async ({ page }, testInfo) => {
      await page.goto('/sign-in', { waitUntil: 'networkidle' });

      await expect(page).toHaveTitle(/Sign in|LMRing|lmring/);

      await takeSnapshot(page, testInfo);
    });

    test('should take screenshot of the French homepage', async ({ page, context }, testInfo) => {
      await context.setExtraHTTPHeaders({ 'x-language': 'fr' });
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page).toHaveTitle(/LMRing|lmring/);

      await takeSnapshot(page, testInfo);
    });
  });
});
