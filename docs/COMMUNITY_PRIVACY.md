# Community report contract

These are unverified community signals, stored separately from published official
surveillance. Even clinic_confirmed_self_report is a user's claim, not verified
clinical evidence. Never append these rows to historical_surveillance or mix their
counts into official incidence/forecast accuracy calculations.

## Database access

- No anonymous table privileges on community_reports. Ordinary signed-in users
  have no rows visible through RLS. Only explicitly appointed admins can read rows.
- submit_community_report accepts only LGU, date, status, optional barangay/contact,
  and explicit consent. It does not accept IDs, timestamps, deletion state, or a
  caller-chosen reference code. Contact opt-in defaults to false and is constrained
  at table level. Future dates are checked in Asia/Manila at write time.
- community_reports_weekly_agg is the only public read interface: exactly lgu_id,
  week_start, report_count. Monday-start weeks with fewer than five active reports
  are omitted. It exposes no status, contact, barangay, reference, or exact dates.
- All definer functions have an empty search_path, qualified object names, and
  explicit execute grants. PUBLIC's default execution permission is revoked.

## Reference code and withdrawal

Submission returns one DW- code with 24 hexadecimal characters derived from a
cryptographically random UUID. Only its SHA-256 hash is stored in the unique
reference_code column. A future UI must show it once, encourage saving it, and
never log it, put it in a URL, or offer public lookup/recovery.

The anonymous delete_community_report RPC accepts the code, soft-deletes the
matching row, clears optional contact and barangay text, and returns the same empty
result for valid, missing and previously deleted codes. The code authorizes
withdrawal only; it never authorizes a raw-row read. Deleted rows are excluded from
public aggregates. Treat this code as a bearer secret.

An admin can use the same withdrawal RPC with a supplied code, or look up its hash
through admin-only raw access. Hash expression:
encode(sha256(convert_to(upper(btrim(code)), 'UTF8')), 'hex').

## Consent integration contract

The RPC requires p_consent_given=true and p_consent_version='community-v1'; the
server sets consent_at and created_at. No consent UI has been built. Before a
public form is enabled, version community-v1 must accompany a reviewed notice
covering voluntary participation, purpose, unverified status, aggregate publishing,
optional follow-up, withdrawal by code, administrator/data-controller contact,
and the agreed retention period. No name, exact address, mandatory phone number,
patient identifier, or precise location field is present.

## Remaining public-launch work

Five-report suppression is a small-cell protection, not proof of anonymity.
Repeated queries, known submissions and deletions can reveal count changes; it
does not prevent false submissions or coordinated reporting. Before enabling a
public form, implement and test server-enforced abuse controls (including all RPC
entry paths), agree retention/purge handling, and review consent language. CORS or
a client-only CAPTCHA alone cannot protect a directly callable public RPC.

No community UI, external notification, contact delivery, public form launch,
synthetic surveillance data, or claims of legal compliance are included here.
