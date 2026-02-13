# Backend 06 - Media Card UI Cleanup

## Objective

Simplify admin media cards for non-technical users.

## Changes

Updated media cards to remove technical metadata from each card:
- Removed mime type display
- Removed file size display
- Removed display order text

Retained:
- File name
- Visibility status (Visible/Hidden)
- Hide/Show action
- Delete action

## File Updated

- `backend/components/admin/MediaSectionManager.tsx`
