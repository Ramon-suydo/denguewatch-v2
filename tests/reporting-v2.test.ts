import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const admin = "00000000-0000-4000-8000-000000000001",
  moderator = "00000000-0000-4000-8000-000000000002",
  viewer = "00000000-0000-4000-8000-000000000003";
async function role(
  name: "anon" | "authenticated",
  id: string,
  fn: () => Promise<void>,
) {
  await db.exec("set role " + name);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  try {
    await fn();
  } finally {
    await db.exec("reset role");
  }
}
let firstCode = "";
const onset = new Date().toISOString().slice(0, 10);
async function challenge() {
  const r = (
    await db.query<{ challenge_id: string; salt: string; difficulty: number }>(
      "select * from public.report_challenge()",
    )
  ).rows[0];
  let nonce = 0;
  while (
    !createHash("sha256")
      .update(`${r.challenge_id}:${r.salt}:${nonce}`)
      .digest("hex")
      .startsWith("0000")
  )
    nonce++;
  return { ...r, nonce: String(nonce) };
}
async function submit(overrides: Record<string, unknown> = {}) {
  const c = await challenge();
  const p = {
    id: c.challenge_id,
    nonce: c.nonce,
    barangay: "SOURCE|Barangay 1",
    onset,
    symptoms: ["fever"],
    note: "",
    consent: true,
    version: "community-v2",
    honeypot: "",
    ...overrides,
  };
  return (
    await db.query<{ code: string }>(
      "select public.submit_signal($1::uuid,$2,$3,$4::date,$5::text[],$6,$7::boolean,$8,$9) code",
      [
        p.id,
        p.nonce,
        p.barangay,
        p.onset,
        p.symptoms,
        p.note,
        p.consent,
        p.version,
        p.honeypot,
      ],
    )
  ).rows[0].code;
}
before(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;`,
  );
  for (const file of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile("supabase/migrations/" + file, "utf8"));
  await db.query("insert into auth.users(id) values($1),($2),($3)", [
    admin,
    moderator,
    viewer,
  ]);
  await db.query(
    "insert into private.staff_roles(user_id,role) values($1,'admin'),($2,'moderator')",
    [admin, moderator],
  );
  await db.exec(
    "insert into public.manila_barangay_catalog values('SOURCE|Barangay 1','Barangay 1','isolated source fixture');insert into public.lgus(name) values('MANILA CITY');",
  );
});
after(async () => await db.close());
test("new reporting is closed by default; legacy path remains closed even if its old policy opens", async () => {
  await role("anon", "", async () => {
    await assert.rejects(challenge(), /closed/);
    await assert.rejects(db.query("select * from public.community_signals"));
    await assert.rejects(db.query("select * from private.report_challenges"));
  });
  await db.exec("update public.community_policy set submissions_enabled=true");
  await assert.rejects(
    db.query(
      "select public.submit_community_report(null,current_date,'self_suspected','community-v1',true)",
    ),
    /Legacy collection is closed/,
  );
});
test("consent, future date, schema, honeypot and unknown area are enforced before storage", async () => {
  await db.exec("update public.reporting_v2_policy set enabled=true");
  await role("anon", "", async () => {
    for (const overrides of [
      { consent: false },
      { onset: "2999-01-01" },
      { version: "old" },
      { barangay: "unknown" },
      { symptoms: ["injection"] },
      { honeypot: "bot" },
    ])
      await assert.rejects(submit(overrides));
  });
  assert.equal(
    (
      await db.query<{ n: number }>(
        "select count(*)::int n from public.community_signals",
      )
    ).rows[0].n,
    0,
  );
});
test("proof replay fails, notes are scrubbed, XSS remains text, duplicate/burst signals quarantine", async () => {
  let reused: { challenge_id: string; nonce: string } | undefined;
  await role("anon", "", async () => {
    const c = await challenge();
    reused = c;
    const code = (
      await db.query<{ code: string }>(
        "select public.submit_signal($1::uuid,$2,$3,$4::date,$5::text[],$6,true,$7,'') code",
        [
          c.challenge_id,
          c.nonce,
          "SOURCE|Barangay 1",
          onset,
          ["fever"],
          "Email test@example.test, phone +63 912 345 6789 <script>alert(1)</script>",
          "community-v2",
        ],
      )
    ).rows[0].code;
    assert.match(code, /^DW2-[A-F0-9]{32}$/);
    firstCode = code;
    await assert.rejects(
      submit({ id: c.challenge_id, nonce: c.nonce }),
      /Invalid challenge/,
    );
    await submit();
    await submit();
    await submit({ symptoms: ["headache"] });
  });
  const rows = (
    await db.query<{ note_text: string; moderation: string }>(
      "select note_text,moderation from public.community_signals order by created_at",
    )
  ).rows;
  assert.ok(!rows[0].note_text.includes("@"));
  assert.ok(!rows[0].note_text.includes("912"));
  assert.ok(!rows[0].note_text.includes("<script>"));
  assert.equal(rows[1].moderation, "quarantined");
  assert.equal(rows[3].moderation, "quarantined");
  assert.ok(reused);
});
test("public and ordinary authenticated callers cannot enumerate reports or use staff RPCs", async () => {
  for (const name of ["anon", "authenticated"] as const)
    await role(name, name === "anon" ? "" : viewer, async () => {
      await assert.rejects(db.query("select * from public.community_signals"));
      await assert.rejects(
        db.query("select nextval('public.staff_audit_id_seq')"),
      );
      await assert.rejects(
        db.query("select * from public.staff_signal_queue()"),
      );
      await assert.rejects(
        db.query("select public.moderate_signal(gen_random_uuid(),'approved')"),
      );
      await assert.rejects(
        db.query(
          "select public.stage_surveillance_upload('[]'::jsonb,'isolated citation')",
        ),
      );
    });
});
test("moderation is role checked and audited; only delayed groups >=3 publish; withdrawal has no existence oracle", async () => {
  const ids = (
    await db.query<{ id: string }>(
      "select id from public.community_signals order by created_at",
    )
  ).rows.map((r) => r.id);
  await role("authenticated", moderator, async () => {
    await db.query("select * from public.staff_signal_queue()");
    for (const id of ids.slice(0, 3))
      await db.query("select public.moderate_signal($1,'approved')", [id]);
    await assert.rejects(
      db.query(
        "select public.stage_surveillance_upload('[{}]'::jsonb,'isolated citation')",
      ),
    );
  });
  assert.equal(
    (await db.query("select * from public.community_signal_aggregates()")).rows
      .length,
    0,
  );
  await db.exec(
    "update public.community_signals set created_at=now()-interval '4 days'",
  );
  await role("anon", "", async () => {
    assert.equal(
      (await db.query("select * from public.community_signal_aggregates()"))
        .rows.length,
      1,
    );
    await db.query("select public.withdraw_signal('DW2-NOT-A-CODE')");
  });
  const audit = (
    await db.query<{ n: number }>(
      "select count(*)::int n from public.staff_audit",
    )
  ).rows[0].n;
  assert.ok(audit >= 4);
  await role("anon", "", async () => {
    await db.query("select public.withdraw_signal($1)", [firstCode]);
  });
  assert.equal(
    (await db.query("select * from public.community_signal_aggregates()")).rows
      .length,
    0,
  );
});
test("validated upload preview, publish and rollback are atomic, audited and separate from frozen data", async () => {
  const rows = [{ city: "MANILA CITY", week_ending: "2023-11-26", cases: 52 }];
  await role("authenticated", admin, async () => {
    for (const value of [
      [{ ...rows[0], cases: -1 }],
      [rows[0], rows[0]],
      [{ ...rows[0], city: "x');drop table public.lgus;--" }],
      [{ ...rows[0], week_ending: "2023-11-27" }],
    ])
      await assert.rejects(
        db.query("select public.stage_surveillance_upload($1::jsonb,$2)", [
          JSON.stringify(value),
          "source citation",
        ]),
      );
    const id = (
      await db.query<{ id: string }>(
        "select public.stage_surveillance_upload($1::jsonb,$2) id",
        [JSON.stringify(rows), "Owner reviewed source citation"],
      )
    ).rows[0].id;
    assert.equal(
      (await db.query("select * from public.reviewed_upload_series()")).rows
        .length,
      0,
    );
    await db.query("select public.set_upload_status($1,'published')", [id]);
    assert.equal(
      (await db.query("select * from public.reviewed_upload_series()")).rows
        .length,
      1,
    );
    await db.query("select public.set_upload_status($1,'rolled_back')", [id]);
    assert.equal(
      (await db.query("select * from public.reviewed_upload_series()")).rows
        .length,
      0,
    );
  });
  assert.equal(
    (await db.query("select * from public.historical_surveillance")).rows
      .length,
    0,
  );
});
test("retention removes sensitive signals; all new tables have RLS; purge is not public", async () => {
  await db.exec(
    "update public.community_signals set created_at=now()-interval '91 days'",
  );
  await db.query("select private.purge_expired_community_reports()");
  assert.equal(
    (await db.query("select * from public.community_signals")).rows.length,
    0,
  );
  const tables = (
    await db.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname,relrowsecurity from pg_class where relname in ('community_signals','staff_audit','surveillance_uploads','report_challenges','staff_roles','reporting_v2_policy','manila_barangay_catalog')",
    )
  ).rows;
  assert.equal(tables.length, 7);
  assert.ok(tables.every((r) => r.relrowsecurity));
  await role("anon", "", async () => {
    await assert.rejects(
      db.query("select private.purge_expired_community_reports()"),
    );
  });
});
