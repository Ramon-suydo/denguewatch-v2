import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadDataset } from "../scripts/lib/historical.ts";

test("verified DB snapshot preserves counts, every official source value, gaps and artifact checksums without community/contact data", async () => {
  const snapshot = JSON.parse(
    await readFile("public/demo-snapshot.json", "utf8"),
  );
  const dataset = await loadDataset("data/raw");
  assert.deepEqual(snapshot.metadata.counts, {
    lgus: 17,
    week: 4403,
    month: 1037,
    day: 1910,
  });
  assert.equal(snapshot.cities.length, 17);
  assert.equal(snapshot.history.length, 7350);
  for (const period of ["week", "month", "day"])
    assert.equal(
      snapshot.history.filter(
        (r: { period_type: string }) => r.period_type === period,
      ).length,
      snapshot.metadata.counts[period],
    );
  const known = new Map(
    snapshot.history.map((row: Record<string, unknown>) => [
      `${snapshot.cities.find((city: { id: string }) => city.id === row.lgu_id).name}|${row.period_start}|${row.period_type}|${row.source}`,
      row,
    ]),
  );
  for (const {
    lgu_name,
    source_citation: _sourceCitation,
    ...expected
  } of dataset.observations) {
    const actual = known.get(
      `${lgu_name}|${expected.period_start}|${expected.period_type}|${expected.source}`,
    ) as Record<string, unknown>;
    assert.ok(actual);
    for (const [field, value] of Object.entries(expected))
      assert.deepEqual(actual[field], value);
  }
  assert.deepEqual(
    snapshot.metadata.sourceChecksums,
    dataset.audit.summaries.map((s) => ({
      source: s.source,
      sha256: s.sha256,
    })),
  );
  assert.equal(
    snapshot.metadata.backtestChecksum,
    createHash("sha256")
      .update(await readFile("docs/weekly-backtest-v1.json"))
      .digest("hex"),
  );
  assert.deepEqual(
    snapshot.weekly,
    JSON.parse(await readFile("src/data/weekly-forecast-v1.json", "utf8")),
  );
  assert.deepEqual(snapshot.quality, dataset.audit);
  const json = JSON.stringify(snapshot);
  for (const forbidden of [
    '"contact_email"',
    '"contact_value"',
    '"reference_code"',
    '"community_reports"',
    '"policy"',
    '"community"',
  ])
    assert.ok(!json.includes(forbidden), forbidden);
});

import { readPublished, isSnapshotMode } from "../src/lib/demo-snapshot.ts";
test("cancelled published reads do not switch the app to snapshot mode", async () => {
  const parent = new AbortController();
  const promise = readPublished(
    parent.signal,
    (signal) =>
      new Promise<number>((_, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("Cancelled", "AbortError")),
          { once: true },
        );
      }),
    () => {
      throw new Error("Cancellation must not load snapshot data");
    },
  );
  parent.abort();
  await assert.rejects(promise, { name: "AbortError" });
  assert.equal(isSnapshotMode(), false);
});
