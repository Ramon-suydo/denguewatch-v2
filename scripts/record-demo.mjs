import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:43125";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw Error("Record the local reviewed preview only.");
await mkdir("docs/evidence", { recursive: true });
await mkdir(".artifacts/recording", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  channel:
    process.env.PLAYWRIGHT_CHANNEL ||
    (process.platform === "win32" ? "msedge" : undefined),
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: {
    dir: ".artifacts/recording",
    size: { width: 1280, height: 800 },
  },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const scenes = [];
async function scene(path, selector, seconds) {
  await page.goto(base + path);
  await page.locator(selector).first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  scenes.push({ path, seconds });
  await page.waitForTimeout(seconds * 1000);
}
try {
  await scene("/", "h2", 8);
  await page
    .getByRole("heading", { name: "Current risk unavailable" })
    .waitFor();
  await page.screenshot({
    path: "docs/evidence/home-1280.png",
    fullPage: true,
  });
  await scene("/trends", ".evidence-chart", 8);
  await page
    .getByRole("heading", { name: "Historical forecast and interval" })
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(5000);
  await scene("/metro-manila", ".ncr-city-map path", 8);
  await page.screenshot({
    path: "docs/evidence/metro-manila-1280.png",
    fullPage: true,
  });
  await scene("/methodology", '[aria-label="Model evaluation metrics"]', 8);
  await page
    .getByRole("heading", { name: "Did weather help?" })
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(4000);
  await scene("/prevention", "h2", 5);
  await page.getByRole("button", { name: "Filipino", exact: true }).click();
  await page.waitForTimeout(4000);
  await scene("/report", "h2", 5);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.waitForTimeout(3000);
  await scene("/admin", '[type="email"]', 5);
  await page.goto(base + "/");
  await page
    .getByRole("heading", { name: "Current risk unavailable" })
    .waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await scene("/trends", ".evidence-chart", 5);
  await context.setOffline(false);
  const video = page.video();
  await context.close();
  await video.saveAs("docs/evidence/fallback-demo.webm");
  const mobile = await browser.newContext({
    viewport: { width: 360, height: 900 },
    reducedMotion: "reduce",
  });
  const phone = await mobile.newPage();
  await phone.goto(base + "/");
  await phone
    .getByRole("heading", { name: "Current risk unavailable" })
    .waitFor();
  await phone.evaluate(() => document.fonts.ready);
  await phone.screenshot({
    path: "docs/evidence/home-360.png",
    fullPage: true,
  });
  await phone.goto(base + "/metro-manila");
  await phone.locator(".ncr-city-map path").first().waitFor();
  await phone.screenshot({
    path: "docs/evidence/metro-manila-360.png",
    fullPage: true,
  });
  await mobile.close();
  await writeFile(
    "docs/evidence/recording.json",
    JSON.stringify(
      {
        kind: "Actual local historical app navigation; not usability results",
        base,
        viewport: { width: 1280, height: 800 },
        scenes,
        no_health_report_submitted: true,
        no_staff_login_attempted: true,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Saved public screenshots and fallback-demo.webm; no report or staff login submitted.",
  );
} finally {
  await browser.close();
}
