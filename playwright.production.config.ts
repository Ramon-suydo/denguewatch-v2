import { defineConfig } from "@playwright/test";
const port = process.env.PLAYWRIGHT_PORT || "43124";
export default defineConfig({
  testDir: "./tests/production",
  outputDir: ".artifacts/pwa-browser",
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
