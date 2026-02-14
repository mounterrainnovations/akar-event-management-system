# Phase-3 Easebuzz Integration Plan

## Scope
Backend-only payment foundation for event booking integrations.

## Current implementation in this phase

1. Payment initiate route (no UI)
- `POST /api/payments/easebuzz/initiate`
- Accepts booking/payment payload from frontend booking logic.
- Generates one dynamic callback URL and sets it as both `surl` and `furl`.
- Builds Easebuzz request hash using SHA-512 and this format:
  - `key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt`
- Calls Easebuzz initiate endpoint.
- Creates a pending row in `payments` table before calling Easebuzz.

2. Common callback route
- `POST /api/payments/easebuzz/callback`
- Parses callback payload from `json` or `form-data`.
- Current behavior for this step: logs incoming body with `console.log`.
- Success/failure branching and DB updates will be added next.

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
  "registrationId": "registration-uuid",
  "eventId": "event-uuid",
  "transactionId": "optional-client-ref",
  "userId": "required-if-auth-not-enforced"
}
```

## Callback context strategy

Stored in Easebuzz `udf*` fields:
- `udf1`: `registrationId`
- `udf2`: `eventId`
- `udf3`: `userId`
- `udf4`: `transactionId`
- `udf5`..`udf10`: reserved for later use

## Next implementation steps

1. Build callback parser that branches success/failure/webhook scenarios.
2. Update `payments`, `payment_logs`, and `event_registrations` from callback outcomes.
3. Add idempotency guard for callback processing.
4. Turn on strict auth enforcement (`PAYMENT_ENFORCE_AUTH=true`).
