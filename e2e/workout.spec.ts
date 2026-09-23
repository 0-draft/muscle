import { test, expect, type Page } from '@playwright/test';

// The workout screen must never lose or mis-date a session typed in the gym.
const day = (page: Page) => page.locator('.wk-day[aria-pressed="true"]');
const card = (page: Page, n: number) => page.locator('.wk-list:not([hidden]) .wk-card').nth(n);

// Capture the prefilled GitHub URLs instead of opening them (no network, no login redirect).
const openedUrls = (page: Page) => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened.map((u) => decodeURIComponent(u).replace(/\+/g, ' ')));

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

test('ticking a set loads a plate and starts the rest timer', async ({ page }) => {
  await expect(page.locator('[data-timer]')).toBeHidden();
  await card(page, 0).locator('.wk-set').first().click();
  await expect(card(page, 0).locator('.wk-set').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.wk-plate')).toHaveCount(2); // one on each sleeve
  await expect(page.locator('[data-timer]')).toBeVisible();
  await page.locator('[data-timer-skip]').click();
  await expect(page.locator('[data-timer]')).toBeHidden();
});

test('an unlogged session survives midnight and is logged under the day it started', async ({ page }) => {
  await card(page, 0).locator('.wk-set').first().click();
  await card(page, 0).locator('[data-log]').fill('６０×１０、60x9＠3');
  // Pretend the phone slept past midnight: move the session to yesterday.
  const started = await page.evaluate(() => {
    const cur = JSON.parse(localStorage.getItem('muscle:current')!);
    const data = localStorage.getItem(`muscle:session:${cur.date}:${cur.day}`)!;
    localStorage.removeItem(`muscle:session:${cur.date}:${cur.day}`);
    localStorage.setItem('muscle:session:2026-09-22:A', data);
    localStorage.setItem('muscle:current', JSON.stringify({ date: '2026-09-22', day: 'A' }));
    return cur.day;
  });
  expect(started).toBe('A');
  await page.reload();
  await expect(day(page)).toHaveAttribute('data-day', 'A');
  await expect(card(page, 0).locator('[data-log]')).toHaveValue('６０×１０、60x9＠3');

  await page.locator('[data-log-it]').click();
  const [url] = await openedUrls(page);
  expect(url).toContain('https://github.com/0-draft/muscle/issues/new?');
  expect(url).toContain('title=[log] 2026-09-22 A');
  expect(url).toContain('body=bench 60x10 60x9@3');

  // Once logged, the next visit starts the other day, empty.
  await page.reload();
  await expect(day(page)).toHaveAttribute('data-day', 'B');
  await expect(page.locator('[data-count]')).toContainText('0 /');
});

test('reset asks before clearing', async ({ page }) => {
  await card(page, 0).locator('.wk-set').first().click();
  page.once('dialog', (d) => d.dismiss());
  await page.locator('[data-reset]').click();
  await expect(card(page, 0).locator('.wk-set').first()).toHaveAttribute('aria-pressed', 'true');
  page.once('dialog', (d) => d.accept());
  await page.locator('[data-reset]').click();
  await expect(card(page, 0).locator('.wk-set').first()).toHaveAttribute('aria-pressed', 'false');
});

test('log button refuses an empty session', async ({ page }) => {
  await page.locator('[data-log-it]').click();
  await expect(page.locator('[data-log-hint]')).toContainText('少なくとも1種目');
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
