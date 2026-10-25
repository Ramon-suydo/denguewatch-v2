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
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Current risk unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByText("Weather data unavailable; showing baseline forecast.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/In complete-row history/)).toContainText(
    "122.1",
  );
  await expect(
    page.getByRole("heading", { name: "Historical Manila forecast" }),
  ).toBeVisible();
  const data = await (await page.request.get("/api/v2/manila.json")).json();
  expect(data.snapshots.every((s: any) => s.model === "naive")).toBe(true);
  await page.getByRole("button", { name: "Filipino", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bantay-panahon: konteksto lamang" }),
  ).toBeVisible();
  await expect(
    page.getByText(
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
  await page.goto("/methodology");
  const table = page.getByRole("region", {
    name: "Season and weather ablation metrics",
  });
  await expect(table).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(7);
  await page
    .getByLabel("Environmental scenario", { exact: true })
    .selectOption("Z");
  await page
    .getByLabel("Environmental fold", { exact: true })
    .selectOption("2023");
  await page
    .getByLabel("Environmental horizon", { exact: true })
    .selectOption("2");
  await expect(
    table.getByRole("rowheader", { name: "env-season", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/469 paired weeks/)).toBeVisible();
  await page.goto("/metro-manila");
  await page
    .getByRole("button", { name: "Show exploratory city context" })
    .click();
  const values = page.getByRole("region", {
    name: "City geographic context values",
  });
  await expect(values.getByRole("row")).toHaveCount(18);
  await expect(
    page
      .getByRole("region", { name: "Exploratory geographic effect sizes" })
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
  await page.goto("/data-sources");
  await expect(
    page.getByRole("heading", {
      name: "Environmental and geographic providers",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/This data was obtained from the NASA Langley/),
  ).toBeVisible();
});
