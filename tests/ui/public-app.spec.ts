import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { mockPublicApi } from "./public-fixtures";
import cache from "../../src/data/weekly-forecast-v1.json" with { type: "json" };
import { sourceAttribution } from "../../src/lib/source-metadata";

test("dashboard and full city series use real-source fixtures, keep provenance separate, and paginate Manila daily data", async ({
  page,
}) => {
  const data = await mockPublicApi(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Historical case trend" }),
  ).toBeVisible();
  await expect(page.locator('section[aria-labelledby="history-title"] .history-chart svg').first()).toBeVisible();
  await expect(
    page.getByText(
      "No community reports yet for this city, or fewer than five in each week. Small counts are hidden for privacy.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Historical estimate only.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".area-table tbody tr")).toHaveCount(17);
  await page
    .getByRole("link", { name: /Explore MANILA CITY in detail/ })
    .click();
  await page.getByLabel("Period type").selectOption("day");
  await expect(
    page.getByText("Incidence is not published for this source.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Dec 2, 2023/).first()).toBeVisible();
  expect(data.historyOffsets).toContain(1500);
  await page.getByText("View exact case values").click();
  await expect(page.locator(".chart-table tbody tr")).toHaveCount(40);
  await page.getByLabel("Period type").selectOption("month");
  await expect(page.locator('section[aria-labelledby="history-title"] .history-chart svg')).toHaveCount(2);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(errors).toEqual([]);
  await page.goto("/");
  await expect(page.locator('section[aria-labelledby="history-title"] .history-chart svg')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await mkdir(".artifacts/public-app", { recursive: true });
  await page.screenshot({
    path: ".artifacts/public-app/dashboard.png",
    fullPage: true,
  });
});

test("consent is opt-in, contact is optional, submission uses only RPC, and withdrawal hides code existence", async ({
  page,
}) => {
  const data = await mockPublicApi(page);
  await page.goto("/report");
  const consent = page.getByRole("checkbox");
  await expect(consent).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Continue to report" }),
  ).toBeDisabled();
  await consent.check();
  await page.getByRole("button", { name: "Continue to report" }).click();
  await page
    .getByLabel("City / municipality (required)")
    .selectOption(data.cities[0].id);
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

test("closed collection, missing city, empty history and service errors have usable states", async ({
  page,
}) => {
  const data = await mockPublicApi(page, { open: false });
  await page.goto("/report");
  await expect(
    page.getByText("New submissions are not open yet.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Continue to report" }),
  ).toBeDisabled();
  await page.goto("/city/not-a-city");
  await expect(
    page.getByRole("heading", { name: "City not found" }),
  ).toBeVisible();
  await page.goto(
    "/city/" + data.cities.find((city) => city.name === "MAKATI CITY")!.id,
  );
  await page.getByLabel("Period type").selectOption("day");
  await expect(
    page
      .getByText("No daily observations are available for this city.")
      .first(),
  ).toBeVisible();
  await page.route("**/rest/v1/historical_surveillance**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "unavailable" }),
    }),
  );
  await page.getByLabel("Period type").selectOption("month");
  await expect(page.getByText(/Offline demo snapshot/)).toBeVisible();
  await expect(page.locator('section[aria-labelledby="history-title"] .history-chart svg')).toHaveCount(2);
});

test("map popups distinguish old official trends and community counts; tile failures keep the list usable", async ({
  page,
}) => {
  await mockPublicApi(page);
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("/map");
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(17);
  await expect(
    page.getByText("Some map tiles could not load.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Map risk display").selectOption("historical");
  await page.locator('.leaflet-marker-icon[title^="MANILA CITY"]').click();
  await expect(
    page
      .locator(".leaflet-popup")
      .getByText("Recent eligible historical months"),
  ).toBeVisible();
  await expect(
    page.locator(".leaflet-popup").getByText("Community · Unverified"),
  ).toBeVisible();
  await expect(
    page
      .locator(".leaflet-popup")
      .getByText(
        "No community reports yet for this city, or fewer than five in each week. Small counts are hidden for privacy.",
      ),
  ).toBeVisible();
  await page.locator(".leaflet-popup-close-button").click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("public routes are responsive and legal information stays available on phones", async ({
  page,
}) => {
  const fixture = await mockPublicApi(page);
  await page.route("https://tile.openstreetmap.org/**", route => route.abort());
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/dashboard", "/city/" + fixture.cities[0].id, "/map", "/report", "/privacy", "/terms", "/data-sources", "/design-preview", "/not-found"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const notice = page.getByRole("complementary", { name: "Estimates, not alerts" });
      await expect(notice).toHaveCount(1);
      await expect(notice).toContainText("Community reports are unverified and are not part of official data");
      await expect(notice).toContainText("not medical advice, an emergency or outbreak alert");
      const footer = page.getByRole("contentinfo");
      await expect(footer).toContainText(sourceAttribution());
      await expect(footer).toContainText("Last data period: Dec 2, 2023 (Manila daily only)");
      await expect(footer).toContainText("NCR weekly: Jan 10, 2021");
      await expect(footer.getByRole("link", { name: "Data & Sources" })).toBeVisible();
      await expect(page.getByText("Loading data…")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('section[aria-labelledby="history-title"] .history-chart svg')).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.evaluate(() => document.fonts.ready);
  await mkdir(".artifacts/public-app", { recursive: true });
  await page.screenshot({
    path: ".artifacts/public-app/mobile.png",
    fullPage: true,
  });
});

test("publishable community volumes remain separate and are labelled as a lower bound", async ({
  page,
}) => {
  const data = await mockPublicApi(page);
  const manila = data.cities.find((city) => city.name === "MANILA CITY")!;
  await page.route("**/rest/v1/rpc/community_reports_weekly_agg**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { lgu_id: manila.id, week_start: "2026-09-21", report_count: 7 },
      ]),
    }),
  );
  await page.goto("/");
  const section = page.getByRole("region", {
    name: "Recent community reports",
  });
  await expect(
    section.getByText("reports in publishable weeks.", { exact: false }),
  ).toContainText("7");
  await expect(section.getByText("Community · Unverified")).toBeVisible();
  await expect(page.getByText("Model: Ridge regression.", { exact: false })).toBeVisible();
  await expect(page.getByRole("region", { name: "Forecast estimates and prediction intervals" }).locator("tbody tr")).toHaveCount(3);
});

test("loading can resolve to empty city data without inventing observations", async ({
  page,
}) => {
  await mockPublicApi(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/rest/v1/lgus**", async (route) => {
    await gate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await page.goto("/");
  await expect(page.getByText("Loading data…")).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", { name: "No cities available yet" }),
  ).toBeVisible();
});

test("weekly forecast cache exposes all horizons, matched model metrics and historical uncertainty accessibly", async ({ page }) => {
  await mockPublicApi(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Weekly forecast estimates" })).toBeVisible();
  await expect(page.getByText("Ridge beats seasonal naive in 17 of 17 LGUs", { exact: false })).toBeVisible();
  const estimates = page.getByRole("region", { name: "Forecast estimates and prediction intervals" });
  await expect(estimates.locator("tbody tr")).toHaveCount(3);
  await expect(estimates).toContainText("Jan 17, 2021");
  await page.getByLabel("Forecast horizon").selectOption("4");
  await expect(page.locator(".forecast-date")).toContainText("Feb 7, 2021");
  await page.getByLabel("Backtest reporting period").selectOption("without-covid");
  await expect(page.getByText(/Removing those targets leaves only 2019/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Walk-forward model performance" }).locator("tbody tr")).toHaveCount(6);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByText("Inputs, training and interval limitations").click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("model transparency numbers and baseline order match the cached artifact", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto("/");
  const transparency = page.getByRole("region", { name: "Model transparency" });
  const score = (model: string, cohort = "all-2019-onward", horizon = 1) => cache.summary.find(s => s.city === "ALL NCR" && s.model === model && s.cohort === cohort && s.horizon === horizon)!;
  const model = score(cache.selected), mean = score("mean-4"), naive = score("seasonal-naive");
  const improvement = (value: number | null, base: number | null) => value === null || base === null || base === 0 ? "Unavailable" : (100 * (base - value) / base).toFixed(1) + "%";
  const headline = transparency.getByTestId("headline-baseline-comparison");
  await expect(headline).toContainText(model.mae!.toFixed(2));
  await expect(headline).toContainText(mean.mae!.toFixed(2));
  await expect(headline).toContainText(naive.mae!.toFixed(2));
  await expect(headline).toContainText(improvement(model.mae, mean.mae));
  await expect(headline).toContainText(improvement(model.mae, naive.mae));
  expect((await headline.innerText()).indexOf("4-week mean")).toBeLessThan((await headline.innerText()).indexOf("Seasonal naive"));
  await expect(transparency.getByTestId("smape-limitation")).toContainText(model.smape!.toFixed(1) + "%");
  await expect(transparency.getByTestId("smape-limitation")).toContainText(mean.smape!.toFixed(1) + "%");
  const excludedCovid = score(cache.selected, "without-covid");
  await expect(transparency.getByTestId("interval-limitation")).toContainText(excludedCovid.coverage80!.toFixed(1) + "%/" + excludedCovid.coverage95!.toFixed(1) + "%");
  await expect(transparency).toContainText(cache.metadata.evaluation);
  await expect(transparency).toContainText("There is no evidence on later years");
  for (const cohort of ["all-2019-onward", "without-covid", "covid-only"]) {
    await page.getByLabel("Backtest reporting period").selectOption(cohort);
    for (const horizon of [1, 2, 4]) {
      await page.getByLabel("Forecast horizon").selectOption(String(horizon));
      const m = score(cache.selected, cohort, horizon), b = score("mean-4", cohort, horizon), n = score("seasonal-naive", cohort, horizon);
      await expect(page.getByTestId("slice-baseline-comparison")).toContainText(improvement(m.mae, b.mae));
      await expect(page.getByTestId("slice-baseline-comparison")).toContainText(improvement(m.mae, n.mae));
    }
  }
});

test("footer follows DB changes and explicitly labels snapshot coverage after failed reads", async ({ page }) => {
  await mockPublicApi(page);
  await page.route("**/rest/v1/historical_surveillance**", route => {
    const period = new URL(route.request().url()).searchParams.get("period_type");
    const date = period === "eq.day" ? "2031-01-01" : period === "eq.week" ? "2030-12-29" : "2030-12-01";
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ period_start: date }]) });
  });
  await page.goto("/data-sources");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Last data period: Jan 1, 2031 (Manila daily only)");
  await expect(footer).toContainText("NCR weekly: Dec 29, 2030");
  await page.route("**/rest/v1/historical_surveillance**", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "unavailable" }) }));
  await page.reload();
  await expect(page.getByText(/Offline demo snapshot/)).toBeVisible();
  await expect(footer).toContainText("Coverage from the verified demo snapshot");
  await expect(footer).not.toContainText("Jan 1, 2031");
  await expect(footer).toContainText("Dec 2, 2023");
  await page.route("**/rest/v1/historical_surveillance**", route => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.reload();
  await expect(footer).toContainText("Last data period: No published records available");
});
