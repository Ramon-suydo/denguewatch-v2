import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarCorrelation } from "../scripts/lib/measurements";
test("calendar autocorrelation never compresses missing weeks or invents variance", () => {
  const rows = new Map([
    ["2023-01-01", 1],
    ["2023-01-08", 2],
    ["2023-01-22", 4],
    ["2023-01-29", 8],
  ]);
  assert.deepEqual(calendarCorrelation(rows, 1), { n: 2, r: 1 });
  assert.equal(
    calendarCorrelation(
      new Map([
        ["2023-01-01", 5],
        ["2023-01-08", 5],
        ["2023-01-15", 5],
      ]),
      1,
    ).r,
    null,
  );
  assert.throws(() => calendarCorrelation(rows, 0));
});
