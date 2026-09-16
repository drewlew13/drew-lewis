import { mkdtempSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';

/**
 * A photograph is not just pixels. A phone photo routinely carries EXIF
 * metadata, and that metadata routinely includes GPS coordinates accurate to a
 * few metres, plus the device and the timestamp.
 *
 * Publishing one raw would leak an exact location on a site that deliberately
 * says only "Austin, TX" and withholds a street address by rule — silently, and
 * in a form no reader would notice. So committed images carry no EXIF at all:
 * stripped entirely, not just of GPS, because the simplest rule is the one that
 * cannot be half-applied.
 *
 * See specs/0006-about-section-headshot.md.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIRS = ['src/assets', 'public'];
const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.tif',
  '.tiff',
  '.heic',
  '.heif',
]);

/** Largest an emitted headshot may be. A slow portrait is a slow first screen. */
const EMITTED_IMAGE_BUDGET_BYTES = 150 * 1024;

function walk(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // Directory may legitimately not exist.
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function imagesUnder(dirs: string[]): string[] {
  return dirs
    .flatMap((dir) => walk(join(ROOT, dir)))
    .filter((file) => IMAGE_EXTENSIONS.has(extname(file).toLowerCase()));
}

async function hasExif(file: string): Promise<boolean> {
  const metadata = await sharp(file).metadata();
  return Boolean(metadata.exif && metadata.exif.length > 0);
}

test('committed images carry no EXIF metadata', async () => {
  const images = imagesUnder(SOURCE_DIRS);
  expect(images.length, 'no source images found to check').toBeGreaterThan(0);

  const offenders: string[] = [];
  for (const image of images) {
    // Report the file and the rule, never the metadata contents — CI logs are
    // public, and the whole point is that this data does not get published.
    if (await hasExif(image)) {
      offenders.push(`${relative(ROOT, image)} carries an EXIF block`);
    }
  }

  expect(offenders, offenders.join('\n')).toEqual([]);
});

test('the EXIF check detects metadata when it is present', async () => {
  // A guard that has never rejected anything is not known to work. This writes
  // an image carrying EXIF — including a GPS tag, the field that matters — into
  // a temporary directory, well outside the repository.
  const dir = mkdtempSync(join(tmpdir(), 'exif-fixture-'));
  const fixture = join(dir, 'with-exif.jpg');

  await sharp({
    create: { width: 8, height: 8, channels: 3, background: '#888888' },
  })
    .jpeg()
    // In libvips' EXIF model IFD3 is the GPS directory, which is the tag
    // group that matters here: it is where a phone records where a photo was
    // taken.
    .withExif({
      IFD0: { Copyright: 'fixture' },
      IFD3: { GPSLatitudeRef: 'N', GPSLongitudeRef: 'W' },
    })
    .toFile(fixture);

  expect(await hasExif(fixture)).toBe(true);

  // And the same routine says no for an image written without metadata.
  const clean = join(dir, 'clean.jpg');
  await sharp({
    create: { width: 8, height: 8, channels: 3, background: '#888888' },
  })
    .jpeg()
    .toFile(clean);

  expect(await hasExif(clean)).toBe(false);
});

test('the emitted headshot stays within its size budget', async ({
  page,
  request,
}) => {
  await page.goto('');

  const src = await page.locator('#about img').getAttribute('src');
  expect(src, 'no headshot image found in the About section').toBeTruthy();

  const response = await request.get(src!);
  expect(response.status(), `headshot did not resolve: ${src}`).toBe(200);

  const bytes = (await response.body()).length;
  expect(
    bytes,
    `emitted headshot is ${Math.round(bytes / 1024)}KB`,
  ).toBeLessThanOrEqual(EMITTED_IMAGE_BUDGET_BYTES);

  // Also confirm it is on disk under the base path, not served from elsewhere.
  expect(src!.startsWith('/drew-lewis/')).toBe(true);
  expect(
    statSync(join(ROOT, 'dist', src!.replace('/drew-lewis/', ''))).isFile(),
  ).toBe(true);
});
