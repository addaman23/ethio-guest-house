import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/database";
import { bookingToJson, propertyToJson, serializeRoles, parseRoles, userToJson } from "../db/mappers";
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
import {
  ensureBookingDepositFields,
  markDepositPaid,
} from "../utils/deposit";
import { newId } from "../utils/ids";

const router = Router();

router.use(requireAdmin);

function enrichAdminBooking(row: BookingRow) {
  const ensured = ensureBookingDepositFields(row);
  const prop = getDb()
    .prepare("SELECT title, city FROM properties WHERE id = ?")
    .get(ensured.property_id) as { title: string; city: string } | undefined;
  const guest = getDb()
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
    const depositsPaid = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM bookings
           WHERE status IN ('confirmed', 'completed') AND deposit_status = 'paid'`
        )
        .get() as { c: number }
    ).c;
    const depositsAwaiting = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM bookings
           WHERE status = 'confirmed'
             AND deposit_status IN ('not_due', 'due', 'reminded')`
        )
        .get() as { c: number }
    ).c;
    const depositsPaidEtb = (
      db
        .prepare(
          `SELECT COALESCE(SUM(deposit_etb), 0) as s FROM bookings
           WHERE deposit_status = 'paid'`
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
        depositsPaid,
        depositsAwaitingPayment: depositsAwaiting,
        depositsPaidEtb,
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

router.post("/bookings/:id/deposit-paid", (req, res, next) => {
  try {
    const booking = getDb()
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(req.params.id) as BookingRow | undefined;
    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }
    if (booking.status !== "confirmed") {
      throw new HttpError(400, "Only confirmed bookings accept deposit payment");
    }
    const row = markDepositPaid(booking.id);
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

/** Hosts only (verified + pending), for moderation. */
router.get("/hosts", (_req, res, next) => {
  try {
    const rows = getDb()
      .prepare(
        `SELECT * FROM users
         WHERE roles LIKE '%host%' OR host_blocked = 1
         ORDER BY host_blocked DESC, host_verified ASC, name ASC`
      )
      .all() as UserRow[];
    const hosts = rows.map((row) => {
      const listings = getDb()
        .prepare(
          `SELECT COUNT(*) as c,
                  SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live
           FROM properties WHERE host_id = ?`
        )
        .get(row.id) as { c: number; live: number | null };
      return {
        ...userToJson(row),
        listingCount: listings.c,
        liveListingCount: listings.live ?? 0,
      };
    });
    res.json({ hosts });
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
    if ((user.host_blocked ?? 0) === 1) {
      throw new HttpError(400, "Host is blocked. Reinstate them before verifying.");
    }

    const roles = new Set(parseRoles(user.roles));
    roles.add("host");

    getDb()
      .prepare(`UPDATE users SET host_verified = 1, roles = ?, host_blocked = 0 WHERE id = ?`)
      .run(serializeRoles([...roles]), req.params.id);

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

/**
 * Remove a host for misconduct: strip host role, unverify, block re-register,
 * and suspend all of their listings.
 */
router.post("/hosts/:id/remove", (req, res, next) => {
  try {
    const body = z
      .object({
        reason: z.string().min(3).max(500).optional(),
      })
      .parse(req.body ?? {});

    const user = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as UserRow | undefined;

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const roles = parseRoles(user.roles);
    if (!roles.includes("host") && (user.host_blocked ?? 0) !== 1) {
      throw new HttpError(400, "User is not a host");
    }
    if (roles.includes("admin")) {
      throw new HttpError(400, "Cannot remove an admin account as a host this way");
    }

    const nextRoles = serializeRoles(roles.filter((r) => r !== "host"));
    const reason = body.reason?.trim() || "Removed by admin";

    const db = getDb();
    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE users SET roles = ?, host_verified = 0, host_blocked = 1 WHERE id = ?`
      ).run(nextRoles || "guest", req.params.id);

      const sus = db
        .prepare(
          `UPDATE properties SET status = 'suspended'
           WHERE host_id = ? AND status != 'suspended'`
        )
        .run(req.params.id);

      db.prepare(
        `INSERT INTO admin_actions (admin_id, action, target_type, target_id, notes)
         VALUES (?, 'remove_host', 'user', ?, ?)`
      ).run(req.headers["x-admin-user-id"] ?? "api_key", req.params.id, reason);

      return sus.changes;
    });

    const suspendedCount = tx();
    const updated = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as UserRow;

    res.json({
      user: userToJson(updated),
      suspendedListings: suspendedCount,
      message: `${updated.name} was removed as a host. Their listings were suspended.`,
    });
  } catch (e) {
    next(e);
  }
});

/** Clear host block so they can apply again (still needs verify). */
router.post("/hosts/:id/reinstate", (req, res, next) => {
  try {
    const user = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as UserRow | undefined;

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    getDb()
      .prepare(`UPDATE users SET host_blocked = 0 WHERE id = ?`)
      .run(req.params.id);

    getDb()
      .prepare(
        `INSERT INTO admin_actions (admin_id, action, target_type, target_id)
         VALUES (?, 'reinstate_host', 'user', ?)`
      )
      .run(req.headers["x-admin-user-id"] ?? "api_key", req.params.id);

    const updated = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as UserRow;

    res.json({
      user: userToJson(updated),
      message: `${updated.name} may register as a host again (still needs verification).`,
    });
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
    const depositStatus =
      typeof req.query.depositStatus === "string" && req.query.depositStatus.length > 0
        ? req.query.depositStatus
        : undefined;

    let rows: BookingRow[];
    if (status && depositStatus) {
      rows = getDb()
        .prepare(
          `SELECT * FROM bookings WHERE status = ? AND deposit_status = ?
           ORDER BY deposit_due_at ASC, created_at DESC`
        )
        .all(status, depositStatus) as BookingRow[];
    } else if (status) {
      rows = getDb()
        .prepare(`SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC`)
        .all(status) as BookingRow[];
    } else if (depositStatus) {
      rows = getDb()
        .prepare(
          `SELECT * FROM bookings WHERE deposit_status = ?
           ORDER BY deposit_due_at ASC, created_at DESC`
        )
        .all(depositStatus) as BookingRow[];
    } else {
      rows = getDb()
        .prepare(`SELECT * FROM bookings ORDER BY created_at DESC`)
        .all() as BookingRow[];
    }

    res.json({ bookings: rows.map(enrichAdminBooking) });
  } catch (e) {
    next(e);
  }
});

/**
 * Deposit tracker for admins: who still owes the 10%, who already paid.
 * Note: payment is confirmed manually after WhatsApp (no bank API yet).
 */
router.get("/deposits", (req, res, next) => {
  try {
    const filter =
      typeof req.query.status === "string" && req.query.status.length > 0
        ? req.query.status
        : "awaiting";

    let sql: string;
    if (filter === "paid") {
      sql = `SELECT * FROM bookings
             WHERE deposit_status = 'paid'
             ORDER BY created_at DESC`;
    } else if (filter === "all") {
      sql = `SELECT * FROM bookings
             WHERE status IN ('confirmed', 'completed', 'pending_approval')
             ORDER BY
               CASE deposit_status
                 WHEN 'due' THEN 0
                 WHEN 'reminded' THEN 1
                 WHEN 'not_due' THEN 2
                 WHEN 'paid' THEN 3
                 ELSE 4
               END,
               deposit_due_at ASC,
               created_at DESC`;
    } else {
      // awaiting = confirmed and not yet paid
      sql = `SELECT * FROM bookings
             WHERE status = 'confirmed'
               AND deposit_status IN ('not_due', 'due', 'reminded')
             ORDER BY deposit_due_at ASC, created_at DESC`;
    }

    const rows = getDb().prepare(sql).all() as BookingRow[];
    const deposits = rows.map((row) => {
      const booking = enrichAdminBooking(row);
      const host = getDb()
        .prepare(
          `SELECT u.name, u.phone FROM users u
           JOIN properties p ON p.host_id = u.id
           WHERE p.id = ?`
        )
        .get(row.property_id) as { name: string; phone: string } | undefined;
      return {
        ...booking,
        hostName: host?.name,
        hostPhone: host?.phone,
      };
    });

    const summary = getDb()
      .prepare(
        `SELECT
           SUM(CASE WHEN status = 'confirmed' AND deposit_status IN ('not_due','due','reminded') THEN 1 ELSE 0 END) as awaiting,
           SUM(CASE WHEN deposit_status = 'paid' THEN 1 ELSE 0 END) as paid,
           SUM(CASE WHEN deposit_status = 'paid' THEN deposit_etb ELSE 0 END) as paidEtb,
           SUM(CASE WHEN status = 'confirmed' AND deposit_status IN ('not_due','due','reminded') THEN deposit_etb ELSE 0 END) as awaitingEtb
         FROM bookings`
      )
      .get() as {
      awaiting: number | null;
      paid: number | null;
      paidEtb: number | null;
      awaitingEtb: number | null;
    };

    res.json({
      filter,
      summary: {
        awaiting: summary.awaiting ?? 0,
        paid: summary.paid ?? 0,
        paidEtb: summary.paidEtb ?? 0,
        awaitingEtb: summary.awaitingEtb ?? 0,
      },
      note:
        "Guests pay the 10% deposit to the platform WhatsApp number. Mark paid only after you (or the host) confirm the transfer. Automatic bank/Telebirr proof comes in Phase 2.",
      deposits,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
