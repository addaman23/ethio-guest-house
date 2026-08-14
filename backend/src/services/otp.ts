import { config } from "../config";
import { getDb } from "../db/database";
import { HttpError } from "../middleware/errorHandler";
import { sendSms } from "./sms";

const OTP_TTL_MINUTES = 10;

export async function requestOtp(
  phone: string
): Promise<{ sent: boolean; demoHint?: string }> {
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

  const message = `Your AddisAbaba Guest Houses code is ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`;

  if (config.nodeEnv === "development" && config.sms.provider === "console") {
    await sendSms(phone, message);
    return {
      sent: true,
      demoHint: `Development mode: use OTP code ${config.otpDemoCode}`,
    };
  }

  const result = await sendSms(phone, message);
  if (!result.ok) {
    console.error("[otp] SMS send failed:", result.error);
    throw new HttpError(503, "Could not send SMS OTP. Try again shortly.");
  }

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
