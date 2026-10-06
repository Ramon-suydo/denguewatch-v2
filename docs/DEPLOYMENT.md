# Deployment setup

The public app includes historical Manila views, backtest evidence, the offline
Tondo map and review-only legal pages. Set the Vercel Node runtime to 22.x.
The committed snapshot supports the demo without hosted database setup; follow
[database setup](DATABASE_SETUP.md) only when an authorized database change is needed.

## GitHub

The repository is https://github.com/Ramon-suydo/denguewatch-v2. Publish the
reviewed redesign branch without changing production:

```powershell
git switch feat/manila-redesign
git status --short
git push -u origin feat/manila-redesign
```

Collaborators should create their own feature branches from the redesign and open
pull requests back to it. Test locally and review the preview before merging into
main. Do not force-push history or change the frozen defense-v1 tag.

## Vercel

1. Select Add New > Project, connect GitHub, and grant access to this repository.
2. Click Import beside the repository.
3. Set Framework Preset to Vite and Root Directory to ./.
4. Use Build Command npm run build and Output Directory
   dist. Keep the default install command; the lockfile is committed.
5. Add the browser environment variables below, or set VITE_DEMO_MODE=true for
   a forced snapshot preview. Keep submissions closed and deploy the reviewed branch.

The Vercel Git integration handles deployment; no GitHub Actions file is needed.

## Environment variables

Go to Project > Settings > Environment Variables. Set these for Production and
Preview, and Development if using Vercel's local environment workflow:

| Name | Value |
| --- | --- |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_ANON_KEY | Supabase public anon key |
| VITE_SUPABASE_URL | Same URL for the browser client |
| VITE_SUPABASE_ANON_KEY | Same public anon key for the browser client |

Vite exposes only VITE_-prefixed variables to browser code by default. Client
code uses import.meta.env.VITE_SUPABASE_URL and
import.meta.env.VITE_SUPABASE_ANON_KEY; unprefixed names alone will not work.
Never put service-role/secret keys in client variables. Public anon keys require
appropriate Supabase row-level security. Keep local values in ignored .env.local.
Do not commit actual values. Redeploy after changing Vercel variables.
Use a separate Supabase test project for risky Preview database tests; a Vercel
preview does not create a separate database.

## Confirm automatic deployments

1. Settings > Git: confirm the connected GitHub repository.
2. Settings > Environments > Production: set Branch Tracking to main (some
   dashboard versions show Production Branch under Git).
3. Keep automatic Git deployments enabled and Preview tracking non-production
   branches. Avoid ignored-build rules that skip desired deployments.
4. Push a tested main commit. Under Deployments,
   confirm Ready, Production, main, and the matching commit hash. Open the URL.
5. Push a real committed feature change with git push -u origin feat/case-form.
   Confirm Ready, Preview, the feature branch, and its matching commit hash.
6. Copy the preview URL for the panel. Check it in a signed-out/private browser;
   if deployment protection requires login, use Vercel sharing/access controls
   to grant the panel access.

Test locally and self-review before merging risky work: every push or merge to
main triggers a live production deployment.

## References

- [Vercel Git integration](https://vercel.com/docs/git)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel environments](https://vercel.com/docs/deployments/environments)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)

Database migrations and ingestion run manually using DATABASE_SETUP.md;
Vercel builds never receive DIRECT_DATABASE_URL or execute ingestion.
