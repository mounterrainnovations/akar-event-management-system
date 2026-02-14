# Backend 19 - Retrieve Hash Derived (No DB Hash)

## Objective
Remove all DB persistence/lookup usage of payment `hash` and switch retrieve flow to derive hash using:
- `key|txnid|salt`

## Changes

### 1. Removed payment hash persistence and lookup
- `createPendingPayment(...)` no longer inserts `hash` into `payments`.
- `getRegistrationTransactionLookup(...)` no longer fetches `payments.hash`.
- Lookup now uses `event_registrations.transaction_id` directly.

### 2. Retrieve API hash generation updated
In `backend/lib/payments/easebuzz/service.ts`:
- `retrieveEasebuzzTransaction(...)` now computes request hash internally as:
  - `sha512(key|txnid|salt)`
- Request payload sent to Easebuzz retrieve API uses derived `key`, `txnid`, `hash`.
- Function now returns `requestPayload` for consistent logging.

### 3. Callers updated
- `backend/app/api/payments/easebuzz/callback/route.ts`
- `backend/app/api/payments/easebuzz/transaction/route.ts`

Both now call retrieve with only `txnid`, and log `retrieveResult.requestPayload`.

### 4. AI schema alignment
`AI.md` payments schema updated by removing:
- `hash text null`

## Validation
- `npx tsc --noEmit` passed.
