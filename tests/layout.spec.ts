import { expect, test } from '@playwright/test';
import { builtRoutes } from './routes';

/**
 * Article 4 makes mobile width the default case. A multi-section page is
 * exactly where a stray wide element sneaks in, and a desktop-only check never
 * sees it. See specs/0003-resume-content-page.md.
 */

const WIDTHS = [
  { name: 'mobile', width: 375, height: 780 },
  { name: 'desktop', width: 1280, height: 900 },
];

for (const route of builtRoutes()) {
  for (const viewport of WIDTHS) {
    test(`page /${route} has no horizontal overflow at ${viewport.name} width`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto(route);

      const { scrollWidth, clientWidth, widest } = await page.evaluate(() => {
        const root = document.documentElement;
        let widest = '';
        let widestRight = root.clientWidth;

        // Name the offending element, otherwise the failure is a bare number.
        for (const element of Array.from(document.body.querySelectorAll('*'))) {
          const right = element.getBoundingClientRect().right;
          if (right > widestRight) {
            widestRight = right;
            widest = `${element.tagName.toLowerCase()}.${element.className}`;
          }
        }

        return {
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          widest,
        };
      });

      expect(
        scrollWidth,
        widest ? `widest element: ${widest}` : 'no element identified',
      ).toBeLessThanOrEqual(clientWidth);
    });
  }
}
