import crypto from "crypto";
import { getDb } from "../db/database";

export type SiteEventType = "page_view" | "contact_click";
export type ContactChannel = "phone" | "whatsapp" | "viber" | "email";

export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function recordSiteEvent(input: {
  eventType: SiteEventType;
  path?: string | null;
  channel?: ContactChannel | string | null;
  visitorId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO site_events (event_type, path, channel, visitor_id, ip_hash, user_agent, referrer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.eventType,
      input.path ?? null,
      input.channel ?? null,
      input.visitorId ?? null,
      hashIp(input.ip ?? undefined),
      input.userAgent ? input.userAgent.slice(0, 400) : null,
      input.referrer ? input.referrer.slice(0, 500) : null
    );
}

function countEvents(sql: string, params: unknown[] = []): number {
  return (getDb().prepare(sql).get(...params) as { c: number }).c;
}

export function getAnalyticsSummary(days = 30) {
  const db = getDb();
  const since = `-${Math.max(1, days)} days`;

  const pageViews = countEvents(
    `SELECT COUNT(*) as c FROM site_events
     WHERE event_type = 'page_view' AND created_at >= datetime('now', ?)`,
    [since]
  );
  const uniqueVisitors = countEvents(
    `SELECT COUNT(DISTINCT visitor_id) as c FROM site_events
     WHERE event_type = 'page_view'
       AND visitor_id IS NOT NULL
       AND created_at >= datetime('now', ?)`,
    [since]
  );
  const contactClicks = countEvents(
    `SELECT COUNT(*) as c FROM site_events
     WHERE event_type = 'contact_click' AND created_at >= datetime('now', ?)`,
    [since]
  );

  const byChannel = db
    .prepare(
      `SELECT channel as name, COUNT(*) as c FROM site_events
       WHERE event_type = 'contact_click'
         AND created_at >= datetime('now', ?)
         AND channel IS NOT NULL
       GROUP BY channel
       ORDER BY c DESC`
    )
    .all(since) as { name: string; c: number }[];

  const topPages = db
    .prepare(
      `SELECT path as name, COUNT(*) as c FROM site_events
       WHERE event_type = 'page_view'
         AND created_at >= datetime('now', ?)
         AND path IS NOT NULL
       GROUP BY path
       ORDER BY c DESC
       LIMIT 10`
    )
    .all(since) as { name: string; c: number }[];

  const last7Days = db
    .prepare(
      `SELECT date(created_at) as day,
              SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as views,
              SUM(CASE WHEN event_type = 'contact_click' THEN 1 ELSE 0 END) as contacts
       FROM site_events
       WHERE created_at >= datetime('now', '-7 days')
       GROUP BY date(created_at)
       ORDER BY day ASC`
    )
    .all() as { day: string; views: number; contacts: number }[];

  const recent = db
    .prepare(
      `SELECT event_type, path, channel, visitor_id, created_at
       FROM site_events
       ORDER BY id DESC
       LIMIT 40`
    )
    .all() as {
    event_type: string;
    path: string | null;
    channel: string | null;
    visitor_id: string | null;
    created_at: string;
  }[];

  const phoneClicks =
    byChannel.find((c) => c.name === "phone")?.c ?? 0;
  const whatsappClicks =
    byChannel.find((c) => c.name === "whatsapp")?.c ?? 0;
  const viberClicks = byChannel.find((c) => c.name === "viber")?.c ?? 0;
  const emailClicks = byChannel.find((c) => c.name === "email")?.c ?? 0;

  return {
    days,
    pageViews,
    uniqueVisitors,
    contactClicks,
    phoneClicks,
    whatsappClicks,
    viberClicks,
    emailClicks,
    byChannel: Object.fromEntries(byChannel.map((r) => [r.name, r.c])),
    topPages,
    last7Days,
    recent: recent.map((r) => ({
      type: r.event_type,
      path: r.path,
      channel: r.channel,
      visitorId: r.visitor_id,
      at: r.created_at,
    })),
    note:
      "Phone/WhatsApp/Viber counts are button taps on the website (click-to-call). Completed carrier calls need a call-tracking provider.",
  };
}
