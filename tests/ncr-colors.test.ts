import { test } from "node:test";
import assert from "node:assert/strict";
import { historicalFill, historicalStroke } from "../src/lib/ncr-colors";
import { simulatedLuminance, visionMatrices } from "../src/lib/map-colors.js";
test("NCR boundary strokes exceed 3:1 against every rate fill across normal and simulated color vision", () => {
  for (const fraction of [
    null,
    ...Array.from({ length: 301 }, (_, i) => i / 300),
  ]) {
    const fill = historicalFill(fraction),
      stroke = historicalStroke(fill);
    for (const matrix of Object.values(visionMatrices)) {
      const a = simulatedLuminance(fill, matrix),
        b = simulatedLuminance(stroke, matrix);
      assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 3);
    }
  }
  assert.notEqual(historicalFill(null), historicalFill(0));
});
