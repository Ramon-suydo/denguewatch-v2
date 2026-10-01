import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { mockPublicApi } from "./public-fixtures";

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
  await expect(page.getByRole("alert")).toContainText("data service");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
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
  await mockPublicApi(page);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/report", "/privacy", "/terms", "/data-sources"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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
