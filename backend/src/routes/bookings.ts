import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/database";
import { bookingToJson } from "../db/mappers";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type { BookingRow, PropertyRow, UserRow } from "../types";
import { newId, nightsBetween } from "../utils/ids";
import { calculateBookingPricing, depositDueDate } from "../utils/bookingPricing";
import { syncBookingToRequestInbox } from "../utils/bookingRequests";
import {
  ensureBookingDepositFields,
  markDepositPaid,
} from "../utils/deposit";

const router = Router();

function enrichBooking(row: BookingRow) {
  const ensured = ensureBookingDepositFields(row);
  const db = getDb();
  const prop = db
    .prepare("SELECT title, city FROM properties WHERE id = ?")
    .get(ensured.property_id) as { title: string; city: string } | undefined;
  const guest = db
    .prepare("SELECT name, phone, guest_country FROM users WHERE id = ?")
    .get(ensured.guest_id) as
    | { name: string; phone: string; guest_country: string | null }
    | undefined;

  return bookingToJson(ensured, {
    propertyTitle: prop?.title,
    propertyCity: prop?.city,
    guestName: guest?.name,
    guestPhone: guest?.phone,
    guestCountry: guest?.guest_country,
  });
}

router.use(requireAuth);

router.get("/mine", (req, res, next) => {
  try {
    const rows = getDb()
      .prepare(
        `SELECT * FROM bookings WHERE guest_id = ? ORDER BY created_at DESC`
      )
      .all(req.user!.id) as BookingRow[];

    res.json({ bookings: rows.map(enrichBooking) });
  } catch (e) {
    next(e);
  }
});

router.post("/", (req, res, next) => {
  try {
    const body = z
      .object({
        propertyId: z.string(),
        checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        guests: z.number().int().min(1).max(20),
        message: z.string().max(1000).optional(),
      })
      .parse(req.body);

    const property = getDb()
      .prepare("SELECT * FROM properties WHERE id = ? AND status = 'live'")
      .get(body.propertyId) as PropertyRow | undefined;

    if (!property) {
      throw new HttpError(404, "Property not available");
    }

    if (body.guests > property.max_guests) {
      throw new HttpError(400, `Maximum ${property.max_guests} guests allowed`);
    }

    const nights = nightsBetween(body.checkIn, body.checkOut);
    if (nights < 1) {
      throw new HttpError(400, "Check-out must be after check-in");
    }

    const id = newId("bk");
    const pricing = calculateBookingPricing(property.nightly_rate_etb, nights);
    const depositDueAt = depositDueDate(body.checkIn);
    const guestMessage = body.message?.trim() || null;

    getDb()
      .prepare(
        `INSERT INTO bookings (
          id, property_id, guest_id, check_in, check_out, guests,
          total_etb, subtotal_etb, platform_fee_etb, host_payout_etb,
          status, payment_method, payment_status, guest_message,
          deposit_etb, deposit_due_at, deposit_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', 'pay_on_arrival', 'unpaid', ?, ?, ?, 'not_due')`
      )
      .run(
        id,
        body.propertyId,
        req.user!.id,
        body.checkIn,
        body.checkOut,
        body.guests,
        pricing.totalEtb,
        pricing.subtotalEtb,
        pricing.platformFeeEtb,
        pricing.hostPayoutEtb,
        guestMessage,
        pricing.depositEtb,
        depositDueAt
      );

    const row = getDb()
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(id) as BookingRow;

    syncBookingToRequestInbox(row);

    res.status(201).json({ booking: enrichBooking(row) });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/cancel", (req, res, next) => {
  try {
    const row = getDb()
      .prepare("SELECT * FROM bookings WHERE id = ? AND guest_id = ?")
      .get(req.params.id, req.user!.id) as BookingRow | undefined;

    if (!row) {
      throw new HttpError(404, "Booking not found");
    }

    if (!["pending_approval", "confirmed"].includes(row.status)) {
      throw new HttpError(400, "Booking cannot be cancelled");
    }

    getDb()
      .prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`)
      .run(req.params.id);

    const updated = getDb()
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(req.params.id) as BookingRow;

    res.json({ booking: enrichBooking(updated) });
  } catch (e) {
    next(e);
  }
});

/** Demo / guest self-confirm: mark 10% deposit paid after WhatsApp payment. */
router.post("/:id/deposit-paid", (req, res, next) => {
  try {
    const row = getDb()
      .prepare("SELECT * FROM bookings WHERE id = ? AND guest_id = ?")
      .get(req.params.id, req.user!.id) as BookingRow | undefined;

    if (!row) {
      throw new HttpError(404, "Booking not found");
    }
    if (row.status !== "confirmed") {
      throw new HttpError(400, "Only confirmed bookings accept deposit payment");
    }
    if (row.deposit_status === "paid") {
      res.json({ booking: enrichBooking(row) });
      return;
    }

    const updated = markDepositPaid(row.id);
    res.json({ booking: enrichBooking(updated) });
  } catch (e) {
    next(e);
  }
});

export default router;
