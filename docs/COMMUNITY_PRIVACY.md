# Community report contract

These are unverified community signals, separate from published surveillance.
Even clinic_confirmed_self_report is a user's claim, not verified clinical evidence.
Never append community rows to historical_surveillance or mix their counts into
official incidence, forecasts, or forecast evaluation.

## Database access

- Anonymous clients cannot read or insert community_reports directly. Ordinary
  authenticated users have no rows visible through RLS; appointed admins can read.
- submit_community_report accepts only LGU, date, status, optional barangay/contact,
  and explicit consent. It never accepts caller-chosen IDs, timestamps, deletion
  state, or reference codes. It checks Asia/Manila dates and active LGUs.
- community_reports_weekly_agg is the public read RPC: lgu_id, week_start,
  report_count only. Monday-start weeks with fewer than five active, unexpired
  reports are omitted. Missing groups mean zero OR suppressed, never confirmed zero.
- Definer functions have empty search_path and explicit execute grants.
  PUBLIC default execution is revoked; raw records remain protected.

## Reference code and withdrawal

Submission returns DW- plus 24 random hexadecimal characters. Only its SHA-256
hash is stored. The UI displays the original once and asks the user to save it.
It is not put in URLs, browser storage, logs, or a public lookup/recovery endpoint.

delete_community_report accepts the bearer code, soft-deletes the matching active
row, clears optional contact and barangay, and always returns the same empty result.
The code authorizes withdrawal only, never raw-row retrieval. The public Privacy
page provides this process without login and gives a non-enumerating confirmation.

An appointed admin may use the same withdrawal RPC with a supplied code. A future
moderation interface is optional and is not included. Hash expression for authorized
owner/admin lookup: encode(sha256(convert_to(upper(btrim(code)), 'UTF8')), 'hex').

## Consent and lifecycle

The owner approved 90-day retention and achilleslang23@gmail.com as the public
research contact. community-v1 is shown before collection with unchecked consent,
a medical disclaimer and WHO-linked warning signs, voluntary purpose, aggregate
publishing, optional contact opt-in, retention and code-based withdrawal.
The UI calls the protected RPC; no direct insert or medical case-entry UI exists.

The lifecycle migration leaves submissions disabled until the approved owner
setup verifies the hourly cleanup and explicitly enables collection. community_policy
is public-readable but cannot be changed by anonymous or normal authenticated users.

The RPC enforces a serialized global ceiling of 100 submissions in a rolling
24-hour window, including withdrawn rows. This bounds storage abuse without
collecting IP addresses. It does not validate identity, prevent fabricated reports,
or guarantee availability if someone deliberately consumes the quota.

Records immediately leave public counts when withdrawn or when 90 days old.
The hourly private purge hard-deletes expired rows. Until then, withdrawn rows
retain only their remaining structured fields; optional contact/barangay are
already cleared. Application deletion is distinct from provider backup lifecycle.

## Disclosure limits and operational status

Five-report suppression reduces small-cell exposure but does not prove anonymity.
Known submissions and repeated queries/deletions can reveal aggregate changes.
The app does not claim legal or clinical certification.

Only appointed research administrators can read individual reports. No individual
report content is sold or shared with third parties for their own purposes.
Supabase processes storage and Vercel serves the site; OpenStreetMap receives
map requests/IP addresses, not report content. There are no advertising analytics.

Hosted migrations and caches were applied with authorization on 2026-09-24.
Real submissions remain disabled; no activation has been authorized.
See [PUBLIC_APP.md](PUBLIC_APP.md) for exact commands, changes and validation.


## Day 5 review drafts (2026-10-03)

/legal and the existing /privacy and /terms pages carry legal-v1 review drafts.
No app analytics, cookies, localStorage/sessionStorage or remote font/CDN loader
is installed. Browser caching is distinct from app storage. Online public anon
reads send request metadata to Supabase; Vercel serves the app and the online
map requests OpenStreetMap tiles. Provider log/backup retention and locations
are not verified. Offline snapshot contains official/model data only; mutations
are blocked. The online code-based withdrawal path remains available.

The previously approved 90-day DB setting and research email above remain facts,
not a final controller designation or newly settled launch policy. Controller
identity/contact, final public-launch retention, technical-log retention and
backup retention are [pending] in src/lib/legal.ts. Community-v1 consent is a
reusable unticked required block, gated by the existing disabled policy and
matching version. The consent draft changes before any collection; it is not
retroactive consent. Follow LAUNCH_CHECKLIST.md before any activation.

Owner update (2026-10-03, legal-v1.1): controller name/contact are now supplied in
src/lib/legal.ts. Launch retention is Not applicable, form closed; the 90-day DB
setting is unchanged. Provider-default log/backup descriptions are supplied but
not verified durations. The earlier Day 5 pending-field note above is superseded;
DPO designation, provider settings and any future launch policy still need review.
