import { ReportingStatus } from "./ReportingStatus";
import { Link } from "react-router-dom";
import {
  LEGAL_VERSION,
  LEGAL_DATE,
  CONTROLLER_NAME,
  CONTROLLER_CONTACT,
  LAUNCH_RETENTION,
  TECHNICAL_LOG_RETENTION,
  BACKUP_RETENTION,
} from "../lib/legal";
export function DraftMark() {
  return (
    <p className="data-notice">
      Draft for review. Not legal advice. Version {LEGAL_VERSION} · {LEGAL_DATE}
    </p>
  );
}
export function PrivacyDraft() {
  return (
    <div className="prose">
      <DraftMark />
      <h2>Privacy Notice</h2>
      <h3>What happens today</h3>
      <p>
        Public browsing does not require an account. <ReportingStatus /> No analytics or advertising SDKs are installed. The app sets no
        cookies. Only a language preference is stored in localStorage; reports
        and withdrawal codes are never stored in browser storage. Fonts and app
        code are served with the app; the dated official-data snapshot is
        fetched from the same site and held in memory. Your browser may cache
        public files.
      </p>
      <p>
        Public research pages and the NCR map use same-origin files with
        self-hosted fonts. Reporting, withdrawal and legacy source auditing can
        send requests to Supabase. No external map tiles are requested. These
        providers can receive IP addresses, browser/request information,
        requested paths and timestamps. The provider-default labels below do not
        establish a verified duration. Their logging settings, processing
        locations and retention require provider/owner verification; we do not
        promise that no technical logs exist. Technical-log retention:{" "}
        {TECHNICAL_LOG_RETENTION}. Provider backup retention: {BACKUP_RETENTION}
        . Offline mode blocks report mutations; previously cached public
        research files can remain available.
      </p>
      <p>
        Public reporting uses a public anonymous API key. Staff sign-in uses an appointed Supabase Auth account and MFA.
        Session persistence and automatic auth refresh are disabled. The
        withdrawal form can send a private code to Supabase when online; it is
        not a public lookup and returns the same result regardless of a matching
        report. Offline withdrawal is unavailable.
      </p>
      <h3>If reporting opens after review</h3>
      <p>
        The v2 form collects an optional coarse Manila area, symptom-onset date,
        optional symptoms and a short sanitized note, consent/version and
        submission time. No name, contact field, precise location or application
        IP field is collected. Pattern-based PII removal is imperfect; do not
        include identifying information. The database records consent,
        moderation/withdrawal state and a one-way hash of the private DW2-
        withdrawal code. Do not provide names, exact addresses, patient
        identifiers or someone else's information.
      </p>
      <p>
        Individual health information is sensitive personal information under RA
        10173 §3(l)(2). Intended purposes are voluntary research into broad
        community patterns; reports are not verified clinical records, medical
        advice or official surveillance. The consent text and lawful basis
        require lawyer/school DPO review before collection opens.{" "}
        <a
          href="https://privacy.gov.ph/data-privacy-act/"
          target="_blank"
          rel="noreferrer"
        >
          RA 10173, published by the NPC
        </a>
        .
      </p>
      <h3>Sharing and retention</h3>
      <p>
        Appointed moderators and administrators can review individual reports.
        Supabase processes the records for the app; no individual report content
        is intended for sale, advertising or third parties' own use. The v2
        public area/week counts require at least three approved reports and a
        minimum 72-hour publication delay. Legacy submission entrypoints are
        permanently closed; v2 submission follows its server policy. Suppression reduces exposure but
        does not guarantee anonymity. Community reports are excluded from
        official series, forecasts and the public demo snapshot.
      </p>
      <p>
        Community-report launch retention: {LAUNCH_RETENTION}. The existing
        database is configured for 90 days, with an hourly expiry-purge definition. Hosted scheduling and execution must be verified in the launch review. V2 withdrawal
        immediately removes a matching active report from aggregates and clears
        note, symptoms and area; legacy DW- withdrawal clears optional contact
        and barangay text. Remaining structured fields persist until
        expiry/purge. Provider backups follow a separate lifecycle; application
        deletion does not promise immediate backup deletion.
      </p>
      <h3>Your rights and contact</h3>
      <p>
        You may request information/access, correction, objection, erasure or
        withdrawal, subject to applicable law and appropriate identity
        verification. Save your DW- or DW2- code: it permits withdrawal, not
        record retrieval. There is no public code recovery. Lost-code
        access/correction requests need a DPO-reviewed process that avoids
        exposing another person's record.{" "}
        <Link to="/privacy#withdraw">Withdrawal by code</Link>.
      </p>
      <p>
        Personal information controller: {CONTROLLER_NAME}. Controller contact:{" "}
        <a href={"mailto:" + CONTROLLER_CONTACT}>{CONTROLLER_CONTACT}</a>. This
        is the owner-supplied research contact; a DPO appointment is not
        confirmed. You can also{" "}
        <a
          href="https://privacy.gov.ph/data-subject-rights/"
          target="_blank"
          rel="noreferrer"
        >
          review your rights and complaint options with the National Privacy
          Commission
        </a>
        .
      </p>
    </div>
  );
}
export function TermsDraft() {
  return (
    <div className="prose">
      <DraftMark />
      <h2>Terms of Use</h2>
      <p>
        DengueWatch is an educational/research prototype, not an official DOH
        service. Published histories, forecasts and legacy risk labels may be
        incomplete, delayed or unavailable. Estimates describe historical source
        labels; they do not establish current conditions.
      </p>
      <p>
        Do not rely on the app for diagnosis, treatment, emergency decisions or
        outbreak declarations. Follow DOH/local health-office guidance and
        qualified clinical advice. Community reports, when server policy permits submission,
        remain unverified and separate from official records.
      </p>
      <h3>Acceptable use</h3>
      <p>
        Do not submit fabricated or repeated reports, other people's personal
        information, attempt to identify people from aggregates, probe private
        records, bypass access controls or disrupt the service. Reporting
        requires voluntary consent and truthful self-reporting. No medical
        monitoring or personal reply is promised.
      </p>
      <h3>Availability and liability — lawyer review required</h3>
      <p>
        The prototype is provided without a promise of uninterrupted
        availability, completeness or fitness for a particular purpose. Proposed
        limitation of liability: to the extent permitted by applicable law, the
        research operators would limit responsibility for losses arising from
        reliance on the prototype. This proposed clause requires lawyer review;
        it does not waive statutory rights or establish an enforceable liability
        limit.
      </p>
      <p>
        Respect source usage terms and attribution; permission to redistribute
        or reuse supplied files has not been established by a descriptive
        attribution. <Link to="/legal#sources">Data Sources & Attribution</Link> ·{" "}
        <Link to="/legal#privacy">Privacy Notice</Link>.
      </p>
    </div>
  );
}
export function ForecastDisclaimerDraft() {
  return (
    <div className="prose">
      <DraftMark />
      <h2>Forecast & Medical Disclaimer</h2>
      <p>
        Forecasts are statistical estimates from historical published data. They
        are not medical advice, emergency or outbreak alerts, diagnoses,
        individual infection probabilities, or substitutes for DOH/local
        health-office guidance. Seek qualified clinical care for health
        concerns; do not wait for an app forecast.
      </p>
      <p>
        The Manila research harness evaluates one, two and exploratory four-week
        case estimates through 2023 under both absent-day scenarios. The public
        historical forecast uses persistence; weather did not improve the
        matched 1–2 week ridge comparisons. Nominal prediction intervals are
        imperfectly calibrated and do not guarantee coverage. COVID-period
        reporting is distorted; 2020–2021 are reported separately, alongside
        2018, 2019, 2022 and 2023 test folds. Model comparisons do not establish
        present-day performance or season-level outbreak prediction.
      </p>
      <p>
        Archived monthly risk labels are historical distribution categories, not
        clinical warning thresholds in the current public site. Monthly and
        weekly sources overlap and must not be added; Manila daily observations
        are a separate series. Raw absence remains unknown; Scenario M preserves
        missing values and Scenario Z explicitly assumes zero within coverage.
        Community reports are unverified and never part of official data or
        model training.
      </p>
    </div>
  );
}
