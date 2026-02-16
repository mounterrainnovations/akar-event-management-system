# Backend-35 Waitlist Booking Flow No Payment

## Goal
Handle `event_status = waitlist` in backend booking flow by creating event registrations without initiating payment.

## Behavior Implemented
1. Booking creation now validates event status from centralized event query metadata.
2. Booking is allowed only when event status is:
   - `published`
   - `waitlist`
3. For `waitlist` events:
   - registration is created in `event_registrations`
   - `payment_status` remains `pending`
   - payment initiation is skipped
   - response returns `payment.paymentUrl = null` and `payment.transactionId = null`
4. For `published` events:
   - existing payment flow remains unchanged

## DRY / Query Centralization
Added reusable query helpers and reused them in booking service:

- `backend/lib/queries/events.ts`
  - `getEventBookingMeta(eventId)`
- `backend/lib/queries/event-form-fields.ts` (new)
  - `listEventFormFieldsForValidation(eventId)`
- `backend/lib/queries/event-registrations.ts`
  - `insertEventRegistration(payload, selectFields)`

Booking service now uses these query helpers instead of inline DB fetch/insert for the touched flow path.

## Additional Cleanup
- Removed unused `EVENT_EXISTENCE_SELECT_FIELDS` from `backend/lib/bookings/queries.ts`.
- Improved amount parsing in booking input to allow non-negative values (`0` accepted), which aligns with existing no-payment branch behavior.
- Registration name generation now uses canonical DB event name, not request payload event name.

## Files Updated
- `backend/app/api/bookings/route.ts`
- `backend/lib/bookings/service.ts`
- `backend/lib/bookings/queries.ts`
- `backend/lib/queries/events.ts`
- `backend/lib/queries/event-form-fields.ts`
- `backend/lib/queries/event-registrations.ts`

## Validation
Passed:

```bash
npx eslint app/api/bookings/route.ts lib/bookings/service.ts lib/bookings/queries.ts lib/queries/events.ts lib/queries/event-form-fields.ts lib/queries/event-registrations.ts
```
