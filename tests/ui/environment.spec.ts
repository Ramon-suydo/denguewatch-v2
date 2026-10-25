import {goto,activeView} from '../support/active-view';
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("weather failure leaves historical persistence usable and providers stay server-only", async ({
  page,
}) => {
  const providerCalls: string[] = [];
  page.on("request", (r) => {
    if (
      /archive-api\.open-meteo|power\.larc|overpass|opentopodata/.test(r.url())
    )
      providerCalls.push(r.url());
  });
  await page.route("**/api/v2/weather.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await goto(page, "/");
  await expect(
    activeView(page).getByRole("heading", { name: "Current risk unavailable" }),
  ).toBeVisible();
  await expect(
    activeView(page).getByText("Weather data unavailable; showing baseline forecast.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(activeView(page).getByText(/In complete-row history/)).toContainText(
    "122.1",
  );
  await expect(
    activeView(page).getByRole("heading", { name: "Historical Manila forecast" }),
  ).toBeVisible();
  const data = await (await page.request.get("/api/v2/manila.json")).json();
  expect(data.snapshots.every((s: any) => s.model === "naive")).toBe(true);
  await activeView(page).getByRole("button", { name: "Filipino", exact: true }).click();
  await expect(
    activeView(page).getByRole("heading", { name: "Bantay-panahon: konteksto lamang" }),
  ).toBeVisible();
  await expect(
    activeView(page).getByText(
      "Hindi makuha ang datos ng panahon; batayang pagtataya ang ipinapakita.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(providerCalls).toEqual([]);
});
test("environment ablation and exploratory city context remain accessible at 360px", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 360, height: 900 });
  await goto(page, "/methodology");
  const table = activeView(page).getByRole("region", {
    name: "Season and weather ablation metrics",
  });
  await expect(table).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(7);
  await activeView(page).getByLabel("Environmental scenario", { exact: true })
    .selectOption("Z");
  await activeView(page).getByLabel("Environmental fold", { exact: true })
    .selectOption("2023");
  await activeView(page).getByLabel("Environmental horizon", { exact: true })
    .selectOption("2");
  await expect(
    table.getByRole("rowheader", { name: "env-season", exact: true }),
  ).toBeVisible();
  await expect(activeView(page).getByText(/469 paired weeks/)).toBeVisible();
  await goto(page, "/metro-manila");
  await activeView(page).getByRole("button", { name: "Show exploratory city context" })
    .click();
  const values = activeView(page).getByRole("region", {
    name: "City geographic context values",
  });
  await expect(values.getByRole("row")).toHaveCount(18);
  await expect(
    activeView(page).getByRole("region", { name: "Exploratory geographic effect sizes" })
      .getByRole("row"),
  ).toHaveCount(7);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    axe.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await goto(page, "/data-sources");
  await expect(
    activeView(page).getByRole("heading", {
      name: "Environmental and geographic providers",
    }),
  ).toBeVisible();
  await expect(
    activeView(page).getByText(/This data was obtained from the NASA Langley/),
  ).toBeVisible();
});
