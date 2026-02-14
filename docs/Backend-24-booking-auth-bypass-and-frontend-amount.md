# Backend 24 - Booking Auth Bypass and Frontend Amount Trust

## Objective
Apply two booking flow fixes:
1. Add bypass behavior when `PAYMENT_ENFORCE_AUTH=false`:
- token validation can be skipped
- request must explicitly provide a valid `user_id`

2. Remove backend coupon/price computations for booking initiate:
- frontend sends final billing `amount`
- backend should not query coupon/ticket pricing tables for amount calculation

## Changes
### 1. Auth resolution for booking routes
Updated booking auth helper to mirror payment-enforcement behavior.

- If `PAYMENT_ENFORCE_AUTH=true`:
  - Requires valid `Authorization: Bearer <token>`
  - Uses token-derived `userId`

- If `PAYMENT_ENFORCE_AUTH=false`:
  - Token is not required
  - Requires explicit `user_id` in request
  - Validates `user_id` as UUID

Request user id sources:
- `POST /api/bookings`: `body.user_id` (or `body.userId`)
- `GET /api/bookings`: query `user_id` (or `userId`)
- `GET /api/bookings/event/[eventId]`: query `user_id` (or `userId`)
- `GET /api/bookings/[bookingId]`: query `user_id` (or `userId`)
- `DELETE /api/bookings/[bookingId]`: query `user_id` (or `userId`)

### 2. Initiate amount logic
`POST /api/bookings` now trusts frontend amount directly:
- requires `amount` in request body (positive number)
- stores:
  - `total_amount = amount`
  - `discount_amount = 0`
  - `final_amount = amount`
  - `coupon_id = null`

Removed backend coupon/ticket price lookup logic from booking initiation path.

## Files Updated
- `backend/lib/bookings/http.ts`
- `backend/app/api/bookings/route.ts`
- `backend/app/api/bookings/event/[eventId]/route.ts`
- `backend/app/api/bookings/[bookingId]/route.ts`
- `backend/lib/bookings/service.ts`

## Validation
- `npm run lint -- app/api/bookings/route.ts app/api/bookings/[bookingId]/route.ts app/api/bookings/event/[eventId]/route.ts lib/bookings/service.ts lib/bookings/http.ts lib/payments/auth.ts` passed.
