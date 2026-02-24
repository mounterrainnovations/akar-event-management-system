# Backend-43: Events About Rich Text Editor

## Objective

Upgrade the admin Event Creation/Edit `about` input to support rich text formatting (bold, italic, links, images) and ensure frontend event pages render this content correctly.

## Changes

### 1. Admin Event Form: Rich Text Input for About

File: `backend/components/admin/EventsNewCreate.tsx`

- Replaced the plain `<textarea>` for `about` with the shared `RichTextEditor`.
- Reused existing rich editor implementation already used in work management.
- Added rich-text-aware validation:
  - strips HTML tags/`&nbsp;`
  - rejects empty content even if editor emits wrapper tags

### 2. Admin Event Detail Modal: Render About HTML

File: `backend/components/admin/EventsNewDetailModal.tsx`

- Updated the About preview block to render stored HTML content using `dangerouslySetInnerHTML`.
- Added fallback behavior for legacy plain-text content by converting newlines to `<br />`.

### 3. Frontend Event Detail Page: Render Rich About Content

File: `frontend/src/app/event/[id]/page.tsx`

- Updated About section rendering to support HTML produced by the admin editor.
- Preserved fallback for legacy plain text by escaping and wrapping it.
- Kept mobile expand/collapse behavior by using text length derived from HTML-stripped content.
- Added lightweight styling hooks for common rich content tags (`p`, `ul`, `ol`, `a`).

## Result

Event creators can now format event descriptions in admin, and those formatted descriptions are displayed properly in both:

- Admin event detail preview
- Public frontend event detail page

## Verification

- `backend`: `npm run build` passed.
- `frontend`: `npm run build` passed.
