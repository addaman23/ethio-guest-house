import { getDb } from "./database";

/** Host-published listings with media should be browsable by guests. */
export function ensureLiveHostListings(): void {
  const db = getDb();
  db.prepare(
    `UPDATE properties
     SET status = 'live'
     WHERE status = 'pending_review'
       AND (
         (image_urls IS NOT NULL AND image_urls != '' AND image_urls != '[]')
         OR (image_url IS NOT NULL AND image_url != '')
       )`
  ).run();
}
