import { config } from "../config";
import { getDb } from "../db/database";
import type { PropertyRow } from "../types";

const MAX_VIDEOS_PER_PROPERTY = 8;

export type VideoKind = "youtube" | "vimeo" | "file";

export interface PropertyVideo {
  url: string;
  kind: VideoKind;
  embedUrl: string | null;
}

export function parseStoredVideoUrls(row: PropertyRow): string[] {
  if (!row.video_urls) return [];
  try {
    const parsed = JSON.parse(row.video_urls) as string[];
    return Array.isArray(parsed) ? parsed.filter((u) => typeof u === "string" && u.length > 0) : [];
  } catch {
    return [];
  }
}

export function toPublicVideoUrl(stored: string): string {
  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    return stored;
  }
  const base = config.publicBaseUrl.replace(/\/$/, "");
  return `${base}${stored.startsWith("/") ? stored : `/${stored}`}`;
}

export function storedVideoUploadUrl(propertyId: string, filename: string): string {
  return `/uploads/properties/${propertyId}/videos/${filename}`;
}

export function youtubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] || null;
      }
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2] || null;
      }
      return u.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

export function vimeoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const id = parts.find((p) => /^\d+$/.test(p));
    return id ?? null;
  } catch {
    return null;
  }
}

export function classifyVideo(url: string): PropertyVideo {
  const publicUrl = toPublicVideoUrl(url);
  const yt = youtubeIdFromUrl(publicUrl);
  if (yt) {
    return {
      url: publicUrl,
      kind: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt}?rel=0`,
    };
  }
  const vim = vimeoIdFromUrl(publicUrl);
  if (vim) {
    return {
      url: publicUrl,
      kind: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vim}`,
    };
  }
  return {
    url: publicUrl,
    kind: "file",
    embedUrl: null,
  };
}

export function videosFromRow(row: PropertyRow): PropertyVideo[] {
  return parseStoredVideoUrls(row).map(classifyVideo);
}

export function appendPropertyVideos(propertyId: string, newPaths: string[]): PropertyRow {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM properties WHERE id = ?")
    .get(propertyId) as PropertyRow | undefined;

  if (!row) {
    throw new Error("Property not found");
  }

  const existing = parseStoredVideoUrls(row);
  const merged = [...existing, ...newPaths].slice(0, MAX_VIDEOS_PER_PROPERTY);

  db.prepare(`UPDATE properties SET video_urls = ? WHERE id = ?`).run(
    JSON.stringify(merged),
    propertyId
  );

  return db
    .prepare("SELECT * FROM properties WHERE id = ?")
    .get(propertyId) as PropertyRow;
}

export function setPropertyVideos(propertyId: string, urls: string[]): PropertyRow {
  const db = getDb();
  const cleaned = urls
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_VIDEOS_PER_PROPERTY);

  db.prepare(`UPDATE properties SET video_urls = ? WHERE id = ?`).run(
    cleaned.length ? JSON.stringify(cleaned) : null,
    propertyId
  );

  return db
    .prepare("SELECT * FROM properties WHERE id = ?")
    .get(propertyId) as PropertyRow;
}
