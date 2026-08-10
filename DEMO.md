# See the final product

## Fastest way (browser only — no Flutter needed)

```powershell
cd C:\Users\Hp\ethio_guest_house\backend
npm run dev
```

Open **http://localhost:3000** in Chrome/Edge.

You get the full demo: Guest book → Host approve → Admin stats & listing approval.

---

## Full stack with Flutter UI (Windows)

```powershell
cd C:\Users\Hp\ethio_guest_house
.\START.ps1
```

Opens 3 windows:

| App | URL |
|-----|-----|
| **API** | http://localhost:3000/health |
| **Mobile** (guest + host) | http://localhost:8080 |
| **Admin** | http://localhost:8081 |

## Demo walkthrough (5 minutes)

### 1. Guest books a stay

1. Open **http://localhost:8080**
2. Tap **Guest** quick login (or phone `+251911000001`, OTP `123456`)
3. Choose **Guest** mode
4. Pick a city or browse all → open **Green View Guest House**
5. **Request booking** → select dates → **Send request to host**

### 2. Host approves

1. Sign out → sign in as **Host** (`+251988013094`, OTP `123456`)
2. Open **Inbox** (reservations)
3. **Approve** the pending request
4. Optional: **Mark paid on arrival** after guest checks in

### 3. Admin moderates

1. Open **http://localhost:8081**
2. **Dashboard** — live stats from API
3. **Listings** — approve **Bahir Dar Comfort Stay** (`pending_review`)
4. **Bookings** — see all platform bookings

## Manual start (if START.ps1 fails)

**Terminal 1 — API**

```powershell
cd backend
npm install
npm run dev
```

**Terminal 2 — Mobile**

```powershell
cd mobile
flutter pub get
flutter run -d chrome --web-port=8080
```

**Terminal 3 — Admin**

```powershell
cd admin
flutter pub get
flutter run -d chrome --web-port=8081
```

## Android emulator

API URL uses `10.0.2.2` automatically on Android. Run:

```powershell
cd mobile
flutter run
```

## Phones (demo)

| Role | Phone | OTP |
|------|-------|-----|
| Guest | +251911000001 | 123456 |
| Host | +251988013094 | 123456 |
| Admin | +251911000099 | 123456 |
