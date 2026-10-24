import { readFile, mkdir, writeFile } from "node:fs/promises";
import { config } from "dotenv";
import pg from "pg";
import { readDatabaseCa } from "./lib/database-tls.ts";
import { refreshForecasts } from "./lib/forecast-cache.ts";
config({ path: [".env.local", ".env"], quiet: true });
const args = process.argv.slice(2);
const allowed = new Set(["--apply", "--refresh", "--enable-reports"]);
if (!args.length || args.some((arg) => !allowed.has(arg))) {
  console.error("Use --apply, --refresh, and/or --enable-reports.");
  process.exit(1);
}
if (args.includes("--enable-reports")) {
  console.error(
    "Legacy report activation is retired. Collection stays closed pending v2 migration, owner authorization and DPO review.",
  );
  process.exit(1);
}
let committed = false;
async function main() {
  const connection = process.env.DIRECT_DATABASE_URL;
  if (!connection) throw new Error("DIRECT_DATABASE_URL is required.");
  const url = new URL(connection);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.port === "6543"
  )
    throw new Error("Use a direct/session PostgreSQL connection.");
  const mode = url.searchParams.get("sslmode");
  if (mode && !["require", "verify-ca", "verify-full"].includes(mode))
    throw new Error("Unsupported TLS mode.");
  url.searchParams.delete("sslmode");
  for (const key of [
    "ssl",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "uselibpqcompat",
  ])
    if (url.searchParams.has(key))
      throw new Error("Use DB_SSL_CA_FILE for TLS.");
  const ca = await readDatabaseCa(process.env.DB_SSL_CA_FILE);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const client = new pg.Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 15000,
    ssl: local ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
  });
  try {
    await client.connect();
    await client.query("begin isolation level repeatable read");
    await client.query("select pg_advisory_xact_lock(24092027)");
    if (args.includes("--apply")) {
      const check = await client.query(
        "select to_regclass('public.historical_surveillance') as historical,to_regclass('supabase_migrations.schema_migrations') as migrations",
      );
      if (!check.rows[0].historical || !check.rows[0].migrations)
        throw new Error("Apply and verify the initial migrations first.");
      for (const file of [
        "20260924000300_forecast_cache.sql",
        "20260924000400_community_lifecycle.sql",
        "20260924000500_composite_risk.sql",
      ]) {
        const version = file.split("_")[0];
        if (
          (
            await client.query(
              "select version from supabase_migrations.schema_migrations where version=$1",
              [version],
            )
          ).rowCount
        )
          continue;
        const sql = await readFile("supabase/migrations/" + file, "utf8");
        await client.query(sql);
        await client.query(
          "insert into supabase_migrations.schema_migrations(version,statements,name) values($1,$2,$3)",
          [version, [sql], file.slice(15, -4)],
        );
        console.log("Staged migration " + file);
      }
      await client.query(
        "create extension if not exists pg_cron with schema pg_catalog",
      );
      await client.query(
        "select cron.schedule('denguewatch-community-retention','17 * * * *','select private.purge_expired_community_reports()')",
      );
      console.log("Scheduled hourly 90-day retention cleanup.");
    }
    if (args.includes("--enable-reports")) {
      const published = (
        await client.query(
          "select contact_email from public.community_policy where id",
        )
      ).rows[0]?.contact_email as string | undefined;
      const contact = process.env.COMMUNITY_CONTACT_EMAIL?.trim() || published;
      if (!contact || !/^\S+@\S+\.\S+$/.test(contact))
        throw new Error(
          "Set the approved COMMUNITY_CONTACT_EMAIL before enabling collection.",
        );
      const cron = await client.query(
        "select 1 from cron.job where jobname='denguewatch-community-retention' and active and command='select private.purge_expired_community_reports()'",
      );
      if (!cron.rowCount)
        throw new Error(
          "Active retention cleanup is required before enabling collection.",
        );
      await client.query(
        "update public.community_policy set contact_email=$1,submissions_enabled=true where id",
        [contact],
      );
      console.log(
        "Published the approved contact and enabled consented submissions.",
      );
    }
    const summary = await refreshForecasts(client);
    await client.query("commit");
    committed = true;
    console.table(summary);
    await mkdir(".artifacts", { recursive: true });
    await writeFile(
      ".artifacts/forecast-verification.json",
      JSON.stringify(
        { computed_at: new Date().toISOString(), cities: summary },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Committed saved forecasts; no raw community records were read or logged.",
    );
  } catch (error) {
    if (!committed) await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  // Driver errors may contain SQL/parameters. Never print them or credentials.
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "configuration or connection";
  console.error(
    "Public-app update failed (" +
      code +
      "). " +
      (committed
        ? "Database changes committed, but the local verification artifact could not be saved."
        : "Check the local configuration and pending migrations. No transaction committed."),
  );
  process.exitCode = 1;
});
