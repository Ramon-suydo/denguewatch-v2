import { Link } from "react-router-dom";
import { LEGAL_VERSION, LEGAL_DATE, CONTROLLER_NAME, CONTROLLER_CONTACT, LAUNCH_RETENTION, TECHNICAL_LOG_RETENTION, BACKUP_RETENTION } from "../lib/legal";
export function DraftMark() {
  return <p className="data-notice">Draft for review. Not legal advice. Version {LEGAL_VERSION} · {LEGAL_DATE}</p>;
}
export function PrivacyDraft() {
  return <div className="prose">
    <DraftMark />
    <h2>Privacy Notice</h2>
    <h3>What happens today</h3>
    <p>Public browsing does not require an account. Community submissions are closed. No analytics or advertising SDKs are installed. The app does not set cookies or store preferences, reports or withdrawal codes in localStorage or sessionStorage. Fonts and app code are served with the app; the dated official-data snapshot is fetched from the same site and held in memory. Your browser may cache public files.</p>
    <p>Online browsing sends requests to Vercel and Supabase; the online map also requests OpenStreetMap tiles. These providers can receive IP addresses, browser/request information, requested paths and timestamps. Their logging settings, processing locations and retention require provider/owner verification; we do not promise that no technical logs exist. Technical-log retention: {TECHNICAL_LOG_RETENTION}. Provider backup retention: {BACKUP_RETENTION}. Local snapshot mode avoids Supabase and external map requests.</p>
    <p>Supabase access uses a public anonymous API key, not a user account. Session persistence and automatic auth refresh are disabled. The withdrawal form can send a private code to Supabase when online; it is not a public lookup and returns the same result regardless of a matching report. Offline withdrawal is unavailable.</p>
    <h3>If reporting opens after review</h3>
    <p>We would collect LGU, report date, self-reported status, optional barangay, consent/version and submission time. Optional email or phone contact requires a separate opt-in for research follow-up. The database records a report identifier, contact opt-in, consent and withdrawal state, and only a one-way hash of the private DW- withdrawal code. Do not provide names, exact addresses, patient identifiers or someone else's information.</p>
    <p>Individual health information is sensitive personal information under RA 10173 §3(l)(2). Intended purposes are voluntary research into broad community patterns and separately opted-in follow-up; reports are not verified clinical records, medical advice or official surveillance. The consent text and lawful basis require lawyer/school DPO review before collection opens. <a href="https://privacy.gov.ph/data-privacy-act/" target="_blank" rel="noreferrer">RA 10173, published by the NPC</a>.</p>
    <h3>Sharing and retention</h3>
    <p>Appointed research administrators can access individual reports. Supabase processes the records for the app; no individual report content is intended for sale, advertising or third parties' own use. Public city/week counts are shown only at five or more active reports. Suppression reduces exposure but does not guarantee anonymity. Community reports are excluded from official series, forecasts and the public demo snapshot.</p>
    <p>Final public-launch retention: {LAUNCH_RETENTION}. The existing database is configured for 90 days, with an hourly expiry purge; that earlier setting must be reconfirmed in the launch review. Withdrawal immediately removes a matching active report from aggregates and clears optional barangay/contact. Remaining structured fields persist until expiry/purge. Provider backups follow a separate lifecycle; application deletion does not promise immediate backup deletion.</p>
    <h3>Your rights and contact</h3>
    <p>You may request information/access, correction, objection, erasure or withdrawal, subject to applicable law and appropriate identity verification. Save your DW- code: it permits withdrawal, not record retrieval. There is no public code recovery. Lost-code access/correction requests need a DPO-reviewed process that avoids exposing another person's record. <Link to="/privacy#withdraw">Withdrawal by code</Link>.</p>
    <p>Personal information controller: {CONTROLLER_NAME}. Controller/DPO contact: {CONTROLLER_CONTACT}. The previously approved research email shown in the participation notice is not a confirmed controller or DPO designation. You can also <a href="https://privacy.gov.ph/data-subject-rights/" target="_blank" rel="noreferrer">review your rights and complaint options with the National Privacy Commission</a>.</p>
  </div>;
}
export function TermsDraft() {
  return <div className="prose">
    <DraftMark /><h2>Terms of Use</h2>
    <p>DengueWatch is an educational/research prototype, not an official DOH service. Published histories, forecasts and legacy risk labels may be incomplete, delayed or unavailable. Estimates describe historical source labels; they do not establish current conditions.</p>
    <p>Do not rely on the app for diagnosis, treatment, emergency decisions or outbreak declarations. Follow DOH/local health-office guidance and qualified clinical advice. Community reports, if collection later opens, remain unverified and separate from official records.</p>
    <h3>Acceptable use</h3>
    <p>Do not submit fabricated or repeated reports, other people's personal information, attempt to identify people from aggregates, probe private records, bypass access controls or disrupt the service. Reporting requires voluntary consent and truthful self-reporting; optional contact never guarantees a reply.</p>
    <h3>Availability and liability — lawyer review required</h3>
    <p>The prototype is provided without a promise of uninterrupted availability, completeness or fitness for a particular purpose. Proposed limitation of liability: to the extent permitted by applicable law, the research operators would limit responsibility for losses arising from reliance on the prototype. This proposed clause requires lawyer review; it does not waive statutory rights or establish an enforceable liability limit.</p>
    <p>Respect source usage terms and attribution; permission to redistribute or reuse supplied files has not been established by a placeholder citation. <Link to="/legal#sources">Data Sources & Attribution</Link> · <Link to="/legal#privacy">Privacy Notice</Link>.</p>
  </div>;
}
export function ForecastDisclaimerDraft() {
  return <div className="prose"><DraftMark /><h2>Forecast & Medical Disclaimer</h2>
    <p>Forecasts are statistical estimates from historical published data. They are not medical advice, emergency or outbreak alerts, diagnoses, individual infection probabilities, or substitutes for DOH/local health-office guidance. Seek qualified clinical care for health concerns; do not wait for an app forecast.</p>
    <p>The weekly model estimates LGU case counts one, two and four weeks ahead of historical source labels. Its test evidence ends January 2021. Nominal prediction intervals are imperfectly calibrated and do not guarantee coverage. COVID-period reporting is distorted; excluded-COVID test targets cover only 2019. Model comparisons do not establish present-day performance or season-level outbreak prediction.</p>
    <p>Monthly legacy risk labels are historical distribution categories, not clinical warning thresholds. Monthly and weekly sources overlap and must not be added; Manila daily observations are a separate series. Missing values remain missing. Community reports are unverified and never part of official data or model training.</p>
  </div>;
}
