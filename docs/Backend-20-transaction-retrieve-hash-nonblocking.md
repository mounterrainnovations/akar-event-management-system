# Backend 20 - Transaction Retrieve Hash Verification Non-Blocking

## Objective
Prevent false-negative 400 errors on transaction status retrieval while still capturing hash verification diagnostics.

## Changes

### 1. `/api/payments/easebuzz/transaction`
- Removed hard-fail response for retrieve-response hash mismatch.
- Endpoint now continues to process returned status flow and returns:
  - `hashVerification` details in response payload.

### 2. Callback pending recheck flow
- In callback pending retries, removed strict `continue` gate on retrieve hash mismatch.
- Status flow from retrieve response is now evaluated directly to progress success/failure/pending handling.

## Files Updated
- `backend/app/api/payments/easebuzz/transaction/route.ts`
- `backend/app/api/payments/easebuzz/callback/route.ts`

## Validation
- `npx tsc --noEmit` passed.
