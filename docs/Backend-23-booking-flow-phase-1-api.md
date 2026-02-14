# Backend 23 - Booking Flow Phase 1 API

## Objective
Implement non-payment booking flow APIs aligned to updated `AI.md` schema and flow:
- `event_registrations` with `tickets_bought`, `name`, `deleted_at`, `transaction_id`
- Auth-protected user booking flows
- DRY query centralization

## Implemented Endpoints
1. `POST /api/bookings`
- Initiates booking for authenticated user.
- Creates row in `event_registrations` with:
  - `event_id`, `user_id`, `coupon_id`
  - `total_amount`, `discount_amount`, `final_amount`
  - `payment_status='pending'`
  - `name` from `eventName`
  - `tickets_bought` from payload map
  - `form_response` (optional, defaults `{}`)
  - `is_verified=false` when event has `verification_required=true`, else `null`
- Logs incoming initiate payload body via `console.log` as requested.

2. `GET /api/bookings`
- Lists authenticated user bookings.
- Pagination supported via query params `page` and `limit`.
- Limit hard-capped to `20`.

3. `GET /api/bookings/event/[eventId]`
- Lists authenticated user bookings for a specific event.
- Pagination supported via query params `page` and `limit`.
- Limit hard-capped to `20`.

4. `GET /api/bookings/[bookingId]`
- Returns one booking by id for authenticated user.

5. `DELETE /api/bookings/[bookingId]`
- Cancels booking by soft delete (`deleted_at = now()`, `updated_at = now()`).

## Auth
Added strict Supabase bearer token validation for booking routes:
- No payment env toggle dependency.
- Requires `Authorization: Bearer <supabase_access_token>`.
- Extracts and uses `userId` from validated token.

## Pricing Logic
- `tickets_bought` is validated as `{ ticketId: quantity }` with UUID keys and positive integer quantities.
- Ticket subtotal is computed from `event_tickets.price * quantity`.
- Coupon is optional and validated for:
  - same `event_id`
  - `is_active=true`
  - `deleted_at is null`
  - validity window (`valid_from` / `valid_until`)
- Discount is flat and capped: `discount_amount = min(subtotal, coupon_value)`.
- `final_amount = max(0, subtotal - discount_amount)`.

## DRY Structure
- `backend/lib/bookings/queries.ts`: centralized select/query constants + page limit
- `backend/lib/bookings/service.ts`: all booking business logic
- `backend/lib/bookings/http.ts`: shared auth + JSON parse helpers
- `backend/lib/auth/supabase-token.ts`: shared strict Supabase token validator

## Files Added
- `backend/lib/auth/supabase-token.ts`
- `backend/lib/bookings/queries.ts`
- `backend/lib/bookings/service.ts`
- `backend/lib/bookings/http.ts`
- `backend/app/api/bookings/route.ts`
- `backend/app/api/bookings/event/[eventId]/route.ts`
- `backend/app/api/bookings/[bookingId]/route.ts`

## Validation
- `npm run lint -- app/api/bookings/route.ts app/api/bookings/[bookingId]/route.ts app/api/bookings/event/[eventId]/route.ts lib/bookings/service.ts lib/bookings/http.ts lib/bookings/queries.ts lib/auth/supabase-token.ts` passed.

## Note
`AI.md` text for cancel flow says "mark deleted_at null". Implementation uses soft delete timestamp (`deleted_at=now`) because active rows are represented by `deleted_at=null`.
