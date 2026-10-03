import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { loadDataset } from "../../scripts/lib/historical";
import { riskInputs } from "../../src/lib/composite";
import { computeForecast } from "../../src/lib/forecast";
import type { City, Observation } from "../../src/lib/types";
let cached: ReturnType<typeof build> | undefined;
async function build() {
  const dataset = await loadDataset("data/raw");
  const snapshot = JSON.parse(await readFile("public/demo-snapshot.json", "utf8"));
  const cities: City[] = dataset.lgus.map((city, index) => ({
    ...city,
    id: snapshot.cities.find((saved: { name: string }) => saved.name === city.name)!.id,
  }));
  const rows: Observation[] = dataset.observations.map((row, index) => ({
    ...row,
    id: index + 1,
    lgu_id: cities.find((city) => city.name === row.lgu_name)!.id,
  }));
  const forecasts = cities.map((city) => ({
    ...computeForecast(city.id, rows),
    input_digest: "isolated-real-source-fixture",
    computed_at: new Date().toISOString(),
  }));
  return { cities, rows, forecasts };
}
export async function fixtureData() {
  return (cached ??= build());
}
export async function mockPublicApi(
  page: Page,
  { open = true }: { open?: boolean } = {},
) {
  const fixture = await fixtureData();
  const submissions: Record<string, unknown>[] = [];
  const deletions: Record<string, unknown>[] = [];
  const historyOffsets: number[] = [];
  await page.route("**/rest/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const resource = url.pathname.split("/").at(-1);
    const respond = (value: unknown) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    if (resource === "lgus") return respond(fixture.cities);
    if (resource === "barangay_risk")
      return respond(
        fixture.cities.map((city) => ({
          lgu_id: city.id,
          inputs: riskInputs(
            fixture.rows.filter((r) => r.lgu_id === city.id),
            "2026-09-24",
            false,
          ),
        })),
      );
    if (resource === "city_forecasts") return respond(fixture.forecasts);
    if (resource === "community_policy")
      return respond({
        id: true,
        retention_days: 90,
        contact_email: open ? "research@example.test" : null,
        submissions_enabled: open,
        consent_version: "community-v1",
      });
    if (resource === "community_reports_weekly_agg") return respond([]);
    if (resource === "historical_surveillance") {
      const city = url.searchParams.get("lgu_id")?.replace("eq.", "");
      const period = url.searchParams.get("period_type")?.replace("eq.", "");
      const start = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 500);
      if (city) historyOffsets.push(start);
      return respond(
        fixture.rows
          .filter((row) => (!city || row.lgu_id === city) && row.period_type === period
            && (!url.searchParams.get("source") || row.source === url.searchParams.get("source")!.replace("eq.", "")))
          .sort((a, b) => {
            const direction = url.searchParams.get("order")?.includes("desc") ? -1 : 1;
            return direction * (a.period_start.localeCompare(b.period_start) || a.id - b.id);
          })
          .slice(start, start + limit),
      );
    }
    if (resource === "submit_community_report") {
      submissions.push(route.request().postDataJSON());
      return respond("DW-AAAAAAAAAAAAAAAAAAAAAAAA");
    }
    if (resource === "delete_community_report") {
      deletions.push(route.request().postDataJSON());
      return route.fulfill({ status: 204 });
    }
    // Never let an isolated browser test accidentally write to hosted Supabase.
    return route.abort();
  });
  return { ...fixture, submissions, deletions, historyOffsets };
}
