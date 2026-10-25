import { defineConfig } from "@playwright/test";
const port = process.env.PLAYWRIGHT_PORT || "43124";
export default defineConfig({
  testDir: "./tests/production",
  outputDir: ".artifacts/pwa-browser",
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/healthz.txt`,
    timeout: 120000,
    reuseExistingServer: false,
  },
});
