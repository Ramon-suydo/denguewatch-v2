import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Card, Input } from "../components/ui";
import { PageHeader } from "../components/PageHeader";

import { deleteReport } from "../lib/api";
import { PrivacyDraft } from "../components/LegalDrafts";
export function Privacy() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash === "#withdraw")
      requestAnimationFrame(() =>
        document.getElementById("withdraw")?.scrollIntoView(),
      );
  }, [location.hash]);

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const pending = useRef(false);
  async function withdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (
      !/^(DW-[A-F0-9]{24}|DW2-[A-F0-9]{32})$/.test(code.trim().toUpperCase())
    ) {
      setError(
        "Use the full DW- or DW2- reference code issued with your report.",
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
      <div className="ui-container app-content narrow-content">
        <Card>
          <p className="data-notice">
            Collection remains closed. The v2 notice describes coarse area,
            symptom-onset date, optional symptoms and a sanitized note, with
            90-day retention. Only approved groups of at least three are
            eligible for publication after 72 hours. Provider logs and backups
            require separate DPO review.
          </p>
          <PrivacyDraft />
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
              maxLength={36}
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
              now withdrawn and optional identifying fields have been cleared.
              For privacy, we do not confirm whether a code exists.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
