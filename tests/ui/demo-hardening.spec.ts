import {goto,ready,activeView} from '../support/active-view';
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockPublicApi } from "../fixtures/public-fixtures";
const routes = [
  "/",
  "/trends",
  "/metro-manila",
  "/methodology",
  "/prevention",
  "/community",
  "/report",
  "/privacy",
  "/terms",
  "/legal",
  "/data-sources",
  "/not-found",
];
async function navigate(page: import("@playwright/test").Page, path: string) {
  await page.evaluate((p) => {
    history.pushState({}, "", p);
    dispatchEvent(new PopStateEvent("popstate"));
  }, path);
  await ready(page,path);
}
test("all public routes retain mobile targets, console hygiene and axe", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      errors.push(message.text());
  });
  await mockPublicApi(page, { open: false });
  for (const width of [320, 390, 768, 1280])
    for (const route of routes) {
      await page.setViewportSize({ width, height: 900 });
      await goto(page, route);
      await expect(activeView(page).getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const violations = (
        await new AxeBuilder({ page }).analyze()
      ).violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      );
      expect(violations, route + " " + width).toEqual([]);
      const small = await page
        .locator(
          "button:visible:not([disabled]),select:visible,summary:visible,a:visible:not(.skip-link)",
        )
        .evaluateAll((elements) =>
          elements
            .filter((e) => e.getBoundingClientRect().height < 43.5)
            .map((e) => e.textContent?.trim().slice(0, 45)),
        );
      expect(small, route + " " + width).toEqual([]);
    }
  expect(errors).toEqual([]);
});
test("blocked external services leave static historical pages and closed reporting usable", async ({
  page,
  context,
}) => {
  const external: string[] = [];
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "onLine", { get: () => false }),
  );
  await context.route("**/*", (r) => {
    if (
      ["localhost", "127.0.0.1"].includes(new URL(r.request().url()).hostname)
    )
      return r.continue();
    external.push(r.request().url());
    return r.abort();
  });
  for (const route of [
    "/",
    "/trends",
    "/metro-manila",
    "/methodology",
    "/prevention",
    "/report",
  ]) {
    await goto(page, route);
    await expect(activeView(page).getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.locator("main>.evidence-banner"),
    ).toBeVisible();
  }
  await expect(
    activeView(page).getByText("New submissions are closed.", { exact: false }),
  ).toBeVisible();
  expect(external).toEqual([]);
});
test("warmed routes and validated datasets remain available with the browser fully offline", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await goto(page, "/");
  await expect(
    activeView(page).getByRole("heading", { name: "Cities to watch" }),
  ).toBeVisible();
  for (const route of [
    "/trends",
    "/metro-manila",
    "/methodology",
    "/prevention",
    "/",
  ])
    await navigate(page, route);
  await context.setOffline(true);
  for (const route of [
    "/trends",
    "/metro-manila",
    "/methodology",
    "/prevention",
    "/",
  ]) {
    await navigate(page, route);
    await expect(
      page.locator("main>.evidence-banner"),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("slow research reads show loading without inventing a current risk, then resolve", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/v2/manila.json", async (r) => {
    await gate;
    await r.continue();
  });
  await goto(page, "/about?drawer=methods&section=dashboard");
  await expect(activeView(page).getByText("Loading data…", { exact: true })).toBeVisible();
  await expect(
    activeView(page).getByRole("heading", { name: "Current risk unavailable" }),
  ).toHaveCount(0);
  release();
  await expect(
    activeView(page).getByRole("heading", { name: "Current risk unavailable" }),
  ).toBeVisible();
});
