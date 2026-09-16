import { defineConfig, devices } from '@playwright/test';

/**
 * Tests run against `astro preview`, not the dev server, because preview serves
 * the real production build under the real `base` path (`/drew-lewis/`). The dev
 * server is more forgiving, which is exactly why it is the wrong thing to
 * validate against.
 */
const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}/drew-lewis`;

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
