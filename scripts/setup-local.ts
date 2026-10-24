import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { assertLocalStack } from "./lib/local-stack.ts";
import { loadDataset } from "./lib/historical.ts";
import { importDataset } from "./lib/import-database.ts";
const cli = "node_modules/supabase/dist/supabase.js";
let stage = "prerequisites";
const run = (args: string[]) =>
  execFileSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
async function main() {
  if (Number(process.versions.node.split(".")[0]) < 22)
    throw Error("Use Node 22.12 or newer.");
  try {
    if (
      process.env.DOCKER_HOST &&
      !/^(unix|npipe):\/\//.test(process.env.DOCKER_HOST)
    )
      throw Error("Local Docker host required.");
    const context = execFileSync("docker", ["context", "show"], {
      encoding: "utf8",
      timeout: 10000,
    }).trim();
    const endpoint = execFileSync(
      "docker",
      ["context", "inspect", context, "--format", "{{.Endpoints.docker.Host}}"],
      { encoding: "utf8", timeout: 10000 },
    ).trim();
    if (!/^(unix|npipe):\/\//.test(endpoint))
      throw Error("Local Docker context required.");
    execFileSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
      stdio: "pipe",
      timeout: 15000,
    });
  } catch {
    throw Error(
      "Start a local Docker installation before npm run setup:local. No database was contacted.",
    );
  }
  if (process.argv.includes("--check")) {
    console.log(
      "Local Docker prerequisites are available. No services or data were changed.",
    );
    return;
  }
  stage = "local-start";
  console.log(
    "Starting local Supabase (first image pull can take several minutes)…",
  );
  run(["start", "--yes"]);
  stage = "local-migrations";
  run(["migration", "up", "--local"]);
  stage = "local-status";
  const status = JSON.parse(run(["status", "--output", "json"]));
  const urls = assertLocalStack(status.API_URL, status.DB_URL),
    anon = status.ANON_KEY ?? status.PUBLISHABLE_KEY,
    secret = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;
  if (!anon || !secret)
    throw Error("Local status did not supply required keys.");
  stage = "local-seed";
  const dataset = await loadDataset("data/raw");
  const db = new pg.Client({ connectionString: urls.database, ssl: false });
  await db.connect();
  const server = createClient(urls.api, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  let credentials: { email: string; password: string; user_id: string } | null =
    null;
  try {
    await importDataset(
      { query: async (sql, values) => db.query(sql, values) },
      dataset,
    );
    stage = "local-demo-auth";
    try {
      credentials = JSON.parse(
        await readFile(".artifacts/local-staff-credentials.json", "utf8"),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (credentials) {
      const user = await server.auth.admin.getUserById(credentials.user_id);
      if (user.error || user.data.user.email !== credentials.email)
        throw Error("Existing local demo credentials require owner review.");
    } else {
      const email = "denguewatch-demo-admin@example.test",
        password = "Local-" + randomBytes(24).toString("base64url") + "!9aA";
      const created = await server.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error || !created.data.user)
        throw Error("Local demo account creation failed; check local Auth.");
      credentials = { email, password, user_id: created.data.user.id };
    }
    await db.query(
      "insert into private.staff_roles(user_id,role) values($1,'admin') on conflict(user_id) do update set role='admin'",
      [credentials.user_id],
    );
    await db.query(
      "update public.reporting_v2_policy set enabled=false where id",
    );
  } finally {
    await db.end();
  }
  stage = "local-config";
  await mkdir(".artifacts", { recursive: true });
  await writeFile(
    ".artifacts/local-staff-credentials.json",
    JSON.stringify(credentials, null, 2) + "\n",
    { mode: 0o600 },
  );
  await writeFile(
    ".env.staff.local",
    `VITE_SUPABASE_URL=${urls.api}\nVITE_SUPABASE_ANON_KEY=${anon}\nVITE_TEST_FIXTURES=false\nVITE_DEMO_MODE=false\n`,
    { mode: 0o600 },
  );
  console.log(
    "Local setup complete: official source seed, owner-appointed demo admin, collection CLOSED. No community report was seeded.",
  );
  console.log(
    "Credentials are in ignored .artifacts/local-staff-credentials.json. Run npm run staff:dev, then open /admin. Hosted configuration was not read or changed.",
  );
}
main().catch((error) => {
  console.error(
    stage === "prerequisites" && error instanceof Error
      ? error.message
      : `Local setup stopped at ${stage}. No hosted database is permitted by this script; review the local stack and retry.`,
  );
  process.exitCode = 1;
});
