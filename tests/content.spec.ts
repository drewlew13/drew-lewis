import { expect, test } from '@playwright/test';
import { sections } from '../src/data/sections';
import {
  education,
  experience,
  headshot,
  links,
  profile,
  projects,
  renderSummary,
  skills,
  yearsSince,
} from '../src/data/resume';

/**
 * The page is generated from the records in src/data/resume.ts, so these assert
 * that what is in the data reaches the page — an entry cannot be silently
 * dropped by a markup change. See specs/0003-resume-content-page.md.
 */

test.describe('homepage content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('');
  });

  test('renders every résumé section, each linkable by id', async ({
    page,
  }) => {
    for (const section of sections) {
      const element = page.locator(`section#${section.id}`);
      await expect(element, `section #${section.id} is missing`).toHaveCount(1);
      await expect(element.locator('h2')).toHaveText(section.title);
    }

    // No extra sections beyond the ones the spec defines.
    await expect(page.locator('main section')).toHaveCount(sections.length);
  });

  test('renders one entry per record, with no entry dropped', async ({
    page,
  }) => {
    await expect(page.locator('#experience article')).toHaveCount(
      experience.length,
    );
    await expect(page.locator('#projects article')).toHaveCount(
      projects.length,
    );
    await expect(page.locator('#education article')).toHaveCount(
      education.length,
    );

    for (const entry of [...experience, ...projects]) {
      const article = page.locator(`article#${entry.slug}`);
      await expect(article, `entry ${entry.slug} is missing`).toHaveCount(1);
      await expect(article.locator('h3')).toHaveText(entry.title);
      await expect(article.locator('li')).toHaveCount(entry.highlights.length);
    }
  });

  test('renders every skill group and item', async ({ page }) => {
    const groups = page.locator('#skills h3');
    await expect(groups).toHaveCount(skills.length);

    for (const group of skills) {
      const heading = page.locator('#skills h3', { hasText: group.name });
      await expect(heading).toHaveCount(1);
    }

    const totalItems = skills.reduce((sum, g) => sum + g.items.length, 0);
    await expect(page.locator('#skills li')).toHaveCount(totalItems);
  });

  test('states the years of experience derived from the start date', async ({
    page,
  }) => {
    const years = yearsSince(profile.careerStart);
    expect(years).toBeGreaterThan(0);

    // The rendered summary must carry the computed figure, not a stale literal.
    expect(renderSummary()).toContain(`${years} years`);
    await expect(page.locator('#about')).toContainText(`${years} years`);
    await expect(page.locator('#about')).not.toContainText('{years}');
  });

  test('link bank exposes every link with a usable accessible name', async ({
    page,
  }) => {
    const bank = page.locator('#about ul a');
    await expect(bank).toHaveCount(links.length);

    for (const link of links) {
      const anchor = page.locator(`#about a[href="${link.href}"]`);
      await expect(anchor, `link ${link.label} is missing`).toHaveCount(1);

      const name = (await anchor.textContent())?.trim() ?? '';
      expect(name.length, `link ${link.label} has no text`).toBeGreaterThan(0);
      expect(name).toContain(link.label);

      if (link.href.startsWith('mailto:')) {
        // rel is meaningless on a mailto — there is no document to open.
        await expect(anchor).not.toHaveAttribute('rel', /.*/);
      } else {
        await expect(anchor).toHaveAttribute('rel', /noopener/);
        expect(link.href.startsWith('https://')).toBe(true);
      }
    }
  });

  test('the contact link is a working mailto with a literal sub-address', async ({
    page,
  }) => {
    const contact = links.filter((link) => link.href.startsWith('mailto:'));
    expect(contact, 'exactly one contact link is expected').toHaveLength(1);

    const [{ href }] = contact;
    const address = href.slice('mailto:'.length);

    // No query string: the address is the whole path, so nothing can be
    // mistaken for form encoding.
    expect(href).not.toContain('?');

    // The `+` stays literal. A browser hands the href to the mail client
    // without decoding it, so `%2B` would arrive as three characters and only a
    // conformant client would turn it back into `+`.
    expect(address).toContain('+');
    expect(href).not.toContain('%');

    expect(address).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // And the anchor on the page carries it unchanged.
    const anchor = page.locator(`#about a[href="${href}"]`);
    await page.goto('');
    await expect(anchor).toHaveCount(1);
    await expect(anchor).toHaveAttribute('href', href);
  });

  test('the link bank moved out of the hero and left nothing behind', async ({
    page,
  }) => {
    await page.goto('');

    // The hero is now name, descriptor and location only.
    await expect(page.locator('main > div > header a')).toHaveCount(0);

    // And every link is present in the About section instead.
    await expect(page.locator('#about ul a')).toHaveCount(links.length);
  });

  test('the About section shows a headshot that will not shift the layout', async ({
    page,
  }) => {
    await page.goto('');

    const image = page.locator('#about img');
    await expect(image).toHaveCount(1);

    const alt = await image.getAttribute('alt');
    expect(alt?.trim().length, 'headshot has no alt text').toBeGreaterThan(0);
    expect(alt).toBe(headshot.alt);

    // Explicit intrinsic dimensions, so nothing jumps as the image loads.
    const width = Number(await image.getAttribute('width'));
    const height = Number(await image.getAttribute('height'));
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(width, 'the headshot source should be square').toBe(height);

    // Eager, because this sits at the top of the page; lazy would delay the
    // largest paint rather than help it.
    await expect(image).toHaveAttribute('loading', 'eager');
  });

  test('the headshot alt text and placeholder flag agree', async () => {
    const saysPlaceholder = /placeholder/i.test(headshot.alt);

    // The schema enforces this at build time; asserting it here means a change
    // to either side fails loudly rather than shipping a placeholder described
    // as a photograph of Drew, or the reverse.
    expect(
      saysPlaceholder,
      headshot.isPlaceholder
        ? 'this is a placeholder, so the alt text must say so'
        : 'this is a real photograph, so the alt text must not say placeholder',
    ).toBe(headshot.isPlaceholder);
  });

  test('heading levels descend without skipping', async ({ page }) => {
    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((nodes) => nodes.map((n) => Number(n.tagName[1])));

    expect(levels[0], 'the first heading should be the h1').toBe(1);

    for (let i = 1; i < levels.length; i += 1) {
      expect(
        levels[i] - levels[i - 1],
        `heading level jumped from h${levels[i - 1]} to h${levels[i]}`,
      ).toBeLessThanOrEqual(1);
    }
  });
});
