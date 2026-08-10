import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import bookingsRoutes from "./routes/bookings";
import hostRoutes from "./routes/host";
import metaRoutes from "./routes/meta";
import propertiesRoutes from "./routes/properties";
import analyticsRoutes from "./routes/analytics";
import webRoutes from "./web/routes";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(","),
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "ethio-guest-house-api" });
  });

  const publicDir = path.join(process.cwd(), "public");

  /** Public SEO website must win over static index.html */
  app.use(webRoutes);

  app.get("/demo", (_req, res) => {
    res.sendFile(path.join(publicDir, "demo.html"));
  });

  app.get("/owner", (_req, res) => {
    res.sendFile(path.join(publicDir, "owner.html"));
  });

  app.use("/uploads", express.static(config.uploadsDir));
  app.use(express.static(publicDir, { index: false }));

  const v1 = express.Router();
  v1.use("/auth", authRoutes);
  v1.use("/meta", metaRoutes);
  v1.use("/analytics", analyticsRoutes);
  v1.use("/properties", propertiesRoutes);
  v1.use("/bookings", bookingsRoutes);
  v1.use("/host", hostRoutes);
  v1.use("/admin", adminRoutes);

  app.use("/v1", v1);

  app.use(errorHandler);

  return app;
}
