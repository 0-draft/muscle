import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['', 'ja/', 'k/protein/', 'ja/k/retraining/', 'ja/k/appetite/', 'program/', 'ja/program/', 'grades/'];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    for (const path of PAGES) {
      test(`/${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
        await page.goto(path);
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      });
    }
  });
}

test('nothing marked hidden is visible', async ({ page }) => {
  for (const path of ['', 'ja/program/']) {
    await page.goto(path);
    const leaks = await page.$$eval('[hidden]', (els) => els.filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.className));
    expect(leaks, path).toEqual([]);
  }
});
