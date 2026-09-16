/**
 * Join a site-root-relative path onto the configured base path.
 *
 * The site is served from `/drew-lewis/`, so a hard-coded absolute path like
 * `/about` points at the wrong URL. Every internal href and asset src must go
 * through this helper.
 *
 * It returns root-relative paths when no base is configured, so it stays
 * correct if the site ever moves to a custom domain — which is what keeps that
 * move a one-file change. See CONSTITUTION.md, "Hosting and base path".
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}` || '/';
}
