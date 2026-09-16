import { test, expect } from '@playwright/test';
import { LinkChecker } from 'linkinator';

/**
 * Crawls the built site from the homepage and fails on any broken internal
 * link. External links are skipped: a third-party outage is not a reason to
 * block a merge, and rate limiting makes them flaky.
 */
test('has no broken internal links', async ({ baseURL }) => {
  test.setTimeout(120_000);

  const checker = new LinkChecker();
  const result = await checker.check({
    path: baseURL!,
    recurse: true,
    // Skip anything that is not on our own preview origin.
    linksToSkip: [`^(?!${baseURL?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`],
  });

  const broken = result.links
    .filter((link) => link.state === 'BROKEN')
    .map((link) => ({
      url: link.url,
      status: link.status,
      parent: link.parent,
    }));

  expect(broken, JSON.stringify(broken, null, 2)).toEqual([]);
});

/**
 * GitHub Pages serves `404.html` with a 404 status for paths that match no
 * file. Requesting `/404` directly is a different thing — that is a real file
 * and answers 200 — so this asserts the miss case specifically.
 */
test('serves the 404 page with a 404 status for unknown paths', async ({
  page,
}) => {
  const response = await page.goto('no-such-page-xyz');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Page not found',
  );
});
