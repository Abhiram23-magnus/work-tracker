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
