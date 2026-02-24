# Backend-42: Work Dashboard to Frontend Wiring

## Goal

Connect admin-managed `works` content to frontend `/work` and `/work/[id]` pages using shared backend access and reusable mapping logic.

## Context Reviewed

- `AI.md` and `backend/ai.md`
- Backend work APIs and service:
  - `backend/app/api/works/route.ts`
  - `backend/app/api/works/[id]/route.ts`
  - `backend/lib/works/service.ts`
- Admin dashboard wiring:
  - `backend/app/admin/page.tsx`
  - `backend/components/admin/WorkSectionManager.tsx`
  - `backend/app/admin/works.actions.ts`
- Frontend work pages and data client:
  - `frontend/src/lib/works.ts`
  - `frontend/src/app/work/page.tsx`
  - `frontend/src/app/work/[id]/page.tsx`

## Data Flow

1. Admin creates/updates entries via `WorkSectionManager` and `works.actions.ts`.
2. Data persists in `public.works`.
3. Frontend fetches published records from backend APIs:
   - `GET /api/works`
   - `GET /api/works/:id`

## Problems Identified

- Frontend work API client used a separate base URL variable, not centralized backend URL helper.
- Frontend links used `/Work/...` and `/Work`, but route path is lowercase `/work`.
- Works `cover_image_url` could be stored as a storage path from admin uploads, but frontend expects a renderable URL.

## Changes Implemented

### 1) Backend: Centralized Work Row Mapping + Cover URL Resolution

File: `backend/lib/works/service.ts`

- Added reusable row mapper `mapWorkRow(...)`.
- Added `resolveCoverImageUrl(...)`:
  - returns as-is when already absolute URL.
  - converts stored storage path to public URL via `getPublicMediaUrl(...)` (bucket: `media`).
- Applied mapper consistently in:
  - `listWorks`
  - `getWorkById`
  - `createWork`
  - `updateWork`

Result: dashboard-created items now return frontend-ready image URLs.

### 2) Frontend: Reuse Centralized Backend URL Logic

File: `frontend/src/lib/works.ts`

- Replaced custom `NEXT_PUBLIC_API_URL` base handling with shared `getBackendUrl()` from `frontend/src/lib/backend.ts`.

Result: works API calls now follow the same environment contract as other frontend modules.

### 3) Frontend: Route Case Fixes

Files:
- `frontend/src/app/work/page.tsx`
- `frontend/src/app/work/[id]/page.tsx`

Changes:
- `/Work/${id}` -> `/work/${id}`
- `/Work` -> `/work`

Result: work list cards and detail back navigation now resolve correctly.

## Outcome

Admin dashboard work entries are now wired cleanly to frontend Work pages with shared URL configuration and backend-side mapping that handles both existing and new cover-image storage formats.
