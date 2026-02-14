# Backend 14 - Easebuzz Callback Business Logic Flows

## 1. Objective
Implement `AI.md` Callback Flow Help business logic with clean, DRY backend flow:
- Three callback status flows: success, failure, pending/recheck.
- Update both `payments` and `event_registrations` using `udf` mapping.
- Retry/recheck pending statuses using Easebuzz retrieve API every second for 5 seconds.
- Remove legacy `/callback/success` and `/callback/failure` route paths.

## 2. UDF Mapping Applied
From callback body:
- `udf1` -> `registrationId`
- `udf2` -> `eventId`
- `udf3` -> `userId`
- `udf4` -> `transactionId`

## 3. Status Flow Grouping
Implemented in `backend/lib/payments/easebuzz/service.ts`:
- Success flow: `success`
- Failure flow: `failure`, `dropped`, `userCancelled`, `bounced`
- Pending flow (retry/recheck): `pending`, `initiated`, `initated`

## 4. Callback Validation and Capture
Updated `backend/app/api/payments/easebuzz/callback/route.ts` to:
- Parse callback body from JSON or URL-encoded payload.
- Persist complete callback body to `payment_logs` in all scenarios.
- Enforce presence checks for required keys `udf1..udf10`.
- Verify callback hash authenticity before business updates.

## 5. Business Updates (`payments` + `event_registrations`)
Added `applyCallbackBusinessStatus(...)` in `backend/lib/payments/service.ts`.

Behavior:
- Maps flow to DB payment status:
  - success -> `paid`
  - failure -> `failed`
  - pending -> `pending`
- Updates `payments` row by resolving from `udf4` (id) and fallback to `txnid` (`easebuzz_txnid`).
- Updates `event_registrations.payment_status` using `udf1` and scoped checks with `udf2`, `udf3` when present.

## 6. Pending Retry/Recheck Flow
Added retrieve client in `backend/lib/payments/easebuzz/service.ts`:
- `retrieveEasebuzzTransaction({ key, txnid, hash })`
- Endpoint default: `https://testdashboard.easebuzz.in/transaction/v2.1/retrieve`
- Configurable via `EASEBUZZ_RETRIEVE_URL`

Route behavior for pending flow:
- Retry up to 5 attempts
- Interval: 1 second between attempts
- Re-evaluates returned status and hash each attempt
- If status transitions to success/failure, applies final flow immediately
- If still pending after retries, keeps pending updates

## 7. Route Cleanup
Removed legacy alias routes:
- `backend/app/api/payments/easebuzz/callback/success/route.ts`
- `backend/app/api/payments/easebuzz/callback/failure/route.ts`

Callback endpoint remains:
- `POST /api/payments/easebuzz/callback`

## 8. Validation
- TypeScript compile passed after implementation:
  - `npx tsc --noEmit`
