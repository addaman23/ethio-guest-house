import type { BookingRow, PropertyRow, UserRow, UserRole } from "../types";
import { config } from "../config";
import { PROPERTY_IMAGE_SETS } from "../utils/propertyImages";
import { parseStoredImageUrls, toPublicImageUrl } from "../utils/propertyPhotos";
import { videosFromRow } from "../utils/propertyVideos";
import { formatListingPrice } from "../utils/pricing";

function parsePropertyImageUrls(row: PropertyRow): string[] {
  const stored = parseStoredImageUrls(row);
  if (stored.length > 0) return stored.map(toPublicImageUrl);
  const fallback = PROPERTY_IMAGE_SETS[row.id];
  return (fallback ?? []).map(toPublicImageUrl);
}

export function parseRoles(roles: string): UserRole[] {
  return roles.split(",").filter(Boolean) as UserRole[];
}

export function serializeRoles(roles: UserRole[]): string {
  return roles.join(",");
}

export function userToJson(row: UserRow) {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    roles: parseRoles(row.roles),
    hostVerified: row.host_verified === 1,
    guestCountry: row.guest_country,
    createdAt: row.created_at,
  };
}

export function propertyToJson(row: PropertyRow) {
  const imageUrls = parsePropertyImageUrls(row);
  const videos = videosFromRow(row);
  const pricing = formatListingPrice(row.nightly_rate_etb);
  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    city: row.city,
    address: row.address,
    description: row.description,
    nightlyRateUsd: pricing.nightlyRateUsd,
    nightlyRateEtb: pricing.nightlyRateEtb,
    currency: pricing.currency,
    priceDisplay: pricing.display,
    maxGuests: row.max_guests,
    amenities: JSON.parse(row.amenities) as string[],
    status: row.status,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    videoUrls: videos.map((v) => v.url),
    videos,
    priceHints: pricing.hints,
    payOnArrivalNote: `Pay about ${pricing.nightlyRateEtb.toLocaleString("en-ET")} ETB / night on arrival (about $${pricing.nightlyRateUsd} USD)`,
    platformCommissionRate: config.platformCommissionRate,
    platformCommissionNote: `${Math.round(config.platformCommissionRate * 100)}% platform fee on rent supports guest–host matching`,
    createdAt: row.created_at,
  };
}

export function bookingToJson(
  row: BookingRow,
  extras?: { propertyTitle?: string; guestName?: string }
) {
  const subtotal =
    row.subtotal_etb > 0 ? row.subtotal_etb : row.total_etb;
  const platformFee =
    row.platform_fee_etb > 0
      ? row.platform_fee_etb
      : Math.round(subtotal * config.platformCommissionRate);
  const hostPayout =
    row.host_payout_etb > 0 ? row.host_payout_etb : subtotal - platformFee;

  return {
    id: row.id,
    propertyId: row.property_id,
    propertyTitle: extras?.propertyTitle,
    guestId: row.guest_id,
    guestName: extras?.guestName,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    subtotalEtb: subtotal,
    platformFeeEtb: platformFee,
    hostPayoutEtb: hostPayout,
    platformCommissionRate: config.platformCommissionRate,
    totalEtb: row.total_etb,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  };
}
