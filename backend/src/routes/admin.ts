import { Router } from "express";
import { getDb } from "../db/database";
import { bookingToJson, propertyToJson, userToJson } from "../db/mappers";
import { requireAdmin } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type { BookingRow, PropertyRow, UserRow } from "../types";
import { getAnalyticsSummary } from "../utils/analytics";

const router = Router();

router.use(requireAdmin);

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

router.get("/bookings", (_req, res, next) => {
  try {
    const rows = getDb()
      .prepare("SELECT * FROM bookings ORDER BY created_at DESC")
      .all() as BookingRow[];

    const enriched = rows.map((row) => {
      const prop = getDb()
        .prepare("SELECT title FROM properties WHERE id = ?")
        .get(row.property_id) as { title: string } | undefined;
      const guest = getDb()
        .prepare("SELECT name FROM users WHERE id = ?")
        .get(row.guest_id) as { name: string } | undefined;
      return bookingToJson(row, {
        propertyTitle: prop?.title,
        guestName: guest?.name,
      });
    });

    res.json({ bookings: enriched });
  } catch (e) {
    next(e);
  }
});

export default router;
