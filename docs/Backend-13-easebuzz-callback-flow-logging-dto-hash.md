# Backend 13 - Easebuzz Callback Flow (Logging, DTO, Hash Verification)

## 1. Objective
Implement `AI.md` callback-flow requirements for Easebuzz:
- Log full callback body to `payment_logs` (including empty-body cases).
- Extract only minimal callback DTO fields needed by backend flow.
- Verify callback hash authenticity before accepting callback.
- Keep callback data raw as received (string fields), without normalization.

## 2. Files Updated
- `backend/app/api/payments/easebuzz/callback/route.ts`
- `backend/lib/payments/http.ts`
- `backend/lib/payments/easebuzz/service.ts`
- `backend/lib/payments/service.ts`

## 3. Callback Payload Logging
Added callback log writer in payments service:
- `logCallbackPaymentRequest(...)`

Behavior:
- Writes callback rows to `payment_logs` with `action = "callback"`.
- Stores complete parsed callback payload in `request_payload`.
- Stores callback processing result in `response_payload` (DTO + hash verification result).
- If callback body is empty, still writes a log row with:
  - `_raw_body: ""`
  - `_error: "Callback body is empty"`
- Attempts to map callback `txnid` to `payments.id` when possible; falls back to `null` if not resolvable to avoid FK failures.

## 4. Minimal Callback DTO Extraction
Added in `backend/lib/payments/easebuzz/service.ts`:
- `extractEasebuzzCallbackDto(payload)`
- `getMissingEasebuzzUdfKeys(payload)`

Extracted fields:
- `key`, `txnid`, `amount`, `productinfo`, `firstname`, `email`, `phone`, `surl`, `furl`
- `udf1` through `udf10`
- `hash`
- `status` (raw string as received)
- `error`
- `errorMessage` (supports both `error_message` and `error_Message`)

Validation applied:
- Required callback keys check for `udf1` through `udf10` (presence check only; values may be empty strings).

## 5. Hash Authenticity Verification
Added in `backend/lib/payments/easebuzz/service.ts`:
- `verifyEasebuzzCallbackHash(dto)`

Hash comparison uses SHA-512 and compares:
- received hash (`dto.hash`) vs
- expected hash generated from callback data using Easebuzz salt and reverse-field callback hash composition.

Invalid/missing hash now returns callback error response and is logged.

## 6. Callback Route Behavior
Updated `POST /api/payments/easebuzz/callback`:
- Parses body from raw text (JSON or URL-encoded).
- Handles and logs:
  - empty body
  - parse errors
  - missing required `udf*` keys
  - hash mismatch
- Returns:
  - `400` for empty/invalid/hash-mismatch callback
  - `200` for valid callback with `{ ok: true, received: true, status }`

## 7. Validation
- TypeScript compile check passed:
  - `npx tsc --noEmit`
