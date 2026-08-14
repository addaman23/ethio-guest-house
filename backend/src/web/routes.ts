import { Router } from "express";
import { getDb } from "../db/database";
import { config } from "../config";
import type { PropertyRow } from "../types";
import { cityFromSlug, citySlug } from "./escape";
import { homePage, listingsPage, notFoundPage, stayPage } from "./pages";

const router = Router();

function liveProperties(city?: string): PropertyRow[] {
  if (city) {
    return getDb()
      .prepare(
        `SELECT * FROM properties WHERE status = 'live' AND city = ? ORDER BY created_at DESC`
      )
      .all(city) as PropertyRow[];
  }
  return getDb()
    .prepare(
      `SELECT * FROM properties WHERE status = 'live'
       ORDER BY CASE WHEN city = 'Addis Ababa' THEN 0 ELSE 1 END, created_at DESC`
    )
    .all() as PropertyRow[];
}

function allLiveCities(): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT city FROM properties WHERE status = 'live' ORDER BY city ASC`
    )
    .all() as { city: string }[];
  return rows.map((r) => r.city);
}

router.get("/", (_req, res) => {
  res.type("html").send(homePage(liveProperties()));
});

router.get("/guest-houses", (req, res) => {
  const cityQ = typeof req.query.city === "string" ? req.query.city.trim() : "";
  if (cityQ) {
    res.type("html").send(listingsPage(liveProperties(cityQ), cityQ));
    return;
  }
  res.type("html").send(listingsPage(liveProperties()));
});

router.get("/guest-houses/city/:citySlug", (req, res) => {
  const cities = allLiveCities();
  const city = cityFromSlug(String(req.params.citySlug), cities);
  if (!city) {
    res.status(404).type("html").send(notFoundPage());
    return;
  }
  res.type("html").send(listingsPage(liveProperties(city), city));
});

router.get("/stay/:id", (req, res) => {
  const row = getDb()
    .prepare(`SELECT * FROM properties WHERE id = ? AND status = 'live'`)
    .get(req.params.id) as PropertyRow | undefined;

  if (!row) {
    res.status(404).type("html").send(notFoundPage());
    return;
  }
  res.type("html").send(stayPage(row));
});

router.get("/robots.txt", (_req, res) => {
  const base = config.publicBaseUrl.replace(/\/$/, "");
  res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /demo
Disallow: /owner
Disallow: /v1/

Sitemap: ${base}/sitemap.xml
`);
});

router.get("/sitemap.xml", (_req, res) => {
  const base = config.publicBaseUrl.replace(/\/$/, "");
  const props = liveProperties();
  const cities = allLiveCities();
  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    { loc: `${base}/`, priority: "1.0" },
    { loc: `${base}/guest-houses`, priority: "0.9" },
    { loc: `${base}/guest-houses/city/addis-ababa`, priority: "0.95" },
    ...cities
      .filter((c) => citySlug(c) !== "addis-ababa")
      .map((c) => ({
        loc: `${base}/guest-houses/city/${citySlug(c)}`,
        priority: "0.8",
      })),
    ...props.map((p) => ({
      loc: `${base}/stay/${p.id}`,
      priority: "0.7",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  res.type("application/xml").send(xml);
});

export default router;
