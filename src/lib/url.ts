/**
 * Join a site-root-relative path onto the configured base path.
 *
 * The site is served from `/drew-lewis/` in production but from `/` in many
 * local/preview setups, so hard-coded absolute paths like `/about` silently
 * break only in production. Every internal href and asset src must go through
 * this helper. See CONSTITUTION.md, "Base path".
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}` || '/';
}
