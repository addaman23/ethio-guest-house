import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
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
  contactEmail: process.env.CONTACT_EMAIL ?? "hello@ethioguesthouses.com",
  contactPhone: process.env.CONTACT_PHONE ?? "+251911000099",
  contactWhatsapp: process.env.CONTACT_WHATSAPP ?? "+251911000099",
  contactViber: process.env.CONTACT_VIBER ?? "+251911000099",
  contactLabel: process.env.CONTACT_LABEL ?? "Ethio Guest Houses · Addis Ababa",
};
