import { defineConfig } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

// Cargar .env.local para que los tests E2E vean las creds (Supabase, etc.)
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env.test', override: false })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: process.env.CI
    ? {
        command: 'npx next dev -p 3000',
        url: 'http://localhost:3000',
        timeout: 60000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})
