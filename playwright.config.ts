import { defineConfig, devices } from '@playwright/test';
import astroConfig from './astro.config.mjs';

/**
 * Tests run against the production build served by `scripts/preview.mjs` under
 * the real base path, not against the dev server. The dev server is more
 * forgiving about exactly the things that break on GitHub Pages.
 *
 * `baseURL` must keep its trailing slash: Playwright resolves `page.goto()`
 * with the URL() constructor, which drops the last path segment when there is
 * no trailing slash. Routes are base-relative for the same reason.
 */
const PORT = 4321;

// Derived from astro.config.mjs rather than repeated here, so changing the
// deployment URL stays a one-file change. The preview server derives it the
// same way.
const BASE = `/${(astroConfig.base ?? '').replace(/^\/|\/$/g, '')}`.replace(
  /^\/$/,
  '',
);
const BASE_URL = `http://localhost:${PORT}${BASE}/`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // CI installs its own browser and leaves this unset. Sandboxes that
        // ship a pre-installed Chromium set CHROMIUM_PATH so the run reuses it
        // instead of downloading a second copy.
        launchOptions: process.env.CHROMIUM_PATH
          ? { executablePath: process.env.CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
