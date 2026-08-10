import fs from "fs";
import path from "path";
import { config } from "../config";
import { getDb } from "../db/database";
import type { PropertyRow } from "../types";

const MAX_PHOTOS_PER_PROPERTY = 20;

export function parseStoredImageUrls(row: PropertyRow): string[] {
  if (row.image_urls) {
    try {
      const parsed = JSON.parse(row.image_urls) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      /* fall through */
    }
  }
  if (row.image_url) return [row.image_url];
  return [];
}

export function toPublicImageUrl(stored: string): string {
  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    return stored;
  }
  const base = config.publicBaseUrl.replace(/\/$/, "");
  return `${base}${stored.startsWith("/") ? stored : `/${stored}`}`;
}

export function toStoredImagePath(publicUrl: string): string {
  const base = config.publicBaseUrl.replace(/\/$/, "");
  if (publicUrl.startsWith(base)) {
    return publicUrl.slice(base.length) || publicUrl;
  }
  return publicUrl;
}

export function propertyUploadDir(propertyId: string): string {
  return path.join(config.uploadsDir, "properties", propertyId);
}

export function ensureUploadDirs(): void {
  fs.mkdirSync(path.join(config.uploadsDir, "properties"), { recursive: true });
}

/** Stored in DB as `/uploads/properties/{id}/{file}` */
export function storedUploadUrl(propertyId: string, filename: string): string {
  return `/uploads/properties/${propertyId}/${filename}`;
}

export function appendPropertyPhotos(propertyId: string, newPaths: string[]): PropertyRow {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM properties WHERE id = ?")
    .get(propertyId) as PropertyRow | undefined;

  if (!row) {
    throw new Error("Property not found");
  }

  const existing = parseStoredImageUrls(row);
  const merged = [...existing, ...newPaths].slice(0, MAX_PHOTOS_PER_PROPERTY);

  db.prepare(
    `UPDATE properties SET image_url = ?, image_urls = ? WHERE id = ?`
  ).run(merged[0] ?? null, JSON.stringify(merged), propertyId);

  return db
    .prepare("SELECT * FROM properties WHERE id = ?")
    .get(propertyId) as PropertyRow;
}
