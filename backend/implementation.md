# Phase-3 Easebuzz Integration Plan

## Scope
Backend-only payment foundation for event booking integrations.

## Current implementation in this phase

1. Payment initiate route (no UI)
- `POST /api/payments/easebuzz/initiate`
- Accepts booking/payment payload from frontend booking logic.
- Generates dynamic `surl` and `furl` callback URLs.
- Builds Easebuzz request hash using SHA-512 and configured sequence.
- Calls Easebuzz initiate endpoint.

2. Dynamic callbacks
- `POST /api/payments/easebuzz/callback/success`
- `POST /api/payments/easebuzz/callback/failure`
- Parses form-data/json callback payloads.
- Verifies callback hash when `EASEBUZZ_VERIFY_CALLBACK_HASH=true`.
- Updates:
  - `payments` table (upsert)
  - `payment_logs` table (insert)
  - `event_registrations.payment_status` (update)

3. Auth verification wiring (kept test-friendly for now)
- Supabase token validation is implemented in route layer.
- Enforcement toggle: `PAYMENT_ENFORCE_AUTH`
- Current default expectation for testing: `false`
- Final hardening step: set `PAYMENT_ENFORCE_AUTH=true`

## Payload contract (initiate route)

```json
{
  "amount": 499,
  "productInfo": "Event ticket",
  "firstName": "Pranav",
  "email": "test@example.com",
  "phone": "9999999999",
  "eventId": "event-uuid",
  "registrationId": "registration-uuid",
  "paymentReference": "optional-client-ref",
  "successRedirectUrl": "optional-override",
  "failureRedirectUrl": "optional-override"
}
```

## Callback context strategy

- `udf1`: `registrationId`
- `udf2`: `eventId`
- `udf3`: `userId` (when auth enforced)
- `udf4`: `paymentReference`

Query fallback values are also attached in callback URLs for safer recovery.

## Next implementation steps

1. Validate exact Easebuzz request/response field expectations in sandbox with real credentials.
2. Align table payload shapes with exact DB schema for `payments` and `payment_logs`.
3. Add idempotency guard to callback processing.
4. Turn on strict auth enforcement (`PAYMENT_ENFORCE_AUTH=true`).
5. Turn on callback hash verification in non-local environments.
