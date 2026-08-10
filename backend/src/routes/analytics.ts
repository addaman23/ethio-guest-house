import { Router, type Request } from "express";
import { z } from "zod";
import { recordSiteEvent, type ContactChannel } from "../utils/analytics";

const router = Router();

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim();
  }
  return req.socket.remoteAddress;
}

router.post("/event", (req, res, next) => {
  try {
    const body = z
      .object({
        eventType: z.enum(["page_view", "contact_click"]),
        path: z.string().max(300).optional(),
        channel: z.enum(["phone", "whatsapp", "viber", "email"]).optional(),
        visitorId: z.string().max(80).optional(),
        referrer: z.string().max(500).optional().nullable(),
      })
      .parse(req.body);

    if (body.eventType === "contact_click" && !body.channel) {
      res.status(400).json({ error: "channel required for contact_click" });
      return;
    }

    recordSiteEvent({
      eventType: body.eventType,
      path: body.path ?? req.headers.referer ?? "/",
      channel: (body.channel as ContactChannel | undefined) ?? null,
      visitorId: body.visitorId ?? null,
      ip: clientIp(req),
      userAgent: req.headers["user-agent"] ?? null,
      referrer: body.referrer ?? null,
    });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
