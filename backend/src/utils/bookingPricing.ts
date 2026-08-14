import { config } from "../config";

export interface BookingPricing {
  nights: number;
  nightlyRateEtb: number;
  subtotalEtb: number;
  platformFeeEtb: number;
  hostPayoutEtb: number;
  /** Full stay rent the guest owes overall. */
  totalEtb: number;
  /** Guest prepay: 10% of total stay, due 1 day before check-in. */
  depositEtb: number;
  /** Remaining amount paid on arrival after deposit. */
  balanceOnArrivalEtb: number;
  platformCommissionRate: number;
}

/** Calendar day before check-in (YYYY-MM-DD). */
export function depositDueDate(checkIn: string): string {
  const d = new Date(`${checkIn}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function calculateBookingPricing(
  nightlyRateEtb: number,
  nights: number
): BookingPricing {
  const subtotalEtb = nightlyRateEtb * nights;
  const platformFeeEtb = Math.round(subtotalEtb * config.platformCommissionRate);
  const hostPayoutEtb = subtotalEtb - platformFeeEtb;
  const depositEtb = Math.round(subtotalEtb * config.platformCommissionRate);
  const balanceOnArrivalEtb = subtotalEtb - depositEtb;

  return {
    nights,
    nightlyRateEtb,
    subtotalEtb,
    platformFeeEtb,
    hostPayoutEtb,
    totalEtb: subtotalEtb,
    depositEtb,
    balanceOnArrivalEtb,
    platformCommissionRate: config.platformCommissionRate,
  };
}

export function backfillBookingPricingFromTotal(totalEtb: number): Pick<
  BookingPricing,
  | "subtotalEtb"
  | "platformFeeEtb"
  | "hostPayoutEtb"
  | "totalEtb"
  | "depositEtb"
  | "balanceOnArrivalEtb"
> {
  const platformFeeEtb = Math.round(totalEtb * config.platformCommissionRate);
  return {
    subtotalEtb: totalEtb,
    platformFeeEtb,
    hostPayoutEtb: totalEtb - platformFeeEtb,
    totalEtb,
    depositEtb: platformFeeEtb,
    balanceOnArrivalEtb: totalEtb - platformFeeEtb,
  };
}
