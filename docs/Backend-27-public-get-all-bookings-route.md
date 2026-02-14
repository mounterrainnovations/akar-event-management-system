# Backend 27 - Public Get All Bookings Route

## Objective
Add an unprotected route for frontend event cards to fetch bookings globally.

## Route Added
- `GET /api/bookings/all`

## Auth
- Public route (no auth required).

## Query Params
- `page` (optional, default `1`)
- `limit` (optional, default `20`, max `20`)
- `event_id` or `eventId` (optional UUID filter)
- `include_deleted` (optional, `true` to include cancelled bookings)

Default behavior excludes cancelled bookings (`deleted_at is null`).

## Response Shape
```json
{
  "ok": true,
  "page": 1,
  "limit": 20,
  "total": 42,
  "items": [
    {
      "id": "...",
      "eventId": "...",
      "userId": "...",
      "couponId": null,
      "totalAmount": 799,
      "discountAmount": 0,
      "finalAmount": 799,
      "paymentStatus": "pending",
      "formResponse": {},
      "createdAt": "...",
      "updatedAt": "...",
      "deletedAt": null,
      "name": "Future of Design Summit",
      "transactionId": null,
      "ticketsBought": {"ticket_uuid": 2},
      "isVerified": null
    }
  ]
}
```

## Files Updated
- `backend/app/api/bookings/all/route.ts` (new)
- `backend/lib/bookings/service.ts`

## Validation
- `npm run lint -- app/api/bookings/all/route.ts lib/bookings/service.ts` passed.
