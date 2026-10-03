import { test, expect } from "@playwright/test";
import { mockPublicApi } from "../fixtures/public-fixtures";
test("mobile defaults to the Manila card without map tiles, with sorting and factors", async ({
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
  await expect(page.locator(".city-grid-card")).toHaveCount(1);
  expect(tiles).toBe(0);
  await expect(page.getByLabel("Sort cities")).toHaveCount(0);
  await expect(page.locator(".city-grid-card h2")).toContainText("MANILA CITY");
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
