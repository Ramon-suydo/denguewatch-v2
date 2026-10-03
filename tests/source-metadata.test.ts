import test from "node:test";
import assert from "node:assert/strict";
import { citationFields, pendingCitationFields, publishedSources, sourceMetadata, sourceAttribution, CITATION_PENDING } from "../src/lib/source-metadata.ts";

test("citation metadata reports pending fields without blocking the test or build", () => {
  const pending = pendingCitationFields();
  if (pending.length) console.warn(`[sources] ${pending.length} source metadata fields are unverified or incomplete. Review src/lib/source-metadata.ts; exact citations are not ready.`);
  if (pending.length) assert.ok(sourceAttribution().includes(CITATION_PENDING));
  for (const source of publishedSources) {
    assert.deepEqual(Object.keys(sourceMetadata[source.source]).sort(), Object.keys(citationFields).sort());
  }
});
