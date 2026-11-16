import { defineConfig, devices } from '@playwright/test';

/** End-to-end tests run against the pmu_test database, never the development one. */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5174',
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    {
      command: 'npm run start --workspace @pmu/api',
      url: 'http://127.0.0.1:3001/api/health',
      env: { ENV_FILE: '.env.test' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run dev --workspace @pmu/web -- --port 5174 --strictPort',
      url: 'http://localhost:5174',
      env: { API_URL: 'http://127.0.0.1:3001' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
