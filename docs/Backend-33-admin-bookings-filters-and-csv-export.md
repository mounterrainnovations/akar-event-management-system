# Backend 33 - Admin Bookings Filters and CSV Export

## Objective
Make admin bookings filtering usable and add CSV export for the post-filtered registration list.

## Changes
- Activated the filter icon with a filters popover.
- Added filters for:
  - event
  - payment status
  - tier
  - date range (`from` / `to`, inclusive)
- Added `Clear all` for active filters.
- Added `Download CSV` action that exports exactly the currently filtered bookings.
- CSV includes:
  - registration id
  - customer name and email
  - event
  - tier
  - quantity
  - final amount
  - payment status
  - created_at
  - form_response (JSON string)

## File Updated
- `backend/components/admin/BookingsSectionManager.tsx`

## Validation
- Ran:
  - `cd backend && npx eslint components/admin/BookingsSectionManager.tsx`
- Result: no lint errors.
