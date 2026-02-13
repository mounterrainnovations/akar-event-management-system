# Backend 07 - Events Admin Dashboard CRUD

## 1. Objective
Add an `Events` section in backend admin dashboard sidebar and wire end-to-end CRUD for event management and related entities based on the event flow model in `AI.md`.

## 2. Event Relationship Baseline (from AI.md)
- `events` is the root table (container record).
- `event_tickets` has many rows per event via `event_tickets.event_id -> events.id`.
- `event_coupons` has many rows per event via `event_coupons.event_id -> events.id`.
- `event_form_fields` has many rows per event via `event_form_fields.event_id -> events.id`.
- `event_registrations` has many rows per event via `event_registrations.event_id -> events.id`.
- `event_registrations.ticket_id -> event_tickets.id` (required).
- `event_registrations.coupon_id -> event_coupons.id` (optional).
- `event_registrations.user_id -> users.id` (optional because user can be null).

This is reflected in the admin flow:
1. Create event.
2. Add tickets, coupons, and dynamic form fields.
3. Registrations are viewed under each event as purchase records.

## 3. Sidebar and Section Wiring
Updated admin navigation to support two sections:
- `Media`
- `Events`

Section is controlled by query param:
- `/admin?section=media`
- `/admin?section=events`

## 4. Events Module Added
### 4.1 Service Layer
New file: `backend/lib/events/service.ts`

Implemented:
- Event listing with metrics (`listEventAdminSummaries`)
- Event detail with child entities (`getEventAdminDetail`)
- Event create/update (`createEvent`, `updateEvent`)
- Event soft-delete and restore (`softDeleteEvent`, `restoreEvent`)
- Ticket create/update/archive (`createEventTicket`, `updateEventTicket`, `softDeleteEventTicket`)
- Coupon create/update/archive (`createEventCoupon`, `updateEventCoupon`, `softDeleteEventCoupon`)
- Form field create/update/delete (`createEventFormField`, `updateEventFormField`, `deleteEventFormField`)

### 4.2 Server Actions
New file: `backend/app/admin/events-actions.ts`

Implemented form actions with:
- Auth/session guard
- Input parsing and validation
- JSON parsing for JSONB fields (`about`, `terms_and_conditions`, ticket `description`, form field `options`)
- Date window validation (registration, discount, coupon validity)
- Redirect-based success/error feedback for toasts
- Context preservation with `section=events`, selected `eventId`, and `includeDeleted`

### 4.3 Admin UI Component
New file: `backend/components/admin/EventsSectionManager.tsx`

Implemented UI for:
- Event flow baseline explanation panel
- Event list + selection
- Create event form
- Edit event form
- Archive/restore event
- Ticket CRUD surface (create/update/archive)
- Coupon CRUD surface (create/update/archive)
- Form field CRUD surface (create/update/delete)
- Registration viewer (read-only with form response JSON)
- Event analytics summary (registration/revenue signals)

## 5. Admin Page Integration
Updated file: `backend/app/admin/page.tsx`

Changes:
- Added sidebar `Events` nav item.
- Added query-param based section routing.
- Added conditional rendering of `EventsSectionManager`.
- Preserved existing media admin behavior.

## 6. Validation Run
- Targeted ESLint passed for all new/modified files.
- TypeScript check passed (`npx tsc --noEmit`).
- Full repository lint still has pre-existing unrelated errors in existing UI files (`backend/components/ui/*`).
