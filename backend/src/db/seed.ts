import { getDb } from "./database";
import { serializeRoles } from "./mappers";
import { PROPERTY_IMAGE_SETS } from "../utils/propertyImages";
import { PROPERTY_VIDEO_SETS } from "../utils/propertyVideosSeed";
import { DEMO_PROPERTY_USD_RATES, usdToEtb } from "../utils/pricing";

export function seedDatabase(): void {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (count.c > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, name, roles, host_verified)
    VALUES (@id, @phone, @name, @roles, @host_verified)
  `);

  insertUser.run({
    id: "guest_1",
    phone: "+251911000001",
    name: "Demo Guest",
    roles: serializeRoles(["guest"]),
    host_verified: 0,
  });

  insertUser.run({
    id: "host_1",
    phone: "+251911000002",
    name: "Demo Host",
    roles: serializeRoles(["guest", "host"]),
    host_verified: 1,
  });

  insertUser.run({
    id: "admin_1",
    phone: "+251911000099",
    name: "Platform Admin",
    roles: serializeRoles(["admin"]),
    host_verified: 0,
  });

  const insertProperty = db.prepare(`
    INSERT INTO properties (
      id, host_id, title, city, address, description,
      nightly_rate_etb, max_guests, amenities, status, image_url, image_urls, video_urls
    ) VALUES (
      @id, @host_id, @title, @city, @address, @description,
      @nightly_rate_etb, @max_guests, @amenities, @status, @image_url, @image_urls, @video_urls
    )
  `);

  const properties = [
    {
      id: "prop_1",
      host_id: "host_1",
      title: "Green View Guest House",
      city: "Addis Ababa",
      address: "Bole, Addis Ababa",
      description: "Quiet rooms near Bole. Breakfast included.",
      nightly_rate_etb: usdToEtb(DEMO_PROPERTY_USD_RATES.prop_1),
      max_guests: 4,
      amenities: JSON.stringify(["Wi-Fi", "Breakfast", "Parking"]),
      status: "live",
    },
    {
      id: "prop_2",
      host_id: "host_1",
      title: "Lake Side Lodge",
      city: "Hawassa",
      address: "Lake Hawassa shore",
      description: "Family-friendly guest house with lake view.",
      nightly_rate_etb: usdToEtb(DEMO_PROPERTY_USD_RATES.prop_2),
      max_guests: 6,
      amenities: JSON.stringify(["Wi-Fi", "Garden"]),
      status: "live",
    },
    {
      id: "prop_3",
      host_id: "host_1",
      title: "Bahir Dar Comfort Stay",
      city: "Bahir Dar",
      address: "Kebele 03, Bahir Dar",
      description: "Close to Nile falls tours.",
      nightly_rate_etb: usdToEtb(DEMO_PROPERTY_USD_RATES.prop_3),
      max_guests: 3,
      amenities: JSON.stringify(["Wi-Fi", "Hot water"]),
      status: "pending_review",
    },
  ];

  for (const p of properties) {
    const images = PROPERTY_IMAGE_SETS[p.id] ?? [];
    const videos = PROPERTY_VIDEO_SETS[p.id] ?? [];
    insertProperty.run({
      ...p,
      image_url: images[0] ?? null,
      image_urls: images.length ? JSON.stringify(images) : null,
      video_urls: videos.length ? JSON.stringify(videos) : null,
    });
  }

  const insertIntlGuest = db.prepare(`
    INSERT INTO users (id, phone, name, roles, host_verified, guest_country)
    VALUES (@id, @phone, @name, @roles, 0, @guest_country)
  `);
  insertIntlGuest.run({
    id: "guest_us",
    phone: "+12025550101",
    name: "Demo Guest (USA)",
    roles: serializeRoles(["guest"]),
    guest_country: "US",
  });
  insertIntlGuest.run({
    id: "guest_ca",
    phone: "+14165550102",
    name: "Demo Guest (Canada)",
    roles: serializeRoles(["guest"]),
    guest_country: "CA",
  });
  insertIntlGuest.run({
    id: "guest_uk",
    phone: "+447911123456",
    name: "Demo Guest (UK)",
    roles: serializeRoles(["guest"]),
    guest_country: "GB",
  });

  console.log("Database seeded with demo users and properties.");
}

if (require.main === module) {
  seedDatabase();
}
