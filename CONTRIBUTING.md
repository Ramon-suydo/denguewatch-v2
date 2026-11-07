# Contributing

main is always deployable; every push is treated as a live Vercel release.
Small, low-risk commits directly to main are fine for the deadline.
Use feat/<short-name> for risky work (feat/case-form, feat/risk-forecast).
Schema and auth changes require a branch and quick self-review before merging.
Review the diff, test locally, run the build and relevant checks, and smoke-test
 the demo before merging. Check the Vercel preview when available.

## Commits

Use short, present-tense subjects prefixed by area:

- schema: add barangay_risk table
- ui: match Iacademy nav styling
- fix: case form validation

After each numbered build prompt (schema, design system, core pages, cleanup),
the assistant reviews and commits its task changes itself, reports validation
and the commit hash, and gives the exact push command for the current branch.
Leave no completed task work uncommitted between sessions. Never commit secrets
or unrelated user changes. Report any commit blocker explicitly.
The user runs the push unless they explicitly ask otherwise.

## Feature workflow

```powershell
git switch main
git pull --ff-only origin main
git switch -c feat/case-form
# Make changes, test, self-review, and commit.
git push -u origin feat/case-form
```

Open a GitHub PR targeting main, review the diff and preview, and merge after
local checks pass. The merge deploys production. Small main commits use
 git push origin main. See [deployment setup](docs/DEPLOYMENT.md).

## Current thesis collaboration

The current NCR ML/map task is on `feat/ml-map-ux`, created from main de0d22c. Review its local checks and preview before merging to main; merging deploys production. For additional risky work, create a separate feat/<short-name> branch.

```powershell
git fetch origin
git switch feat/ml-map-ux
git switch -c feat/your-change
```

Run npm test, npm run build, npm run test:contrast, and the relevant browser checks.
Read docs/HANDOFF.md and the current task files before editing. Preserve the data
rules in docs/DATA_QUALITY.md, the closed submissions gate, source disclosures and
the defense-v1 fallback tag. New raw datasets stay local until reviewed; no hosted
Supabase writes without the owner's explicit authorization.
