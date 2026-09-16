import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

/**
 * Every route in the built site, discovered from `dist/` rather than
 * hand-listed. Adding a page automatically puts it under the accessibility
 * suite; there is no list to forget to update.
 *
 * Paths are relative to the configured base, so they compose with Playwright's
 * `baseURL` (which already includes `/drew-lewis`).
 */
export function builtRoutes(): string[] {
  const routes = walk(DIST)
    .map((file) => relative(DIST, file).split(sep).join('/'))
    .map(
      (rel) =>
        '/' + rel.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, ''),
    )
    .map((route) => (route.length > 1 ? route.replace(/\/$/, '') : route));

  return [...new Set(routes)].sort();
}
