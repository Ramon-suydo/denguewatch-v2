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
