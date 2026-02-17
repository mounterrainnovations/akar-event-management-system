# Backend-41 Events Admin Edit Flow Shared Form And Step Order

## Goal
- Add an **Edit Event** option in admin events.
- Reuse the existing **Create Event** multi-step UI and logic for editing (DRY).
- Move **Coupons** step to come **after Tiers / Activity (tickets)** in the flow.

## Changes

### 1) Shared create/edit form component
- Updated `backend/components/admin/EventsNewCreate.tsx` to support:
  - `mode: "create" | "edit"`
  - `eventId` (for edit submits)
  - `initialData` (prefilled event graph)
- Same validation, form state, rendering, and payload mapping are reused for both create and edit.
- Submit now branches:
  - create mode -> `createEventAction(...)`
  - edit mode -> `updateEventAction(eventId, ...)`

### 2) Edit route + UI entry points
- Updated `backend/components/admin/EventsNewSectionManager.tsx`:
  - Added edit rendering path for `?section=events&view=edit&eventId=...`
  - Fetches event detail and maps it into the shared form `initialData`.
  - Added **Edit** CTA in the events list row.
- Updated `backend/components/admin/EventsNewDetailModal.tsx`:
  - Added **Edit** button in modal header actions.

### 3) Backend update action + centralized relation sync
- Updated `backend/app/admin/events-new-actions.ts`:
  - Added `updateEventAction(eventId, input)`.
- Updated `backend/lib/events/service.ts`:
  - Kept event write mappers centralized.
  - Extracted relation insertion logic into reusable helper.
  - Extended update flow to replace related entities (tickets, coupons, form fields, bundle offers) when edit payload includes them.
  - Create and update now share relation write logic.

### 4) Step order change (tickets before coupons)
- Updated `backend/components/admin/EventsNewCreate.tsx` step navigation order to:
  - `General -> Address -> Form Data -> Tiers / Activity -> Coupons -> Offers`
- Updated previous/next behavior, step labels/numbers, and submit-time invalid-step routing to match this order.

## Validation
- TypeScript check passed:
  - `backend`: `./node_modules/.bin/tsc --noEmit`
