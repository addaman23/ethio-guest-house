export type UserRole = "guest" | "host" | "admin";

export type BookingStatus =
  | "pending_approval"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type PropertyStatus =
  | "draft"
  | "pending_review"
  | "live"
  | "suspended";

export type PaymentMethod = "pay_on_arrival" | "telebirr";
export type PaymentStatus = "unpaid" | "paid";

export interface UserRow {
  id: string;
  phone: string;
  name: string;
  roles: string;
  host_verified: number;
  guest_country: string | null;
  created_at: string;
}

export interface PropertyRow {
  id: string;
  host_id: string;
  title: string;
  city: string;
  address: string;
  description: string;
  nightly_rate_etb: number;
  max_guests: number;
  amenities: string;
  status: PropertyStatus;
  image_url: string | null;
  image_urls: string | null;
  video_urls: string | null;
  created_at: string;
}

export interface BookingRow {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_etb: number;
  subtotal_etb: number;
  platform_fee_etb: number;
  host_payout_etb: number;
  status: BookingStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  guest_message: string | null;
  created_at: string;
}

export type BookingRequestStatus =
  | "new"
  | "contacted"
  | "approved"
  | "declined"
  | "closed";

export interface BookingRequestRow {
  id: string;
  property_id: string | null;
  booking_id: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  message: string | null;
  status: BookingRequestStatus;
  source: string;
  created_at: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  roles: UserRole[];
}
