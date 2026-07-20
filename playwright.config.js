import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/browser',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'output/playwright/report', open: 'never' }]
  ],
  outputDir: 'output/playwright/results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'allow'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] }
    }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/manifest.json',
    reuseExistingServer: false,
    timeout: 120_000
  }
})
