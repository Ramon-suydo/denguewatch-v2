import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Checkbox, Input, Select } from "../components/ui";
import {useRedesignLanguage as useLanguage} from "../redesign/Language";
import {Guidance} from "../redesign/Guidance";
import reportingAreas from "../content/reporting-areas.json";
import { LanguageControl } from "../components/EvidenceControls";
import { useResource } from "../lib/resources";
import { signalPolicy, scrubNote, submitSignalV3 } from "../lib/signals";
import { manilaToday } from "../lib/dates";
async function catalog(signal: AbortSignal) {
  const response = await fetch("/api/v2/barangays.json", { signal });
  if (!response.ok) throw Error("Area list unavailable");
  const data = await response.json();
  if (data.version !== 1 || !Array.isArray(data.rows))
    throw Error("Area list unavailable");
  return data as { rows: { code: string; label: string }[] };
}
export function ReportV2() {
  const { language, setLanguage } = useLanguage(),
    fil = language === "fil",
    policy = useResource("report-policy-v2", signalPolicy),
    areas = useResource("manila-areas", catalog);
  const [reportType,setReportType]=useState("suspected"),[areaUnit,setAreaUnit]=useState("MANILA CITY"),[affectedRange,setAffectedRange]=useState("1"),[receipt,setReceipt]=useState<Record<string,string|string[]|number|null>|null>(null),
    [consent, setConsent] = useState(false),
    [step, setStep] = useState(1),
    [barangay, setBarangay] = useState(""),
    [onset, setOnset] = useState(manilaToday()),
    [symptoms, setSymptoms] = useState<string[]>([]),
    [note, setNote] = useState(""),
    [honeypot, setHoneypot] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [code, setCode] = useState("");
  const stepHeading = useRef<HTMLHeadingElement>(null),
    previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step) stepHeading.current?.focus();
    previousStep.current = step;
  }, [step]);
  const pending = useRef(false),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const t = (en: string, fl: string) => (fil ? fl : en);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      pending.current ||
      !consent ||
      !policy.data?.enabled ||
      !onset ||
      onset > manilaToday()
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      const result = await submitSignalV3(
        { barangay, onset, symptoms, note, consent, honeypot,reportType,areaUnit,affectedRange },
        controller.current.signal,
      );
      setCode(result.code);setReceipt(result.stored);
      setNote("");
      setSymptoms([]);
      setBarangay("");
      setOnset("");
      setStep(3);
    } catch (reason) {
      if (!controller.current.signal.aborted)
        setError(
          fil
            ? "Hindi makumpirma kung na-save ang ulat. Huwag itong muling ipadala nang awtomatiko; makipag-ugnayan sa pangkat ng pananaliksik."
            : reason instanceof Error
              ? reason.message
              : t("Report unavailable.", "Hindi maipadala ang ulat."),
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="ui-container app-content evidence-page narrow-content">
      <LanguageControl value={language} onChange={setLanguage} />
      <p className="eyebrow">
        {t("COMMUNITY / UNVERIFIED", "KOMUNIDAD / HINDI BERIPIKADO")}
      </p>
      <h1>
        {t("Share an awareness signal.", "Magbahagi ng ulat para sa kaalaman.")}
      </h1><p>{t("Report a suspected case in your household or an unusual cluster you noticed. Choose only a coarse area; no GPS or free-text address is collected. Barangay selection is available only for the verified Manila catalogue; other units stay at province/city level. The onset day may be approximate.","Iulat ang pinaghihinalaang kaso sa pamilya o kakaibang kumpol sa lugar. Pumili lamang ng malawak na lugar; walang GPS o address. May talaan lamang ng barangay para sa Maynila; lalawigan/lungsod lamang ang iba. Maaaring tantiya ang araw ng pagsisimula.")}</p>
      <p>
        {t(
          "We do not ask for your name or contact details, do not store your IP address or precise location, and use no trackers. No system can promise perfect anonymity, so do not include details that identify you or others. Reports never enter official counts, forecasts or the city models.",
          "Hindi hinihingi ang pangalan o contact, hindi iniimbak ang IP address o eksaktong lokasyon, at walang tracker. Walang sistemang makapangangako ng ganap na anonymity; huwag maglagay ng pagkakakilanlan. Hindi kasama ang ulat sa opisyal na bilang, pagtataya o modelo ng lungsod.",
        )}
      </p>
      <Card><p>{t("An IP address, when provided by the trusted hosting proxy, is used transiently to derive a rotating salted rate-limit hash. Raw IPs are never stored. Hashes expire after a 15-minute window and are physically removed on a successful request or the hourly retention job (up to 75 minutes). Automated note filters cannot detect every identifying detail. Retention and consent require DPO review before collection opens.","Kung ibinigay ng hosting proxy ang IP, pansamantala lamang itong ginagamit sa umiikot na salted hash. Hindi iniimbak ang IP. Natatapos ang hash window sa 15 minuto at binubura sa matagumpay na kahilingan o oras-oras na paglilinis (hanggang 75 minuto). Hindi nahuhuli ng filter ang lahat ng pagkakakilanlan. Kailangan ang pagsusuri ng DPO bago buksan ang pagtanggap.")}</p>
        {!policy.data?.enabled && (
          <p className="data-notice" role="status">
            {policy.loading
              ? t(
                  "Checking collection status…",
                  "Sinusuri ang kalagayan ng pagtanggap…",
                )
              : t(
                  "New submissions are closed.",
                  "Hindi pa bukas ang pagtanggap ng bagong ulat.",
                )}
          </p>
        )}
        {!policy.loading && !policy.data?.verified && (
          <p>
            {t(
              "Collection status could not be confirmed; reporting stays closed.",
              "Hindi makumpirma ang pagtanggap; nananatiling sarado ang pag-uulat.",
            )}{" "}
            <Button variant="secondary" onClick={policy.retry}>
              {t("Retry status", "Subukang muli")}
            </Button>
          </p>
        )}
        {step === 1 && (
          <>
            <h2 ref={stepHeading} tabIndex={-1}>
              {t("Understand and consent", "Unawain at pumayag")}
            </h2>
            <p>
              {t(
                "Your optional health report is sensitive personal information. It supports research and coarse community awareness, not diagnosis, emergency response or validated prediction.",
                "Sensitibong personal na impormasyon ang ulat pangkalusugan. Para ito sa pananaliksik at kaalaman ng komunidad, hindi diyagnosis, agarang tugon o napatunayang prediksiyon.",
              )}
            </p>
            <p>
              {t(
                "Only staff can review individual reports. Public counts require staff approval, a 72-hour delay and at least three reports per area/week. Reports are removed after 90 days; withdraw sooner with your private code.",
                "Itinalagang kawani lamang ang makakakita ng indibidwal na ulat. Kailangan ang pag-apruba, 72-oras na paghihintay at hindi bababa sa tatlong ulat sa bawat lugar/linggo. Binubura ang ulat matapos ang 90 araw; maaari kang umatras gamit ang pribadong code.",
              )}
            </p>
            <p>
              {t(
                "Please report only your own household experience or a coarse, non-identifying cluster observation. Do not include anyone’s identity or address.",
                "Sariling karanasan lamang ang iulat. Huwag ilagay ang pagkakakilanlan o tirahan ng sinuman.",
              )}{" "}
              <Link className="text-link" to="/report?drawer=privacy">
                {t("Privacy and withdrawal", "Pagkapribado at pag-urong")}
              </Link>
              .
            </p>
            <Checkbox
              label={t(
                "I voluntarily consent to this research use of my report under community-v2.",
                "Kusang-loob akong pumapayag sa paggamit ng aking ulat sa pananaliksik ayon sa community-v2.",
              )}
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <Button
              disabled={!consent || !policy.data?.enabled}
              onClick={() => setStep(2)}
            >
              {t("Continue to report", "Magpatuloy sa pag-uulat")}
            </Button>
            <p className="muted">
              {t(
                "Controller: DengueWatch student research team. Contact:",
                "Tagapangasiwa: DengueWatch student research team. Makipag-ugnayan sa:",
              )}{" "}
              achilleslang23@gmail.com.{" "}
              {t(
                "Notice requires DPO review before collection opens.",
                "Kailangang suriin ng DPO ang abiso bago buksan ang pagtanggap.",
              )}
            </p>
          </>
        )}
        {step === 2 && (
          <form onSubmit={submit}>
            <h2 ref={stepHeading} tabIndex={-1}>
              {t("Your report", "Iyong ulat")}
            </h2>
            <Select label={t("Report type","Uri ng ulat")} value={reportType} onChange={e=>setReportType(e.target.value)} required><option value="suspected">{t("Suspected household / family case","Pinaghihinalaang kaso sa pamilya")}</option><option value="cluster">{t("Unusual cluster in the area","Di-karaniwang kumpol sa lugar")}</option></Select>
            <Select label={t("Province / city (coarse reporting unit)","Lalawigan / lungsod")} value={areaUnit} onChange={e=>{setAreaUnit(e.target.value);setBarangay("");}} required>{reportingAreas.units.map(name=><option key={name}>{name}</option>)}</Select>
            <Select label={t("People affected (approximate range)","Tinatayang bilang ng apektado")} value={affectedRange} onChange={e=>setAffectedRange(e.target.value)} required>{['1','2-4','5-9','10+'].map(range=><option key={range}>{range}</option>)}</Select>
            <Select
              label={t(
                "Barangay (coarse area only)",
                "Barangay (pangkalahatang lugar lamang)",
              )}
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              disabled={busy||areaUnit!=="MANILA CITY"}
            >
              <option value="">
                {t(
                  "Manila city · area not listed / prefer not to specify",
                  "Maynila · wala sa listahan / ayaw tukuyin",
                )}
              </option>
              {areas.data?.rows.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </Select>
            {areas.error && (
              <p>
                {t(
                  "Area list unavailable. You may choose Manila city only.",
                  "Hindi makuha ang listahan. Maaaring piliin ang Maynila lamang.",
                )}
              </p>
            )}
            <Input
              label={t(
                "Symptom-onset date (required)",
                "Petsa ng pagsisimula ng sintomas (kailangan)",
              )}
              type="date"
              required
              min={new Date(
                Date.parse(manilaToday() + "T00:00:00Z") - 90 * 86400000,
              )
                .toISOString()
                .slice(0, 10)}
              max={manilaToday()}
              value={onset}
              disabled={busy}
              onChange={(e) => setOnset(e.target.value)}
            />
            <fieldset>
              <legend>
                {t(
                  "Symptoms (optional; not a diagnosis)",
                  "Mga sintomas (opsyonal; hindi diyagnosis)",
                )}
              </legend>
              {[
                ["fever", "Fever", "Lagnat"],
                ["headache", "Headache", "Sakit ng ulo"],
                ["body-ache", "Body ache", "Pananakit ng katawan"],
                ["nausea", "Nausea", "Pagduduwal"],
                ["rash", "Rash", "Pantal"],
                ["other", "Other symptoms", "Iba pang sintomas"],
              ].map(([key, en, fl]) => (
                <Checkbox
                  key={key}
                  label={t(en, fl)}
                  checked={symptoms.includes(key)}
                  disabled={busy}
                  onChange={(e) =>
                    setSymptoms((values) =>
                      e.target.checked
                        ? [...values, key]
                        : values.filter((v) => v !== key),
                    )
                  }
                />
              ))}
            </fieldset>
            <label htmlFor="signal-note">
              {t(
                "Short note (optional, 250 characters)",
                "Maikling tala (opsyonal, 250 titik)",
              )}
            </label>
            <textarea
              id="signal-note"
              maxLength={250}
              value={note}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby="note-scrub"
            />
            <p id="note-scrub" className="muted">
              {t(
                "Email and phone patterns are removed. Address-like notes are discarded. Detection is imperfect: do not include names or identifying details.",
                "Inaalis ang anyong email at telepono. Itinatapon ang talang mukhang tirahan. Hindi perpekto ang pagtukoy: huwag ilagay ang pangalan o pagkakakilanlan.",
              )}
            </p>
            {note && (
              <p>
                {t("Sanitized note:", "Nalinis na tala:")}{" "}
                {scrubNote(note) ||
                  t("Removed for privacy", "Inalis para sa pagkapribado")}
              </p>
            )}
            <div hidden aria-hidden="true">
              <label>
                Website
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>
            {error && <p role="alert">{error}</p>}
            <Button type="submit" disabled={busy || !policy.data?.enabled}>
              {busy
                ? t(
                    "Checking anti-spam proof…",
                    "Sinusuri ang patunay laban sa spam…",
                  )
                : t("Submit community report", "Ipadala ang ulat")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setStep(1)}
            >
              {t("Back", "Bumalik")}
            </Button>
          </form>
        )}
        {step === 3 && (
          <>
            <h2 ref={stepHeading} tabIndex={-1}>
              {t(
                "Report received for review",
                "Natanggap ang ulat para sa pagsusuri",
              )}
            </h2>{receipt&&<section aria-label="Exactly what was stored"><h3>{t("Exactly what was stored","Eksaktong naimbak")}</h3><dl>{Object.entries(receipt).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{Array.isArray(value)?value.join(', '):value===null?t('Not supplied','Walang ibinigay'):String(value)}</dd></div>)}</dl></section>}<Guidance compact/>
            <p>
              {t(
                "Unverified. This is not a medical confirmation. Save this private withdrawal code; it cannot be recovered from the app.",
                "Hindi beripikado. Hindi ito kumpirmasyong medikal. Itago ang pribadong code para sa pag-urong; hindi ito makukuha muli sa app.",
              )}
            </p>
            <p className="tracking-code">
              <code>{code}</code>
            </p>
            <Link className="text-link" to="/privacy#withdraw">
              {t("Withdraw with your code", "Umatras gamit ang iyong code")}
            </Link>
          </>
        )}
      </Card>
      <p>
        <Link className="text-link" to="/community">
          {t(
            "View community aggregates",
            "Tingnan ang pinagsamang ulat ng komunidad",
          )}
        </Link>{" "}
        ·{" "}
        <Link className="text-link" to="/prevention">
          {t(
            "Prevention and urgent warning signs",
            "Pag-iwas at agarang babala",
          )}
        </Link>
      </p>
    </div>
  );
}
