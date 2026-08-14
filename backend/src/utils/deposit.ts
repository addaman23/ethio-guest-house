import { config } from "../config";
import { getDb } from "../db/database";
import type { BookingRow, NotificationRow } from "../types";
import { depositDueDate } from "./bookingPricing";
import { newId } from "./ids";

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function resolveDepositEtb(row: BookingRow): number {
  if (row.deposit_etb > 0) return row.deposit_etb;
  const subtotal = row.subtotal_etb > 0 ? row.subtotal_etb : row.total_etb;
  return Math.round(subtotal * config.platformCommissionRate);
}

export function resolveDepositDueAt(row: BookingRow): string {
  return row.deposit_due_at || depositDueDate(row.check_in);
}

export function balanceOnArrivalEtb(row: BookingRow): number {
  const subtotal = row.subtotal_etb > 0 ? row.subtotal_etb : row.total_etb;
  return Math.max(0, subtotal - resolveDepositEtb(row));
}

/** Guest pays deposit to platform WhatsApp. */
export function depositPayWhatsappHref(row: BookingRow, guestName?: string): string {
  const amount = resolveDepositEtb(row);
  const due = resolveDepositDueAt(row);
  const text = [
    `Hello AddisAbaba Guest Houses — I am paying my 10% deposit.`,
    `Booking: ${row.id}`,
    `Guest: ${guestName ?? "Guest"}`,
    `Check-in: ${row.check_in}`,
    `Deposit due: ${due}`,
    `Amount: ${amount.toLocaleString("en-ET")} ETB`,
  ].join("\n");
  return `https://wa.me/${digitsOnly(config.contactWhatsapp)}?text=${encodeURIComponent(text)}`;
}

/** Host/admin reminds the guest on WhatsApp. */
export function depositRemindGuestWhatsappHref(
  guestPhone: string,
  row: BookingRow,
  guestName?: string
): string | null {
  const digits = digitsOnly(guestPhone);
  if (!digits) return null;
  const amount = resolveDepositEtb(row);
  const due = resolveDepositDueAt(row);
  const text = [
    `Hello ${guestName ?? "guest"},`,
    `Reminder from AddisAbaba Guest Houses: your 10% deposit is due by ${due} (1 day before check-in ${row.check_in}).`,
    `Please pay ${amount.toLocaleString("en-ET")} ETB. The remaining balance is paid on arrival.`,
    `Booking: ${row.id}`,
  ].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Ensure deposit columns are filled for legacy rows. */
export function ensureBookingDepositFields(row: BookingRow): BookingRow {
  const depositEtb = resolveDepositEtb(row);
  const dueAt = resolveDepositDueAt(row);
  if (
    row.deposit_etb === depositEtb &&
    row.deposit_due_at === dueAt &&
    row.deposit_status
  ) {
    return row;
  }
  getDb()
    .prepare(
      `UPDATE bookings
       SET deposit_etb = ?,
           deposit_due_at = COALESCE(deposit_due_at, ?),
           deposit_status = COALESCE(NULLIF(deposit_status, ''), 'not_due')
       WHERE id = ?`
    )
    .run(depositEtb, dueAt, row.id);
  return getDb()
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(row.id) as BookingRow;
}

export function markDepositPaid(bookingId: string): BookingRow {
  const row = getDb()
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as BookingRow | undefined;
  if (!row) {
    throw new Error("Booking not found");
  }
  getDb()
    .prepare(
      `UPDATE bookings SET deposit_status = 'paid' WHERE id = ?`
    )
    .run(bookingId);
  return getDb()
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as BookingRow;
}

export function createDepositDueNotification(row: BookingRow): NotificationRow {
  const amount = resolveDepositEtb(row);
  const due = resolveDepositDueAt(row);
  const id = newId("ntf");
  const title = "Pay your 10% deposit";
  const body = `Your stay starts ${row.check_in}. Please pay ${amount.toLocaleString("en-ET")} ETB by ${due}. Remaining balance is paid on arrival.`;
  getDb()
    .prepare(
      `INSERT INTO notifications (id, user_id, booking_id, type, title, body)
       VALUES (?, ?, ?, 'deposit_due', ?, ?)`
    )
    .run(id, row.guest_id, row.id, title, body);
  return getDb()
    .prepare("SELECT * FROM notifications WHERE id = ?")
    .get(id) as NotificationRow;
}
