import { useEffect, useState } from "react";
import { parse } from "csv-parse/browser/esm/sync";
import { Button, Card, Input } from "../components/ui";
import { StaffMfa } from "../components/StaffMfa";
import { getSupabase } from "../lib/supabase";
type Signal = {
  id: string;
  barangay_code: string | null;
  area_unit?:string|null; report_type?:string|null;affected_range?:string|null;
  onset_date: string;
  symptoms: string[];
  note_text: string | null;
  moderation: string;
  created_at: string;
};
type Upload = { id: string; citation: string; status: string; rows: unknown[] };
export function Admin() {
  const [mfaRequired,setMfaRequired]=useState(false);
  const [role, setRole] = useState<string | null>(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [queue, setQueue] = useState<Signal[]>([]),
    [uploads, setUploads] = useState<Upload[]>([]),
    [audit, setAudit] = useState<
      { id: number; action: string; record_id: string | null; at: string }[]
    >([]),
    [preview, setPreview] = useState<
      { city: string; week_ending: string; cases: number }[]
    >([]),
    [citation, setCitation] = useState(""),
    [mergeTarget, setMergeTarget] = useState("");
  async function load() {
    const client = getSupabase();
    const { data, error } = await client.rpc("staff_signal_queue");
    if (error)
      throw Error("Staff access could not be verified. Sign in again.");
    setQueue(data ?? []);
    const { data: role, error: roleError } = await client.rpc("staff_role");
    if (roleError || !["moderator", "admin"].includes(role))
      throw Error("An appointed staff role is required.");
    setRole(role);
    if (role === "admin") {
      const u = await client
        .from("surveillance_uploads")
        .select("id,citation,status,rows")
        .order("created_at", { ascending: false })
        .limit(30);
      const a = await client
        .from("staff_audit")
        .select("id,action,record_id,at")
        .order("at", { ascending: false })
        .limit(100);
      if (u.error || a.error) throw Error("Admin data could not load.");
      setUploads(u.data ?? []);
      setAudit(a.data ?? []);
    }
  }
  useEffect(() => {
    void (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        if (data.session) setMfaRequired(true);
      } catch {
        setRole(null);
      }
    })();
  }, []);
  async function action(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  async function login(event: React.FormEvent) {
    event.preventDefault();
    await action(async () => {
      const { error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });
      setPassword("");
      if (error) throw Error("Sign-in failed. Check your credentials.");
      setMfaRequired(true);
    });
  }
  async function moderate(id: string, status: string) {
    await action(async () => {
      const { error } = await getSupabase().rpc("moderate_signal", {
        p_id: id,
        p_action: status,
        p_merge_into: status === "merged" ? mergeTarget || null : null,
      });
      if (error)
        throw Error(
          "Moderation was not confirmed. Refresh the queue before retrying.",
        );
      await load();
    });
  }
  async function file(event: React.ChangeEvent<HTMLInputElement>) {
    setPreview([]);
    setError("");
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 1000000) throw Error("CSV must be under 1 MB.");
      const records = parse(await file.text(), {
        columns: true,
        bom: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];
      if (!records.length || records.length > 5000)
        throw Error("Supply 1 to 5000 rows.");
      const seen = new Set<string>();
      const rows = records.map((r) => {
        if (
          Object.keys(r).sort().join(",") !== "cases,city,week_ending" ||
          !/^\d{1,7}$/.test(r.cases) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(r.week_ending)
        )
          throw Error(
            "Columns must be city,week_ending,cases; counts must be nonnegative integers.",
          );
        const date = new Date(r.week_ending + "T00:00:00Z");
        if (
          !Number.isFinite(+date) ||
          date.toISOString().slice(0, 10) !== r.week_ending ||
          date.getUTCDay() !== 0
        )
          throw Error("Use valid Sunday source labels.");
        const key = r.city + "|" + r.week_ending;
        if (seen.has(key)) throw Error("Duplicate city/week.");
        seen.add(key);
        return {
          city: r.city,
          week_ending: r.week_ending,
          cases: Number(r.cases),
        };
      });
      setPreview(rows);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "CSV invalid.");
    }
  }
  async function stage() {
    await action(async () => {
      const { error } = await getSupabase().rpc("stage_surveillance_upload", {
        p_rows: preview,
        p_citation: citation,
      });
      if (error)
        throw Error(
          "Server validation rejected the upload. No official rows were changed.",
        );
      setPreview([]);
      setCitation("");
      await load();
    });
  }
  async function status(id: string, state: string) {
    await action(async () => {
      const { error } = await getSupabase().rpc("set_upload_status", {
        p_id: id,
        p_status: state,
      });
      if (error)
        throw Error(
          "Upload transition was not confirmed. Refresh before retrying.",
        );
      await load();
    });
  }
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">
        Skip to admin content
      </a>
      <header className="admin-header">
        <strong>DengueWatch / Staff</strong>
        {role && (
          <>
            <span>{role}</span>
            <Button
              variant="secondary"
              onClick={() =>
                action(async () => {
                  await getSupabase().auth.signOut();
                  setRole(null);
                  setQueue([]);
                  setUploads([]);
                  setAudit([]);
                })
              }
            >
              Sign out
            </Button>
          </>
        )}
      </header>
      <main id="admin-main" className="ui-container app-content evidence-page">
        {import.meta.env.DEV && import.meta.env.VITE_TEST_FIXTURES === "true" && <p className="data-notice">LOCAL TEST DATA ONLY: isolated development dataset. No hosted reports.</p>}
        <h1>{role ? "Staff review workspace" : "Staff sign in"}</h1>
        <p>
          Separate from public pages. Reporting status is controlled by the server policy; staff appointment and MFA are required.
        </p>
        {error && <p role="alert">{error}</p>}
        {mfaRequired ? <StaffMfa onVerified={async()=>{await load();setMfaRequired(false);}} onCancel={()=>{void getSupabase().auth.signOut();setMfaRequired(false);setRole(null);}} /> : !role ? (
          <Card>
            <form onSubmit={login}>
              <Input
                label="Staff email"
                type="email"
                autoComplete="username"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" disabled={busy}>
                {busy ? "Verifying…" : "Sign in"}
              </Button>
            </form>
            <p>
              No shared demo password or public self-enrollment. An
              owner-appointed server role is required.
            </p>
          </Card>
        ) : (
          <>
            <Card>
              <h2>Moderation queue</h2>
              <p>
                All reports remain community-reported and unverified after
                review. Review does not establish a diagnosis.
              </p>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => action(load)}
              >
                Refresh queue
              </Button>
              <Input
                label="Approved report UUID to merge into (optional)"
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
              />
              {!queue.length ? (
                <p>No reviewable reports.</p>
              ) : (
                queue.map((r) => (
                  <article className="staff-report" key={r.id}>
                    <h3>
                      {r.onset_date} · {r.moderation}
                    </h3>
                    <p>Reference ID: {r.id}</p>
                    <p>Area: {r.area_unit ?? "MANILA CITY"} ? {r.barangay_code ?? "area not specified"}</p>
                    <p>Symptoms: {r.symptoms.join(", ") || "Not specified"}</p>
                    <p>Report type: {r.report_type??"suspected"} ? People affected: {r.affected_range??"not supplied"}</p>{r.note_text && <p>Sanitized note: {r.note_text}</p>}
                    <div className="evidence-actions">
                      <Button
                        disabled={busy}
                        onClick={() => moderate(r.id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => moderate(r.id, "rejected")}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy || !mergeTarget}
                        onClick={() => moderate(r.id, "merged")}
                      >
                        Merge
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </Card>
            {role === "admin" && (
              <>
                <Card>
                  <h2>CSV preview and versioned publication</h2>
                  <p>
                    Use exactly city,week_ending,cases. Server validates the
                    same schema, known NCR cities, Sunday dates and unique
                    city/week keys. Upload versions remain separate from
                    immutable raw files and the frozen model. A reviewed
                    rebuild/re-evaluation is required to change the app’s
                    bundled forecasts.
                  </p>
                  <Input
                    label="Historical weekly CSV"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={file}
                  />
                  <Input
                    label="Reviewed source citation"
                    minLength={8}
                    maxLength={1000}
                    value={citation}
                    onChange={(e) => setCitation(e.target.value)}
                  />
                  {preview.length > 0 && (
                    <>
                      <p>
                        {preview.length} parsed rows · preview of first{" "}
                        {Math.min(20, preview.length)}.
                      </p>
                      <div
                        className="table-scroll"
                        role="region"
                        aria-label="CSV preview"
                        tabIndex={0}
                      >
                        <table>
                          <thead>
                            <tr>
                              <th scope="col">City</th>
                              <th scope="col">Week ending</th>
                              <th scope="col">Cases</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.slice(0, 20).map((r) => (
                              <tr key={r.city + r.week_ending}>
                                <th scope="row">{r.city}</th>
                                <td>{r.week_ending}</td>
                                <td>{r.cases}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Button
                        disabled={busy || citation.trim().length < 8}
                        onClick={stage}
                      >
                        Validate and stage upload
                      </Button>
                    </>
                  )}
                  {uploads.map((u) => (
                    <div className="staff-report" key={u.id}>
                      <p>
                        {u.citation} · {u.rows.length} rows · {u.status}
                      </p>
                      {u.status === "draft" && (
                        <Button
                          disabled={busy}
                          onClick={() => status(u.id, "published")}
                        >
                          Publish reviewed version
                        </Button>
                      )}
                      {u.status === "published" && (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => status(u.id, "rolled_back")}
                        >
                          Roll back version
                        </Button>
                      )}
                    </div>
                  ))}
                </Card>
                <Card>
                  <h2>Audit log</h2>
                  <p>
                    Records staff actions and IDs, without report contents or
                    contact details.
                  </p>
                  <div
                    className="table-scroll"
                    role="region"
                    aria-label="Staff audit log"
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Time</th>
                          <th scope="col">Action</th>
                          <th scope="col">Record ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audit.map((a) => (
                          <tr key={a.id}>
                            <th scope="row">{a.at}</th>
                            <td>{a.action}</td>
                            <td>{a.record_id ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
