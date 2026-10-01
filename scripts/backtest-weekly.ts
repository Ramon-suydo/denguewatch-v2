import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { integer, sourceDate } from "./lib/historical.ts";
import { normalizeLgu, LGUS } from "./lib/geography.ts";
import { WEEKLY_SOURCE, WEEKLY_VERSION, runWeeklyBacktest, type WeeklyInput } from "../src/lib/weekly-forecast.ts";

const buffer = await readFile(`data/raw/${WEEKLY_SOURCE}`);
const checksum = createHash("sha256").update(buffer).digest("hex");
// New bytes require the existing audit to succeed first; no silent source changes.
let approvedRows = 4403;
let approved = "4e993553f10081b4e6b35a0d4b3c9bd0cc271765645a123fcb2e0c5d7084633c";
try {
  const audit = JSON.parse(await readFile(".artifacts/data-audit.json", "utf8"));
  const sourceAudit = audit.summaries.find((s: { source: string }) => s.source === WEEKLY_SOURCE);
  approved = sourceAudit?.sha256 ?? approved;
  approvedRows = sourceAudit?.rows ?? approvedRows;
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
assert.equal(checksum, approved, "Weekly source changed: run npm run data:audit and review the audit before forecasting");
const raw = parse(buffer, { columns: true, bom: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
assert.deepEqual(Object.keys(raw[0] ?? {}), ["loc", "cases", "deaths", "date", "Region"]);
assert.equal(raw[0].loc, "#adm2+name", "Expected HXL metadata row");
const rows: WeeklyInput[] = raw.slice(1).filter(r => r.Region === "NATIONAL CAPITAL REGION").map(r => {
  const cases = integer(r.cases, "weekly cases");
  // Death counts are never features/targets. Preserve the audited suspect-row exclusion policy.
  const suspect = r.deaths !== "" && integer(r.deaths, "quality check only") > cases;
  return { city: normalizeLgu(r.loc), date: sourceDate(r.date), cases, excluded: suspect };
});
assert.deepEqual([...new Set(rows.map(r => r.city))].sort(), LGUS.map(([name]) => name).sort());
assert.equal(rows.length, approvedRows, "Coverage does not match the approved weekly audit");
const result = runWeeklyBacktest(rows);
const metadata = {
  version: WEEKLY_VERSION, runAt: new Date().toISOString(), source: WEEKLY_SOURCE, checksum,
  observations: rows.length, excludedSuspectRows: rows.filter(r => r.excluded).length,
  trainWindow: { first: rows.map(r => r.date).sort()[0], last: rows.map(r => r.date).sort().at(-1), mode: "expanding, through each origin only" },
  evaluation: "2018 development/calibration; 2019 onward test; 2020-2021 reporting distortion flagged",
  selection: "Frozen using 2018 one-week MAE only: ridge must improve >=5% over both baselines and win in a majority of LGUs; otherwise choose the better baseline. Test outcomes never choose the model.",
  intervals: "Per LGU/model/horizon signed out-of-sample residual quantiles; at least 30 earlier targets observed by origin; expanding calibration; lower bounds clipped to zero.",
  gaps: "Exact calendar lags; no imputation. Missing/suspect targets and required lags are unavailable; compare all models on common supported targets. Seasonal lag is 52 weeks (364 days), not an inferred week-boundary convention.",
  ridge: "Separate LGU and direct horizon fits: log1p lags at origin, origin-1/-2/-3, target-52; annual Fourier harmonics 1 and 2; training-only scaling; lambda=10; >=52 complete training examples; nonnegative expm1 output, no bias correction.",
};
await mkdir("src/data", { recursive: true });
const { predictions, ...cached } = result;
await writeFile("src/data/weekly-forecast-v1.json", JSON.stringify({ metadata, ...cached }, null, 2) + "\n");
// Compact, fully reproducible per-origin evidence; not loaded by the browser.
const columns = ["city", "origin", "target", "horizon", "model", "actual", "predicted", "interval", "trainEnd", "trainN"];
await writeFile("docs/weekly-backtest-v1.json", JSON.stringify({ metadata, columns, predictions: predictions.map(p => columns.map(key => p[key as keyof typeof p])) }) + "\n");
const overall = result.summary.filter(s => s.city === "ALL NCR" && s.horizon === 1 && s.cohort === "all-2019-onward");
const wins = result.cities.filter(city => {
  const s = result.summary.filter(s => s.city === city && s.horizon === 1 && s.cohort === "all-2019-onward");
  return s.find(r => r.model === "ridge")!.mae! < s.find(r => r.model === "seasonal-naive")!.mae!;
}).length;
console.log(JSON.stringify({ selected: result.selected, ridgeWins: `${wins}/${result.cities.length}`, overall, withoutCovid: result.summary.filter(s => s.city === "ALL NCR" && s.horizon === 1 && s.cohort === "without-covid"), records: predictions.length, excluded: metadata.excludedSuspectRows }, null, 2));
