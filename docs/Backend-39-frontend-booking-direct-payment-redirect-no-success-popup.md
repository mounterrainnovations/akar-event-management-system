# Backend-39 Frontend Booking Direct Payment Redirect No Success Popup

## Goal
Remove the intermediate booking success popup in the frontend registration modal and move users directly to payment after booking initiation.

## AI.md Sync Confirmed
- Frontend change is connected to existing backend booking initiate flow (`POST /api/bookings`).
- No duplicate payment initiation path was introduced.

## Frontend Changes
### 1) Direct redirect after booking initiation
- Updated `frontend/src/components/RegistrationModal.tsx` submit success handling.
- After booking API success, when `bookingMode` is payment and a `paymentUrl` exists, the modal now immediately redirects with `window.location.assign(paymentUrl)`.
- Existing session marker (`booking:lastEventId`) is still set before redirect.

### 2) No success popup for booking or waitlist
- Removed state transitions that previously switched the modal into a success screen with registration ID and `Pay Now`.
- For waitlist mode (and any non-redirect success path), modal now closes immediately after successful booking creation.

## Validation
- TypeScript compile check passed:
  - `frontend`: `./node_modules/.bin/tsc --noEmit`
- `npm run lint` in this repo currently fails due existing lint script/project config issue (`next lint` resolving to non-existent `frontend/lint` directory), unrelated to this change.
