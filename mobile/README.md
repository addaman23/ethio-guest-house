# Mobile app (Flutter)

## Structure

- `lib/domain/` — models and enums
- `lib/data/repositories/` — `PropertyRepository`, `BookingRepository` (+ mocks)
- `lib/core/services/` — `PayOnArrivalPaymentService`, `TelebirrPaymentService` (stub)
- `lib/features/guest/` — search, detail, booking request, my bookings
- `lib/features/host/` — dashboard, approve/decline reservations
- `lib/features/auth/` — login, role picker

## Run

```powershell
flutter pub get
flutter run
```
