import { Router, type Request } from "express";
import { z } from "zod";
import { getDb } from "../db/database";
import { bookingToJson, propertyToJson, serializeRoles, userToJson } from "../db/mappers";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type { BookingRow, PropertyRow, UserRow } from "../types";
import fs from "fs";
import path from "path";
import {
  propertyPhotoUpload,
  listingPhotoUpload,
  propertyVideoUpload,
} from "../middleware/upload";
import {
  appendPropertyPhotos,
  propertyUploadDir,
  storedUploadUrl,
} from "../utils/propertyPhotos";
import {
  appendPropertyVideos,
  setPropertyVideos,
  storedVideoUploadUrl,
  youtubeIdFromUrl,
  vimeoIdFromUrl,
} from "../utils/propertyVideos";
import { resolveNightlyRateEtb } from "../utils/pricing";
import { newId } from "../utils/ids";

function nightlyFromBody(input: {
  nightlyRateUsd?: number;
  nightlyRateEtb?: number;
}): number {
  try {
    return resolveNightlyRateEtb(input);
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : "Invalid nightly rate");
  }
}

const router = Router();

router.use(requireAuth);
router.use(requireRole("host", "guest"));

function assertHost(req: Request): void {
  if (!req.user!.roles.includes("host")) {
    throw new HttpError(403, "Host role required. Contact admin for verification.");
  }
}

function enrichBooking(row: BookingRow) {
  const db = getDb();
  const prop = db
    .prepare("SELECT title FROM properties WHERE id = ?")
    .get(row.property_id) as { title: string } | undefined;
  const guest = db
    .prepare("SELECT name FROM users WHERE id = ?")
    .get(row.guest_id) as { name: string } | undefined;

  return bookingToJson(row, {
    propertyTitle: prop?.title,
    guestName: guest?.name,
  });
}

function getHostPropertyIds(hostId: string): string[] {
  const rows = getDb()
    .prepare("SELECT id FROM properties WHERE host_id = ?")
    .all(hostId) as { id: string }[];
  return rows.map((r) => r.id);
}

router.get("/properties", (req, res, next) => {
  try {
    assertHost(req);
    const rows = getDb()
      .prepare("SELECT * FROM properties WHERE host_id = ? ORDER BY created_at DESC")
      .all(req.user!.id) as PropertyRow[];

    res.json({ properties: rows.map(propertyToJson) });
  } catch (e) {
    next(e);
  }
});

router.post("/properties", (req, res, next) => {
  try {
    assertHost(req);

    if (!req.user!.hostVerified) {
      throw new HttpError(403, "Host account not verified by admin yet");
    }

    const body = z
      .object({
        title: z.string().min(3),
        city: z.string().min(2),
        address: z.string().min(3),
        description: z.string().min(10),
        nightlyRateUsd: z.number().positive().optional(),
        nightlyRateEtb: z.number().int().positive().optional(),
        maxGuests: z.number().int().min(1).max(30),
        amenities: z.array(z.string()).default([]),
      })
      .parse(req.body);

    const nightlyRateEtb = nightlyFromBody(body);

    const id = newId("prop");
    getDb()
      .prepare(
        `INSERT INTO properties (
          id, host_id, title, city, address, description,
          nightly_rate_etb, max_guests, amenities, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review')`
      )
      .run(
        id,
        req.user!.id,
        body.title,
        body.city,
        body.address,
        body.description,
        nightlyRateEtb,
        body.maxGuests,
        JSON.stringify(body.amenities)
      );

    const row = getDb()
      .prepare("SELECT * FROM properties WHERE id = ?")
      .get(id) as PropertyRow;

    res.status(201).json({ property: propertyToJson(row) });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/properties/listing",
  (req, res, next) => {
    try {
      assertHost(req);
      if (!req.user!.hostVerified) {
        throw new HttpError(403, "Host account not verified by admin yet");
      }
      next();
    } catch (e) {
      next(e);
    }
  },
  listingPhotoUpload.array("photos", 10),
  (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new HttpError(400, "Upload at least one photo (form field: photos)");
      }

      const body = z
        .object({
          title: z.string().min(3),
          city: z.string().min(2),
          address: z.string().min(3),
          description: z.string().min(10),
          nightlyRateUsd: z.coerce.number().positive().optional(),
          nightlyRateEtb: z.coerce.number().int().positive().optional(),
          maxGuests: z.coerce.number().int().min(1).max(30),
          amenities: z
            .string()
            .optional()
            .transform((s) => {
              if (!s) return ["Wi-Fi"];
              try {
                const parsed = JSON.parse(s) as string[];
                return Array.isArray(parsed) ? parsed : ["Wi-Fi"];
              } catch {
                return s.split(",").map((a) => a.trim()).filter(Boolean);
              }
            }),
        })
        .parse(req.body);

      const nightlyRateEtb = nightlyFromBody(body);

      const id = newId("prop");
      getDb()
        .prepare(
          `INSERT INTO properties (
            id, host_id, title, city, address, description,
            nightly_rate_etb, max_guests, amenities, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review')`
        )
        .run(
          id,
          req.user!.id,
          body.title,
          body.city,
          body.address,
          body.description,
          nightlyRateEtb,
          body.maxGuests,
          JSON.stringify(body.amenities)
        );

      const paths: string[] = [];
      const dir = propertyUploadDir(id);
      fs.mkdirSync(dir, { recursive: true });

      for (const file of files) {
        const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
        const filename = `${newId("img")}${ext}`;
        fs.writeFileSync(path.join(dir, filename), file.buffer);
        paths.push(storedUploadUrl(id, filename));
      }

      const row = appendPropertyPhotos(id, paths);

      res.status(201).json({
        property: propertyToJson(row),
        uploaded: paths.length,
        message:
          "Listing saved with photos, description, and price. Admin will review before guests can book.",
      });
    } catch (e) {
      next(e);
    }
  }
);

