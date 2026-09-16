// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// The site is a GitHub Pages *project* page, so it is served from a subpath.
// `site` + `base` must stay in sync with the repository name, or every
// generated asset URL 404s in production while still working locally.
export default defineConfig({
  site: 'https://drewlew13.github.io',
  base: '/drew-lewis',
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
});
