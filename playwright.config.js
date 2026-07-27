import { defineConfig, devices } from '@playwright/test';

/**
 * Local-only motion proof harness for the Nevamis static site.
 * Artifacts land in artifacts/motion-proof/ (gitignored, Jekyll-excluded).
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './artifacts/motion-proof/_runs',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: './artifacts/motion-proof/_report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3211',
    trace: 'off',
    screenshot: 'off',
    // Prove the real experience: motion on unless a test opts into reduce.
    reducedMotion: 'no-preference',
  },
  webServer: {
    command: 'node serve.js',
    url: 'http://127.0.0.1:3211/home.html',
    reuseExistingServer: true,
    timeout: 20_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
