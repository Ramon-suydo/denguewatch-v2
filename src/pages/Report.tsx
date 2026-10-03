import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  useToast,
} from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { ReadState } from "../components/PageState";
import { MedicalNotice } from "../components/MedicalNotice";
import { ParticipationNotice } from "../components/ParticipationNotice";
import { useAppData } from "../lib/resources";
import { submitReport } from "../lib/api";
import { manilaToday } from "../lib/dates";
import { CommunityConsent } from "../components/CommunityConsent";
import { COMMUNITY_CONSENT } from "../lib/legal";
export function Report() {
  const { cities, policy, community } = useAppData();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [city, setCity] = useState("");
  const [date, setDate] = useState(manilaToday);
  const [status, setStatus] = useState("self_suspected");
  const [barangay, setBarangay] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const stepTitle = useRef<HTMLHeadingElement>(null);
  function go(next: number) {
    setStep(next);
    setError("");
    requestAnimationFrame(() => stepTitle.current?.focus());
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !policy.data) return;
    if (
      !consent ||
      !city ||
      date > manilaToday() ||
      !date ||
      !cities.data?.some((item) => item.id === city) ||
      (!policy.data.submissions_enabled || policy.data.consent_version !== COMMUNITY_CONSENT.version)
    ) {
      setError(
        "Check your consent, city, date, and whether submissions are open.",
      );
      return;
    }
    if (optIn && !contact.trim()) {
      setError("Provide a contact value or turn contact follow-up off.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const reference = await submitReport(
        { city, date, status, barangay, contactOptIn: optIn, contact, consent },
        COMMUNITY_CONSENT.version,
      );
      setCode(reference);
      setContact("");
      setBarangay("");
      setOptIn(false);
      community.retry();
      go(3);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to confirm submission.",
      );
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="VOLUNTARY COMMUNITY REPORTING"
        title="Share a community signal."
        description="Your report stays separate from official surveillance. No account, name, or exact address is required."
      />
      <div className="dw-container app-content narrow-content">
        <ol className="steps" aria-label="Report progress">
          {["Understand & consent", "Your report", "Save your code"].map(
            (label, index) => (
              <li
                key={label}
                aria-current={step === index + 1 ? "step" : undefined}
              >
                <span>{index + 1}</span>
                {label}
              </li>
            ),
          )}
        </ol>
        <h2 ref={stepTitle} tabIndex={-1} className="step-title">
          Step {step}:{" "}
          {step === 1
            ? "Your choice"
            : step === 2
              ? "Report details"
              : "Your reference code"}
        </h2>
        {step === 3 ? (
          <Card className="confirmation">
            <h3>Report received</h3>
            <p>
              Save this code now. It is displayed only in this session and
              cannot be recovered after you leave.
            </p>
            <p className="reference-code">{code}</p>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  toast("Reference code copied. Store it somewhere private.");
                } catch {
                  toast(
                    "Copy was unavailable. Select the code above and copy it manually.",
                  );
                }
              }}
            >
              Copy reference code
            </Button>
            <p>
              Treat the code like a password. Anyone who has it can withdraw
              this report, but cannot read your report with it.
            </p>
            <p>
              Go to{" "}
              <Link to="/privacy#withdraw">Privacy → Withdraw a report</Link>,
              paste the code, and submit the deletion request. Optional contact
              and barangay text are cleared immediately. Remaining records
              expire after 90 days.
            </p>
            <Link className="text-link" to="/">
              Return to the public dashboard ↗
            </Link>
          </Card>
        ) : (
          <ReadState resource={policy}>
            {(notice) => (
              <>
                {!notice.submissions_enabled && (
                  <p className="data-notice" role="status">
                    New submissions are not open yet. You can review the
                    participation notice; the research team is completing its
                    public contact and collection setup.
                  </p>
                )}
                {step === 1 ? (
                  <>
                    <MedicalNotice />
                    <Card>
                      <ParticipationNotice policy={notice} />
                      <CommunityConsent checked={consent} onChange={setConsent} />
                      <Button
                        disabled={!consent || !notice.submissions_enabled || notice.consent_version !== COMMUNITY_CONSENT.version}
                        onClick={() => go(2)}
                      >
                        Continue to report
                      </Button>
                    </Card>
                  </>
                ) : (
                  <ReadState resource={cities}>
                    {(list) =>
                      !list.length ? (
                        <Card>
                          <p>
                            No cities are available. Reporting is temporarily
                            unavailable.
                          </p>
                          <Button variant="secondary" onClick={() => go(1)}>
                            Back to consent
                          </Button>
                        </Card>
                      ) : (
                        <Card>
                          <form className="report-form" onSubmit={submit}>
                            <Select
                              label="City / municipality (required)"
                              value={city}
                              required
                              disabled={busy}
                              onChange={(event) => setCity(event.target.value)}
                            >
                              <option value="">Choose a city</option>
                              {list.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </Select>
                            <Input
                              label="Barangay (optional)"
                              maxLength={100}
                              value={barangay}
                              disabled={busy}
                              onChange={(event) =>
                                setBarangay(event.target.value)
                              }
                              hint="Barangay name only. Do not include your street, house number, or a person’s name."
                            />
                            <Input
                              label="Report date (required)"
                              type="date"
                              required
                              max={manilaToday()}
                              value={date}
                              disabled={busy}
                              onChange={(event) => setDate(event.target.value)}
                            />
                            <Select
                              label="Self-reported status (required)"
                              required
                              value={status}
                              disabled={busy}
                              onChange={(event) =>
                                setStatus(event.target.value)
                              }
                            >
                              <option value="self_suspected">
                                I suspect dengue (not a diagnosis)
                              </option>
                              <option value="clinic_confirmed_self_report">
                                A clinic confirmed it, according to me
                              </option>
                              <option value="recovered">
                                I have recovered, according to me
                              </option>
                            </Select>
                            <Checkbox
                              label="I would like to allow the research team to contact me about this report (optional)."
                              checked={optIn}
                              disabled={busy}
                              onChange={(event) => {
                                setOptIn(event.target.checked);
                                if (!event.target.checked) setContact("");
                              }}
                            />
                            {optIn && (
                              <Input
                                label="Email address or phone number"
                                required
                                maxLength={254}
                                value={contact}
                                disabled={busy}
                                autoComplete="off"
                                onChange={(event) =>
                                  setContact(event.target.value)
                                }
                                hint="Used only for optional research follow-up. This is not an emergency contact service."
                              />
                            )}
                            <p className="muted">
                              Your choice to participate was recorded at Step 1.
                              You can go back to review or withdraw that choice
                              before submitting.
                            </p>
                            {error && (
                              <p className="form-error" role="alert">
                                {error}
                              </p>
                            )}
                            <div className="modal-actions">
                              <Button
                                variant="secondary"
                                disabled={busy}
                                onClick={() => go(1)}
                              >
                                Back to consent
                              </Button>
                              <Button
                                type="submit"
                                disabled={
                                  busy ||
                                  !consent ||
                                  (!notice.submissions_enabled || notice.consent_version !== COMMUNITY_CONSENT.version)
                                }
                              >
                                {busy
                                  ? "Submitting…"
                                  : "Submit community report"}
                              </Button>
                            </div>
                          </form>
                        </Card>
                      )
                    }
                  </ReadState>
                )}
              </>
            )}
          </ReadState>
        )}
      </div>
    </>
  );
}
