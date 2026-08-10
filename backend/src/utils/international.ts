import { z } from "zod";

/** E.164 — Ethiopia and international travelers (US, Canada, Europe, etc.). */
export const internationalPhoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be international format, e.g. +251..., +1..., +44...");

export const GUEST_COUNTRIES = [
  { code: "ET", name: "Ethiopia", dial: "+251", flag: "🇪🇹", currency: "ETB" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸", currency: "USD" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦", currency: "CAD" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧", currency: "GBP" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪", currency: "EUR" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷", currency: "EUR" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹", currency: "EUR" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸", currency: "EUR" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱", currency: "EUR" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪", currency: "EUR" },
  { code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹", currency: "EUR" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹", currency: "EUR" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪", currency: "EUR" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪", currency: "SEK" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴", currency: "NOK" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰", currency: "DKK" },
  { code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮", currency: "EUR" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭", currency: "CHF" },
  { code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱", currency: "PLN" },
  { code: "GR", name: "Greece", dial: "+30", flag: "🇬🇷", currency: "EUR" },
  { code: "CZ", name: "Czech Republic", dial: "+420", flag: "🇨🇿", currency: "CZK" },
  { code: "RO", name: "Romania", dial: "+40", flag: "🇷🇴", currency: "RON" },
  { code: "HU", name: "Hungary", dial: "+36", flag: "🇭🇺", currency: "HUF" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷", currency: "TRY" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺", currency: "AUD" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿", currency: "NZD" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪", currency: "AED" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦", currency: "SAR" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦", currency: "ZAR" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳", currency: "INR" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵", currency: "JPY" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳", currency: "CNY" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷", currency: "BRL" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽", currency: "MXN" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬", currency: "EGP" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪", currency: "KES" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬", currency: "NGN" },
] as const;

/**
 * Approximate demo rates — listings are priced in USD; pay on arrival converts to ETB.
 * Values = ETB per 1 unit of foreign currency.
 */
export const ETB_REFERENCE_RATES: Record<string, number> = {
  ETB: 1,
  USD: 57,
  CAD: 42,
  EUR: 62,
  GBP: 72,
  CHF: 64,
  AUD: 37,
  NZD: 34,
  AED: 15.5,
  SAR: 15.2,
  ZAR: 3.1,
  INR: 0.68,
  JPY: 0.38,
  CNY: 7.9,
  BRL: 10,
  MXN: 3.3,
  EGP: 1.2,
  KES: 0.44,
  NGN: 0.04,
  TRY: 1.7,
  PLN: 14,
  SEK: 5.4,
  NOK: 5.2,
  DKK: 8.3,
  CZK: 2.4,
  RON: 12.5,
  HUF: 0.16,
};

export function etbToForeign(etb: number, currency: string): number | null {
  const rate = ETB_REFERENCE_RATES[currency];
  if (!rate || rate <= 0) return null;
  return Math.round((etb / rate) * 100) / 100;
}

export function formatPriceHints(etb: number): { etb: number; hints: { currency: string; amount: number }[] } {
  const hints: { currency: string; amount: number }[] = [];
  for (const currency of ["USD", "CAD", "EUR", "GBP"] as const) {
    const amount = etbToForeign(etb, currency);
    if (amount != null) hints.push({ currency, amount });
  }
  return { etb, hints };
}
