import { getDb } from "../db/database";
import type { BookingRow } from "../types";
import {
  createDepositDueNotification,
  ensureBookingDepositFields,
  resolveDepositDueAt,
} from "../utils/deposit";

/**
 * Find confirmed bookings whose 10% deposit is due (check-in minus 1 day),
 * create in-app notifications, and mark deposit_status = reminded.
 */
export function runDepositReminders(): { reminded: number } {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const candidates = db
    .prepare(
      `SELECT * FROM bookings
       WHERE status = 'confirmed'
         AND deposit_status IN ('not_due', 'due')
         AND (deposit_due_at IS NULL OR deposit_due_at <= ?)`
    )
    .all(today) as BookingRow[];

  let reminded = 0;

  for (const raw of candidates) {
    const row = ensureBookingDepositFields(raw);
    const due = resolveDepositDueAt(row);
    if (due > today) continue;
    if (row.deposit_status === "paid" || row.deposit_status === "waived") continue;

    // Avoid duplicate notifications if already reminded
    if (row.deposit_status === "reminded" && row.deposit_reminded_at) continue;

    const existing = db
      .prepare(
        `SELECT id FROM notifications
         WHERE booking_id = ? AND type = 'deposit_due' LIMIT 1`
      )
      .get(row.id) as { id: string } | undefined;

    if (!existing) {
      createDepositDueNotification(row);
    }

    db.prepare(
      `UPDATE bookings
       SET deposit_status = 'reminded',
           deposit_reminded_at = datetime('now')
       WHERE id = ?`
    ).run(row.id);

    reminded += 1;
  }

  // Flip not_due → due when due date has arrived but we haven't reminded yet
  // (covered above as reminded). Also set due for visibility before reminder run edge cases:
  db.prepare(
    `UPDATE bookings
     SET deposit_status = 'due'
     WHERE status = 'confirmed'
       AND deposit_status = 'not_due'
       AND deposit_due_at IS NOT NULL
       AND deposit_due_at <= ?`
  ).run(today);

  return { reminded };
}

export function startDepositReminderJob(intervalMs = 60_000): NodeJS.Timeout {
  // Run once on boot, then periodically.
  try {
    const r = runDepositReminders();
    if (r.reminded > 0) {
      console.log(`[deposit] Sent ${r.reminded} deposit reminder(s)`);
    }
  } catch (e) {
    console.error("[deposit] Reminder job failed:", e);
  }

  return setInterval(() => {
    try {
      const r = runDepositReminders();
      if (r.reminded > 0) {
        console.log(`[deposit] Sent ${r.reminded} deposit reminder(s)`);
      }
    } catch (e) {
      console.error("[deposit] Reminder job failed:", e);
    }
  }, intervalMs);
}
