import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

// Les tests visent le site construit (dist/) servi tel quel, avec la page de style (STYLEGUIDE=1).
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm run build && pnpm exec astro preview --port ${PORT}`,
    env: { STYLEGUIDE: '1' },
    url: `http://localhost:${PORT}/design/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
