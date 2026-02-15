# Backend 32 - Admin Bookings Form Response Viewer

## Objective
Show each registration's `event_registrations.form_response` in the admin Bookings table without expanding row height or breaking table layout for large JSON payloads.

## Changes
- Added a new `Form Response` column in the admin bookings table.
- Added a compact `View (n)` action per row that opens a popover.
- Rendered responses in a fixed-height scrollable container with readable labels and safe formatting for:
  - strings, numbers, booleans
  - arrays
  - nested objects (pretty JSON)
- Added URL-aware rendering:
  - image links (`png`, `jpg`, `jpeg`, `webp`, `gif`, `svg`, `avif`, `bmp`, `ico`, `data:image/...`) now show inline preview + open-image link
  - non-image links render as clickable URLs
- Kept table rows compact and unchanged in structure for all other columns.
- Replaced `any`-based ticket quantity rendering with typed helper logic to keep lint clean.

## File Updated
- `backend/components/admin/BookingsSectionManager.tsx`

## Validation
- Ran:
  - `cd backend && npx eslint components/admin/BookingsSectionManager.tsx`
- Result: no lint errors.
