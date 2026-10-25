# Credential rotation and hosted launch

Status: NEEDS OWNER. A configured password matched public historical text. Matching paths and commit hashes are recorded by `npm run security:secrets`; values and patches are never printed. Removing current text does not revoke a credential. Do not rewrite history. Treat the old password as compromised.

1. In the Supabase project, open Database settings and reset the database password to a unique password from a password manager. Save the new direct/session connection string privately. Do not paste it into chat, an issue, a commit or a terminal command literal. Dashboard reset is NEEDS OWNER.
2. In Settings > API Keys, replace any exposed server secret key. Update consumers, verify them, then revoke the old key. Publishable keys belong in browser configuration; secret keys never do. For legacy JWT-based keys, follow Supabase's signing-key migration/rotation instructions rather than assuming database-password rotation also rotates APIs. See [API keys](https://supabase.com/docs/guides/getting-started/api-keys) and [signing keys](https://supabase.com/docs/guides/auth/signing-keys). API-key rotation is NEEDS OWNER when exposure applies.
3. Edit ignored `.env.local` privately. Set `DIRECT_DATABASE_URL`, `DB_SSL_CA_FILE` if the trusted certificate is required, `SUPABASE_URL`, and either `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`. Set public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the public URL and publishable/anon key only. Set `CREDENTIALS_ROTATED=1` only after completing rotation. The scripts reject the fingerprint of the exposed password before connecting. No private values belong in `.env.example`.
4. In Vercel project Settings > Environment Variables, update the corresponding production and preview variables. Update GitHub Actions repository secrets `SUPABASE_SERVICE_ROLE_KEY` (or use the configured secret-key name consistently) and repository variable `SUPABASE_URL`. Set repository variable `CREDENTIALS_ROTATED=1` only after rotation and successful verification. Never put a server secret in a `VITE_` name. Redeploy the reviewed commit after the release gates pass. Hosting changes/redeployment are NEEDS OWNER.
5. Run these commands with Node 22.12+ from the project, after saving the private environment file:

```powershell
npm run credentials:verify
npm run security:secrets
npm run hosted:bootstrap
npm run db:verify -- --hosted
```

If the first verification reports missing reporting migrations, run `npm run hosted:bootstrap` after rotation, then repeat verification. Bootstrap applies pending migrations transactionally and records applied versions. It does not seed official observations or community reports and does not enable collection by default. Re-running it leaves recorded migrations unchanged. An existing schema with no truthful migration ledger must be reconciled privately before bootstrap; do not mark migrations applied without verifying them.

6. Create the first admin with a private email and a unique password. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` privately in `.env.local`, then run:

```powershell
npm run hosted:admin
```

Remove `BOOTSTRAP_ADMIN_PASSWORD` afterward. The script creates the requested Supabase Auth user if absent, appoints its role idempotently and prints neither email, password nor user records. An existing user's password is not reset. Verify an actual hosted login; this is NEEDS OWNER. Admin creation uses the [server-only Auth admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser).

7. Enable TOTP enrollment and verification in Supabase Authentication MFA settings. In the staff sign-in flow, enroll a TOTP authenticator if none exists, verify its six-digit code, and confirm an AAL2 session before reviewing reports. Keep recovery/access procedures private. See [Supabase TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp). Hosted enrollment/login and MFA enforcement verification are NEEDS OWNER until exercised with the real project.
8. Configure repository variable `DEPLOYED_URL` to the reviewed HTTPS deployment. Enable Actions and manually run the ZAP deployed baseline and Community retention workflows once. Inspect artifacts and run history. A workflow file alone is not evidence of an installed or successful schedule. If pg_cron is available, `db:verify -- --hosted` checks its actual active hourly job. Otherwise `db:verify -- --hosted` verifies the exact active hourly workflow, a successful execution of the current protected-RPC script within 48 hours, and the matching repository API target through the authenticated GitHub CLI. These hosted checks are NEEDS OWNER.
9. Complete a real usability session and school/DPO review of consent, retention, withdrawal, lawful basis and institutional responsibility. Do not invent participants, scores or approval. These are NEEDS OWNER.
10. Only after every release gate and owner step is complete, enable reporting:

```powershell
$env:LAUNCH_GATES_PASSED = '1'
npm run hosted:bootstrap -- --enable-reporting
```

`REPORTING_ENABLED` defaults to on only for that explicit, verified activation. One-line kill switch:

```powershell
npm run reports:off
```

Collection remains closed on missing/unverified policy, network failure or offline mode. The server policy is authoritative; changing browser copy cannot open collection. No real reports were submitted during local development.

Install the local leak-prevention hook once:

```powershell
git config core.hooksPath .githooks
```

The pre-commit hook scans the staged index and validates shipped data. CI scans the current tracked tree and full reachable history, retains known exposure findings and blocks an unattested rotation. Owner attestation is not a substitute for the separate live credential-verification command.

Private guard metadata is kept only in ignored `.artifacts/launch/exposure-fingerprints.json`; no password fingerprint is committed. Configure the matching GitHub Actions secret without printing it:

```powershell
Get-Content .artifacts/launch/exposure-fingerprints.json -Raw | gh secret set EXPOSED_CREDENTIAL_SHA256
```

Keep this local file private and retain it when changing the password. Other developer checkouts need the private `EXPOSED_CREDENTIAL_SHA256` configuration before the leak-prevention gate can pass. This fingerprint is a detection guard, not proof of rotation.
