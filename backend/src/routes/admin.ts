import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/database";
import { bookingToJson, propertyToJson, userToJson } from "../db/mappers";
import { requireAdmin } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type {
  BookingRequestRow,
  BookingRow,
  PropertyRow,
  UserRow,
} from "../types";
import { getAnalyticsSummary } from "../utils/analytics";
import {
  enrichBookingRequest,
  listAdminMessages,
} from "../utils/bookingRequests";
import { newId } from "../utils/ids";

const router = Router();

router.use(requireAdmin);

function enrichAdminBooking(row: BookingRow) {
  const prop = getDb()
    .prepare("SELECT title, city FROM properties WHERE id = ?")
    .get(row.property_id) as { title: string; city: string } | undefined;
  const guest = getDb()
    .prepare("SELECT name, phone, guest_country FROM users WHERE id = ?")
    .get(row.guest_id) as
    | { name: string; phone: string; guest_country: string | null }
    | undefined;
  return bookingToJson(row, {
    propertyTitle: prop?.title,
    propertyCity: prop?.city,
    guestName: guest?.name,
    guestPhone: guest?.phone,
    guestCountry: guest?.guest_country,
  });
}

function setBookingStatus(bookingId: string, status: "confirmed" | "declined") {
  const booking = getDb()
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as BookingRow | undefined;
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  if (booking.status !== "pending_approval") {
    throw new HttpError(400, "Booking is not pending approval");
  }
  getDb().prepare(`UPDATE bookings SET status = ? WHERE id = ?`).run(status, bookingId);
  return getDb()
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as BookingRow;
}

