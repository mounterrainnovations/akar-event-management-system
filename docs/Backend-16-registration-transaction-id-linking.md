# Backend 16 - Registration Transaction ID Linking

## Objective
Persist payment transaction mapping on `event_registrations` so each registration can directly resolve its transaction row.

## Changes
Updated callback business update flow to also set:
- `event_registrations.transaction_id`

Value source:
- prefers callback `txnid`
- falls back to callback transaction id path when required

This is applied across all callback flows:
- success
- failure
- pending/recheck

## File Updated
- `backend/lib/payments/service.ts`

## AI Schema Update
Updated `AI.md` schema for `event_registrations`:
- added column: `transaction_id character varying(40) null`
- added FK: `event_registrations_transaction_id_fkey` -> `payments(easebuzz_txnid)`
- added index: `event_registrations_transaction_idx`

## Validation
- `npx tsc --noEmit` passed.
