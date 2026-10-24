# Privacy implementation and review

Status: local implementation; collection remains disabled. No hosted migration,
report activation or real-report seeding was performed in this task.

Health reports are sensitive personal information under RA 10173. See the
[National Privacy Commission text](https://privacy.gov.ph/data-privacy-act/),
particularly Sections 3 and 13. This engineering document is not legal approval.
The school/owner's data-protection officer must review purpose, lawful basis,
controller identity/contact, consent wording, children/third-party reporting,
provider processing, breach response and disclosure risk before collection opens.

The v2 form asks only for an optional coarse Manila source-area label,
symptom-onset date, optional symptoms and a short optional sanitized note. No
name, contact field, precise location or application IP field is stored. Consent
must explicitly match community-v2. Only self-reporting is requested. Free-text
pattern detection is imperfect: names and unusual addresses may evade it;
minimizing or disabling free text remains a DPO decision, not an anonymity claim.

Raw reports are staff-only through audited RPCs; direct SELECT is not granted.
Approval is moderation, not medical confirmation. Public area/onset-week groups
require >=3 approved, nonwithdrawn reports, each >=72 hours old. Small, pending,
quarantined, merged, rejected and withdrawn groups do not publish. Suppression
cannot guarantee anonymity or prevent all differencing attacks. Community data
never enters the official-data publisher, evaluation, model or demo snapshot.

Tracking codes are UUIDv4-derived bearer secrets (122 random bits), displayed
once and stored only as SHA-256 hashes. Withdrawal clears note, symptoms and area,
removes the record from aggregates immediately, and returns the same response
for matching/nonmatching codes. No public lookup or recovery is offered. Legacy
DW- codes still use their original withdrawal path; v2 uses DW2- codes.

Records expire after 90 days from creation. The private purge function removes
expired v1/v2 rows and stale challenges; the migration reuses/schedules the existing hourly job when pg_cron is
available and preloaded. Without pg_cron it emits a notice and collection stays
closed pending owner verification. Current hosted scheduling/execution has not been reverified. Provider
backups and technical logs have separate lifecycles and require owner review;
application deletion does not promise immediate deletion from backups.

Public research files/PWA caches contain official historical aggregates only.
The app stores a language preference locally; report inputs, tracking codes and
staff sessions are not persisted in localStorage/sessionStorage. No third-party
analytics or advertising SDK is installed. Hosting/auth providers can process IPs
in technical logs even though the application schema stores none. Settings,
retention, access and processing locations remain DPO/owner review items.

Research contact supplied by owner: achilleslang23@gmail.com. Do not email raw
health records or tracking codes as routine feedback. Access/correction/lost-code
requests need an identity-safe, DPO-reviewed process before launch.
