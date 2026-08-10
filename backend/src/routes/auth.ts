import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/database";
import { parseRoles, serializeRoles, userToJson } from "../db/mappers";
import { signToken } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { requestOtp, verifyOtp } from "../services/otp";
import type { UserRow } from "../types";
import { newId } from "../utils/ids";
import { internationalPhoneSchema } from "../utils/international";

const router = Router();

const phoneSchema = internationalPhoneSchema;

router.post("/otp/request", (req, res, next) => {
  try {
    const { phone } = z.object({ phone: phoneSchema }).parse(req.body);
    const result = requestOtp(phone);
    res.json({ ok: true, phone, ...result });
  } catch (e) {
    next(e);
  }
});

router.post("/otp/verify", (req, res, next) => {
  try {
    const body = z
      .object({
        phone: phoneSchema,
        code: z.string().min(4).max(8),
        name: z.string().min(1).max(100).optional(),
        guestCountry: z.string().length(2).optional(),
      })
      .parse(req.body);

    if (!verifyOtp(body.phone, body.code)) {
      throw new HttpError(401, "Invalid or expired OTP");
    }

    const db = getDb();
    let user = db
      .prepare("SELECT * FROM users WHERE phone = ?")
      .get(body.phone) as UserRow | undefined;

    if (!user) {
      const id = newId("user");
      const name = body.name ?? "Guest";
      db.prepare(
        `INSERT INTO users (id, phone, name, roles, host_verified, guest_country)
         VALUES (?, ?, ?, ?, 0, ?)`
      ).run(id, body.phone, name, serializeRoles(["guest"]), body.guestCountry ?? null);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow;
    } else if (body.guestCountry) {
      db.prepare(`UPDATE users SET guest_country = ? WHERE id = ?`).run(
        body.guestCountry,
        user.id
      );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as UserRow;
    }

    const token = signToken(user);
    res.json({
      token,
      user: userToJson(user),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
