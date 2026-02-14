# Backend 30 - Frontend Book Now Authenticated Booking Initiate

## Objective
Wire frontend Book Now flow to booking initiate endpoint with bearer-token security and correct payload shape.

## Frontend Changes

### 1. Enforce auth before booking
Updated event detail CTA flow in:
- `frontend/src/app/event/[id]/page.tsx`

Behavior:
- If user is not authenticated and clicks **Book Now**:
  - opens auth modal
  - shows info toast
  - does not open registration flow

### 2. Enforce auth at submit too
Updated modal submit in:
- `frontend/src/components/RegistrationModal.tsx`

Behavior:
- If user is not authenticated at submit time:
  - opens auth modal
  - blocks booking call

### 3. Correct booking initiate payload + bearer token
Replaced old per-ticket `/api/registrations` loop with single call to:
- `POST {backendUrl}/api/bookings`

Headers:
- `Authorization: Bearer <supabase_access_token>`
- `Content-Type: application/json`

Payload now matches backend booking initiate contract:
- `user_id`
- `eventId`
- `firstName`
- `email`
- `phone`
- `eventName`
- `amount` (normalized to 2 decimals)
- `tickets_bought`
- `coupon_id` (optional)
- `form_response` (optional object)

### 4. Post-initiate payment handoff
On successful booking initiate response:
- stores `booking.id` as `registrationId`
- stores `payment.paymentUrl`
- **Pay Now** button redirects to payment URL

## DRY / Cleanup
- Removed redundant per-ticket registration API loop.
- Added local payload builder helper in modal.
- Simplified flow to one booking+payment initiation call.

## Notes
Project lint scripts are currently misconfigured in this frontend setup (`next lint` resolving to invalid project directory), so direct lint verification is blocked by tooling configuration rather than code logic.
