# Backend 25 - Event Registrations Schema Sync

## Objective
Align backend code with updated `AI.md` `event_registrations` schema where:
- removed: `ticket_id`, `quantity`, `discount_amount`
- retained/new usage: `tickets_bought`, `name`, `transaction_id`, `updated_at`, `deleted_at`

## Root Cause Fixed
`GET /api/bookings` failed with:
- `column event_registrations.discount_amount does not exist`

because booking select fields still referenced removed column `discount_amount`.

## Changes
### 1. Booking flow schema sync
- Removed `discount_amount` from booking selects.
- Updated booking row mapping to derive discount as `max(total_amount - final_amount, 0)`.
- Kept initiate behavior using frontend `amount` and storing:
  - `total_amount = amount`
  - `final_amount = amount`
  - `coupon_id = null`

### 2. Events service registration schema sync
Updated `backend/lib/events/service.ts` registration models/selects/mappers to current schema:
- `REGISTRATION_SELECT_FIELDS` updated
- `RegistrationRow`, `EventRegistration`, and admin registration mapping updated
- `totalQuantity` analytics now computed from `tickets_bought` summed values
- `listAllRegistrations()` no longer selects/joins `ticket_id`-based fields
- `discountAmount` derived from `total_amount - final_amount`

### 3. Admin schema description text sync
Updated stale text in:
- `backend/components/admin/EventsSectionManager.tsx`

## Files Updated
- `backend/lib/bookings/queries.ts`
- `backend/lib/bookings/service.ts`
- `backend/lib/events/service.ts`
- `backend/components/admin/EventsSectionManager.tsx`

## Validation
- `npm run lint -- lib/bookings/service.ts lib/bookings/queries.ts lib/bookings/http.ts app/api/bookings/route.ts app/api/bookings/[bookingId]/route.ts app/api/bookings/event/[eventId]/route.ts lib/events/service.ts` passed.

## Result
`GET /api/bookings?user_id=<uuid>` now reads only valid columns for the updated schema.
