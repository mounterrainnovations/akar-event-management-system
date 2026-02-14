# Backend 18 - Transaction Status Endpoint by Registration

## Objective
Add an endpoint that accepts `registrationId`, resolves payment transaction details from DB, and runs Easebuzz transaction retrieve flow.

## Endpoint Added
- `POST /api/payments/easebuzz/transaction`

## Request Body
- `registrationId` (required)

## Resolution Flow
1. Read `event_registrations` by `registrationId`.
2. Read `transaction_id` from registration.
3. Use `transaction_id` to find `payments` row via `payments.easebuzz_txnid`.
4. Fetch required fields from payments:
   - `easebuzz_txnid` (transaction id)
   - `hash`
5. Call Easebuzz retrieve API with `key`, `txnid`, `hash`.

## Business Flow
- Parses retrieve response as callback-shaped payload.
- Verifies callback hash authenticity.
- Resolves status flow (`success`, `failure`, `pending`, or `unknown`).
- Applies payment/registration status update when flow is not `unknown`.
- Logs request/response in payment logs.

## Files Updated
- `backend/app/api/payments/easebuzz/transaction/route.ts` (new)
- `backend/lib/payments/service.ts`
- `backend/lib/payments/easebuzz/service.ts`

## Validation
- `npx tsc --noEmit` passed.
