import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { builtRoutes } from './routes';

const routes = builtRoutes();

test('the build produced at least one page', () => {
  expect(routes.length).toBeGreaterThan(0);
});

for (const route of routes) {
  test.describe(`page /${route}`, () => {
    test('is served under the configured base path', async ({
      page,
      baseURL,
    }) => {
      // Guards against a route or baseURL change that quietly drops the base
      // prefix and tests the wrong URL. See tests/routes.ts.
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      expect(page.url()).toContain(new URL(baseURL!).pathname);
    });

    test('has no detectable accessibility violations', async ({ page }) => {
      await page.goto(route);

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Print the rule and the offending markup, otherwise a CI failure is a
      // bare count with nothing to act on.
      const report = violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((n) => n.html),
      }));

      expect(report, JSON.stringify(report, null, 2)).toEqual([]);
    });

    test('has the document basics search engines and screen readers need', async ({
      page,
    }) => {
      await page.goto(route);

      await expect(page).toHaveTitle(/\S/);
      await expect(page.locator('html')).toHaveAttribute('lang', /\S/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /\S/,
      );
      await expect(page.locator('h1')).toHaveCount(1);
    });
  });
}
