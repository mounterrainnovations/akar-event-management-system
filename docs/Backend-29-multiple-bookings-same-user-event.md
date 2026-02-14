# Backend 29 - Multiple Bookings for Same User and Event

## Objective
Allow multiple bookings from the same account for the same event (movie-booking style) while preserving current DB constraints.

## Root Cause
`event_registrations` has unique constraint:
- `event_ticket_name` on `(event_id, name)`

Booking initiate was storing static `name = eventName`, causing duplicate-key failures for repeat bookings.

## Fix
Updated booking creation to store a unique registration name per insert:
- `name = <eventName-trimmed>-<uuid-suffix>`

This preserves the current schema and allows repeated bookings without constraint violations.

## Redundant Logic Removed
Removed obsolete duplicate-constraint branch that returned:
- `Booking already exists with this event name`

Now booking insert follows normal error handling and supports repeat entries as intended.

## File Updated
- `backend/lib/bookings/service.ts`

## Validation
- `npm run lint -- lib/bookings/service.ts app/api/bookings/route.ts` passed.
