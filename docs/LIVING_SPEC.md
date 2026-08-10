# Ethio Guest House — Living Specification

**Version:** 0.1 (MVP hypothesis)  
**Market:** Ethiopia  
**Currency:** ETB (Ethiopian Birr)

## Product summary

A single Flutter mobile app for guests and hosts, plus a web admin panel. Guests discover guest houses, request bookings, and pay on arrival. Hosts approve or decline requests. Platform admins verify hosts, moderate listings, and view platform metrics. Telebirr integration is planned for deposits or online payment in a later phase; MVP uses **pay on arrival** only.

## Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | App shape | Single app with Guest / Host mode switch |
| 2 | Market & payments | Ethiopia; Telebirr (Phase 2); MVP = pay on arrival |
| 3 | Booking | Host must approve each reservation |
| 4 | Payment timing | Pay on arrival (cash/mobile at property) |
| 5 | Mobile stack | Flutter (iOS + Android) |
| 6 | Operations | Separate admin panel (web) |

## User roles

### Guest
- Register / sign in (phone + OTP preferred for Ethiopia)
- Search by city, dates, guests, price range
- View listing (photos, amenities, rules, location)
- Submit booking request → status `pending_approval`
- Receive notification when host approves → `confirmed`
- Pay on arrival; host marks `paid` (optional host action)
- View / cancel bookings (per cancellation policy)

### Host
- Register as host (admin may verify before listing goes live)
- Create / edit property (title, address, city, photos, capacity, nightly rate ETB)
- Manage availability calendar (block dates)
- Approve or decline booking requests
- See upcoming stays and guest contact (after confirm)

### Admin (web panel)
- Dashboard: users, listings, bookings, pending verifications
- Approve / suspend hosts and listings
- View all bookings and override status (support)
- Configure platform settings (commission %, cancellation text) — Phase 2
- Audit log for sensitive actions

## Booking state machine

```
pending_approval → confirmed → completed
                 ↘ declined
confirmed → cancelled (guest or host, per policy)
confirmed → paid (host marks on arrival — optional MVP)
```

## Payment model

| Phase | Behavior |
|-------|----------|
| **MVP** | No in-app charge. Booking shows “Pay on arrival in ETB”. Host confirms payment at check-in. |
| **Phase 2** | Telebirr: deposit or full prepay via Ethio Telecom Telebirr API (merchant integration required). |

## Telebirr (Phase 2 notes)

- Requires merchant account with Ethio Telecom / partner aggregator
- Typical flow: create payment order → redirect / USSD → webhook confirms → booking `payment_status: paid`
- Keep `PaymentService` interface in app; MVP uses `PayOnArrivalPaymentService`

## MVP screens (mobile)

**Shared:** Splash, Login, Register, Role picker (Guest / Host), Profile

**Guest:** Home search, Search results, Property detail, Booking request (dates, guests), My bookings, Booking detail

**Host:** Host home, My properties, Add/Edit property, Calendar, Reservation inbox, Reservation detail (approve/decline)

## Admin panel (web MVP)

- Login (admin only)
- Users list (filter: guest / host)
- Host verification queue
- Listings list (approve / hide)
- Bookings list (read-only + force status for support)
- Simple stats cards

**Suggested stack for admin:** Flutter Web (shared Dart models) or Next.js + REST API. This repo includes `admin/` as Flutter Web scaffold aligned with mobile models.

## Data model (core entities)

- `User` — id, phone, name, role(s), hostVerified, createdAt
- `Property` — id, hostId, title, city, address, description, nightlyRateEtb, maxGuests, amenities[], status (draft | pending_review | live | suspended)
- `AvailabilityBlock` — propertyId, date (no booking allowed)
- `Booking` — id, propertyId, guestId, checkIn, checkOut, guests, totalEtb, status, paymentMethod (pay_on_arrival | telebirr), createdAt
- `AdminAction` — audit trail

## Non-goals (MVP)

- In-app chat
- Reviews/ratings
- Multi-language (Amharic can be Phase 2; structure i18n early)
- iOS/Android push (can use Firebase later; stub notification service)

## Assumptions

- Backend will be REST or Supabase; mobile uses repository pattern with mock data until API is live
- Phone OTP auth is primary; email optional
- Cities seeded: Addis Ababa, Hawassa, Bahir Dar, Mekelle, etc.

## Slice board

| Slice | Scope | Status |
|-------|--------|--------|
| S1 | Flutter scaffold, models, mock repos, guest browse + request | In progress |
| S2 | Host property CRUD + approve/decline | Planned |
| S3 | Backend API + auth | Planned |
| S4 | Admin web + admin API | Planned |
| S5 | Telebirr integration | Planned |
