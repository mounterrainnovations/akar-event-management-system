# Backend 11 - Easebuzz Phase-3 Foundation

## 1. Objective
Set up backend-only payment integration foundations for Easebuzz with no UI dependency, so frontend booking flow can call backend APIs directly.

## 2. Routes Added
- `POST /api/payments/easebuzz/initiate`
- `POST /api/payments/easebuzz/callback/success`
- `POST /api/payments/easebuzz/callback/failure`

All routes include `OPTIONS` handling and CORS response headers for allowed origins.

## 3. Implementation Added

### A. Easebuzz gateway layer
Files:
- `backend/lib/payments/easebuzz/config.ts`
- `backend/lib/payments/easebuzz/service.ts`

Capabilities:
- Reads Easebuzz key/salt/base-url/path from env.
- Builds initiate payload with SHA-512 hash.
- Generates dynamic `surl` and `furl` callback URLs.
- Supports configurable request/response hash sequences.
- Supports optional callback hash validation toggle.

### B. Supabase access-token validation hook
File:
- `backend/lib/payments/auth.ts`

Capabilities:
- Validates Bearer token using Supabase Auth `getUser`.
- Enforcement toggle via env `PAYMENT_ENFORCE_AUTH`.
- Implemented now but defaults to test-friendly disabled mode until hardening phase.

### C. Callback processing and DB updates
Files:
- `backend/lib/payments/callback-handler.ts`
- `backend/lib/payments/http.ts`
- `backend/lib/payments/service.ts`

Capabilities:
- Parses callback payload (json/form-data).
- Processes success/failure outcomes.
- Writes payment state into:
  - `payments` table (upsert by `payment_reference`)
  - `payment_logs` table (insert)
  - `event_registrations.payment_status` (update)

## 4. Route Contract (Initiate)
Input fields:
- `amount` (number, required)
- `productInfo` (string, required)
- `firstName` (string, required)
- `email` (string, required)
- `phone` (string, optional)
- `eventId` (string, optional)
- `registrationId` (string, optional)
- `paymentReference` (string, optional)
- `successRedirectUrl` (string, optional override)
- `failureRedirectUrl` (string, optional override)

## 5. Callback Context Strategy
Stored in Easebuzz `udf*` fields for deterministic callback reconciliation:
- `udf1`: `registrationId`
- `udf2`: `eventId`
- `udf3`: `userId` (when present)
- `udf4`: `paymentReference`

## 6. Docs and Config Updates
Updated:
- `backend/README.md`

Added env docs for:
- `EASEBUZZ_KEY`, `EASEBUZZ_SALT`
- base/path and hash sequence settings
- callback hash verification toggle
- callback base URL and CORS origins
- payment auth enforcement toggle
- payment table name overrides

## 7. Notes
- This phase establishes route + service foundations and callback plumbing.
- Final strictness (auth + callback hash validation) is intentionally configurable to reduce local testing friction.
