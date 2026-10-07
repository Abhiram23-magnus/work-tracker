# Tests

| What | Where | Backend | Run |
|---|---|---|---|
| Unit tests (money maths, sync merge, email helpers…) | `src/tests/*.test.ts` | none | `npm test` |
| The real build: opens on the dashboard with no login, saves on the phone, offline | `tests/e2e/local.e2e.ts` | none | `npm run test:e2e` |
| Email sign-in, sign-up, confirmation and errors | `tests/e2e/login.e2e.ts` | fake Supabase | `npm run test:e2e` |
| Multi-user isolation, multi-device sync, offline, logout | `tests/e2e/sync.e2e.ts` | fake Supabase | `npm run test:e2e` |
| Real email sign-in + real RLS through the REST API | `tests/e2e/live.e2e.ts` | **real** Supabase | see below |
| Real RLS policies (SELECT / INSERT / UPDATE / DELETE) | `tests/rls/tracker_items_rls.sql` | **real** database | Supabase SQL editor |

## E2E tests (Playwright)

The live app has login switched off (no Supabase keys). `npm run test:e2e` builds it twice: the real build on
port 4181 for `local.e2e.ts`, and a build with dummy keys on port 4180 so the (switched-off) login and sync code
stays tested. It drives both in Chromium at phone size.
Each browser context acts as a separate phone. The fake Supabase in `tests/e2e/fake-supabase.ts` answers
the same auth and `tracker_items` requests as the real project and applies the same rule as the RLS
policies (`user_id = auth.uid()`), so these tests need no network access and send no email.

To check a deployed site:

```sh
E2E_BASE_URL=https://worker-tracker-farm.netlify.app/ npx playwright test local
```

## Live test (real Supabase, real sign-in)

Only useful when login is switched back on (see the main README). `live.e2e.ts` is skipped unless four variables are set. It signs two users in through the real login
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
Netlify site, then check that https://worker-tracker-farm.netlify.app/ serves this build and opens on the dashboard
without login.

Repository secrets (Settings → Secrets and variables → Actions):

| Secret | Needed for |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Deploying (Netlify → User settings → Applications → Personal access tokens). Without it the deploy and production jobs are skipped. |
