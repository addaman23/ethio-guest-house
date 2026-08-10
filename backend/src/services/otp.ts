import { config } from "../config";
import { getDb } from "../db/database";

const OTP_TTL_MINUTES = 10;

export function requestOtp(phone: string): { sent: boolean; demoHint?: string } {
  const db = getDb();
  const code =
    config.nodeEnv === "development"
      ? config.otpDemoCode
      : String(Math.floor(100000 + Math.random() * 900000));

  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)
     ON CONFLICT(phone) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at`
  ).run(phone, code, expiresAt);

  // TODO: integrate Ethiopian SMS provider (e.g. local gateway)

  if (config.nodeEnv === "development") {
    return {
      sent: true,
      demoHint: `Development mode: use OTP code ${config.otpDemoCode}`,
    };
  }

  return { sent: true };
}

export function verifyOtp(phone: string, code: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT code, expires_at FROM otp_codes WHERE phone = ?")
    .get(phone) as { code: string; expires_at: string } | undefined;

  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) return false;
  if (row.code !== code) return false;

  db.prepare("DELETE FROM otp_codes WHERE phone = ?").run(phone);
  return true;
}
