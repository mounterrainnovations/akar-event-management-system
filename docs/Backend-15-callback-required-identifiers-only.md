# Backend 15 - Callback Updates Use Required Identifiers Only

## Objective
Reduce callback business update logic to only required identifiers.

## Change Applied
In callback status application flow, `event_registrations` update now uses only:
- `registrationId` (`udf1`)

Removed from update scoping:
- `eventId` (`udf2`)
- `userId` (`udf3`)

This applies across all callback flows:
- success
- failure
- pending/recheck

## Files Updated
- `backend/lib/payments/service.ts`
- `backend/app/api/payments/easebuzz/callback/route.ts`

## Notes
- Payment table updates still resolve payment row via transaction identifiers (`udf4` / `txnid`) as required by payment table design.
- Event registration update path is now minimal and required-only.

## Validation
- `npx tsc --noEmit` passed.
