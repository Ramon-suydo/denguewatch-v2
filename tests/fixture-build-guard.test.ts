import assert from "node:assert/strict";
import { test } from "node:test";
import config from "../vite.config";
test("production rejects the test-only fixture flag", () => {
 const previous = process.env.VITE_TEST_FIXTURES;
 process.env.VITE_TEST_FIXTURES = "true";
 try { assert.throws(() => (config as (env: {command: string; mode: string}) => unknown)({ command: "build", mode: "production" }), /Production build blocked/); }
 finally { if (previous === undefined) delete process.env.VITE_TEST_FIXTURES; else process.env.VITE_TEST_FIXTURES = previous; }
});
