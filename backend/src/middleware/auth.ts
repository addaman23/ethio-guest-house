import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { getDb } from "../db/database";
import { parseRoles, userToJson } from "../db/mappers";
import type { JwtPayload, UserRow, UserRole } from "../types";
import { HttpError } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      user?: ReturnType<typeof userToJson>;
      jwt?: JwtPayload;
    }
  }
}

/** Pick the longest session for the user's highest-privilege role. */
export function sessionExpiresForRoles(roles: UserRole[]): string {
  if (roles.includes("admin")) return config.jwtExpiresAdmin;
  if (roles.includes("host")) return config.jwtExpiresHost;
  return config.jwtExpiresGuest;
}

export function signToken(user: UserRow): string {
  const roles = parseRoles(user.roles);
  const payload: JwtPayload = {
    sub: user.id,
    phone: user.phone,
    roles,
  };
  const expiresIn = sessionExpiresForRoles(roles) as jwt.SignOptions["expiresIn"];
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Missing or invalid authorization"));
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const row = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(payload.sub) as UserRow | undefined;

    if (!row) {
      next(new HttpError(401, "User not found"));
      return;
    }

    req.jwt = payload;
    req.user = userToJson(row);
    next();
  } catch {
    next(new HttpError(401, "Invalid token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const has = req.user.roles.some((r) => roles.includes(r));
    if (!has) {
      next(new HttpError(403, "Forbidden"));
      return;
    }
    next();
  };
}

/** Admin panel: Bearer JWT with admin role OR X-Admin-Key header (dev). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-admin-key"];
  if (apiKey && apiKey === config.adminApiKey) {
    next();
    return;
  }

  requireAuth(req, res, () => {
    if (!req.user?.roles.includes("admin")) {
      next(new HttpError(403, "Admin access required"));
      return;
    }
    next();
  });
}
