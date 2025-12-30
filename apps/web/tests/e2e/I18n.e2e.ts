import { expect, test } from '@playwright/test';

test.describe('I18n', () => {
  test('renders English content by default', async ({ page, context }) => {
    await context.setExtraHTTPHeaders({});
    await page.goto('/');

    await expect(
      page.getByRole('heading', {
        name: 'Boilerplate Code for Your Next.js Project with Tailwind CSS',
      }),
    ).toBeVisible();
  });

  test('uses the language header to render localized content', async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ 'x-language': 'fr' });
    await page.goto('/sign-in');

    await expect(page.getByText('Adresse e-mail')).toBeVisible();
  });
});
