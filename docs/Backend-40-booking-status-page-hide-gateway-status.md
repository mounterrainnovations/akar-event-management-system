# Backend-40 Booking Status Page Hide Gateway Status

## Goal
Remove raw gateway status output (for example, `resolved_model`) from booking status pages so users only see useful, user-facing information.

## Frontend Changes
- Updated `frontend/src/components/booking/BookingStatusPage.tsx`.
- Removed parsing and rendering of `status` query param as `Gateway Status`.
- Status card now shows:
  - `Registration Id` (if present)
  - `Transaction Id` (if present)
  - `Message` (if present)

## Validation
- TypeScript compile check passed:
  - `frontend`: `./node_modules/.bin/tsc --noEmit`
