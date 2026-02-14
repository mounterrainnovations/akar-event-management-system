# Backend 12 - Easebuzz Common Callback and Initiate DB Seed

## 1. Objective
Refactor Phase-3 payment wiring to:
- Use a single common callback route for `surl`, `furl`, and future webhook.
- Build initiate hash using required `udf1..udf10` sequence.
- Insert pending payment row at txn generation time before Easebuzz API call.

## 2. Route Changes

### A. Initiate route (retained)
- `POST /api/payments/easebuzz/initiate`

### B. Callback route refactor
- Added:
  - `POST /api/payments/easebuzz/callback`
- Compatibility aliases retained (forward to common callback):
  - `POST /api/payments/easebuzz/callback/success`
  - `POST /api/payments/easebuzz/callback/failure`

Current callback behavior for this step:
- Parse incoming payload (`json` or `form-data`).
- `console.log` incoming body.
- Do not branch success/failure yet.

## 3. Initiate Payload and Hash
Updated in `backend/lib/payments/easebuzz/service.ts`:
- Generate `txnid` (`uuid`) per request.
- Build hash string using format:
  - `key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt`
- Compute SHA-512 hash and attach to payload.

## 4. Callback URL Strategy
- Build one dynamic callback URL: `/api/payments/easebuzz/callback`
- Set same URL as both:
  - `surl`
  - `furl`

## 5. DB Insert on Initiate
Updated `backend/lib/payments/service.ts` and initiate route to insert payment before Easebuzz call:
- Table: `payments`
- Fields populated:
  - `registration_id`
  - `user_id`
  - `easebuzz_txnid`
  - `amount`
  - `status = pending`
  - `initiated_at`

Also logs initiate request/response to `payment_logs`.

## 6. Auth note
- Supabase token validation remains implemented.
- If auth enforcement is disabled (`PAYMENT_ENFORCE_AUTH=false`), `userId` must be provided in initiate payload.
