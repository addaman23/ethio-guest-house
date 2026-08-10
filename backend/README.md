# Ethio Guest House — Node API

Express + TypeScript REST API for the Ethiopia guest house booking platform.

## Stack

- **Express** — HTTP server
- **SQLite** (`better-sqlite3`) — file database (swap to PostgreSQL later without changing routes)
- **JWT** — auth after phone OTP
- **Zod** — request validation

## Quick start

```powershell
cd C:\Users\Hp\ethio_guest_house\backend
copy .env.example .env
npm install
npm run dev
```

Server: `http://localhost:3000`  
API base: `http://localhost:3000/v1`

## Demo accounts (seeded)

| Role  | Phone           | OTP (dev) |
|-------|-----------------|-----------|
| Guest | +251911000001    | 123456    |
| Host  | +251988013094    | 123456    |
| Admin | +251911000099    | 123456    |

## Auth flow

```http
POST /v1/auth/otp/request
{ "phone": "+251911000001" }

POST /v1/auth/otp/verify
{ "phone": "+251911000001", "code": "123456" }
→ { "token": "...", "user": { ... } }
```

Use header on protected routes: `Authorization: Bearer <token>`

## Main endpoints

| Area   | Method | Path |
|--------|--------|------|
| Guest  | GET | `/v1/properties?city=Addis%20Ababa` |
| Guest  | GET | `/v1/properties/:id` |
| Guest  | POST | `/v1/bookings` |
| Guest  | GET | `/v1/bookings/mine` |
| Host   | GET | `/v1/host/properties` |
| Host   | POST | `/v1/host/properties` |
| Host   | GET | `/v1/host/bookings?status=pending_approval` |
| Host   | POST | `/v1/host/bookings/:id/approve` |
| Host   | POST | `/v1/host/bookings/:id/decline` |
| Host   | POST | `/v1/host/bookings/:id/mark-paid` |
| Admin  | GET | `/v1/admin/stats` |
| Admin  | GET | `/v1/admin/users` |
| Admin  | POST | `/v1/admin/hosts/:id/verify` |

Full contract: [../docs/API_CONTRACT.md](../docs/API_CONTRACT.md)

## Admin access

Either:

- JWT for user with `admin` role (`+251911000099`), or
- Header: `X-Admin-Key: dev-admin-key` (from `.env`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled server |
| `npm run db:seed` | Re-run seed (skips if users exist) |

## Production notes

- Set strong `JWT_SECRET` and `ADMIN_API_KEY`
- Replace demo OTP with Ethiopian SMS provider
- Use PostgreSQL by changing `database.ts` (or add Prisma)
- Add Telebirr webhook route under `/v1/payments/telebirr` (Phase 2)
