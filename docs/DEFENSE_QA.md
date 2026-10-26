# Current NCR classification defense questions

## Why is RF not clearly better?

In this run the simple persistence rule actually has higher held-out F1. Many positive weeks are continuations of elevated counts, making “already high this week” a strong one-week baseline. RF was chosen by training validation, not by choosing the best-looking test result. The published report retains both outcomes, paired intervals and the 20-positive onset subset. The onset persistence rule produces no alerts by construction under our current-above-cutoff subset; that must not be sold as strong evidence of operational early warning.

## Why not 79% accuracy?

The owner-supplied IEEE paper (document 9357035, Sarma et al., 2020) is a different, patient-level task. We borrow the DT/RF and 70:30 comparison protocol. Its accuracy is not our accuracy, and majority-class accuracy can look high in an imbalanced city-week task. Report balanced accuracy, precision, recall, F1, AUC, Brier, confusion matrices and uncertainty from our actual data.

## Why city-level only?

The source has 17 NCR reporting units: 16 cities and Pateros municipality. It has no barangay case series for this model. Polygon fills follow those whole units; street detail is basemap context, not a finer prediction grid. Boundary/name agreement is explicit but does not independently certify reporting catchments.

## Why Replay mode?

The model input is limited to 2016-2020. Newer 17-city surveillance is absent. Replay identifies the historical target week and shows recorded outcomes. Unscorable windows remain No data. Live requires a reviewed complete upload and a source week within 21 days. A one-week target can already have passed if reporting is delayed; the UI shows that date and requests newer counts, without rolling a one-step forecast into an invented current estimate.

## Why a chronological split?

All cities share one target-week cut: first 70% of eligible weeks train, last 30% test. Training labels must have matured by each validation/test origin. Random rows mix earlier/later dates and correlated city records, so that comparison is separately labelled rather than used as forecasting evidence.

## What differs from the prototype?

The source contains three absent whole calendar weeks despite complete fields on recorded dates. We preserve the calendar and exclude feature/target windows crossing gaps. Our one-hot city encoding, balanced weights, training-only tuning, sigmoid calibration and validation operating points also differ from a fixed-depth/fixed-cutoff prototype. These are possible contributors; the prototype code was not provided for a controlled attribution. No parameters are tuned to reproduce supplied test numbers.

Current authoritative results: ML_METHOD.md, ML_EVALUATION.md, MAP_DESIGN.md and data/processed/ml/evaluation.json. Citation metadata is verified from the owner-supplied IEEE URL via Crossref; full publisher text remains access-blocked. Older questions below describe the archived Manila/national research.

---

# Three-page redesign: defense questions

**Why is the national map an outlook and not a forecast?** National cases stop in January 2021. The map ranks old seasonal count expectations, not next-week cases or present infection risk. Only Manila has a separate historical case-forecast panel, and its source also ends in December 2023. Current risk is unavailable.

**Does weather drive the national colours?** No. The earlier-year rolling tests for 2018, 2019 and 2020 did not show consistent improvement over seasonal controls. Weather context is dated, cached, and excluded from the index. Missing weather leaves the seasonal outlook usable. See MAP_METHOD.md and the saved evaluation tables.

**Is this population-adjusted risk?** No. Verified PSA denominators matching every surveillance catchment are unavailable. Counts are confounded by population size and reporting. The app discloses this prominently and does not publish national per-100,000 rates.

**Do all polygons match?** No. There are 104 local polygons, 96 explicit name matches, 8 no-data polygons and 30 surveillance units without matched polygons. An exact name is not proof that separately reported cities and province catchments align. No guessed district-to-city reassignment occurs.

**Are community reports anonymous and medically confirmed?** They omit names, contacts, GPS and raw stored IPs; privacy cannot be guaranteed. A transient proxy IP can produce a rotating, expiring salted hash for throttling. Staff review content, not diagnoses. At least three approved reports and a 72-hour delay are required for public groups. Reports never enter the index, forecasts or official counts. Collection remains closed until institutional privacy and hosted checks are complete.

**Who owns the photograph and project?** The project owner identifies Sumarie Slabber as photographer. Written permission/licence and source URL remain NEEDS OWNER. Team, school and contacts remain hidden until supplied through src/content/about.json. No affiliation or permission is invented.

**What was verified locally versus on the host?** Read the latest redesign evidence ledger. Embedded PostgreSQL tests execute real migrations/RLS/abuse guards, but do not verify Supabase Auth, deployed infrastructure logs, schedules, credentials or Vercel. Credential rotation, hosted checks, DPO review and usability sessions remain NEEDS OWNER. A local pass must never be described as a hosted pass.

---

