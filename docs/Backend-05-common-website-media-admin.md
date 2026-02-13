# Backend 05 - Common Website Media Admin (Non User-Scoped)

## 1. Objective

Make admin media operations section-scoped and shared across all admins so website content is managed from `public.website_media` as a common pool.

## 2. Problem Fixed

Previously, admin media listing and mutations were constrained by uploader (`media.user_id`), which blocked cross-admin management in the same media section.

## 3. Changes Implemented

### A. Removed user-scoped filtering for admin section listing

Updated section state fetch to read all media mapped to the section from `website_media` (excluding soft-deleted records), without filtering by `media.user_id`.

File:
- `backend/lib/media/website-media-service.ts`

### B. Removed user ownership checks for hide/delete

Updated section mutation flows to operate by `websiteMediaId` only:
- Toggle visibility (`is_active`)
- Delete from section (`deleted_at`, `is_active=false`, storage removal + media soft delete when unreferenced)

No uploader-based authorization branch remains in these service methods.

File:
- `backend/lib/media/website-media-service.ts`

### C. Generalized section parsing for future categories

Replaced hardcoded section parsing with `isWebsiteSection(...)` so newly configured sections follow the same action flow automatically.

File:
- `backend/app/admin/actions.ts`

### D. Made admin page section-driven

Admin page now derives sections from rules config and renders all configured sections through the same manager component.

Files:
- `backend/lib/media/website-sections.ts`
- `backend/app/admin/page.tsx`

## 4. Forward Pattern for New Media Categories

To add another media category and keep the same common behavior:

1. Add enum value in DB `website_section`
2. Add section rules in `backend/lib/media/website-sections.ts`
3. Admin UI and actions automatically use the same shared, non user-scoped section flow

## 5. Notes

- Auth session is still required to access admin actions/page.
- Section validation and min/max rules remain enforced in service layer.
