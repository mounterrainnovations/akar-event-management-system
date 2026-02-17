# Backend-37 Waitlist To Published Reuse Registration Flow

## Goal
When an event moves from `waitlist` to `published`:
1. Show `Book Now` to users.
2. Reuse the same waitlist registration ID for booking instead of creating a new registration.
3. Prefill previously submitted attendee details (`name`, `email`, `phone`, and saved form fields).
4. Flip `event_registrations.is_waitlisted` to `false` when conversion to booking flow happens.

## Backend Changes

### 1) Registration reuse support in centralized query layer
Updated `backend/lib/queries/event-registrations.ts`:
- Added `getEventRegistrationForUserEvent(...)` to load a specific registration by:
  - `registrationId`
  - `userId`
  - `eventId`
- Added `updateEventRegistrationById(...)` for reusable update + select-return flow.

### 2) Booking input supports existing registration ID
Updated `backend/lib/bookings/service.ts`:
- `InitiateBookingInput` now supports optional `registrationId`.
- `parseInitiateBookingInput(...)` accepts:
  - `registrationId`
  - `registration_id`

### 3) Create-or-update behavior in booking flow
Updated `backend/lib/bookings/service.ts`:
- For published/payment flow:
  - if `registrationId` is provided, service now validates the existing row belongs to same `userId` + `eventId`.
  - validates registration is active and currently `is_waitlisted = true`.
  - updates that same row instead of inserting a new one.
- Updated fields include:
  - `coupon_id`
  - `total_amount`
  - `final_amount`
  - `payment_status = pending`
  - `form_response`
  - `tickets_bought`
  - `transaction_id = null`
  - `is_waitlisted = false`
  - `is_verified` recalculated from event verification config
- If `registrationId` is absent, old create behavior remains unchanged (backward compatible).

## Frontend Changes

### 1) Published events now detect existing waitlist registration for current user
Updated `frontend/src/app/event/[id]/page.tsx`:
- Booking lookup now runs for both `waitlist` and `published` statuses.
- For `published`:
  - finds active waitlist booking for current user in the same event.
  - stores `id` + `formResponse` for modal prefill/reuse.
- For `waitlist`:
  - existing behavior remains (`Join Waitlist` / `Joined Waitlist` state).

### 2) Modal prefills and reuses same registration ID
Updated `frontend/src/components/RegistrationModal.tsx`:
- Accepts optional `existingWaitlistBooking`.
- On open (published mode + existing waitlist booking):
  - pre-populates form using saved `formResponse`.
  - ensures `name`, `email`, and `phone` are prefilled.
- Booking payload now includes `registrationId` for published conversion flow.

## Backward Compatibility
- Existing waitlist flow remains single-step.
- Existing booking creation flow remains unchanged when no `registrationId` is sent.
- Existing payment initiation path remains unchanged; it now receives the reused registration ID from booking response.

## Validation
- Passed:
  - `cd backend && npx eslint lib/bookings/service.ts lib/queries/event-registrations.ts app/api/bookings/route.ts`
- Note:
  - `cd backend && npm run build` still fails on unrelated pre-existing PDF module resolution issues in `backend/lib/pdfs/ticket-generator.ts`.
