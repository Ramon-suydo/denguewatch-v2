import { defineConfig } from "@playwright/test";
const port = process.env.PLAYWRIGHT_PORT || "4173";
export default defineConfig({
  testDir: "./tests/ui",
  outputDir: ".artifacts/playwright",
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    reducedMotion: "reduce",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    navigationTimeout: 45000,
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/healthz.txt`,
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      VITE_TEST_FIXTURES: "true",
      VITE_SUPABASE_URL: "https://denguewatch-tests.invalid",
      VITE_SUPABASE_ANON_KEY: "isolated-public-test-key",
    },
  },
});
