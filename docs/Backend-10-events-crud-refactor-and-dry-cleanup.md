# Backend 10 - Events CRUD Refactor and DRY Cleanup

## 1. Objective
Refactor event CRUD changes against `main` for cleaner, DRY-er code while preserving behavior.

## 2. Scope (Diff vs `main` in backend)
Files reviewed and refactored:
- `backend/app/admin/events-actions.ts`
- `backend/app/admin/page.tsx`
- `backend/components/admin/EventsSectionManager.tsx`
- `backend/lib/events/enums.ts`
- `backend/lib/events/service.ts`

## 3. Refactor Work Done
### A. Server actions cleanup (`events-actions.ts`)
- Centralized action context extraction (`session`, `eventId`, `includeDeleted`, `paymentStatus`).
- Added shared redirect helpers:
  - `redirectSuccess`
  - `redirectError`
  - `requireEventId`
- Reduced repeated try/catch + redirect boilerplate across all actions.
- Added `parseDiscountType` helper to remove inline discount-type parsing duplication.
- Ensured redirects happen outside success-path try blocks to avoid noisy `NEXT_REDIRECT` logging behavior.

### B. Service layer cleanup (`service.ts`)
- Introduced shared select-field constants for core queries.
- Introduced payload mapping helpers:
  - `mapTicketWriteInput`
  - `mapCouponWriteInput`
  - `mapFormFieldWriteInput`
- Reused helpers for create/update operations to remove duplicate payload construction and reduce drift risk.

### C. UI cleanup (`EventsSectionManager.tsx`)
- Added `ActionContextFields` component to deduplicate repeated hidden context fields:
  - `includeDeleted`
  - `paymentStatus`
- Replaced repeated hidden-input fragments with the shared component.

## 4. Functional Preservation
- Event CRUD flow unchanged.
- Ticket/coupon/form field CRUD behavior unchanged.
- Verification-required and registration-verification behavior unchanged.
- Query context preservation (`eventId`, `includeDeleted`, `paymentStatus`) unchanged.

## 5. Validation
- ESLint passed on refactored files.
- TypeScript compile passed (`npx tsc --noEmit`).
