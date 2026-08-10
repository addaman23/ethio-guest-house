import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/database";
import { HttpError } from "../middleware/errorHandler";
import type { PropertyRow } from "../types";
import {
  createBookingRequest,
  enrichBookingRequest,
} from "../utils/bookingRequests";

const router = Router();

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("+") && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith("251") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  throw new HttpError(400, "Enter a valid phone number with country code, e.g. +251988013094");
}

/** Public website booking request — appears in admin message inbox. */
router.post("/", (req, res, next) => {
  try {
    const body = z
      .object({
        propertyId: z.string().optional(),
        guestName: z.string().min(2).max(80),
        guestPhone: z.string().min(9).max(20),
        guestEmail: z.union([z.string().email(), z.literal("")]).optional(),
        checkIn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
        checkOut: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
        guests: z.coerce.number().int().min(1).max(30).default(1),
        message: z.union([z.string().max(1000), z.literal("")]).optional(),
      })
      .parse(req.body);

    if (body.propertyId) {
      const property = getDb()
        .prepare("SELECT * FROM properties WHERE id = ? AND status = 'live'")
        .get(body.propertyId) as PropertyRow | undefined;
      if (!property) {
        throw new HttpError(404, "Property not available");
      }
    }

    const row = createBookingRequest({
      propertyId: body.propertyId ?? null,
      guestName: body.guestName.trim(),
      guestPhone: normalizePhone(body.guestPhone),
      guestEmail: body.guestEmail || null,
      checkIn: body.checkIn || null,
      checkOut: body.checkOut || null,
      guests: body.guests,
      message: body.message?.trim() || null,
      source: "website",
      status: "new",
    });

    res.status(201).json({
      request: enrichBookingRequest(row),
      message:
        "Request received. Our team will contact you on WhatsApp, Viber, phone, or email.",
    });
  } catch (e) {
    next(e);
  }
});

export default router;
