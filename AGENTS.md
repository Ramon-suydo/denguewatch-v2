# Project workflow

Read CONTRIBUTING.md before making changes.

- Treat every push to main as an automatic live Vercel deployment.
- Use feat/<short-name> for risky changes, especially schema and auth.
- Remind the user to test locally and self-review before merging risky work
  near the defense. Small, low-risk commits directly to main are allowed.
- After each numbered build prompt (schema, design system, core pages, cleanup),
  review and commit task changes using a short, present-tense area: action subject.
- Report checks, commit hash, and the exact git push command for the current branch.
  The user pushes unless they explicitly ask otherwise.
- Leave no completed task work uncommitted. Never commit secrets or unrelated
  user edits. Report commit blockers honestly.
