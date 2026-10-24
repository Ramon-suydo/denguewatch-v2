import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
test("retired activation command fails before any database connection", () => {
  try {
    execFileSync(
      process.execPath,
      [
        "node_modules/tsx/dist/cli.mjs",
        "scripts/manage-public-app.ts",
        "--enable-reports",
      ],
      { encoding: "utf8", timeout: 5000, stdio: "pipe" },
    );
    assert.fail("Legacy activation must not succeed");
  } catch (error) {
    const result = error as { status?: number; stderr?: string };
    assert.equal(result.status, 1);
    assert.match(result.stderr ?? "", /activation is retired/);
  }
});
