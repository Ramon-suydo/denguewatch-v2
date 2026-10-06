import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { mockPublicApi } from "../fixtures/public-fixtures";
test.describe.configure({ timeout: 180000 });
const snapshot = JSON.parse(await readFile("public/demo-snapshot.json", "utf8"));
const routes = ["/", "/dashboard", "/city/" + snapshot.cities.find((c: { name: string }) => c.name === "MANILA CITY").id, "/map", "/report", "/privacy", "/terms", "/legal", "/data-sources", "/dev", "/city/not-an-lgu", "/not-found"];
function watch(page: import("@playwright/test").Page) {
  const issues: string[] = [];
  page.on("pageerror", error => issues.push(error.message));
  page.on("console", message => { if (["error", "warning"].includes(message.type())) issues.push(message.text() + " @ " + message.location().url); });
  return issues;
}
async function screens(page: import("@playwright/test").Page) {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("Loading data…", { exact: true })).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} ${width}`).toBeTruthy();
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")), `${route} ${width}`).toEqual([]);
      const small = await page.locator("button:visible:not([disabled]), select:visible, summary:visible, a:visible:not(.skip-link)").evaluateAll(elements => elements.filter(e => {
        const box = e.getBoundingClientRect();
        return box.height < 43.5;
      }).map(e => e.textContent?.trim().slice(0, 50)));
      expect(small, `tap targets ${route} ${width}`).toEqual([]);
    }
  }
}
test("all public routes: online console hygiene, mobile/table targets and axe", async ({ page }) => {
  const issues = watch(page);
  await mockPublicApi(page, { open: false });
  await screens(page);
  expect(issues).toEqual([]);
});
test("offline snapshot needs no Supabase or external network and works with browser offline after assets load", async ({ page, context }) => {
  const issues = watch(page);
  // Deterministic loss of connectivity before the first data read; local static assets remain available.
  await page.addInitScript(() => Object.defineProperty(navigator, "onLine", { get: () => false }));
  let external = 0;
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(url.hostname)) return route.continue();
    external++; return route.abort();
  });
  await screens(page);
  await page.goto("/");
  await expect(page.getByText(/Offline demo snapshot/)).toBeVisible();
  await page.getByRole("link", { name: /Explore MANILA CITY in detail/ }).click();
  await page.getByLabel("Show records").selectOption("day");
  await page.getByText("View exact case values").click();
  await expect(page.locator(".chart-table tbody tr")).toHaveCount(40);
  await page.goto("/report");
  await expect(page.getByText("New submissions are not open yet.", { exact: false })).toBeVisible();
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("button", { name: "Continue to report" })).toBeDisabled();
  expect(external).toBe(0);
  expect(issues).toEqual([]);
});
test("warmed routes and snapshot work with the browser fully offline", async ({ page, context }) => {
  const issues = watch(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "onLine", { get: () => false }));
  await page.goto("/");
  await expect(page.getByText(/Offline demo snapshot/)).toBeVisible();
  // Prime lazy route modules through committed SPA navigation before switching offline.
  for (const route of routes) {
    await page.evaluate(async path => { history.pushState({}, "", path); dispatchEvent(new PopStateEvent("popstate")); await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); }, route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await context.setOffline(true);
  for (const route of routes) {
    await page.evaluate(async path => { history.pushState({}, "", path); dispatchEvent(new PopStateEvent("popstate")); await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); }, route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Offline demo snapshot/)).toBeVisible();
  }
  expect(issues).toEqual([]);
});
test("four-second timeout selects the snapshot without console noise", async ({ page }) => {
  const issues = watch(page);
  await page.addInitScript(() => {
    const original = window.fetch;
    window.fetch = (input, init) => String(input).includes("denguewatch-tests.invalid") ? new Promise(() => {}) : original(input, init);
  });
  const started = Date.now();
  await page.goto("/");
  await expect(page.getByText(/Offline demo snapshot/)).toBeVisible({ timeout: 6500 });
  expect(Date.now() - started).toBeLessThan(6500);
  await expect(page.locator(".area-table tbody tr")).toHaveCount(1);
  expect(issues).toEqual([]);
});
