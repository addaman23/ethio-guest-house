import { Router } from "express";
import { getDb } from "../db/database";
import { propertyToJson } from "../db/mappers";
import { HttpError } from "../middleware/errorHandler";
import type { PropertyRow } from "../types";

const router = Router();

router.get("/", (req, res, next) => {
  try {
    const { city, minPrice, maxPrice } = req.query;
    let sql = `SELECT * FROM properties WHERE status = 'live'`;
    const params: unknown[] = [];

    if (typeof city === "string" && city.length > 0) {
      sql += ` AND city = ?`;
      params.push(city);
    }
    if (minPrice) {
      sql += ` AND nightly_rate_etb >= ?`;
      params.push(parseInt(String(minPrice), 10));
    }
    if (maxPrice) {
      sql += ` AND nightly_rate_etb <= ?`;
      params.push(parseInt(String(maxPrice), 10));
    }

    sql += ` ORDER BY created_at DESC`;

    const rows = getDb().prepare(sql).all(...params) as PropertyRow[];
    res.json({ properties: rows.map(propertyToJson) });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", (req, res, next) => {
  try {
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

export default router;
