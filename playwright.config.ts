import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8787',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Build the frontend with the local API base so its /api calls resolve to
    // the server we start here, then boot the Hono server that serves dist/.
    command: 'VITE_BASE_URL=http://localhost:8787 npm run build && npm run start',
    url: 'http://localhost:8787',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
