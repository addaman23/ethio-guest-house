import { createApp } from "./app";
import { config } from "./config";
import { getDb } from "./db/database";
import { ensureHostPhone } from "./db/ensureHostPhone";
import { ensureLiveHostListings } from "./db/ensureLiveHostListings";
import { ensurePropertyImages } from "./db/ensurePropertyImages";
import { ensurePropertyVideos } from "./db/ensurePropertyVideos";
import { ensureUsdListingPrices } from "./db/ensureUsdListingPrices";
import { seedDatabase } from "./db/seed";
import { startDepositReminderJob } from "./jobs/depositReminders";
import { ensureUploadDirs } from "./utils/propertyPhotos";

ensureUploadDirs();
getDb();
seedDatabase();
ensurePropertyImages();
ensurePropertyVideos();
ensureUsdListingPrices();
ensureHostPhone();
ensureLiveHostListings();

const app = createApp();

app.listen(config.port, () => {
  console.log(`AddisAbaba Guest Houses website: http://localhost:${config.port}`);
  console.log(`API base: http://localhost:${config.port}/v1`);
  console.log(`Operator demo: http://localhost:${config.port}/demo`);
  if (config.nodeEnv === "development") {
    console.log(`Demo OTP for all phones: ${config.otpDemoCode}`);
    console.log(`Admin API key header: X-Admin-Key: ${config.adminApiKey}`);
  }
  startDepositReminderJob(60_000);
});
