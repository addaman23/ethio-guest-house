import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../config";

let db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  roles TEXT NOT NULL DEFAULT 'guest',
  host_verified INTEGER NOT NULL DEFAULT 0,
  host_blocked INTEGER NOT NULL DEFAULT 0,
  guest_country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otp_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT NOT NULL,
  nightly_rate_etb INTEGER NOT NULL,
  max_guests INTEGER NOT NULL,
  amenities TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending_review',
  image_url TEXT,
  image_urls TEXT,
  video_urls TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS availability_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id TEXT NOT NULL REFERENCES properties(id),
  block_date TEXT NOT NULL,
  UNIQUE(property_id, block_date)
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  guest_id TEXT NOT NULL REFERENCES users(id),
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL,
  total_etb INTEGER NOT NULL,
  subtotal_etb INTEGER NOT NULL DEFAULT 0,
  platform_fee_etb INTEGER NOT NULL DEFAULT 0,
  host_payout_etb INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  payment_method TEXT NOT NULL DEFAULT 'pay_on_arrival',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  deposit_etb INTEGER NOT NULL DEFAULT 0,
  deposit_due_at TEXT,
  deposit_status TEXT NOT NULL DEFAULT 'not_due',
  deposit_reminded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  path TEXT,
  channel TEXT,
  visitor_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_requests (
  id TEXT PRIMARY KEY,
  property_id TEXT,
  booking_id TEXT,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  check_in TEXT,
  check_out TEXT,
  guests INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'website',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  booking_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_host ON properties(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_site_events_created ON site_events(created_at);
CREATE INDEX IF NOT EXISTS idx_site_events_type ON site_events(event_type);
CREATE INDEX IF NOT EXISTS idx_site_events_visitor ON site_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_created ON booking_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
`;

function migrateSchema(database: Database.Database): void {
  const propertyCols = database
    .prepare("PRAGMA table_info(properties)")
    .all() as { name: string }[];
  if (!propertyCols.some((c) => c.name === "image_urls")) {
    database.exec("ALTER TABLE properties ADD COLUMN image_urls TEXT");
  }
  if (!propertyCols.some((c) => c.name === "video_urls")) {
    database.exec("ALTER TABLE properties ADD COLUMN video_urls TEXT");
  }

  const userCols = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.some((c) => c.name === "guest_country")) {
    database.exec("ALTER TABLE users ADD COLUMN guest_country TEXT");
  }
  if (!userCols.some((c) => c.name === "host_blocked")) {
    database.exec("ALTER TABLE users ADD COLUMN host_blocked INTEGER NOT NULL DEFAULT 0");
  }

  const adminActionCols = database
    .prepare("PRAGMA table_info(admin_actions)")
    .all() as { name: string }[];
  if (adminActionCols.length > 0 && !adminActionCols.some((c) => c.name === "notes")) {
    database.exec("ALTER TABLE admin_actions ADD COLUMN notes TEXT");
  }

  const bookingCols = database.prepare("PRAGMA table_info(bookings)").all() as { name: string }[];
  if (!bookingCols.some((c) => c.name === "subtotal_etb")) {
    database.exec("ALTER TABLE bookings ADD COLUMN subtotal_etb INTEGER NOT NULL DEFAULT 0");
    database.exec("ALTER TABLE bookings ADD COLUMN platform_fee_etb INTEGER NOT NULL DEFAULT 0");
    database.exec("ALTER TABLE bookings ADD COLUMN host_payout_etb INTEGER NOT NULL DEFAULT 0");
    database.exec(`
      UPDATE bookings SET
        subtotal_etb = total_etb,
        platform_fee_etb = CAST(ROUND(total_etb * 0.10) AS INTEGER),
        host_payout_etb = total_etb - CAST(ROUND(total_etb * 0.10) AS INTEGER)
      WHERE subtotal_etb = 0 OR subtotal_etb IS NULL
    `);
  }
  if (!bookingCols.some((c) => c.name === "guest_message")) {
    database.exec("ALTER TABLE bookings ADD COLUMN guest_message TEXT");
  }
  if (!bookingCols.some((c) => c.name === "deposit_etb")) {
    database.exec("ALTER TABLE bookings ADD COLUMN deposit_etb INTEGER NOT NULL DEFAULT 0");
    database.exec("ALTER TABLE bookings ADD COLUMN deposit_due_at TEXT");
    database.exec(
      "ALTER TABLE bookings ADD COLUMN deposit_status TEXT NOT NULL DEFAULT 'not_due'"
    );
    database.exec("ALTER TABLE bookings ADD COLUMN deposit_reminded_at TEXT");
    database.exec(`
      UPDATE bookings SET
        deposit_etb = CASE
          WHEN deposit_etb = 0 THEN CAST(ROUND(COALESCE(NULLIF(subtotal_etb, 0), total_etb) * 0.10) AS INTEGER)
          ELSE deposit_etb
        END,
        deposit_due_at = COALESCE(
          deposit_due_at,
          date(check_in, '-1 day')
        )
      WHERE deposit_etb = 0 OR deposit_due_at IS NULL
    `);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      booking_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
    CREATE INDEX IF NOT EXISTS idx_bookings_deposit_due ON bookings(deposit_due_at);
  `);
}

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(config.databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(config.databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrateSchema(db);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
