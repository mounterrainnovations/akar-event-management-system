# Backend 26 - Bookings POST Error Response Improvement

## Objective
Improve `POST /api/bookings` error clarity so client receives actionable messages instead of generic fallback.

## Change
Updated error handling in:
- `backend/app/api/bookings/route.ts`

Behavior:
- For validation/client errors (400): returns exact error message.
- For server errors (500): returns
  - `error: "Unable to initiate booking"`
  - `details: <actual backend error message>`

## Validation
- `npm run lint -- app/api/bookings/route.ts` passed.
