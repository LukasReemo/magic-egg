import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4173/magic-egg/', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4173/magic-egg/', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'chromium-portrait', use: { browserName: 'chromium', viewport: {width: 820, height: 1180}, ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } } : {}) } },
    { name: 'chromium-landscape', use: { browserName: 'chromium', viewport: {width: 1024, height: 768}, ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } } : {}) } },
    { name: 'webkit-landscape', use: { browserName: 'webkit', viewport: {width: 1180, height: 820}, isMobile: true, hasTouch: true, ...(process.env.WEBKIT_PATH ? { launchOptions: { executablePath: process.env.WEBKIT_PATH } } : {}) } },
  ],
});
