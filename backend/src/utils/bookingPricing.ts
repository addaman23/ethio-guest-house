import { config } from "../config";

export interface BookingPricing {
  nights: number;
  nightlyRateEtb: number;
  subtotalEtb: number;
  platformFeeEtb: number;
  hostPayoutEtb: number;
  /** Amount the guest pays on arrival (equals rent subtotal). */
  totalEtb: number;
  platformCommissionRate: number;
}

export function calculateBookingPricing(
  nightlyRateEtb: number,
  nights: number
): BookingPricing {
  const subtotalEtb = nightlyRateEtb * nights;
  const platformFeeEtb = Math.round(subtotalEtb * config.platformCommissionRate);
  const hostPayoutEtb = subtotalEtb - platformFeeEtb;

  return {
    nights,
    nightlyRateEtb,
    subtotalEtb,
    platformFeeEtb,
    hostPayoutEtb,
    totalEtb: subtotalEtb,
    platformCommissionRate: config.platformCommissionRate,
  };
}

export function backfillBookingPricingFromTotal(totalEtb: number): Pick<
  BookingPricing,
  "subtotalEtb" | "platformFeeEtb" | "hostPayoutEtb" | "totalEtb"
> {
  const platformFeeEtb = Math.round(totalEtb * config.platformCommissionRate);
  return {
    subtotalEtb: totalEtb,
    platformFeeEtb,
    hostPayoutEtb: totalEtb - platformFeeEtb,
    totalEtb,
  };
}
