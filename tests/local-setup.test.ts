import config from "../vite.config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertLocalStack } from "../scripts/lib/local-stack";
test("local setup rejects hosted, credential-confusable, non-HTTP and remote database destinations", () => {
  assert.ok(
    assertLocalStack(
      "http://127.0.0.1:54321",
      "postgresql://test:password@127.0.0.1:54322/postgres",
    ),
  );
  for (const [api, db] of [
    [
      "https://example.supabase.co",
      "postgresql://test:password@localhost/postgres",
    ],
    [
      "http://localhost.evil.test",
      "postgresql://test:password@localhost/postgres",
    ],
    [
      "http://localhost:54321",
      "postgresql://test:password@db.example.test/postgres",
    ],
    [
      "http://localhost@evil.test",
      "postgresql://test:password@localhost/postgres",
    ],
  ])
    assert.throws(() => assertLocalStack(api, db), /non-loopback/);
});

test("staff development mode refuses fallback to hosted configuration", () => {
  const previous = process.env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_URL = "https://host.example.test";
  try {
    assert.throws(
      () =>
        (config as (env: { command: string; mode: string }) => unknown)({
          command: "serve",
          mode: "staff",
        }),
      /Local staff mode/,
    );
  } finally {
    if (previous === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = previous;
  }
});
