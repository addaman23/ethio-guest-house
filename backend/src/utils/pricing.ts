import { config } from "../config";
import { etbToForeign } from "./international";

export function usdToEtb(usd: number): number {
  return Math.round(usd * config.usdEtbRate);
}

export function etbToUsd(etb: number): number {
  if (config.usdEtbRate <= 0) return 0;
  return Math.round((etb / config.usdEtbRate) * 100) / 100;
}

export function assertMinNightlyUsd(usd: number): void {
  if (usd < config.minNightlyUsd) {
    throw new Error(`Nightly rate must be at least $${config.minNightlyUsd} USD`);
  }
}

/** Resolve host-submitted rate: prefer USD (min $50), fall back to ETB. */
export function resolveNightlyRateEtb(input: {
  nightlyRateUsd?: number;
  nightlyRateEtb?: number;
}): number {
  if (input.nightlyRateUsd != null) {
    assertMinNightlyUsd(input.nightlyRateUsd);
    return usdToEtb(input.nightlyRateUsd);
  }
  if (input.nightlyRateEtb != null) {
    const usd = etbToUsd(input.nightlyRateEtb);
    assertMinNightlyUsd(usd);
    return Math.round(input.nightlyRateEtb);
  }
  throw new Error("nightlyRateUsd is required (minimum $50)");
}

export function formatListingPrice(etb: number): {
  nightlyRateUsd: number;
  nightlyRateEtb: number;
  currency: "USD";
  display: string;
  payOnArrivalEtb: number;
  hints: { currency: string; amount: number }[];
} {
  const nightlyRateUsd = etbToUsd(etb);
  const hints: { currency: string; amount: number }[] = [
    { currency: "ETB", amount: etb },
  ];
  for (const currency of ["CAD", "EUR", "GBP"] as const) {
    const amount = etbToForeign(etb, currency);
    if (amount != null) hints.push({ currency, amount });
  }
  return {
    nightlyRateUsd,
    nightlyRateEtb: etb,
    currency: "USD",
    display: `$${nightlyRateUsd} USD`,
    payOnArrivalEtb: etb,
    hints,
  };
}

/** Demo listing USD rates (starting from $50). */
export const DEMO_PROPERTY_USD_RATES: Record<string, number> = {
  prop_1: 50,
  prop_2: 65,
  prop_3: 80,
};
