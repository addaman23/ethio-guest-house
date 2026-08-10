import '../../domain/models/app_user.dart';
import '../../domain/models/booking.dart';
import '../../domain/models/booking_status.dart';
import '../../domain/models/payment_method.dart';
import '../../domain/models/property.dart';
import '../../domain/models/property_status.dart';
import '../../domain/models/user_role.dart';
import '../../core/constants/platform_commission.dart';

BookingStatus parseBookingStatus(String value) {
  switch (value) {
    case 'pending_approval':
      return BookingStatus.pendingApproval;
    case 'confirmed':
      return BookingStatus.confirmed;
    case 'declined':
      return BookingStatus.declined;
    case 'cancelled':
      return BookingStatus.cancelled;
    case 'completed':
      return BookingStatus.completed;
    default:
      return BookingStatus.pendingApproval;
  }
}

PropertyStatus parsePropertyStatus(String value) {
  switch (value) {
    case 'draft':
      return PropertyStatus.draft;
    case 'pending_review':
      return PropertyStatus.pendingReview;
    case 'live':
      return PropertyStatus.live;
    case 'suspended':
      return PropertyStatus.suspended;
    default:
      return PropertyStatus.draft;
  }
}

PaymentMethod parsePaymentMethod(String value) {
  return value == 'telebirr' ? PaymentMethod.telebirr : PaymentMethod.payOnArrival;
}

PaymentStatus parsePaymentStatus(String value) {
  return value == 'paid' ? PaymentStatus.paid : PaymentStatus.unpaid;
}

List<UserRole> parseRoles(List<dynamic> roles) {
  return roles
      .map((r) {
        switch (r.toString()) {
          case 'host':
            return UserRole.host;
          case 'admin':
            return UserRole.admin;
          default:
            return UserRole.guest;
        }
      })
      .where((r) => r != UserRole.admin)
      .toList();
}

AppUser parseUser(Map<String, dynamic> json, {UserRole? activeRole}) {
  final roles = parseRoles(json['roles'] as List<dynamic>? ?? ['guest']);
  final resolved = activeRole ??
      (roles.contains(UserRole.host) ? UserRole.host : UserRole.guest);
  return AppUser(
    id: json['id'] as String,
    phone: json['phone'] as String,
    name: json['name'] as String,
    roles: roles.isEmpty ? [UserRole.guest] : roles,
    activeRole: roles.contains(resolved) ? resolved : roles.first,
    hostVerified: json['hostVerified'] as bool? ?? false,
    guestCountry: json['guestCountry'] as String?,
  );
}

Map<String, dynamic> userToJson(AppUser user) => {
      'id': user.id,
      'phone': user.phone,
      'name': user.name,
      'roles': user.roles.map((r) => r.name).toList(),
      'hostVerified': user.hostVerified,
      'activeRole': user.activeRole.name,
    };

Property parseProperty(Map<String, dynamic> json) {
  final urls = (json['imageUrls'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .where((u) => u.isNotEmpty)
          .toList() ??
      <String>[];
  final single = json['imageUrl'] as String?;
  final imageUrls = urls.isNotEmpty
      ? urls
      : (single != null && single.isNotEmpty ? [single] : <String>[]);

  return Property(
    id: json['id'] as String,
    hostId: json['hostId'] as String,
    title: json['title'] as String,
    city: json['city'] as String,
    address: json['address'] as String,
    description: json['description'] as String,
    nightlyRateEtb: json['nightlyRateEtb'] as int,
    maxGuests: json['maxGuests'] as int,
    amenities: (json['amenities'] as List<dynamic>).cast<String>(),
    status: parsePropertyStatus(json['status'] as String),
    imageUrl: imageUrls.isNotEmpty ? imageUrls.first : single,
    imageUrls: imageUrls,
  );
}

Booking parseBooking(Map<String, dynamic> json) {
  return Booking(
    id: json['id'] as String,
    propertyId: json['propertyId'] as String,
    propertyTitle: json['propertyTitle'] as String? ?? '',
    guestId: json['guestId'] as String,
    guestName: json['guestName'] as String? ?? '',
    checkIn: DateTime.parse(json['checkIn'] as String),
    checkOut: DateTime.parse(json['checkOut'] as String),
    guests: json['guests'] as int,
    totalEtb: json['totalEtb'] as int,
    subtotalEtb: json['subtotalEtb'] as int? ?? json['totalEtb'] as int,
    platformFeeEtb: json['platformFeeEtb'] as int? ??
        ((json['totalEtb'] as int) * PlatformCommission.rate).round(),
    hostPayoutEtb: json['hostPayoutEtb'] as int? ??
        (json['totalEtb'] as int) -
            ((json['totalEtb'] as int) * PlatformCommission.rate).round(),
    status: parseBookingStatus(json['status'] as String),
    paymentMethod: parsePaymentMethod(json['paymentMethod'] as String),
    paymentStatus: parsePaymentStatus(json['paymentStatus'] as String),
    createdAt: DateTime.parse(json['createdAt'] as String),
  );
}

String formatDate(DateTime d) =>
    '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
