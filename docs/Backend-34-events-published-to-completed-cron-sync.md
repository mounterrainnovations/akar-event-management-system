# Backend-34 Events Published To Completed Cron Sync

## Goal
Add a cron-only endpoint that checks `events.event_date` and `events.status` for all events and moves expired published events to `completed`.

## New Endpoint
- `GET /api/events/cron/sync-completed`

File:
- `backend/app/api/events/cron/sync-completed/route.ts`

Behavior:
1. Strictly requires `Authorization: Bearer ${CRON_SECRET}`.
2. Uses a centralized query from `/lib/queries` (no route-level table query duplication).
3. Updates events where:
   - `status = 'published'`
   - `event_date < now()`
   - `deleted_at IS NULL`
4. Sets `status = 'completed'`.
5. Returns summary with `updatedCount` and `updatedEventIds`.

## Centralized Query (DRY)
- `backend/lib/queries/events.ts`
  - added `markPublishedEventsCompleted(beforeIso: string)`
  - default table uses `EVENTS_TABLE` env var fallback to `events`

## Vercel Jobs Wiring

`backend/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/payments/cron/sync-pending",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/events/cron/sync-completed",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Manual Test

```bash
curl -X GET "https://<your-backend-domain>/api/events/cron/sync-completed" \
  -H "Authorization: Bearer <CRON_SECRET>"
```