router.get("/stats", (_req, res, next) => {
  try {
    const db = getDb();
    const users = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
    const liveListings = (
      db.prepare("SELECT COUNT(*) as c FROM properties WHERE status = 'live'").get() as {
        c: number;
      }
    ).c;
    const pendingHosts = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM users WHERE roles LIKE '%host%' AND host_verified = 0`
        )
        .get() as { c: number }
    ).c;
    const pendingReview = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM properties WHERE status = 'pending_review'`
        )
        .get() as { c: number }
    ).c;
    const pendingBookings = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM bookings WHERE status = 'pending_approval'`
        )
        .get() as { c: number }
    ).c;
    const openRequests = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM booking_requests WHERE status IN ('new', 'contacted')`
        )
        .get() as { c: number }
    ).c;
    const bookings30d = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM bookings WHERE created_at >= datetime('now', '-30 days')`
        )
        .get() as { c: number }
    ).c;
    const platformRevenueEtb = (
      db
        .prepare(
          `SELECT COALESCE(SUM(platform_fee_etb), 0) as s FROM bookings
           WHERE status IN ('confirmed', 'completed')`
        )
        .get() as { s: number }
    ).s;

    const analytics = getAnalyticsSummary(30);

    res.json({
      stats: {
        users,
        liveListings,
        pendingHostVerification: pendingHosts,
        pendingListingReview: pendingReview,
        pendingBookingRequests: pendingBookings,
        openGuestMessages: openRequests,
        bookingsLast30Days: bookings30d,
        platformRevenueEtb,
        pageViews30d: analytics.pageViews,
        uniqueVisitors30d: analytics.uniqueVisitors,
        contactClicks30d: analytics.contactClicks,
        phoneClicks30d: analytics.phoneClicks,
        whatsappClicks30d: analytics.whatsappClicks,
        viberClicks30d: analytics.viberClicks,
        emailClicks30d: analytics.emailClicks,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/messages", (req, res, next) => {
  try {
    const status =
      typeof req.query.status === "string" && req.query.status.length > 0
        ? req.query.status
        : undefined;
    const messages = listAdminMessages(status);
    res.json({
      messages,
      pendingCount: messages.filter((m) => m.status === "new").length,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/messages/:id/contacted", (req, res, next) => {
  try {
    const row = getDb()
      .prepare("SELECT * FROM booking_requests WHERE id = ?")
      .get(req.params.id) as BookingRequestRow | undefined;
    if (!row) throw new HttpError(404, "Message not found");

    getDb()
      .prepare(`UPDATE booking_requests SET status = 'contacted' WHERE id = ?`)
      .run(req.params.id);

    const updated = getDb()
      .prepare("SELECT * FROM booking_requests WHERE id = ?")
      .get(req.params.id) as BookingRequestRow;

    res.json({ message: enrichBookingRequest(updated) });
  } catch (e) {
    next(e);
  }
});

router.post("/messages/:id/approve", (req, res, next) => {
  try {
    const row = getDb()
      .prepare("SELECT * FROM booking_requests WHERE id = ?")
      .get(req.params.id) as BookingRequestRow | undefined;
    if (!row) throw new HttpError(404, "Message not found");

    if (row.booking_id) {
      setBookingStatus(row.booking_id, "confirmed");
    }

    getDb()
      .prepare(`UPDATE booking_requests SET status = 'approved' WHERE id = ?`)
      .run(req.params.id);

    getDb()
      .prepare(
        `INSERT INTO admin_actions (admin_id, action, target_type, target_id)
         VALUES (?, 'approve_booking_request', 'booking_request', ?)`
      )
      .run(req.headers["x-admin-user-id"] ?? "api_key", req.params.id);

    const updated = getDb()
      .prepare("SELECT * FROM booking_requests WHERE id = ?")
      .get(req.params.id) as BookingRequestRow;

    res.json({ message: enrichBookingRequest(updated) });
  } catch (e) {
    next(e);
  }
});

router.post("/messages/:id/decline", (req, res, next) => {
  try {
    const row = getDb()
      .prepare("SELECT * FROM booking_requests WHERE id = ?")
      .get(req.params.id) as BookingRequestRow | undefined;
    if (!row) throw new HttpError(404, "Message not found");

    if (row.booking_id) {
      setBookingStatus(row.booking_id, "declined");
    }

    getDb()
      .prepare(`UPDATE booking_requests SET status = 'declined' WHERE id = ?`)
      .run(req.params.id);

    getDb()
      .prepare(
        `INSERT INTO admin_actions (admin_id, action, target_type, target_id)
         VALUES (?, 'decline_booking_request', 'booking_request', ?)`
      )
      .run(req.headers["x-admin-user-id"] ?? "api_key", req.params.id);

    const updated = getDb()
      .prepare("SELECT * FROM booking_requests WHERE id = ?")
      .get(req.params.id) as BookingRequestRow;

    res.json({ message: enrichBookingRequest(updated) });
  } catch (e) {
    next(e);
  }
});

router.post("/bookings/:id/approve", (req, res, next) => {
  try {
    const row = setBookingStatus(req.params.id, "confirmed");
    getDb()
      .prepare(
        `UPDATE booking_requests SET status = 'approved' WHERE booking_id = ?`
      )
      .run(req.params.id);
    res.json({ booking: enrichAdminBooking(row) });
  } catch (e) {
    next(e);
  }
});

router.post("/bookings/:id/decline", (req, res, next) => {
  try {
    const row = setBookingStatus(req.params.id, "declined");
    getDb()
      .prepare(
        `UPDATE booking_requests SET status = 'declined' WHERE booking_id = ?`
      )
      .run(req.params.id);
    res.json({ booking: enrichAdminBooking(row) });
  } catch (e) {
    next(e);
  }
});
router.get("/analytics", (req, res, next) => {
  try {
    const days = Math.min(
      90,
      Math.max(1, parseInt(String(req.query.days ?? "30"), 10) || 30)
    );
    res.json({ analytics: getAnalyticsSummary(days) });
  } catch (e) {
    next(e);
  }
});

router.get("/users", (_req, res, next) => {
  try {
    const rows = getDb()
      .prepare("SELECT * FROM users ORDER BY created_at DESC")
      .all() as UserRow[];
    res.json({ users: rows.map(userToJson) });
  } catch (e) {
    next(e);
  }
});

router.get("/admins", (_req, res, next) => {
  try {
    const rows = getDb()
      .prepare(`SELECT * FROM users WHERE roles LIKE '%admin%' ORDER BY name ASC`)
      .all() as UserRow[];
    res.json({ admins: rows.map(userToJson) });
  } catch (e) {
    next(e);
  }
});

router.post("/admins/grant", (req, res, next) => {
  try {
    const body = z
      .object({
        phone: z.string().min(9).max(20),
        name: z.string().min(2).max(80).optional(),
      })
      .parse(req.body);

    const phone = normalizeAdminPhone(body.phone);
    const db = getDb();
    let user = db
      .prepare("SELECT * FROM users WHERE phone = ?")
      .get(phone) as UserRow | undefined;

    if (!user) {
      const id = newId("admin");
      db.prepare(
        `INSERT INTO users (id, phone, name, roles, host_verified)
         VALUES (?, ?, ?, 'admin', 0)`
      ).run(id, phone, body.name?.trim() || "Admin");
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow;
    } else {
      const roles = new Set(user.roles.split(",").filter(Boolean));
      roles.add("admin");
      db.prepare(`UPDATE users SET roles = ? WHERE id = ?`).run(
        [...roles].join(","),
        user.id
      );
      if (body.name?.trim()) {
        db.prepare(`UPDATE users SET name = ? WHERE id = ?`).run(
          body.name.trim(),
          user.id
        );
      }
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as UserRow;
    }

    db.prepare(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id)
       VALUES (?, 'grant_admin', 'user', ?)`
    ).run(req.headers["x-admin-user-id"] ?? "api_key", user.id);

    res.json({
      admin: userToJson(user),
      message: `${user.name} (${user.phone}) can now sign in as admin.`,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/admins/revoke", (req, res, next) => {
  try {
    const body = z.object({ phone: z.string().min(9).max(20) }).parse(req.body);
    const phone = normalizeAdminPhone(body.phone);
    const db = getDb();
    const user = db
      .prepare("SELECT * FROM users WHERE phone = ?")
      .get(phone) as UserRow | undefined;

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const roles = user.roles
      .split(",")
      .filter(Boolean)
      .filter((r) => r !== "admin");
    if (roles.length === 0) roles.push("guest");

    db.prepare(`UPDATE users SET roles = ? WHERE id = ?`).run(roles.join(","), user.id);
    db.prepare(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id)
       VALUES (?, 'revoke_admin', 'user', ?)`
    ).run(req.headers["x-admin-user-id"] ?? "api_key", user.id);

    const updated = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(user.id) as UserRow;

    res.json({
      user: userToJson(updated),
      message: `Admin access removed for ${updated.phone}.`,
    });
  } catch (e) {
    next(e);
  }
});

function normalizeAdminPhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("+") && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith("251") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  throw new HttpError(400, "Enter a valid phone, e.g. 0988013094 or +251988013094");
}
router.post("/hosts/:id/verify", (req, res, next) => {
  try {
    const user = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as UserRow | undefined;

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    getDb()
      .prepare(`UPDATE users SET host_verified = 1 WHERE id = ?`)
      .run(req.params.id);

    getDb()
      .prepare(
        `INSERT INTO admin_actions (admin_id, action, target_type, target_id)
         VALUES (?, 'verify_host', 'user', ?)`
      )
      .run(req.headers["x-admin-user-id"] ?? "api_key", req.params.id);

    const updated = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as UserRow;

    res.json({ user: userToJson(updated) });
  } catch (e) {
    next(e);
  }
});

router.get("/properties", (req, res, next) => {
  try {
    const status = (req.query.status as string) ?? "pending_review";
    const rows = getDb()
      .prepare("SELECT * FROM properties WHERE status = ? ORDER BY created_at DESC")
      .all(status) as PropertyRow[];

    res.json({ properties: rows.map(propertyToJson) });
  } catch (e) {
    next(e);
  }
});

router.post("/properties/:id/approve", (req, res, next) => {
  try {
    getDb()
      .prepare(`UPDATE properties SET status = 'live' WHERE id = ?`)
      .run(req.params.id);

    const row = getDb()
      .prepare("SELECT * FROM properties WHERE id = ?")
      .get(req.params.id) as PropertyRow | undefined;

    if (!row) {
      throw new HttpError(404, "Property not found");
    }

    res.json({ property: propertyToJson(row) });
  } catch (e) {
    next(e);
  }
});

router.post("/properties/:id/suspend", (req, res, next) => {
  try {
    getDb()
      .prepare(`UPDATE properties SET status = 'suspended' WHERE id = ?`)
      .run(req.params.id);

    const row = getDb()
      .prepare("SELECT * FROM properties WHERE id = ?")
      .get(req.params.id) as PropertyRow | undefined;

    if (!row) {
      throw new HttpError(404, "Property not found");
    }

    res.json({ property: propertyToJson(row) });
  } catch (e) {
    next(e);
  }
});

router.get("/bookings", (req, res, next) => {
  try {
    const status =
      typeof req.query.status === "string" && req.query.status.length > 0
        ? req.query.status
        : undefined;

    const rows = (
      status
        ? getDb()
            .prepare(
              `SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC`
            )
            .all(status)
        : getDb()
            .prepare(`SELECT * FROM bookings ORDER BY created_at DESC`)
            .all()
    ) as BookingRow[];

    res.json({ bookings: rows.map(enrichAdminBooking) });
  } catch (e) {
    next(e);
  }
});

export default router;
