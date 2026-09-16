import { expect, test } from '@playwright/test';
import { sections } from '../src/data/sections';

/**
 * The header navigation and the page sections are both built from
 * src/data/sections.ts. These assert they agree in BOTH directions, so a
 * section added without a nav link — or a nav link pointing at a section that
 * no longer exists — fails the build rather than shipping a dead anchor.
 *
 * See specs/0004-section-driven-navigation.md.
 */

const navLinks = (page: import('@playwright/test').Page) =>
  page.locator('nav[aria-label="Primary"] a');

test.describe('header navigation', () => {
  test('links to every section, in page order', async ({ page }) => {
    await page.goto('');

    await expect(navLinks(page)).toHaveCount(sections.length);
    await expect(navLinks(page)).toHaveText(
      sections.map((entry) => entry.navLabel),
    );
  });

  test('every nav link points at a section that exists on the page', async ({
    page,
  }) => {
    await page.goto('');

    const hrefs = await navLinks(page).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href') ?? ''),
    );

    for (const href of hrefs) {
      const fragment = href.split('#')[1];
      expect(fragment, `nav link "${href}" has no fragment`).toBeTruthy();
      await expect(
        page.locator(`section#${fragment}`),
        `nav link points at #${fragment}, which is not on the page`,
      ).toHaveCount(1);
    }
  });

  test('every section on the page has a nav link', async ({ page }) => {
    await page.goto('');

    const sectionIds = await page
      .locator('main section[id]')
      .evaluateAll((nodes) => nodes.map((node) => node.id));

    expect(sectionIds.length).toBeGreaterThan(0);

    const hrefs = await navLinks(page).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href')?.split('#')[1] ?? ''),
    );

    for (const id of sectionIds) {
      expect(
        hrefs,
        `section #${id} has no link in the header — add it to src/data/sections.ts`,
      ).toContain(id);
    }

    // Same set, same order, in both directions.
    expect(hrefs).toEqual(sectionIds);
  });

  test('nav links carry the full path, so they work from other pages', async ({
    page,
    baseURL,
  }) => {
    const basePath = new URL(baseURL!).pathname;

    // The 404 page has no sections of its own; its nav must navigate home
    // rather than point at fragments that do not exist there.
    await page.goto('404');

    const hrefs = await navLinks(page).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href') ?? ''),
    );

    expect(hrefs).toHaveLength(sections.length);
    for (const href of hrefs) {
      expect(href.startsWith(basePath), `bare fragment on 404: ${href}`).toBe(
        true,
      );
    }
  });

  test('the name in the header links home and is the bolder element', async ({
    page,
  }) => {
    await page.goto('');

    const name = page.locator('body > div > header a').first();
    await expect(name).toHaveText('Drew Lewis');

    const weight = await name.evaluate((node) =>
      Number(getComputedStyle(node).fontWeight),
    );
    const linkWeight = await navLinks(page)
      .first()
      .evaluate((node) => Number(getComputedStyle(node).fontWeight));

    expect(weight).toBeGreaterThanOrEqual(700);
    expect(weight).toBeGreaterThan(linkWeight);
  });
});
