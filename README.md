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

## Accounts and sync (Supabase)

Without Supabase keys the app runs exactly as before: one person, data only on this phone, no login.
With keys, everyone signs in with their mobile number and a code sent by SMS (Supabase phone OTP),
and their data stays private to their account. The first sign-in with a number creates the account.

Phone sign-in needs the Phone provider switched on in Supabase (Authentication → Sign In / Providers → Phone)
with an SMS provider such as Twilio, MessageBird, Vonage or Textlocal. For testing without sending real SMS,
add test numbers with fixed codes under the same Phone settings.

1. Create a Supabase project and run `supabase/migrations/0001_tracker_items.sql` in its SQL editor.
   It creates one table, `tracker_items`, with row-level security so a user can only read and write their own rows.
2. The project `worker-tracker` (ap-south-1) is already set up and its public keys are in `.env.production`,
   so production builds (including Netlify) use it. For `npm run dev`, copy them to `.env.local`.
   To use another project, change those two values.
3. Rebuild. The first person to sign in on a phone that already has data gets that data moved into their account.

The phone keeps working offline. Changes save locally first and upload when the connection returns;
other phones pick them up on their next sync (on open, on reconnect, and after each change).
If the same record is edited on two phones, the later edit wins.

## Dashboard and export

- The dashboard shows today's totals, the last 6 months of earnings vs wages paid, and who is owed the most.
- **Export Excel** downloads one `.xlsx` with Workers (balances), Work and Money sheets.
- **Export PDF** downloads a summary of every worker's account; each worker's page has a **Statement (PDF)** with a running balance.
