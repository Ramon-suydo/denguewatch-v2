import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
const executable = execFileSync(
  process.platform === "win32" ? "where.exe" : "which",
  ["lighthouse"],
  { encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/)[0];
const cli = resolve(dirname(executable), "../lighthouse/cli/index.js");
if (!existsSync(cli))
  throw Error(
    "Run through npm exec --package=node@22 --package=lighthouse@13 -- node scripts/audit-lighthouse.mjs URL",
  );
const target = process.argv[2] || "http://127.0.0.1:43124/";
new URL(target);
mkdirSync("docs/evidence", { recursive: true });
console.log("Lighthouse runtime:", process.version, "target:", target);
const result = spawnSync(
  process.execPath,
  [
    cli,
    target,
    "--output=html",
    "--output=json",
    "--output-path=docs/evidence/lighthouse-mobile",
    "--chrome-flags=--headless --no-sandbox --disable-gpu",
    "--only-categories=performance,accessibility,best-practices,seo",
    "--form-factor=mobile",
    "--quiet",
  ],
  { stdio: "inherit", env: process.env },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