router.patch("/properties/:id", (req, res, next) => {
  try {
    assertHost(req);

    const existing = getDb()
      .prepare("SELECT * FROM properties WHERE id = ? AND host_id = ?")
      .get(req.params.id, req.user!.id) as PropertyRow | undefined;

    if (!existing) {
      throw new HttpError(404, "Property not found");
    }

    const body = z
      .object({
        title: z.string().min(3).optional(),
        city: z.string().min(2).optional(),
        address: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        nightlyRateUsd: z.number().positive().optional(),
        nightlyRateEtb: z.number().int().positive().optional(),
        maxGuests: z.number().int().min(1).max(30).optional(),
        amenities: z.array(z.string()).optional(),
      })
      .parse(req.body);

    const nightlyRateEtb =
      body.nightlyRateUsd != null || body.nightlyRateEtb != null
        ? nightlyFromBody(body)
        : null;

    getDb()
      .prepare(
        `UPDATE properties SET
          title = COALESCE(?, title),
          city = COALESCE(?, city),
          address = COALESCE(?, address),
          description = COALESCE(?, description),
          nightly_rate_etb = COALESCE(?, nightly_rate_etb),
          max_guests = COALESCE(?, max_guests),
          amenities = COALESCE(?, amenities)
         WHERE id = ?`
      )
      .run(
        body.title ?? null,
        body.city ?? null,
        body.address ?? null,
        body.description ?? null,
        nightlyRateEtb,
        body.maxGuests ?? null,
        body.amenities ? JSON.stringify(body.amenities) : null,
        req.params.id
      );

    const row = getDb()
      .prepare("SELECT * FROM properties WHERE id = ?")
      .get(req.params.id) as PropertyRow;

    res.json({ property: propertyToJson(row) });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/properties/:id/photos",
  (req, res, next) => {
    try {
      assertHost(req);
      const existing = getDb()
        .prepare("SELECT * FROM properties WHERE id = ? AND host_id = ?")
        .get(req.params.id, req.user!.id) as PropertyRow | undefined;
      if (!existing) {
        throw new HttpError(404, "Property not found");
      }
      next();
    } catch (e) {
      next(e);
    }
  },
  propertyPhotoUpload.array("photos", 10),
  (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new HttpError(400, "Upload at least one photo (form field: photos)");
      }

      const propertyId = String(req.params.id);
      const paths = files.map((f) => storedUploadUrl(propertyId, f.filename));
      const row = appendPropertyPhotos(propertyId, paths);

      res.status(201).json({
        property: propertyToJson(row),
        uploaded: paths.length,
        message: "Photos uploaded. Guests will see them after admin approves the listing (if pending).",
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post("/properties/:id/videos", (req, res, next) => {
  try {
    assertHost(req);
    const existing = getDb()
      .prepare("SELECT * FROM properties WHERE id = ? AND host_id = ?")
      .get(req.params.id, req.user!.id) as PropertyRow | undefined;
    if (!existing) {
      throw new HttpError(404, "Property not found");
    }

    const body = z
      .object({
        urls: z.array(z.string().url()).min(1).max(8),
        replace: z.boolean().optional().default(false),
      })
      .parse(req.body);

    for (const url of body.urls) {
      const ok =
        youtubeIdFromUrl(url) ||
        vimeoIdFromUrl(url) ||
        /\.(mp4|webm|mov)(\?|$)/i.test(url);
      if (!ok) {
        throw new HttpError(
          400,
          `Unsupported video URL (use YouTube, Vimeo, or a direct .mp4/.webm link): ${url}`
        );
      }
    }

    const row = body.replace
      ? setPropertyVideos(String(req.params.id), body.urls)
      : appendPropertyVideos(String(req.params.id), body.urls);

    res.status(201).json({
      property: propertyToJson(row),
      message: "Videos saved. They appear on the public website when the listing is live.",
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/properties/:id/videos/upload",
  (req, res, next) => {
    try {
      assertHost(req);
      const existing = getDb()
        .prepare("SELECT * FROM properties WHERE id = ? AND host_id = ?")
        .get(req.params.id, req.user!.id) as PropertyRow | undefined;
      if (!existing) {
        throw new HttpError(404, "Property not found");
      }
      next();
    } catch (e) {
      next(e);
    }
  },
  propertyVideoUpload.array("videos", 3),
  (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new HttpError(400, "Upload at least one video (form field: videos)");
      }

      const propertyId = String(req.params.id);
      const paths = files.map((f) => storedVideoUploadUrl(propertyId, f.filename));
      const row = appendPropertyVideos(propertyId, paths);

      res.status(201).json({
        property: propertyToJson(row),
        uploaded: paths.length,
        message: "Videos uploaded. Guests see them on the public website when the listing is live.",
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/bookings", (req, res, next) => {
  try {
    assertHost(req);
    const propertyIds = getHostPropertyIds(req.user!.id);
    if (propertyIds.length === 0) {
      res.json({ bookings: [] });
      return;
    }

    const status = req.query.status as string | undefined;
    const placeholders = propertyIds.map(() => "?").join(",");

    let sql = `SELECT * FROM bookings WHERE property_id IN (${placeholders})`;
    const params: unknown[] = [...propertyIds];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;

    const rows = getDb().prepare(sql).all(...params) as BookingRow[];
    res.json({ bookings: rows.map(enrichBooking) });
  } catch (e) {
    next(e);
  }
});

function updateBookingStatus(
  bookingId: string,
  hostId: string,
  status: "confirmed" | "declined"
) {
  const booking = getDb()
    .prepare("SELECT b.* FROM bookings b JOIN properties p ON p.id = b.property_id WHERE b.id = ? AND p.host_id = ?")
    .get(bookingId, hostId) as BookingRow | undefined;

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

router.post("/bookings/:id/approve", (req, res, next) => {
  try {
    assertHost(req);
    const row = updateBookingStatus(req.params.id, req.user!.id, "confirmed");
    res.json({ booking: enrichBooking(row) });
  } catch (e) {
    next(e);
  }
});

router.post("/bookings/:id/decline", (req, res, next) => {
  try {
    assertHost(req);
    const row = updateBookingStatus(req.params.id, req.user!.id, "declined");
    res.json({ booking: enrichBooking(row) });
  } catch (e) {
    next(e);
  }
});

router.post("/bookings/:id/mark-paid", (req, res, next) => {
  try {
    assertHost(req);
    const booking = getDb()
      .prepare(
        `SELECT b.* FROM bookings b
         JOIN properties p ON p.id = b.property_id
         WHERE b.id = ? AND p.host_id = ?`
      )
      .get(req.params.id, req.user!.id) as BookingRow | undefined;

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }
    if (booking.status !== "confirmed") {
      throw new HttpError(400, "Only confirmed bookings can be marked paid");
    }

    getDb()
      .prepare(`UPDATE bookings SET payment_status = 'paid' WHERE id = ?`)
      .run(req.params.id);

    const row = getDb()
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(req.params.id) as BookingRow;

    res.json({ booking: enrichBooking(row) });
  } catch (e) {
    next(e);
  }
});

/** Let a guest user register intent to become a host */
router.post("/register-role", (req, res, next) => {
  try {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.user!.id) as UserRow;

    const roles = row.roles.split(",").filter(Boolean);
    if (!roles.includes("host")) {
      roles.push("host");
    }

    db.prepare(`UPDATE users SET roles = ? WHERE id = ?`).run(
      serializeRoles(roles as ("guest" | "host" | "admin")[]),
      req.user!.id
    );

    const updated = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.user!.id) as UserRow;

    res.json({ user: userToJson(updated) });
  } catch (e) {
    next(e);
  }
});

export default router;
