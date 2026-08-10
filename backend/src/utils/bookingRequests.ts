import { getDb } from "../db/database";
import type { BookingRequestRow, BookingRow, PropertyRow, UserRow } from "../types";
import { newId } from "./ids";

export function bookingRequestToJson(
  row: BookingRequestRow,
  extras?: { propertyTitle?: string; propertyCity?: string }
) {
  const phoneDigits = row.guest_phone.replace(/[^\d]/g, "");
  return {
    id: row.id,
    type: "booking_request" as const,
    propertyId: row.property_id,
    propertyTitle: extras?.propertyTitle ?? null,
    propertyCity: extras?.propertyCity ?? null,
    bookingId: row.booking_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    guestEmail: row.guest_email,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    message: row.message,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    contact: {
      whatsapp: phoneDigits
        ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
            `Hello ${row.guest_name}, regarding your Ethio Guest Houses booking request.`
          )}`
        : null,
      phone: `tel:${row.guest_phone.replace(/\s/g, "")}`,
      email: row.guest_email
        ? `mailto:${row.guest_email}?subject=${encodeURIComponent(
            "Ethio Guest Houses booking request"
          )}`
        : null,
      viber: phoneDigits ? `viber://chat?number=%2B${phoneDigits}` : null,
    },
  };
}

export function createBookingRequest(input: {
  propertyId?: string | null;
  bookingId?: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number;
  message?: string | null;
  source?: string;
  status?: string;
}): BookingRequestRow {
  const id = newId("req");
  getDb()
    .prepare(
      `INSERT INTO booking_requests (
        id, property_id, booking_id, guest_name, guest_phone, guest_email,
        check_in, check_out, guests, message, status, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.propertyId ?? null,
      input.bookingId ?? null,
      input.guestName,
      input.guestPhone,
      input.guestEmail ?? null,
      input.checkIn ?? null,
      input.checkOut ?? null,
      input.guests ?? 1,
      input.message ?? null,
      input.status ?? "new",
      input.source ?? "website"
    );

  return getDb()
    .prepare("SELECT * FROM booking_requests WHERE id = ?")
    .get(id) as BookingRequestRow;
}

/** Mirror app/demo bookings into the admin message inbox. */
export function syncBookingToRequestInbox(booking: BookingRow): void {
  const existing = getDb()
    .prepare("SELECT id FROM booking_requests WHERE booking_id = ?")
    .get(booking.id) as { id: string } | undefined;
  if (existing) return;

  const guest = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(booking.guest_id) as UserRow | undefined;
  if (!guest) return;

  createBookingRequest({
    propertyId: booking.property_id,
    bookingId: booking.id,
    guestName: guest.name,
    guestPhone: guest.phone,
    guestEmail: null,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    guests: booking.guests,
    message: booking.guest_message,
    source: "app",
    status: booking.status === "pending_approval" ? "new" : "closed",
  });
}

export function enrichBookingRequest(row: BookingRequestRow) {
  let propertyTitle: string | undefined;
  let propertyCity: string | undefined;
  if (row.property_id) {
    const prop = getDb()
      .prepare("SELECT title, city FROM properties WHERE id = ?")
      .get(row.property_id) as Pick<PropertyRow, "title" | "city"> | undefined;
    propertyTitle = prop?.title;
    propertyCity = prop?.city;
  }
  return bookingRequestToJson(row, { propertyTitle, propertyCity });
}

export function listAdminMessages(status?: string) {
  const db = getDb();

  // Keep inbox in sync with any pending bookings that were never mirrored
  const pendingBookings = db
    .prepare(`SELECT * FROM bookings WHERE status = 'pending_approval'`)
    .all() as BookingRow[];
  for (const b of pendingBookings) {
    syncBookingToRequestInbox(b);
  }

  let sql = `SELECT * FROM booking_requests`;
  const params: unknown[] = [];
  if (status) {
    sql += ` WHERE status = ?`;
    params.push(status);
  } else {
    sql += ` WHERE status IN ('new', 'contacted')`;
  }
  sql += ` ORDER BY created_at DESC`;

  const rows = db.prepare(sql).all(...params) as BookingRequestRow[];
  return rows.map(enrichBookingRequest);
}
