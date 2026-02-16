# Backend-32 Payments GET Routes And Transaction Sync

## Goal
Implement protected payment read APIs with pagination and DRY query modules, and support transaction status sync for one or many registrations.

## Query Layer (DRY)
Added shared query folder and table-specific query files:
- `backend/lib/queries/common.ts`
- `backend/lib/queries/payments.ts`
- `backend/lib/queries/event-registrations.ts`

This centralizes:
- pagination defaults (`limit=20`)
- UUID validation helpers
- payment row fetch/list mapping
- event registration ID lookups by event and payment status

## Auth Protection
Added unified payment route auth resolver:
- `backend/lib/payments/auth.ts`

Supported auth modes:
1. Supabase bearer token
2. Cron bearer token: `Authorization: Bearer ${CRON_SECRET}`
3. Admin session cookie (`hw_session`)
4. Full bypass when `PAYMENT_ENFORCE_AUTH=false`

## New GET Routes
1. `GET /api/payments`
- paginated list of all payments

2. `GET /api/payments/event/:eventId`
- pulls pending registrations for event
- syncs their latest transaction status via Easebuzz retrieve flow
- returns paginated payments for all registrations in that event

3. `GET /api/payments/user/:userId`
- paginated list of payments for a user (`payments.user_id`)

4. `GET /api/payments/item`
- single payment by either:
  - `registrationId`
  - `transactionId` (aka `easebuzz_txnid`)

## Transaction Route Update
Updated:
- `backend/app/api/payments/easebuzz/transaction/route.ts`

Now accepts:
- single `registrationId`
- or multiple `registrationIds`

Added shared sync service:
- `backend/lib/payments/transaction-status.ts`

For each registration, flow is:
1. resolve mapped `transaction_id`
2. call Easebuzz retrieve API
3. log transaction request in `payment_logs`
4. apply business status update to `payments` + `event_registrations` when valid

## Flow Note
Callback route (`/api/payments/easebuzz/callback`) remains compatible and unchanged in behavior; business update logic is shared and reused.
