# Backend-33 Payments Pending Cron Sync And Vercel Jobs

## Goal
Add a cron-only endpoint that scans all pending payments in batches and triggers transaction refresh to update payment and registration statuses.

## New Endpoint
- `GET /api/payments/cron/sync-pending`

File:
- `backend/app/api/payments/cron/sync-pending/route.ts`

Behavior:
1. Strictly requires `Authorization: Bearer ${CRON_SECRET}`.
2. Reads pending rows from `payments` (`status = 'pending'`) in paged scans.
3. Collects unique `registration_id` values.
4. Chunks registration IDs into sync batches.
5. Calls `POST /api/payments/easebuzz/transaction` for each batch.
6. Returns aggregate batch-wise summary.

Query params:
- `batchSize` (default `25`, max `100`)
- `scanPageSize` (default `200`, max `500`)

## Supporting Changes
- `backend/lib/queries/payments.ts`
  - added `listPendingPaymentRegistrationIdsPage(...)`
- `backend/lib/payments/auth.ts`
  - exported cron token helper for strict cron route validation
- `backend/vercel.json`
  - added Vercel cron schedule for this endpoint

## Vercel Jobs Wiring

### 1. Add environment variable in Vercel
Set in Project Settings -> Environment Variables:
- `CRON_SECRET=<strong-random-secret>`

### 2. Keep cron route path in `vercel.json`
`backend/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/payments/cron/sync-pending",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### 3. Deploy
Push the branch / trigger deploy.

### 4. Verify
- Vercel Cron will call the route on schedule.
- Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when `CRON_SECRET` is configured.
- Check function logs for `api-payments-cron-sync-pending`.

## Manual Test

```bash
curl -X GET "https://<your-backend-domain>/api/payments/cron/sync-pending?batchSize=25&scanPageSize=200" \
  -H "Authorization: Bearer <CRON_SECRET>"
```
