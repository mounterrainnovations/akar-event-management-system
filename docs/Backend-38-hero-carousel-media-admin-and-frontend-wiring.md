# Backend-38 Hero Carousel Media Admin And Frontend Wiring

## Goal
Mirror the existing `highlights` media flow for homepage hero carousel:
1. Manage hero carousel media via backend admin (`media` -> section manager).
2. Store mappings in `website_media` with section key `hero-carousel`.
3. Serve media through existing `GET /api/website-media/:section`.
4. Consume in frontend homepage hero carousel with static fallback images.

## Backend Changes

### 1) Section rules extended
Updated:
- `backend/lib/media/website-sections.ts`

Changes:
- `WebsiteSection` now includes `hero-carousel`.
- Added rules:
  - `section`: `hero-carousel`
  - `minImages`: `1`
  - `maxImages`: `12`
  - `imagesOnly`: `true`

This enables full reuse of existing common media services/actions/routes without duplicating flow logic.

### 2) Admin media picker + section rendering enabled
Updated:
- `backend/app/admin/page.tsx`

Changes:
- `hero-carousel` category is now enabled in media category cards.
- Media state loading now runs for any valid media category (instead of hardcoded subset).
- Section manager rendering now works for any selected media category, including `hero-carousel`.
- Removed unused imports/variables for cleaner lint output in touched file.

### 3) DB enum support migration
Added:
- `backend/supabase/migrations/20260216_add_website_section_hero_carousel.sql`

Changes:
- Adds `hero-carousel` enum value to `public.website_section` if it does not already exist.

## Frontend Changes

### 1) DRY shared website-media client helper
Added:
- `frontend/src/lib/websiteMedia.ts`

Provides:
- shared `WebsiteMediaItem` type
- `fetchSectionMedia(section, options)` utility for frontend consumers

### 2) Highlights page migrated to shared helper
Updated:
- `frontend/src/app/highlights/page.tsx`

Changes:
- Replaced inline fetch logic with `fetchSectionMedia("highlights")`.

### 3) Homepage hero carousel now uses backend media section
Updated:
- `frontend/src/app/page.tsx`

Changes:
- Added runtime fetch for `hero-carousel` media via shared helper.
- Hero carousel uses backend images when available.
- Keeps existing static fallback list if backend section is empty/unavailable.
- Resets active index when fetched hero image set changes.

## Existing Hero Fallback Links (current local assets)
The current fallback hero list used in homepage remains:
- `/1.jpg`
- `/2.jpg`
- `/3.jpg`
- `/4.jpg`
- `/5.jpg`
- `/6.jpg`
- `/7.jpg`

## Validation
- Passed:
  - `cd backend && npx eslint lib/media/website-sections.ts app/admin/page.tsx`
  - `cd frontend && npm run build`
