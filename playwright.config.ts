import { defineConfig, devices } from '@playwright/test'

// Two local builds:
// - 4180: the login + sync code, built with dummy Supabase keys; tests answer those requests with a fake backend.
// - 4181: the real production build (no keys): no login, data stays on the phone.
// E2E_BASE_URL points the suite at a deployed site instead (only local.e2e.ts applies there).
const local = !process.env.E2E_BASE_URL

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.e2e.ts',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Pixel 7'], baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4180/', trace: 'retain-on-failure' },
  webServer: local
    ? [
        {
          command:
            'VITE_SUPABASE_URL=https://e2e-test.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_e2e npx vite build --outDir dist-e2e-auth && npx vite preview --outDir dist-e2e-auth --port 4180 --strictPort',
          url: 'http://localhost:4180/',
          reuseExistingServer: false,
          timeout: 120_000,
        },
        {
          command: 'npm run build && npx vite preview --port 4181 --strictPort',
          url: 'http://localhost:4181/',
          reuseExistingServer: false,
          timeout: 120_000,
        },
      ]
    : undefined,
})
