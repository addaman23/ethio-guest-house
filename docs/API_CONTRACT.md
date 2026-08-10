# API Contract (draft)

Base URL (local dev): `http://localhost:3000/v1`

Production: `https://ethioguesthouses.com/v1` (same host as the public website unless you split API later)

## Auth

- `POST /auth/otp/request` — `{ "phone": "+2519..." }`
- `POST /auth/otp/verify` — `{ "phone", "code" }` → `{ "token", "user" }`

## Guest

- `GET /properties?city=&checkIn=&checkOut=&guests=&minPrice=&maxPrice=`
- `GET /properties/:id`
- `POST /bookings` — create → `pending_approval`
- `GET /bookings/mine`
- `POST /bookings/:id/cancel`

## Host

- `GET /host/properties`
- `POST /host/properties`
- `PATCH /host/properties/:id`
- `POST /host/properties/:id/photos` — multipart field `photos`
- `POST /host/properties/:id/videos` — `{ "urls": ["https://youtube.com/..."], "replace": false }`
- `POST /host/properties/:id/videos/upload` — multipart field `videos` (mp4/webm/mov)
- `GET /host/bookings?status=pending_approval`
- `POST /host/bookings/:id/approve`
- `POST /host/bookings/:id/decline`
- `POST /host/bookings/:id/mark-paid` — optional on arrival

## Public website (HTML, not under /v1)

- `GET /` — SEO home
- `GET /guest-houses` — listings
- `GET /guest-houses/city/:citySlug` — city SEO page
- `GET /stay/:id` — property detail with photos + videos
- `GET /sitemap.xml`, `GET /robots.txt`
- `GET /demo` — operator demo UI
- `GET /owner` — owner analytics (page views, WhatsApp/Viber/phone/email taps)

## Analytics

- `POST /analytics/event` — public: page_view / contact_click
- `GET /admin/analytics?days=30` — owner dashboard data (admin key)

## Admin

- `GET /admin/stats` — includes pageViews30d, uniqueVisitors30d, contact click totals
- `GET /admin/users`
- `POST /admin/hosts/:id/verify`
- `GET /admin/properties?status=pending_review`
- `POST /admin/properties/:id/approve`
- `POST /admin/properties/:id/suspend`
- `GET /admin/bookings`

## Booking JSON example

```json
{
  "id": "bk_1",
  "propertyId": "prop_1",
  "guestId": "user_1",
  "checkIn": "2026-06-10",
  "checkOut": "2026-06-12",
  "guests": 2,
  "totalEtb": 2400,
  "status": "pending_approval",
  "paymentMethod": "pay_on_arrival",
  "paymentStatus": "unpaid"
}
```
