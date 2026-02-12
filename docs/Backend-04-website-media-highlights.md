# Backend 04 - Website Media (Highlights Section)

## 1. Objective

Implement section-wise media management for website content, starting with the `highlights` section.

## 2. Database Context

Using:

- `public.media` (storage metadata table)
- `public.website_media` (section mapping table)
- section enum value currently used: `highlights`

## 3. Upload Wiring (Confirmed)

Current upload sequence is:

1. Upload file to Supabase public bucket (`mediaBucket`)
2. Insert metadata into `public.media`
3. Insert mapping into `public.website_media` using `media.id` with section

Relevant code:

- `backend/lib/media/service.ts`
- `backend/lib/media/website-media-service.ts`
- `backend/app/admin/actions.ts`

## 4. Section Rules (Highlights)

Configured in reusable section rules:

- images only
- minimum active images: `6`
- maximum total images: `18`

File:

- `backend/lib/media/website-sections.ts`

## 5. Features Implemented (Highlights)

- Multi-file upload
- Image previews (public URLs from bucket)
- Toggle visibility (`is_active`)
- Delete media from section
- Min/Max rule enforcement in service layer
- Reusable section management UI component for future sections

UI/logic files:

- `backend/components/admin/MediaSectionManager.tsx`
- `backend/lib/media/website-media-service.ts`
- `backend/app/admin/page.tsx`
- `backend/app/admin/actions.ts`

## 6. Delete Behavior

Delete flow is implemented as:

1. Delete file from storage bucket first
2. Soft-delete `website_media` row (`deleted_at`, `is_active=false`)
3. If no remaining active section references, soft-delete `media` row

## 7. Reusability Notes

The section model is reusable:

- Add new enum values to `website_section`
- Add section config in `website-sections.ts`
- Reuse `MediaSectionManager` + existing actions/service patterns

## 8. Frontend Consumption API

Public section endpoint added for landing-page/frontend usage:

- `GET /api/website-media/:section`

Current section example:

- `GET /api/website-media/highlights`

Query params:

- `active=true|false` (default `true`)
- `limit=<number>` (capped by section max)

Response shape:

```json
{
  "section": "highlights",
  "items": [
    {
      "id": "website_media_id",
      "mediaId": "media_id",
      "section": "highlights",
      "displayOrder": 0,
      "isActive": true,
      "fileName": "image-1.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 120034,
      "previewUrl": "https://..."
    }
  ],
  "meta": {
    "total": 6,
    "active": 6,
    "minRequired": 6,
    "maxAllowed": 18
  }
}
```
