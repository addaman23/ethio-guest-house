# Ethio Guest House

Guest house booking platform for **Ethiopia**: one Flutter mobile app (guest + host), pay on arrival (ETB), host approval flow, **Telebirr** planned for Phase 2, and a **web admin panel**.

## Your decisions (locked)

| Topic | Choice |
|-------|--------|
| App | Single app, switch Guest / Host |
| Market | Ethiopia, ETB |
| Booking | Host approves each request |
| Payment (MVP) | Pay on arrival |
| Payment (later) | Telebirr |
| Mobile | Flutter |
| Operations | Admin web panel |

## Project layout

```
ethio_guest_house/
  docs/           LIVING_SPEC.md, API_CONTRACT.md
  backend/        Node.js + Express API (SQLite) + public SEO website
  mobile/         Flutter iOS + Android app
  admin/          Flutter Web admin panel (scaffold)
```

## Public website (searchable)

The guest-facing site is served from the API process (server-rendered HTML for Google):

- Home: `http://localhost:3000/`
- Browse: `http://localhost:3000/guest-houses`
- City pages: `http://localhost:3000/guest-houses/city/addis-ababa`
- Stay + videos: `http://localhost:3000/stay/prop_1`
- Sitemap: `http://localhost:3000/sitemap.xml`
- Operator demo: `http://localhost:3000/demo`

**Production domain:** [ethioguesthouses.com](https://ethioguesthouses.com)

**Owner analytics:** [http://localhost:3000/owner](http://localhost:3000/owner) (admin API key) — page views, unique visitors, WhatsApp / Viber / phone / email taps.

**Your contact details:** set `CONTACT_EMAIL`, `CONTACT_PHONE`, `CONTACT_WHATSAPP`, `CONTACT_VIBER` in `backend/.env`.

1. Buy **ethioguesthouses.com** (and ideally **www**).
2. Deploy the `backend/` app to a host (Railway, Render, VPS, etc.).
3. Point DNS A/CNAME records to that host.
4. On the server, use `PUBLIC_BASE_URL=https://ethioguesthouses.com` (see `backend/.env.production.example`).
5. Submit `https://ethioguesthouses.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

**House videos:** hosts add YouTube/Vimeo links or upload MP4/WebM via the demo Host tab (or API `POST /v1/host/properties/:id/videos`).

## Prerequisites

1. Install [Flutter](https://docs.flutter.dev/get-started/install/windows) and add to PATH.
2. Run `flutter doctor` until Android toolchain (and optionally iOS) are OK.

## See everything running

```powershell
.\START.ps1
```

Then open **http://localhost:8080** (mobile) and **http://localhost:8081** (admin).  
Full walkthrough: [DEMO.md](DEMO.md)

## Run the API (Node)

```powershell
cd C:\Users\Hp\ethio_guest_house\backend
copy .env.example .env
npm install
npm run dev
```

Website: `http://localhost:3000` · API: `http://localhost:3000/v1` — see [backend/README.md](backend/README.md) for auth and demo phones.

## Run the mobile app

```powershell
cd C:\Users\Hp\ethio_guest_house\mobile
flutter pub get
flutter run
```

**Demo flow:** Login → “Demo: skip to role picker” → Guest or Host → browse / request booking or approve reservations.

## Run the admin panel (web)

```powershell
cd C:\Users\Hp\ethio_guest_house\admin
flutter pub get
flutter run -d chrome
```

Admin UI is a scaffold; wire it to your backend using `docs/API_CONTRACT.md`.

## Next build slices

1. **Wire Flutter to API** — replace mock repositories with HTTP client pointing at `http://localhost:3000/v1` (use `10.0.2.2` on Android emulator)
2. **PostgreSQL** — optional migration from SQLite for production
2. **Host** — Add/edit property, photo upload, availability calendar
3. **Admin API** — Host verification, listing moderation, stats
4. **Telebirr** — Merchant integration; replace `TelebirrPaymentService` stub

## Documentation

- Product spec: [docs/LIVING_SPEC.md](docs/LIVING_SPEC.md)
- API draft: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
