import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui",
  outputDir: ".artifacts/playwright",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    reducedMotion: "reduce",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://denguewatch-tests.invalid",
      VITE_SUPABASE_ANON_KEY: "isolated-public-test-key",
    },
  },
});
