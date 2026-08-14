import { Router } from "express";
import { getDb } from "../db/database";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import type { NotificationRow } from "../types";

const router = Router();

function notificationToJson(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    bookingId: row.booking_id,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

router.use(requireAuth);

router.get("/", (req, res, next) => {
  try {
    const unreadOnly = String(req.query.unread || "") === "1";
    let sql = `SELECT * FROM notifications WHERE user_id = ?`;
    if (unreadOnly) sql += ` AND read_at IS NULL`;
    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const rows = getDb()
      .prepare(sql)
      .all(req.user!.id) as NotificationRow[];

    res.json({
      notifications: rows.map(notificationToJson),
      unreadCount: (
        getDb()
          .prepare(
            `SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read_at IS NULL`
          )
          .get(req.user!.id) as { c: number }
      ).c,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/read", (req, res, next) => {
  try {
    const row = getDb()
      .prepare("SELECT * FROM notifications WHERE id = ? AND user_id = ?")
      .get(req.params.id, req.user!.id) as NotificationRow | undefined;

    if (!row) {
      throw new HttpError(404, "Notification not found");
    }

    getDb()
      .prepare(
        `UPDATE notifications SET read_at = datetime('now') WHERE id = ?`
      )
      .run(row.id);

    const updated = getDb()
      .prepare("SELECT * FROM notifications WHERE id = ?")
      .get(row.id) as NotificationRow;

    res.json({ notification: notificationToJson(updated) });
  } catch (e) {
    next(e);
  }
});

router.post("/read-all", (req, res, next) => {
  try {
    getDb()
      .prepare(
        `UPDATE notifications SET read_at = datetime('now')
         WHERE user_id = ? AND read_at IS NULL`
      )
      .run(req.user!.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
