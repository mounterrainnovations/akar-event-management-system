# Backend 17 - Initiate-Time Registration Transaction Link and Payment Hash Persist

## Objective
At payment initiate time:
1. Persist `hash` into `payments` first insert row.
2. Link `event_registrations.transaction_id` immediately to the current transaction id.

## Changes
Updated initiate flow to pass payload hash into pending payment creation.

### Files Updated
- `backend/app/api/payments/easebuzz/initiate/route.ts`
- `backend/lib/payments/service.ts`
- `AI.md`

## Service Update Details
In `createPendingPayment(...)`:
- Added new input field: `hash`.
- Insert now writes `payments.hash`.
- After payment insert, updates `event_registrations.transaction_id = easebuzzTxnId` using `registration_id`.

This ensures registration is transaction-linked as soon as initiate starts.

## AI Schema Update
Updated `payments` schema in `AI.md` to include:
- `hash text null`

## Validation
- `npx tsc --noEmit` passed.
