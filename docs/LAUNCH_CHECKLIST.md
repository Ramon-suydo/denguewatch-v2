# Community launch checklist — draft for review

Version launch-v1 · 2026-10-03. Not legal advice. Submissions remain CLOSED.
No report-activation command is authorized by this checklist.

- [ ] Server-side rate limiting and abuse protection on every public RPC path:
  submit, withdraw and aggregate reads. Existing serialized 100/day submission
  ceiling does not protect all paths or prevent fabricated reports/quota denial.
- [ ] Reconfirm final retention [pending]; current DB setting is 90 days.
  Verify hourly purge execution and withdrawn/expired records, plus provider
  backup deletion, technical-log retention and processing locations.
- [ ] Review deployed RLS/grants, definer search paths, anonymous/private access,
  code non-enumeration and small-cell disclosure risks.
- [ ] Lawyer/school DPO reviews community-v1 consent, separate optional contact,
  purposes/lawful basis, Privacy/Terms/disclaimer and proposed liability clause.
  Version material text changes before accepting reports; review access/correction,
  lost-code requests, complaint handling, identity checks and incident response.
- [ ] Fill controller identity and controller/DPO contact [pending]. The previously
  approved research email does not establish the accountable controller/DPO.
- [ ] Verify processor agreements, provider settings/locations, logging/backups,
  and security/privacy assessment. No report fields or codes in logs/URLs/storage.
- [ ] DPO determines NPC registration obligations for the accountable entity.
  Under Circular 2022-04, 250+ employees, sensitive data on 1,000+ individuals or
  processing likely to pose risk to rights/freedoms trigger mandatory registration.
  Being a student prototype is not proof of exemption; review any applicable
  exemption declaration route and ongoing duties with the DPO/NPC.
- [ ] Owner supplies exact source citations/usage terms; notices and affected
  exports use the central metadata. Review deployment/preview before launch.
- [ ] Only after all above, obtain explicit owner authorization for activation;
  verify policy/version and protected paths in production without real patient data.

Primary review references:
[RA 10173](https://privacy.gov.ph/data-privacy-act/),
[NPC data-subject rights](https://privacy.gov.ph/data-subject-rights/),
[NPC registration reminder](https://privacy.gov.ph/reminder-on-mandatory-data-protection-officer-and-data-processing-system-registration/),
[NPC exemption guidance](https://privacy.gov.ph/pips-and-pics/exemption/).

Every remaining placeholder:
- src/lib/legal.ts: controller name; controller/DPO contact; final launch retention;
  technical-log retention; provider backup retention.
- src/lib/source-metadata.ts, for each of NCR weekly, derived NCR monthly and
  Manila daily: title; issuing office; date obtained; FOI request ID; URL; usage terms
  (18 source fields). The visible [exact citation pending] label clears when filled.
