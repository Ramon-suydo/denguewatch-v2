import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { mockPublicApi } from "../fixtures/public-fixtures";
const evidence = JSON.parse(
  await readFile("public/api/v2/manila.json", "utf8"),
);

test("Manila stitched history preserves exact recorded values and source boundaries", async ({
  page,
}) => {
  await page.goto("/trends");
  await page.getByText("Exact weekly values and quality flags").click();
  const table = page.getByRole("region", { name: "Weekly history data table" });
  await expect(table.locator("tbody tr")).toHaveCount(evidence.series.M.length);
  await expect(table).toContainText("Missing / excluded");
  await expect(table).toContainText("2016-11-13");
  await expect(table).toContainText("DOH EPI");
  await expect(table).toContainText("Manila daily");
  await page.getByLabel("Absent-day scenario").selectOption("Z");
  await expect(table.locator("tbody tr")).toHaveCount(evidence.series.Z.length);
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
});
test("consent is opt-in, contact is optional, submission uses only RPC, and withdrawal hides code existence", async ({
  page,
}) => {
  const data = await mockPublicApi(page);
  await page.goto("/dev/legacy-report");
  const consent = page.getByRole("checkbox");
  await expect(consent).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Continue to report" }),
  ).toBeDisabled();
  await consent.check();
  await page.getByRole("button", { name: "Continue to report" }).click();
  await expect(page.getByLabel("City / municipality (required)")).toHaveValue(
    "MANILA CITY",
  );
  await expect(page.getByLabel("Email address or phone number")).toHaveCount(0);
  await page.getByRole("checkbox").check();
  await page
    .getByLabel("Email address or phone number")
    .fill("test@example.test");
  await page.getByRole("checkbox").uncheck();
  await expect(page.getByLabel("Email address or phone number")).toHaveCount(0);
  const date = page.getByLabel("Report date (required)");
  await date.fill("2099-01-01");
  await page.getByRole("button", { name: "Submit community report" }).click();
  expect(data.submissions).toHaveLength(0);
  await date.fill("2026-01-01");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Submit community report" }).click();
  await expect(
    page.getByRole("heading", { name: "Report received" }),
  ).toBeVisible();
  expect(data.submissions).toHaveLength(1);
  expect(data.submissions[0]).toMatchObject({
    p_consent_given: true,
    p_consent_version: "community-v1",
    p_contact_opt_in: false,
    p_contact_value: null,
  });
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "DW-",
  );
  expect(page.url()).not.toContain("DW-");
  await page.getByRole("link", { name: "Privacy → Withdraw a report" }).click();
  await page
    .getByLabel("Reference code", { exact: true })
    .fill("DW-AAAAAAAAAAAAAAAAAAAAAAAA");
  await page.getByRole("button", { name: "Request withdrawal" }).click();
  await expect(
    page.getByText("Request processed.", { exact: false }),
  ).toBeVisible();
  expect(data.deletions).toHaveLength(1);
  await expect(page.getByLabel("Reference code", { exact: true })).toHaveValue(
    "",
  );
});