# Defense questions and honest answers

Current source of release truth: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) and [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).

**Is this live dengue surveillance?** No. Manila cases end 2023-12-02 and NCR weekly observations end 2021-01-10. Weather updates do not make case counts current. Community awareness reports are unverified and never added to official counts or forecasts.

**What do absent dates mean?** The source owner has not confirmed their meaning. M excludes incomplete daily weeks; Z treats absent daily dates as zero only within source coverage. Both are shown; the public chart starts with M. DOH gaps remain missing.

**How good is the forecast?** The visible Methodology accuracy table reads actual saved MAEs and is regression-tested against the evaluation JSON for both scenarios. One-week persistence means last week's value. Some two/four-week ridge comparisons improve retrospective error but remain exploratory with wide uncertainty. Weather did not establish a reliable operational improvement. This is not prospective clinical validation.

**Did the evaluation reproduce?** The full fresh offline evaluation completed and the main evaluation, environmental evaluation and weekly datasets were byte-identical to their previous hashes. Same-code reproducibility does not establish independent scientific validity.

**Can a real user submit now?** Collection fails closed until the owner rotates credentials, verifies hosted migrations/Auth/scheduling, completes human reviews and explicitly activates the server policy. Local tests demonstrate submission, moderation, below-threshold suppression, delayed publication at three reports, withdrawal and denied raw reads against disposable actual SQL. They do not prove a real hosted login, TOTP, delivery or deployment.

**Is the system secure/compliant?** Local RLS/abuse tests, role/AAL2 tests, scanner reports and tested accessibility assertions passed in their stated scope. The secret gate correctly remains blocked on rotation; hosted scans and real Auth remain unverified. These checks do not establish legal compliance. Usability and DPO approval remain NEEDS OWNER.

**What is the source citation?** DOH Epidemiology Bureau EPI weekly source file and coverage are recorded honestly; retrieval is unknown. Daily data was provided by the City of Manila health department to the project team; formal citation and usage permission remain pending the data owner. MIT covers code, not third-party source ownership.

## NEEDS OWNER

1. Rotate the Supabase database password and affected server API keys in the dashboard. Privately update ignored .env.local, hosting environment variables and Actions secrets. Do not paste any values. Set CREDENTIALS_ROTATED=1 only after rotation. Configure the private exposure-guard secret using docs/ROTATE_CREDENTIALS.md.
2. Run `npm run credentials:verify`, `npm run security:secrets`, `npm run hosted:bootstrap`, then `npm run db:verify -- --hosted`. If verification requires pending migrations, bootstrap after rotation and repeat verification. The audit attestation is not proof of revoked hosted credentials.
3. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD privately; run `npm run hosted:admin`; remove the bootstrap password. Enroll/verify TOTP through the staff flow and exercise an actual hosted AAL2 login and authorized moderation. Local test JWTs are not hosted Auth proof.
4. Configure repository variables SUPABASE_URL and DEPLOYED_URL, protected retention server-key secret, the private exposure fingerprint secret, and CREDENTIALS_ROTATED. Manually run Community retention and ZAP baseline workflows; inspect successful current-code runs/artifacts. Verify pg_cron or the active hourly Actions fallback using `npm run db:verify -- --hosted`. A YAML schedule alone is not proof of execution.
5. Perform a real usability session and school/DPO review of consent, retention, withdrawal and institutional responsibility. Resolve original source retrieval dates, formal citation/redistribution terms, absence semantics and population attribution with source owners. No participants, approvals or source dates have been invented.
6. Test locally and self-review the auth/schema changes before merging near the defense. Re-run required release gates in the intended environment. Only after every gate passes, set `$env:LAUNCH_GATES_PASSED = '1'` and run `npm run hosted:bootstrap -- --enable-reporting`. Emergency closure: `npm run reports:off`. Do not enable collection merely to demonstrate a test.

Full numbered dashboard and command instructions: [ROTATE_CREDENTIALS.md](ROTATE_CREDENTIALS.md). All private configuration stays out of Git.

## Why this design?

DengueWatch puts a person’s next task first: choose a city, understand a dated estimate, learn a practical action, or preview a private report. The Bay wave and original drop mark root the identity in Manila without borrowing the owner’s other site. Light surfaces, readable type and a separate labeled risk scale reduce alarm and make comparisons easier. The map’s default example is calculated from the real saved data to show variety; it is not selected to suggest current conditions. Night mode, reduced motion, touch alternatives and bilingual controls support different needs. The full model limitations and negative comparisons remain available in the evidence and About page. See BRAND.md, DESIGN_SYSTEM.md, MOTION.md and the current verification record; human usability and Filipino review are still owner work.
