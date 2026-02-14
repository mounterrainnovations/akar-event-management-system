# Backend 21 - Retrieve `msg` Payload Unwrapping

## Objective
Support Easebuzz retrieve response shape:
- `{ status: true, msg: [ { ...transaction fields... } ] }`

## Change
Updated retrieve payload candidate resolver to unwrap:
- `msg` array (uses first object)
- `msg` object

before mapping to callback DTO fields.

## File Updated
- `backend/lib/payments/easebuzz/service.ts`

## Impact
Transaction/callback recheck flows now correctly parse fields from `msg[0]` and continue status handling.

## Validation
- `npx tsc --noEmit` passed.
