# Deployment setup

The Vite scaffold is now buildable and intentionally renders no UI. Follow
[database setup](docs/DATABASE_SETUP.md) to load and verify published data before
building screens. Set the Vercel Node runtime to 22.x.

## GitHub

Replace YOUR-OWNER and YOUR-REPO with your empty GitHub repository's details:

```powershell
Set-Location 'D:\Project\denguewatch-v2'
git remote add origin https://github.com/YOUR-OWNER/YOUR-REPO.git
git remote -v
git push -u origin main
```

Authenticate if prompted. Do not force-push over remote history.
For subsequent commits on main: git push origin main.

## Vercel

1. Select Add New > Project, connect GitHub, and grant access to this repository.
2. Click Import beside the repository.
3. Set Framework Preset to Vite and Root Directory to ./.
4. For the planned npm app, use Build Command npm run build and Output Directory
   dist. Keep the default install command; the lockfile is committed.
5. Add environment variables below in the import form, then Deploy. This milestone
   builds a blank application shell; there are no application screens yet.

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

Vite exposes only VITE_-prefixed variables to browser code by default. Future
client code must use import.meta.env.VITE_SUPABASE_URL and
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

Database migrations and ingestion run manually using docs/DATABASE_SETUP.md;
Vercel builds never receive DIRECT_DATABASE_URL or execute ingestion.
