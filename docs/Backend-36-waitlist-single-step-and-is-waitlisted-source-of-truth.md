# Backend-36 Waitlist Single Step And Is-Waitlisted Source Of Truth

## Goal
1. Keep waitlist registration flow on page 1 only in frontend (no ticket/payment step UI).
2. Persist `event_registrations.is_waitlisted = true` for waitlist registrations so backend has a canonical waitlist flag.

## AI.md Sync Confirmed
`AI.md` now includes:
- `event_registrations.is_waitlisted boolean null`

## Backend Changes

### 1) Set `is_waitlisted` on registration create
- File: `backend/lib/bookings/service.ts`
- Logic:
  - resolve booking mode from event status
  - when mode is `waitlist`, insert payload now sets:
    - `is_waitlisted: true`
  - when mode is payment flow, sets:
    - `is_waitlisted: false`

### 2) Surface waitlist flag in booking APIs
- File: `backend/lib/bookings/queries.ts`
  - `BOOKING_SELECT_FIELDS` now includes `is_waitlisted`
- File: `backend/lib/bookings/service.ts`
  - `BookingRow` includes `is_waitlisted`
  - mapped output includes `isWaitlisted`

### 3) Input handling cleanup for waitlist
- File: `backend/lib/bookings/service.ts`
  - `tickets_bought` parsing now allows empty object input.
  - payment-mode bookings still enforce non-empty tickets.
  - waitlist-mode bookings allow empty tickets.

### 4) Consistency for legacy registration path
- File: `backend/lib/events/service.ts`
  - `createRegistration(...)` now sets `is_waitlisted: false`

## Frontend Changes

### 1) Waitlist is single-step only
- File: `frontend/src/components/RegistrationModal.tsx`
  - Waitlist submit now happens directly from step 1 after validation.
  - Step label shows `Step 1 of 1` for waitlist events.
  - Footer primary action on step 1 shows `Join Waitlist`.
  - For waitlist payload:
    - `amount: 0`
    - `tickets_bought: {}`

### 2) Already joined detection uses backend truth flag
- File: `frontend/src/app/event/[id]/page.tsx`
  - waitlist membership check now uses `item.isWaitlisted === true`
  - CTA states:
    - `Checking...`
    - `Join Waitlist`
    - `Joined Waitlist` (disabled)

## Validation
- Backend:
  - `npx eslint lib/bookings/service.ts lib/bookings/queries.ts lib/events/service.ts`
- Frontend:
  - `npm run build`
