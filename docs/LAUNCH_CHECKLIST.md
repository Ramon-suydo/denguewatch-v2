# Community launch checklist — draft for review

Version launch-v1 · 2026-10-03. Not legal advice. Submissions remain CLOSED.
No report-activation command is authorized by this checklist.

- [ ] Server-side rate limiting and abuse protection on every public RPC path:
  submit, withdraw and aggregate reads. Existing serialized 100/day submission
  ceiling does not protect all paths or prevent fabricated reports/quota denial.
- [ ] Decide retention before opening; owner currently specifies "Not applicable, form closed". Current DB setting is 90 days.
  Verify hourly purge execution and withdrawn/expired records, plus provider
  backup deletion, technical-log retention and processing locations.
- [ ] Review deployed RLS/grants, definer search paths, anonymous/private access,
  code non-enumeration and small-cell disclosure risks.
- [ ] Lawyer/school DPO reviews community-v1 consent, separate optional contact,
  purposes/lawful basis, Privacy/Terms/disclaimer and proposed liability clause.
  Version material text changes before accepting reports; review access/correction,
  lost-code requests, complaint handling, identity checks and incident response.
- [ ] Review the owner-supplied controller: DengueWatch student research team,
  University Perpetual Help College of Manila; contact achilleslang23@gmail.com.
  Confirm institutional accountability and DPO designation; an email is not proof of appointment.
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

Owner metadata supplied on 2026-10-03 (legal-v1.1):
- Controller identity/contact are filled in src/lib/legal.ts. Launch retention is
  "Not applicable, form closed"; a retention decision is required before opening.
- Technical logs: per Vercel/Supabase defaults. Backups: per Supabase defaults.
  These descriptions are not verified durations; confirm deployed plans/settings.
- For each of NCR weekly, derived NCR monthly and Manila daily: date obtained
  and FOI request ID are "Not available", URL is "not public", usage terms
  "Not stated". Original acquisition channel is unverified; no FOI request is
  claimed absent or invented. Weekly/daily issuing offices remain nonspecific.
  Exact citation warning stays visible until provenance/usage terms are confirmed.
