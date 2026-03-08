import { expect, type Page, test } from '@playwright/test';
import { getE2ECredentials, loginWithPassword } from './helpers/auth';

const credentials = getE2ECredentials();

async function goToLeaderboard(page: Page): Promise<void> {
  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: 'AI 排行榜' })).toBeVisible();
  await expect(page.locator('table')).toBeVisible();
}

async function getHeaderIndex(page: Page, headerName: string): Promise<number> {
  return page.getByRole('button', { name: headerName }).evaluate((button) => {
    const headerCell = button.closest('th');
    const headerRow = headerCell?.parentElement;
    if (!headerCell || !headerRow) {
      throw new Error(`Unable to find header cell for ${button.textContent}`);
    }

    return Array.from(headerRow.children).indexOf(headerCell) + 1;
  });
}

async function getVisibleColumnTexts(page: Page, columnIndex: number): Promise<string[]> {
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  const values: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const cell = rows.nth(index).locator(`td:nth-child(${columnIndex})`);
    values.push((await cell.innerText()).trim());
  }

  return values;
}

function parseMetricValue(text: string): number | null {
  const normalized = text.replaceAll(',', '').replaceAll('$', '').replaceAll('%', '').trim();
  if (!normalized || normalized === '—') {
    return null;
  }

  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
}

function expectSorted(values: Array<number | null>, direction: 'asc' | 'desc'): void {
  let lastValue: number | null = null;
  let seenNull = false;

  for (const value of values) {
    if (value === null) {
      seenNull = true;
      continue;
    }

    expect(seenNull).toBe(false);

    if (lastValue !== null) {
      if (direction === 'asc') {
        expect(value).toBeGreaterThanOrEqual(lastValue);
      } else {
        expect(value).toBeLessThanOrEqual(lastValue);
      }
    }

    lastValue = value;
  }
}

test.describe('Leaderboard sorting', () => {
  test.skip(!credentials, 'Requires LMRING_E2E_EMAIL and LMRING_E2E_PASSWORD');

  test('sorts GPQA ascending and descending, and keeps SWE-bench on page 1', async ({ page }) => {
    await loginWithPassword(page, credentials ?? undefined);
    await goToLeaderboard(page);

    const rankColumnIndex = 1;
    const gpqaColumnIndex = await getHeaderIndex(page, 'GPQA');
    const sweBenchColumnIndex = await getHeaderIndex(page, 'SWE-bench');

    const initialGpqaValues = (await getVisibleColumnTexts(page, gpqaColumnIndex)).map(
      parseMetricValue,
    );
    expectSorted(initialGpqaValues, 'desc');

    await page.getByRole('button', { name: 'GPQA' }).click();
    await page.getByRole('button', { name: 'GPQA' }).click();

    const ascRanks = await getVisibleColumnTexts(page, rankColumnIndex);
    expect(ascRanks[0]).toBe('1');
    const ascGpqaValues = (await getVisibleColumnTexts(page, gpqaColumnIndex)).map(
      parseMetricValue,
    );
    expectSorted(ascGpqaValues, 'asc');

    await page.getByRole('button', { name: 'GPQA' }).click();

    const descRanks = await getVisibleColumnTexts(page, rankColumnIndex);
    expect(descRanks[0]).toBe('1');
    const descGpqaValues = (await getVisibleColumnTexts(page, gpqaColumnIndex)).map(
      parseMetricValue,
    );
    expectSorted(descGpqaValues, 'desc');

    await page.getByRole('button', { name: 'SWE-bench' }).click();

    const sweBenchRanks = await getVisibleColumnTexts(page, rankColumnIndex);
    expect(sweBenchRanks[0]).toBe('1');
    const sweBenchValues = (await getVisibleColumnTexts(page, sweBenchColumnIndex)).map(
      parseMetricValue,
    );
    expectSorted(sweBenchValues, 'desc');
  });
});
