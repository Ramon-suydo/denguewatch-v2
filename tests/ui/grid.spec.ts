import { test, expect } from "@playwright/test";
import { mockPublicApi } from "./public-fixtures";
test("mobile defaults to all 17 city cards without map tiles, with sorting and factors", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicApi(page);
  let tiles = 0;
  await page.route("**/*.tile.openstreetmap.org/**", (route) => {
    tiles++;
    return route.abort();
  });
  await page.goto("/map");
  await expect(
    page.getByRole("button", { name: "Grid", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".city-grid-card")).toHaveCount(17);
  expect(tiles).toBe(0);
  await page.getByLabel("Sort cities").selectOption("name");
  const names = await page.locator(".city-grid-card h2").allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  await page.getByLabel("Sort cities").selectOption("cases");
  const counts = (await page.locator(".city-case-count").allTextContents()).map(
    (n) => Number(n.replaceAll(",", "")),
  );
  expect(counts).toEqual([...counts].sort((a, b) => b - a));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".artifacts/public-app/city-grid-mobile.png",
    fullPage: false,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: ".artifacts/public-app/city-grid-desktop.png",
    fullPage: false,
  });
  await page.locator(".city-grid-card h2 a").first().click();
  await expect(page.getByRole("region", { name: "Model transparency" })).toBeVisible();
  await page.getByText("Inputs, training and interval limitations").click();
  await expect(page.getByText(/Deaths, population, weather, community reports, monthly aggregates and Manila daily data are not predictors/)).toBeVisible();
});
