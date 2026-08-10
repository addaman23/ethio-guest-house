import { getDb } from "./database";
import { PROPERTY_IMAGE_SETS } from "../utils/propertyImages";

/** Backfill demo gallery photos only when a listing has none yet. */
export function ensurePropertyImages(): void {
  const db = getDb();
  const update = db.prepare(`
    UPDATE properties
    SET image_url = ?, image_urls = ?
    WHERE id = ?
      AND (image_urls IS NULL OR image_urls = '' OR image_urls = '[]')
  `);

  for (const [id, urls] of Object.entries(PROPERTY_IMAGE_SETS)) {
    update.run(urls[0], JSON.stringify(urls), id);
  }
}
