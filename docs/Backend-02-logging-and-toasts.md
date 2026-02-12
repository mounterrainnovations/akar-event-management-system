# Backend 02 - Logging and Toast Notifications

## 1. Objective

Add production-grade logging and user-facing toast notifications in the backend app (`/backend`) with clean extensibility.

## 2. Logging Library Setup

- Added `winston` as the core logging library.
- Added centralized logger module:
  - `backend/lib/logger.ts`
- Features included:
  - Environment-aware formatting
  - Contextual child loggers (`getLogger(context)`)
  - Transport extension hook (`addLoggerTransport(...)`) for future OpenObserve/New Relic integrations

## 3. Logging Wiring

### 3.1 Auth Actions

- File: `backend/app/(auth)/actions.ts`
- Added logs for:
  - Signup/login attempts
  - Validation failures
  - Duplicate email / auth failures
  - DB failures
  - Success events
  - Logout events

### 3.2 Session Layer

- File: `backend/lib/auth/session.ts`
- Added logs for:
  - Missing session secret env
  - Malformed/invalid/expired tokens
  - Session creation and session clearing

### 3.3 Supabase Layer

- Files:
  - `backend/lib/supabase/config.ts`
  - `backend/lib/supabase/admin.ts`
- Added logs for:
  - Missing env variables
  - Admin client creation path

## 4. Toast Notifications Setup

- Added `react-toastify`.
- Added global toast provider:
  - `backend/components/providers/ToastProvider.tsx`
- Mounted globally in:
  - `backend/app/layout.tsx`

## 5. Toast Wiring and Behavior

- Added query-param-to-toast bridge:
  - `backend/components/providers/QueryToasts.tsx`
- Wired into pages:
  - `backend/app/(auth)/login/page.tsx`
  - `backend/app/(auth)/signup/page.tsx`
  - `backend/app/admin/page.tsx`

### 5.1 UX Behavior

- Top-right placement
- Colored theme
- Stacked toasts enabled
- Newest on top
- Max visible toasts limited (4)
- Dedupe-safe IDs to prevent repeated spam

### 5.2 Styling

- Added toast visual refinements in:
  - `backend/app/globals.css`

## 6. Dependency Changes

- Updated `backend/package.json`:
  - Added `winston`
  - Added `react-toastify`
- Updated `backend/package-lock.json` accordingly.

## 7. Validation

- `npm run lint` passed.
- `npm run build` passed.

## 8. Logging Runtime Controls

Added centralized runtime controls in `backend/lib/logger.ts`:

- `LOG_ENABLED=true|false`
  - `false` disables all logs globally.
- `LOG_MODE=basic|errors|full`
  - `basic`: normal operational logging (`info` and above)
  - `errors`: only `error` logs
  - `full`: verbose development/debug logging
- Optional: `LOG_LEVEL=<winston-level>` can directly override mode-based level.
