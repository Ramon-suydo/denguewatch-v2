import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { config } from "dotenv";
import pg from "pg";
import { loadDataset } from "./lib/historical.ts";
import { readDatabaseCa } from "./lib/database-tls.ts";
config({ path: [".env.local", ".env"], quiet: true });
async function main() {
  const dataset = await loadDataset("data/raw");
  const connection = process.env.DIRECT_DATABASE_URL;
  if (!connection) throw new Error("Missing DB configuration");
  const url = new URL(connection);
  assert.ok(["postgres:", "postgresql:"].includes(url.protocol) && url.port !== "6543");
  const mode = url.searchParams.get("sslmode");
  assert.ok(!mode || ["require", "verify-ca", "verify-full"].includes(mode));
  url.searchParams.delete("sslmode");
  for (const key of ["ssl", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat"]) assert.ok(!url.searchParams.has(key));
  const ca = await readDatabaseCa(process.env.DB_SSL_CA_FILE);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000,
    ssl: local ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) } });
  try {
    await client.connect();
    await client.query("begin isolation level repeatable read read only");
    const cities = (await client.query("select id,name,psgc_code,population,population_year,population_source from public.lgus where is_active order by name")).rows;
    const history = (await client.query("select id,lgu_id,period_start::text,period_type,cases,deaths,source,source_citation,source_sha256,period_date_semantics,incidence_per_100k::float8,population,population_year,weeks_reported,quality_flags from public.historical_surveillance order by lgu_id,period_start,id")).rows;
    assert.equal(cities.length, 17); assert.equal(history.length, 7350);
    assert.deepEqual(cities.map(({ id, ...city }) => city), [...dataset.lgus].sort((a,b) => a.name.localeCompare(b.name)));
    const byKey = new Map(history.map(row => [`${cities.find(c => c.id === row.lgu_id)?.name}|${row.period_start}|${row.period_type}|${row.source}`, row]));
    assert.equal(byKey.size, history.length);
    for (const expected of dataset.observations) {
      const { lgu_name, source_citation, ...fields } = expected;
      const actual = byKey.get(`${lgu_name}|${expected.period_start}|${expected.period_type}|${expected.source}`);
      assert.ok(actual);
      for (const [field, value] of Object.entries(fields)) assert.deepEqual(actual[field], value);
    }
    const forecasts = (await client.query("select lgu_id,source,method_version,data_as_of::text,forecast_for::text,valid_until::text,latest_observation::text,predicted_cases,p50,p80,risk_label,baseline_count,baseline_start::text,baseline_end::text,input_periods,reason,computed_at,input_digest from public.city_forecasts order by lgu_id")).rows;
    // Only official factors. No community signals, policy records, contacts or report tables.
    const risks = (await client.query("select lgu_id,jsonb_build_object('trend',inputs->'trend','seasonality',inputs->'seasonality','current_calendar_seasonality',inputs->'current_calendar_seasonality','latest',inputs->'latest','selection',inputs->'selection') as inputs from public.barangay_risk order by lgu_id")).rows;
    const legacyBacktest = (await client.query("select lgu_id,method_version,test_period_start::text,period_type,source,predicted_cases,actual_cases from public.historical_forecast_backtest order by lgu_id,test_period_start,method_version")).rows;
    assert.equal(forecasts.length, 17); assert.equal(risks.length, 17);
    const weekly = JSON.parse(await readFile("src/data/weekly-forecast-v1.json", "utf8"));
    const evidenceBytes = await readFile("docs/weekly-backtest-v1.json");
    const weeklyBacktest = JSON.parse(evidenceBytes.toString());
    const checksum = dataset.audit.summaries.find(s => s.period_type === "week")!.sha256;
    assert.equal(weekly.metadata.checksum, checksum); assert.equal(weeklyBacktest.metadata.checksum, checksum);
    const counts = { lgus: cities.length, week: history.filter(r => r.period_type === "week").length,
      month: history.filter(r => r.period_type === "month").length, day: history.filter(r => r.period_type === "day").length };
    assert.deepEqual(counts, { lgus: 17, week: 4403, month: 1037, day: 1910 });
    const coverage = dataset.audit.summaries.map(s => ({ source: s.source, period: s.period_type, date: s.end }));
    const snapshot = { metadata: { version: "demo-db-v1", createdAt: new Date().toISOString(),
      verified: "Every official observation and LGU metadata matched audited raw files in a read-only repeatable-read transaction",
      counts, sourceChecksums: dataset.audit.summaries.map(s => ({ source: s.source, sha256: s.sha256 })),
      backtestChecksum: createHash("sha256").update(evidenceBytes).digest("hex") },
      cities, history, forecasts, risks, weekly, weeklyBacktest, legacyBacktest,
      quality: dataset.audit, coverage };
    await client.query("commit");
    await mkdir("public", { recursive: true });
    await writeFile("public/demo-snapshot.json.tmp", JSON.stringify(snapshot) + "\n");
    await rename("public/demo-snapshot.json.tmp", "public/demo-snapshot.json");
    console.log(JSON.stringify({ date: snapshot.metadata.createdAt, counts, legacyBacktests: legacyBacktest.length, bytes: (await readFile("public/demo-snapshot.json")).length }));
  } finally { await client.end(); }
}
main().catch(() => { console.error("Snapshot export failed. Check DB/TLS configuration and audited source agreement. No credentials or driver details are printed; existing snapshot is preserved."); process.exitCode = 1; });
