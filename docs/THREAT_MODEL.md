# Threat model

Assets: raw health reports, bearer withdrawal codes, staff sessions/roles, official
source integrity, model/evaluation evidence, upload versions and service capacity.
Trust boundaries: public browser → Supabase RPC/RLS; staff browser → verified Auth
identity → private role table; immutable local sources → processed artifacts →
static public APIs. Hosting/auth logs are a separate provider boundary.

| Threat / actor | Control implemented | Evidence / residual risk |
| --- | --- | --- |
| Anonymous raw-report enumeration | No raw SELECT grant; RLS; aggregates only; no code lookup | Full-migration PGlite role tests. Provider/service-role operators remain privileged |
| User sets admin metadata | Private role allow-list; role checks in every privileged RPC; no public signup UI | Viewer/anon denial tests; hosted JWT/Auth integration not independently exercised |
| Tracking-code guessing | UUIDv4 bearer entropy, SHA-256 at rest, generic withdrawal response, no retrieval | Code/replay/withdraw tests; lost codes cannot be recovered; not a constant-time proof |
| Automated fake reports | Closed default, one-use expiring PoW, honeypot, schema limits, global quotas, duplicate/burst quarantine, moderation | Isolated tests; no identity or truth guarantee; distributed capacity exhaustion remains possible |
| Low-count or timing inference | >=3 approved per area/week, >=72h delay, suppressed/merged/withdrawn hidden | Local SQL tests; residual reidentification/differencing requires DPO review |
| XSS / free-text PII | Bounded sanitized notes, address-pattern discard, JSX text rendering, script CSP | Pattern tests and browser preview; names/unusual addresses can evade detection |
| SQL injection / malicious CSV | Typed RPC args, JSON schema, known city names/dates/counts, unique keys, transaction rollback | Invalid/SQL-like input tests; source authenticity still requires human review |
| Unauthorized model changes | Uploaded versions separate from frozen artifacts; reviewed rebuild required | Upload publish/rollback does not alter historical_surveillance; CI checks |
| Leakage / overstated weather skill | Expanding-origin fit/scaling/splits, lag availability, matured residuals, two scenarios, all negative results retained | Leakage tests and full per-origin artifacts; reanalysis vintage and source semantics still unconfirmed |
| Stale-data harm | Current risk explicitly unavailable; source dates everywhere; permanent NCR banner; no automated medical alert | Browser/source artifact checks; user misunderstanding remains a usability question |
| Offline replay or cached private data | Public GET cache allowlist; no mutation queue; staff navigation excluded; no auth persistence | Production offline/cache tests; public data may stay cached until service-worker update |
| Credential disclosure | Ignored env/certs; build guards; history scanner; no service-role client key | Local DB password matches public identifier: ROTATION REQUIRED; scan is heuristic |
| Insider misuse | Moderation/upload action audit, least privilege, hashed codes, bounded queue, retention | Audit tests; owner role appointment and audit review are operational controls |

Release conditions: rotate exposed/weak DB password, obtain DPO/health-owner
review, review/apply the two pending migrations in an authorized environment,
verify hosted roles/Auth/retention/headers, run deployed ZAP, and rehearse recovery.
No current-data or medically validated alert claim is authorized by this model.
