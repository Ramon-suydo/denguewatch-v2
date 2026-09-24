import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, Card, Input } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { ParticipationNotice } from "../components/ParticipationNotice";
import { ReadState } from "../components/PageState";
import { useAppData } from "../lib/resources";
import { deleteReport } from "../lib/api";
export function Privacy() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash === "#withdraw")
      requestAnimationFrame(() =>
        document.getElementById("withdraw")?.scrollIntoView(),
      );
  }, [location.hash]);
  const { policy, community } = useAppData();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const pending = useRef(false);
  async function withdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (!/^DW-[A-F0-9]{24}$/.test(code.trim().toUpperCase())) {
      setError(
        "Use DW- followed by the 24 letters/numbers from your reference code.",
      );
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    setDone(false);
    try {
      await deleteReport(code);
      setCode("");
      setDone(true);
      community.retry();
    } catch {
      setError(
        "The request could not be completed. You can safely retry with the same code.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR INFORMATION"
        title="Privacy, in plain language."
        description="Voluntary participation, minimal collection, and a clear way to withdraw."
      />
      <div className="dw-container app-content narrow-content">
        <Card>
          <ReadState resource={policy}>
            {(notice) => <ParticipationNotice policy={notice} />}
          </ReadState>
          <div className="prose">
            <h3>Who can access individual reports</h3>
            <p>
              Only appointed research administrators can access report records.
              Public visitors receive city/week aggregates only. We do not sell
              reports, provide them to advertisers, or share individual report
              content with third parties for their own purposes.
            </p>
            <h3>Infrastructure is different from publication</h3>
            <p>
              Supabase processes and stores application records, and Vercel
              serves this website. These providers necessarily handle network
              requests. The map requests tiles from OpenStreetMap, which
              receives your IP address and map requests, but no report content.
              This app does not include advertising trackers or analytics.
            </p>
            <h3>What deletion does</h3>
            <p>
              Your code withdraws the report from public counts immediately and
              clears optional contact and barangay fields. The remaining record
              is marked withdrawn and removed by the 90-day retention cleanup,
              measured from its original submission time. Expired records are
              excluded from public counts even if the hourly cleanup is delayed.
            </p>
            <p>
              Deletion here affects the application database. Infrastructure
              backup copies follow the hosting provider’s backup lifecycle and
              are not available through this app. Ask the research team about
              backup handling before participating if this matters to your
              decision.
            </p>
            <h3>Your reference code stays private</h3>
            <p>
              Only a one-way hash is stored in the database. The original code
              is shown once after a successful submission. We do not put it in
              URLs, analytics, or browser storage. There is no public lookup or
              recovery endpoint. Keep the code private and do not send it to
              anyone except when intentionally requesting withdrawal.
            </p>
            <p>
              Questions about participation or your information can go to the
              research contact shown above. If you lose the code, the app cannot
              reliably identify which report is yours without collecting more
              identifying information.
            </p>
            <p>
              <Link to="/terms">Read the terms</Link> ·{" "}
              <Link to="/report">Review the report notice</Link>
            </p>
          </div>
        </Card>
        <Card id="withdraw">
          <h2>Withdraw a report</h2>
          <p>
            Enter your reference code to request deletion. You do not need an
            account.
          </p>
          <form className="report-form" onSubmit={withdraw}>
            <Input
              label="Reference code"
              autoComplete="off"
              spellCheck={false}
              maxLength={27}
              required
              placeholder="DW-…"
              value={code}
              disabled={busy}
              onChange={(event) => setCode(event.target.value)}
              hint="Do not include a name, contact address, or report details."
            />
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? "Requesting withdrawal…" : "Request withdrawal"}
            </Button>
          </form>
          {done && (
            <p role="status" className="data-notice">
              Request processed. If this code matched an active report, it is
              now withdrawn and optional contact and barangay text have been
              cleared. For privacy, we do not confirm whether a code exists.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
