import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const value = process.argv[2];
if (!value)
  throw Error(
    "Provide the deployed URL for this revision: npm run security:zap -- https://your-preview.example",
  );
const url = new URL(value);
if (!["https:", "http:"].includes(url.protocol))
  throw Error("Use an HTTP(S) URL.");
const output = resolve("docs/evidence");
await mkdir(output, { recursive: true });
const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "-v",
    `${output}:/zap/wrk/:rw`,
    "ghcr.io/zaproxy/zaproxy:stable",
    "zap-baseline.py",
    "-t",
    url.toString(),
    "-r",
    "zap-baseline.html",
    "-J",
    "zap-baseline.json",
  ],
  { stdio: "inherit" },
);
if (result.error)
  throw Error("Docker is required for the ZAP baseline scan. No scan was run.");
process.exit(result.status ?? 1);
