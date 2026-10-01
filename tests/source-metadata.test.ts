import test from "node:test";
import assert from "node:assert/strict";
import { citationFields, pendingCitationFields, publishedSources, sourceMetadata } from "../src/lib/source-metadata.ts";

test("citation metadata reports pending fields without blocking the test or build", () => {
  const pending = pendingCitationFields();
  if (pending.length) console.warn(`[sources] ${pending.length} source metadata fields are [pending]. Fill src/lib/source-metadata.ts; exact citations are not ready.`);
  for (const source of publishedSources) {
    assert.deepEqual(Object.keys(sourceMetadata[source.source]).sort(), Object.keys(citationFields).sort());
  }
});
