import { defineConfig, devices } from '@playwright/test'

// E2E_BASE_URL points the suite at a deployed site (e.g. https://worker-tracker-farm.netlify.app).
// Without it, the production build is served locally.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4180/'

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.e2e.ts',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Pixel 7'], baseURL, trace: 'retain-on-failure' },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run build && npx vite preview --port 4180 --strictPort', url: baseURL, reuseExistingServer: false, timeout: 120_000 },
})
