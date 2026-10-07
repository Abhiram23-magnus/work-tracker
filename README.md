# Worker Tracker

Offline-first notebook for farmers: workers, daily work, advances, wage payments and balances.
Built for Android phones, works without internet after the first visit.

## Commands

- `npm run dev` starts the app
- `npm test` runs the unit tests
- `npm run build` type-checks and builds to `dist/` (any static host works)
- `npm run lint` runs oxlint

## How it fits together

```
pages → components / hooks → domain (calculations, validation, history) → services → storageService → localStorage
```

- Money is stored as integer paise. `utils/currency.ts` converts and formats.
- Only `services/storageService.ts` touches browser storage, so it can be swapped for IndexedDB or a synced backend later.
- Work records keep the daily wage they were saved with, so wage changes never rewrite history.
- Balance = earnings − (advances + wage payments). Above 0 is Pending to Pay, 0 is Cleared, below 0 is Advance to Recover.

## Login and cloud sync (switched off)

The live app has **no login**: it opens straight to the dashboard and keeps all data on the phone.

Email login and cloud sync (Supabase) are still in the code but only switch on when the build has
Supabase keys. To turn them back on, create `.env.production` with:

```
VITE_SUPABASE_URL=https://gzvsjkbpuguttmsodoiy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_yjMK8lx8oHVzu1Ju34C0Zw_BU3GXo5v
```

With keys, everyone signs in with email and password, data syncs between phones, and the `tracker_items`
table's row-level security (`supabase/migrations/0001_tracker_items.sql`) keeps each account's rows private.
Data saved without login moves to the first account that signs in on that phone.

## Dashboard and export

- The dashboard shows today's totals, the last 6 months of earnings vs wages paid, and who is owed the most.
- **Export Excel** downloads one `.xlsx` with Workers (balances), Work and Money sheets.
- **Export PDF** downloads a summary of every worker's account; each worker's page has a **Statement (PDF)** with a running balance.
