# Backend 28 - Booking Initiate and Payment Flow Integration

## Objective
Integrate booking initiate with existing payment initiate flow in a DRY, production-friendly way.

## What Changed

### 1. Shared payment initiation orchestration
Added reusable payment flow orchestrator in:
- `backend/lib/payments/service.ts`
- function: `initiatePaymentFlow(...)`

This now owns:
- Easebuzz payload build
- pending payment row creation
- registration `transaction_id` linking
- gateway initiate API call
- payment log insert
- failure marking (`payments.status=failed`) on initiate failures

### 2. Payments route refactor (DRY)
Refactored:
- `POST /api/payments/easebuzz/initiate`
- file: `backend/app/api/payments/easebuzz/initiate/route.ts`

to use shared `initiatePaymentFlow(...)` instead of duplicating core logic.

### 3. Booking initiate now triggers payment initiate
Updated:
- `POST /api/bookings`
- file: `backend/app/api/bookings/route.ts`

Flow now:
1. Validate booking auth (same env-driven behavior)
2. Create booking row in `event_registrations`
3. Immediately call shared `initiatePaymentFlow(...)`
4. Return booking + payment details

Success response now includes:
- `booking`
- `pricing`
- `payment.paymentUrl`
- `payment.transactionId`

Graceful failure behavior:
- If booking is created but payment initiation fails, route returns:
  - `error: "Booking created but payment initiation failed"`
  - `details`
  - `booking`
  - `pricing`
  - `transactionId`
  - `gateway`

### 4. Cleanup
- Removed unused file: `backend/lib/auth/supabase-token.ts`
- Removed unused booking query constants in `backend/lib/bookings/queries.ts`

## Security / Auth Note
Auth behavior remains env-driven and consistent:
- `PAYMENT_ENFORCE_AUTH=true`: bearer token required and user resolved from Supabase token.
- `PAYMENT_ENFORCE_AUTH=false`: fallback explicit `user_id` is accepted where applicable.

The integrated booking->payment flow uses resolved user id and preserves payment auth enforcement semantics.

## Validation
- `npm run lint -- app/api/bookings/route.ts app/api/payments/easebuzz/initiate/route.ts lib/payments/service.ts lib/bookings/queries.ts` passed.
