# Tests

| What | Where | Backend | Run |
|---|---|---|---|
| Unit tests (money maths, sync merge, email helpers…) | `src/tests/*.test.ts` | none | `npm test` |
| Email sign-in, sign-up, confirmation and errors | `tests/e2e/login.e2e.ts` | fake Supabase | `npm run test:e2e` |
| Multi-user isolation, multi-device sync, offline, logout | `tests/e2e/sync.e2e.ts` | fake Supabase | `npm run test:e2e` |
| Real email sign-in + real RLS through the REST API | `tests/e2e/live.e2e.ts` | **real** Supabase | see below |
| Real RLS policies (SELECT / INSERT / UPDATE / DELETE) | `tests/rls/tracker_items_rls.sql` | **real** database | Supabase SQL editor |

## E2E tests (Playwright)

`npm run test:e2e` builds the app, serves it on port 4180 and drives it in Chromium at phone size.
Each browser context acts as a separate phone. The fake Supabase in `tests/e2e/fake-supabase.ts` answers
the same auth and `tracker_items` requests as the real project and applies the same rule as the RLS
policies (`user_id = auth.uid()`), so these tests need no network access and send no email.

To run the suite against a deployed site instead of a local build:

```sh
E2E_BASE_URL=https://worker-tracker-farm.netlify.app/ npm run test:e2e
```

## Live test (real Supabase, real sign-in)

`live.e2e.ts` is skipped unless four variables are set. It signs two users in through the real login
screen, checks that a wrong password is rejected, then uses each user's real access token against the
Supabase REST API to check SELECT, INSERT, UPDATE and DELETE isolation. It deletes the row it created.

1. In Supabase: Authentication → Users → Add user → Create new user, twice, with "Auto Confirm User" ticked.
2. Run:

```sh
LIVE_EMAIL_A=a@example.com LIVE_PASSWORD_A=... \
LIVE_EMAIL_B=b@example.com LIVE_PASSWORD_B=... \
E2E_BASE_URL=https://abhiram23-magnus.github.io/work-tracker/ npx playwright test live
```

## RLS SQL test

Paste `tests/rls/tracker_items_rls.sql` into the Supabase SQL editor and run it. It creates two users, acts as
each one through the `authenticated` role, prints a PASS line per check, raises an error on the first failure,
and rolls everything back.

## CI: GitHub Actions → Netlify

`.github/workflows/netlify.yml` runs on every push to `claude/lucid-pasteur-m25bfh` or `main` (or manually from the
Actions tab). GitHub's servers run the unit and E2E tests, deploy the tested `dist/` to the `worker-tracker-farm`
Netlify site, then run the E2E suite against https://worker-tracker-farm.netlify.app/ and report whether the
Supabase Email provider is switched on.

Repository secrets (Settings → Secrets and variables → Actions):

| Secret | Needed for |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Deploying (Netlify → User settings → Applications → Personal access tokens). Without it the deploy and production jobs are skipped. |
| `LIVE_EMAIL_A`, `LIVE_PASSWORD_A`, `LIVE_EMAIL_B`, `LIVE_PASSWORD_B` | The live sign-in + RLS test against the real Supabase project (two confirmed test accounts). Without them that one test is skipped. |
