# Security design and deployment gates

The application is not yet cleared for live collection. The local database
password matches a public project identifier in Git history: **rotate it in
Supabase and update local configuration before hosted use**. Do not mistake an
absence of credential URLs for a clean secret gate. `npm run security:secrets`
scans locally reachable history, token/private-key patterns and known local
private values, without printing those values. Unknown secrets/unreachable refs
are outside this heuristic proof. A CI checkout without the private env file
cannot establish that the known-value credential has been rotated.

## Authentication and roles

Staff pages live only under /admin with a separate layout. No public menu exposes
staff controls. Supabase Auth handles passwords; its documented implementation
uses salted bcrypt ([official password-security documentation](https://supabase.com/docs/guides/auth/password-security)).
The application never stores or hashes staff passwords itself. Local config
requires >=12 characters with mixed character classes, disables signup and
anonymous sign-in, requires confirmation and secures password changes. Hosted
settings were not changed or verified. MFA is not implemented in this revision;
owner review/enablement is a remaining deployment decision.

Only private owner-managed staff_roles/admin_users rows authorize staff. JWT user
metadata is not an authorization source. Moderators review/merge reports; only
admins stage/publish/roll back CSV versions and read the audit log. Every queue
RPC read and moderation/upload action creates an audit event without report
contents. Raw report SELECT is not granted even to staff. Auth-provider login
logs have separate retention and were not independently inspected.

## Data and abuse boundaries

RLS is enabled on all new tables. Definer functions fix an empty search_path,
revoke public defaults and apply role/schema checks. Typed RPC parameters and
static parameterized queries avoid SQL text interpolation. Uploads require exactly
city/week_ending/cases, known NCR names, Sunday dates, unique keys and bounded
integer counts; drafts/published/rolled-back versions preserve original files.
Publishing a reviewed version does not silently retrain a frozen forecast.

Reports need a short-lived, one-use, server-stored 16-bit SHA-256 proof-of-work
challenge, explicit consent, a valid onset date, fixed symptom vocabulary and a
known source area or city-only choice. Global ceilings serialize challenge and
submission creation without storing IPs. Duplicate fingerprints and local bursts
quarantine reports; they do not prove identity, truth or diagnosis. A distributed
attacker can exhaust global capacity; quarantine/moderation and the closed launch
gate remain necessary. Note scrubbing removes common email/phone patterns,
discards address-like text, and strips tags. React renders remaining text rather
than injecting HTML. PII recognition is not guaranteed.

## Browser, transport and deployment

Builds reject test fixtures, private VITE_* names, sb_secret keys and service-role
JWTs in the browser key slot. Only public Supabase configuration belongs in
VITE_*. Vercel/preview headers include restrictive script CSP, frame denial,
nosniff, no-referrer, restrictive device permissions and HSTS. Inline style is
allowed for React/chart style properties; inline scripts/eval are not allowed.
CSP is configured and tested locally; deployed response headers still need review.

PWA caching allowlists same-origin public GET assets only. It never intercepts
Supabase mutations or staff navigation; no background submission/withdrawal queue.
Staff sessions use no browser persistence. Official JSON exports contain no raw
community records. No cloud migration/write, report activation, production merge
or push occurred as part of these local checks.

## Remaining evidence

See SECURITY_TESTS.md for actual isolated SQL/browser evidence. Docker and a
confirmed deployed URL were unavailable, so no OWASP ZAP result is claimed.
`docs/evidence/zap-status.json` is explicitly a status record, not a scan report.
Run `npm run security:zap -- https://your-deployed-preview.example` once the owner
has a deployment for this revision and Docker. Follow [ZAP's official baseline
instructions](https://www.zaproxy.org/docs/docker/baseline-scan/).
