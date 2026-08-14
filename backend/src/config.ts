import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  /** Session length by role (hosts/admins stay signed in longer). */
  jwtExpiresGuest: process.env.JWT_EXPIRES_GUEST ?? "30d",
  jwtExpiresHost: process.env.JWT_EXPIRES_HOST ?? "180d",
  jwtExpiresAdmin: process.env.JWT_EXPIRES_ADMIN ?? "365d",
  databasePath:
    process.env.DATABASE_PATH ??
    path.join(process.cwd(), "data", "ethio_guest_house.db"),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  otpDemoCode: process.env.OTP_DEMO_CODE ?? "123456",
  adminApiKey: process.env.ADMIN_API_KEY ?? "dev-admin-key",
  /** Platform fee taken from host rent (e.g. 0.10 = 10%). */
  platformCommissionRate: parseFloat(process.env.PLATFORM_COMMISSION_RATE ?? "0.10"),
  uploadsDir:
    process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:3000",
  /** How many ETB equal 1 USD (pay-on-arrival conversion). */
  usdEtbRate: parseFloat(process.env.USD_ETB_RATE ?? "57"),
  /** Minimum listed nightly rate in USD. */
  minNightlyUsd: parseFloat(process.env.MIN_NIGHTLY_USD ?? "50"),
  /** Public contact details shown on the website (update these for production). */
  contactEmail: process.env.CONTACT_EMAIL ?? "addisuabebaw23@gmail.com",
  contactPhone: process.env.CONTACT_PHONE ?? "+251988013094",
  contactWhatsapp: process.env.CONTACT_WHATSAPP ?? "+251988013094",
  contactViber: process.env.CONTACT_VIBER ?? "+251988013094",
  contactLabel: process.env.CONTACT_LABEL ?? "Addis Ababa Guest Houses",
  /**
   * SMS OTP delivery.
   * SMS_PROVIDER: console | twilio | http | none
   * - development defaults to console (logs OTP; OTP_DEMO_CODE still used)
   * - production should use twilio or http (Ethiopian gateway)
   */
  sms: {
    provider: (process.env.SMS_PROVIDER ??
      (process.env.NODE_ENV === "production" ? "none" : "console")) as
      | "console"
      | "twilio"
      | "http"
      | "none",
    fromName: process.env.SMS_FROM_NAME ?? "AddisAbabaGH",
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
      authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
      from: process.env.TWILIO_FROM ?? "",
    },
    http: {
      url: process.env.SMS_HTTP_URL ?? "",
      apiKey: process.env.SMS_HTTP_API_KEY ?? "",
      /** Header name for the API key (default Authorization → Bearer …). */
      apiKeyHeader: process.env.SMS_HTTP_API_KEY_HEADER ?? "Authorization",
      from: process.env.SMS_HTTP_FROM ?? process.env.SMS_FROM_NAME ?? "AddisAbabaGH",
      /** JSON with {{to}}, {{message}}, {{from}} placeholders. */
      bodyTemplate: process.env.SMS_HTTP_BODY_TEMPLATE ?? "",
    },
  },
};
