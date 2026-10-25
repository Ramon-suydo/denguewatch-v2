import {goto,activeView} from '../support/active-view';
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
test("research pages: mobile/desktop, no overflow, no critical or serious axe issues", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [360, 768, 1280])
    for (const route of [
      "/",
      "/trends",
      "/metro-manila",
      "/methodology",
      "/prevention",
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await goto(page, route);
      await expect(activeView(page).locator("h1")).toBeVisible();
      if (route === "/")
        await expect(
          activeView(page).getByRole("heading", { name: "Current risk unavailable" }),
        ).toBeVisible();
      if (route === "/metro-manila")
        await expect(page.locator(".ncr-city-map path")).toHaveCount(17);
      if (route === "/methodology")
        await expect(
          activeView(page).getByRole("heading", { name: "Forecast comparison" }),
        ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const a = await new AxeBuilder({ page }).analyze();
      expect(
        a.violations.filter((v) =>
          ["critical", "serious"].includes(v.impact ?? ""),
        ),
        JSON.stringify(a.violations),
      ).toEqual([]);
    }
  expect(errors).toEqual([]);
  await mkdir(".artifacts/evidence-ui", { recursive: true });
  await goto(page, "/");
  await expect(
    activeView(page).getByRole("heading", { name: "Current risk unavailable" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: ".artifacts/evidence-ui/home-1280.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 900 });
  await page.screenshot({
    path: ".artifacts/evidence-ui/home-360.png",
    fullPage: true,
  });
});
test("scenario and year changes keep absence explicit; NCR remains historical", async ({
  page,
}) => {
  await goto(page, "/trends");
  await expect(
    activeView(page).getByRole("heading", { name: "Weekly recorded cases" }),
  ).toBeVisible();
  await activeView(page).getByLabel("Absent-day scenario").selectOption("Z");
  await expect(
    activeView(page).getByText("Zero is assumed only", { exact: false }),
  ).toBeVisible();
  await activeView(page).getByLabel("History year").selectOption("2020");
  await activeView(page).getByText("Exact weekly values and quality flags").click();
  await expect(
    activeView(page).getByRole("region", { name: "Weekly history data table" }),
  ).toBeVisible();
  await goto(page, "/metro-manila");
  await expect(
    activeView(page).getByText("Data ends January 2021.", { exact: true }),
  ).toBeVisible();
  await activeView(page).getByLabel("Comparison period").selectOption("week");
  await activeView(page).getByLabel("Week label").selectOption("2016-11-06");
  await expect(page.locator(".ncr-city-map path")).toHaveCount(17);
});
test("Filipino home/prevention, missing API retry, and legacy forecasts isolated", async ({
  page,
}) => {
  await goto(page, "/");
  await activeView(page).getByRole("button", { name: "Filipino", exact: true }).click();
  await expect(
    activeView(page).getByRole("heading", { name: "Hindi alam ang panganib ngayon" }),
  ).toBeVisible();
  await goto(page, "/prevention");
  await expect(activeView(page).getByRole("heading", { name: "4S ng DOH" })).toBeVisible();
  await goto(page, "/city/old-id");
  await expect(page).toHaveURL(/\/\?drawer=methods&section=trends$/);
  let failedRequests = 0;
  await page.route("**/api/v2/manila.json", (route) => {
    failedRequests++;
    return route.fulfill({ status: 503, body: "Unavailable" });
  });
  await goto(page, "/");
  await expect(activeView(page).getByRole("alert")).toContainText("could not load");
  expect(failedRequests).toBeGreaterThan(0);
  await expect(activeView(page).getByRole("button", { name: "Try again" })).toBeVisible();
  await page.unroute("**/api/v2/manila.json");
  await activeView(page).getByRole("button", { name: "Try again" }).click();
  await expect(
    activeView(page).getByRole("heading", { name: "Hindi alam ang panganib ngayon" }),
  ).toBeVisible();
});
