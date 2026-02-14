# Backend-31 Booking Callback Frontend Status Redirect Pages

## Goal
Add frontend booking result pages and wire Easebuzz callback flow so users are redirected to status-specific pages after callback processing.

## Frontend Changes

### New booking status pages
- `frontend/src/app/booking/success/page.tsx`
- `frontend/src/app/booking/failure/page.tsx`
- `frontend/src/app/booking/pending/page.tsx`

### Shared DRY status component
- `frontend/src/components/booking/BookingStatusPage.tsx`

This shared component keeps styling and structure consistent with the current site design and accepts callback context via query params:
- `registrationId`
- `txnid`
- `status`
- `message`

## Backend Callback Redirect Integration

### Callback route updated
- `backend/app/api/payments/easebuzz/callback/route.ts`

Behavior:
1. Callback processing and business-status updates remain unchanged.
2. Browser-like callback requests now receive `303` redirects to:
   - `/booking/success`
   - `/booking/failure`
   - `/booking/pending`
3. API/test callers can force JSON response using:
   - `?format=json`

Redirect URLs include resolved callback context as query params.

### New redirect URL builder
- `backend/lib/payments/easebuzz/service.ts`
  - Added `buildBookingResultUrl(...)`

### New config for frontend redirect base
- `backend/lib/payments/easebuzz/config.ts`
  - Added `getPaymentResultBaseUrl()`

Env resolution order:
1. `PAYMENT_RESULT_BASE_URL`
2. `FRONTEND_BASE_URL`
3. fallback: `http://localhost:3001`

## README Update
- `backend/README.md`
  - documented `PAYMENT_RESULT_BASE_URL`

## Notes
- This keeps callback flow production-safe while preserving JSON mode for non-browser integrations and diagnostics.