test("closed collection, legacy redirect, service errors and retry have usable states", async ({
  page,
}) => {
  await mockPublicApi(page, { open: false });
  await page.goto("/report");
  await expect(
    page.getByText("New submissions are not open yet.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Continue to report" }),
  ).toBeDisabled();
  await page.goto("/city/not-a-city");
  await expect(page).toHaveURL(/\/trends$/);
  await page.route("**/api/v2/manila.json", (r) =>
    r.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.unroute("**/api/v2/manila.json");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Weekly recorded cases" }),
  ).toBeVisible();
});
test("historical NCR map distinguishes missing source weeks from zero", async ({
  page,
}) => {
  await page.goto("/map");
  await page.getByLabel("Comparison period").selectOption("week");
  await page.getByLabel("Week label").selectOption("2016-11-13");
  await expect(page.locator(".ncr-city-map path")).toHaveCount(17);
  await expect(
    page.getByRole("region", { name: "Historical NCR city ranking" }),
  ).toContainText("Unavailable");
  await expect(
    page.getByText("Data ends January 2021.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No district or barangay case counts are inferred.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(await page.locator(".barangay-svg").count()).toBe(0);
});
test("public routes retain disclaimers and legal access on phones", async ({
  page,
}) => {
  test.setTimeout(120000);
  await mockPublicApi(page, { open: false });
  for (const width of [320, 390, 768])
    for (const route of [
      "/",
      "/trends",
      "/map",
      "/report",
      "/privacy",
      "/terms",
      "/data-sources",
      "/dev",
      "/not-found",
    ]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("complementary", { name: "Estimates, not alerts" }),
      ).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toContainText("Dec 2, 2023");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
});
test("publishable community aggregates remain delayed, unverified and separate", async ({
  page,
}) => {
  await mockPublicApi(page, { open: false });
  await page.route("**/rest/v1/rpc/community_signal_aggregates**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          area_label: "Manila city (area not specified)",
          week_start: "2026-09-21",
          report_count: 7,
        },
      ]),
    }),
  );
  await page.goto("/community");
  const section = page.getByRole("region", {
    name: "Unverified community aggregates",
  });
  await expect(section).toContainText("7");
  await expect(
    page.getByText("minimum 72-hour delay", { exact: false }),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Historical forecast table"]'),
  ).toHaveCount(0);
});
test("loading resolves to an explicit empty snapshot without fabricated values", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/v2/manila.json", async (r) => {
    await gate;
    await r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...evidence,
        series: { M: [], Z: [] },
        snapshots: [],
      }),
    });
  });
  await page.goto("/");
  await expect(page.getByText("Loading data…", { exact: true })).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", {
      name: "No historical research snapshot available",
    }),
  ).toBeVisible();
});
test("historical forecast exposes all horizons and explicit interval uncertainty", async ({
  page,
}) => {
  await page.goto("/trends");
  await expect(
    page.getByRole("heading", { name: "Historical forecast and interval" }),
  ).toBeVisible();
  const table = page.getByRole("region", { name: "Forecast intervals" });
  await expect(table.locator("tbody tr")).toHaveCount(3);
  await expect(table).toContainText("exploratory");
  await page.goto("/methodology");
  await page.getByLabel("Forecast horizon").selectOption("4");
  await page.getByLabel("Evaluation fold").selectOption("covid-2020-2021");
  await expect(
    page
      .getByRole("region", { name: "Model evaluation metrics" })
      .locator("tbody tr"),
  ).toHaveCount(11);
  await expect(
    page.getByText("Intervals can under-cover", { exact: false }),
  ).toBeVisible();
});
test("model numbers exactly match saved evidence across scenarios and horizons", async ({
  page,
}) => {
  await page.goto("/methodology");
  for (const scenario of ["M", "Z"])
    for (const horizon of [1, 2, 4]) {
      await page.getByLabel("Absent-day scenario").selectOption(scenario);
      await page.getByLabel("Forecast horizon").selectOption(String(horizon));
      const row = evidence.summaries.find(
        (r: any) =>
          r.scenario === scenario &&
          r.horizon === horizon &&
          r.fold === "test-2018-2023" &&
          r.model === "naive",
      );
      const visible = page
        .getByRole("region", { name: "Model evaluation metrics" })
        .locator("tbody tr")
        .filter({
          has: page.getByRole("rowheader", { name: "naive", exact: true }),
        });
      await expect(visible).toContainText(
        row.mae.toLocaleString("en-PH", { maximumFractionDigits: 3 }),
      );
      await expect(visible).toContainText(String(row.n));
    }
});
test("bundled footer dates never become a false live DB coverage claim", async ({
  page,
}) => {
  await mockPublicApi(page);
  await page.route("**/rest/v1/historical_surveillance**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ period_start: "2031-01-01" }]),
    }),
  );
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Dec 2, 2023");
  await expect(footer).toContainText("Jan 10, 2021");
  await expect(footer).not.toContainText("2031");
  await expect(
    page.getByText("Bundled source periods.", { exact: false }),
  ).toBeVisible();
});
