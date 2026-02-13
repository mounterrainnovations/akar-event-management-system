# Backend 09 - Event Verification Required and Registration Verification

## 1. Objective
Implement verification behavior from updated `AI.md` schema:
- `events.verification_required` (boolean)
- `event_registrations.is_verified` (nullable boolean)

Rules implemented:
- If `verification_required = true`: registrations should have non-null `is_verified` with default `false` until manually verified.
- If `verification_required = false`: registrations should have `is_verified = null`.

## 2. Service Layer Updates
Updated: `backend/lib/events/service.ts`

Changes:
- Added `verification_required` to event row model and selects.
- Added `is_verified` to registration row model and selects.
- Added `verificationRequired` to `EventWriteInput` and persisted via event create/update.
- Added `isVerified` to registration DTO.
- Added internal sync function `syncRegistrationVerificationMode`:
  - When required: sets `is_verified=false` for null values.
  - When not required: resets all non-null `is_verified` values to null.
- Sync is applied:
  - On event update.
  - During event detail loading (keeps data aligned even if registrations were inserted elsewhere).
- Added `verifyEventRegistration({ eventId, registrationId })`:
  - Validates event exists and `verification_required=true`.
  - Sets registration `is_verified=true`.

## 3. Server Actions Updates
Updated: `backend/app/admin/events-actions.ts`

Changes:
- Event parser now accepts `verificationRequired` from form input.
- Added new action: `verifyEventRegistrationAction`.
- Preserves existing query context (`eventId`, `includeDeleted`, `paymentStatus`) for verification action redirects.

## 4. Admin UI Updates
Updated: `backend/components/admin/EventsSectionManager.tsx`

Changes:
- Added event-level `verificationRequired` checkbox in:
  - Create event form.
  - Update event form.
- Added verification-required display in event management header.
- Registrations section now shows `is_verified` value explicitly.
- If event requires verification and registration is currently `false`, shows `Verify Registrant` action button.

## 5. Validation
- ESLint passed for changed files.
- TypeScript check passed (`npx tsc --noEmit`).
