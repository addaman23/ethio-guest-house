import { getDb } from "./database";
import { PROPERTY_VIDEO_SETS } from "../utils/propertyVideosSeed";

/** Backfill demo videos only when a listing has none yet. */
export function ensurePropertyVideos(): void {
  const db = getDb();
  const update = db.prepare(`
    UPDATE properties
    SET video_urls = ?
    WHERE id = ?
      AND (video_urls IS NULL OR video_urls = '' OR video_urls = '[]')
  `);

  for (const [id, urls] of Object.entries(PROPERTY_VIDEO_SETS)) {
    update.run(JSON.stringify(urls), id);
  }
}
