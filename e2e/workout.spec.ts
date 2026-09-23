import { test, expect, type Page } from '@playwright/test';

// The workout screen must never lose or mis-date a session typed in the gym. CI builds with an
// empty log, so nothing is prefilled: the first "+" on a barbell lift loads the empty bar.

// Capture the prefilled GitHub URLs instead of opening them (no network, no login redirect).
const openedUrls = (page: Page) =>
  page.evaluate(() => (window as unknown as { __opened: string[] }).__opened.map((u) => decodeURIComponent(u).replace(/\+/g, ' ')));
const day = (page: Page) => page.locator('.wk-day[aria-pressed="true"]');
const firstRow = (page: Page) => page.locator('.wk-card').first().locator('tbody tr').first();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __opened: string[] };
    w.__opened = [];
    window.open = (u?: string | URL) => {
      w.__opened.push(String(u));
      return null;
    };
  });
  await page.goto('ja/program/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('the attempt board needs a load, then Done ticks the set, loads plates and starts the rest clock', async ({ page }) => {
  await expect(page.locator('[data-board]')).toBeVisible();
  await expect(page.locator('[data-b-done]')).toBeDisabled();
  await page.locator('[data-kg-plus]').click();
  await expect(page.locator('[data-b-kg]')).toHaveText('20');
  await expect(page.locator('[data-b-plates]')).toContainText('バーのみ');
  await page.locator('[data-kg-plus]').click();
  await expect(page.locator('[data-b-kg]')).toHaveText('22.5');
  await page.locator('[data-b-done]').click();
  await expect(firstRow(page)).toHaveClass(/is-done/);
  await expect(page.locator('.wk-plate')).toHaveCount(2);
  await expect(page.locator('[data-timer]')).toBeVisible();
  await expect(page.locator('[data-board]')).toBeHidden();
  await page.locator('[data-timer-skip]').click();
  await expect(page.locator('[data-timer]')).toBeHidden();
  await expect(page.locator('[data-b-set]')).toContainText('2/');
});

test('beating the best e1RM fires the verdict lights', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('muscle:v2:bests', JSON.stringify({ bench: 20 })));
  await page.reload();
  await page.locator('[data-kg-plus]').click(); // 20 kg × 6 → e1RM 24 > 20
  await page.locator('[data-b-done]').click();
  await expect(page.locator('[data-pr]')).toBeVisible();
  await expect(page.locator('[data-pr-value]')).toHaveText('24 kg');
  await page.locator('[data-pr]').click();
  await expect(page.locator('[data-pr]')).toBeHidden();
  await expect(firstRow(page).locator('.wk-medal')).toHaveText('PR');
});

test('an unlogged session survives midnight and is logged under the day it started', async ({ page }) => {
  await page.locator('[data-kg-plus]').click();
  await page.locator('[data-b-done]').click();
  await page.locator('[data-timer-skip]').click();
  // Pretend the phone slept past midnight: move the session to yesterday.
  await page.evaluate(() => {
    const cur = JSON.parse(localStorage.getItem('muscle:v2:current')!);
    const data = localStorage.getItem(`muscle:v2:session:${cur.date}:${cur.day}`)!;
    localStorage.removeItem(`muscle:v2:session:${cur.date}:${cur.day}`);
    localStorage.setItem('muscle:v2:session:2026-09-22:A', data);
    localStorage.setItem('muscle:v2:current', JSON.stringify({ date: '2026-09-22', day: 'A' }));
  });
  await page.reload();
  await expect(day(page)).toHaveAttribute('data-day', 'A');
  await expect(firstRow(page)).toHaveClass(/is-done/);

  await page.locator('.wk-actions [data-log-it]').click();
  const [url] = await openedUrls(page);
  expect(url).toContain('https://github.com/0-draft/muscle/issues/new?');
  expect(url).toContain('title=[log] 2026-09-22 A');
  expect(url).toMatch(/body=bench 20x6$/);

  // Once logged, the next visit starts the other day, empty.
  await page.reload();
  await expect(day(page)).toHaveAttribute('data-day', 'B');
  await expect(page.locator('[data-count]')).toContainText('0/');
});

test('reset asks before clearing', async ({ page }) => {
  await page.locator('[data-kg-plus]').click();
  await page.locator('[data-b-done]').click();
  await page.locator('[data-timer-skip]').click();
  page.once('dialog', (d) => d.dismiss());
  await page.locator('[data-reset]').click();
  await expect(firstRow(page)).toHaveClass(/is-done/);
  page.once('dialog', (d) => d.accept());
  await page.locator('[data-reset]').click();
  await expect(firstRow(page)).not.toHaveClass(/is-done/);
});

test('log button refuses an empty session', async ({ page }) => {
  await page.locator('.wk-actions [data-log-it]').click();
  await expect(page.locator('[data-log-hint]')).toContainText('1セット以上');
  expect(await openedUrls(page)).toEqual([]);
});

test('weigh-in rejects values ingest would reject', async ({ page }) => {
  await page.locator('[name="weight"]').fill('7');
  await page.locator('.weigh button').click();
  await expect(page.locator('[data-weigh-msg]')).toContainText('30〜250kg');
  expect(await openedUrls(page)).toEqual([]);
  await page.locator('[name="weight"]').fill('70.2');
  await page.locator('[name="waist"]').fill('82');
  await page.locator('.weigh button').click();
  const [url] = await openedUrls(page);
  expect(url).toMatch(/title=\[weight\] \d{4}-\d{2}-\d{2}&body=70.2, 82$/);
});
