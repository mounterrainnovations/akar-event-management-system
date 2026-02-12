# Backend Summary (Diff vs `main`)

This document summarizes the current branch changes compared to `main`, with focus on backend auth and Supabase wiring.

## Diff Snapshot

- Branch: `backend`
- Compared against: `main`
- `git diff --stat main`:
  - 14 files changed
  - 797 insertions, 17 deletions

## Files Changed vs `main`

- `AI.md` (added)
- `backend/README.md` (modified)
- `backend/app/(auth)/actions.ts` (added)
- `backend/app/(auth)/login/page.tsx` (added)
- `backend/app/(auth)/signup/page.tsx` (added)
- `backend/app/admin/page.tsx` (modified)
- `backend/app/globals.css` (modified)
- `backend/lib/auth/password.ts` (added)
- `backend/lib/auth/session.ts` (added)
- `backend/lib/supabase/admin.ts` (added)
- `backend/lib/supabase/config.ts` (added)
- `backend/package-lock.json` (modified)
- `backend/package.json` (modified)
- `backend/public/authbg.jpg` (added)

## Functional Backend Changes

### 1) Supabase-backed Auth Flow

- Added server actions for auth:
  - `signupAction`
  - `loginAction`
  - `logoutAction`
- Actions are implemented in:
  - `backend/app/(auth)/actions.ts`
- Auth data source:
  - Supabase `public.users` table (email + password + role + soft delete check).

### 2) Password Security

- Password handling now uses `bcrypt`:
  - Hash on signup
  - Verify on login
- Implemented in:
  - `backend/lib/auth/password.ts`
- Dependencies added:
  - `bcrypt`
  - `@types/bcrypt`

### 3) Session Management

- Added signed cookie session utility:
  - set session
  - read/verify session
  - clear session
- Implemented in:
  - `backend/lib/auth/session.ts`
- Cookie characteristics:
  - `httpOnly`
  - `sameSite=lax`
  - `secure` in production

### 4) Login and Signup Pages Wired

- Backend auth pages now submit real forms to server actions:
  - `backend/app/(auth)/login/page.tsx`
  - `backend/app/(auth)/signup/page.tsx`
- Handles redirects and query-param messages for success/error.
- Google sign-in option removed from backend auth-group pages.

### 5) Admin Route Protection

- `backend/app/admin/page.tsx` now:
  - Requires a valid session
  - Redirects unauthenticated users to `/login`
  - Supports sign-out via server action

### 6) Supabase Config/Admin Clients

- Added shared env-config helpers:
  - `backend/lib/supabase/config.ts`
- Added service-role client factory used by auth actions:
  - `backend/lib/supabase/admin.ts`

## Documentation and Setup

- `backend/README.md` updated with required auth env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `AUTH_SESSION_SECRET`

## Notes

- This summary reflects the current working tree compared to `main` at the time of generation.
- Local `.env` values are environment/runtime setup and are not part of this `main` diff summary.
