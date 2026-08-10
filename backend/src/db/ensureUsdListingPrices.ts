import { getDb } from "./database";
import { DEMO_PROPERTY_USD_RATES, usdToEtb } from "../utils/pricing";

/** Keep demo listings priced in USD (from $50) even on existing databases. */
export function ensureUsdListingPrices(): void {
  const db = getDb();
  const update = db.prepare(`UPDATE properties SET nightly_rate_etb = ? WHERE id = ?`);

  for (const [id, usd] of Object.entries(DEMO_PROPERTY_USD_RATES)) {
    update.run(usdToEtb(usd), id);
  }
}
