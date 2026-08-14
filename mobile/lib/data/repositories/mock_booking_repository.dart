import '../../domain/models/app_notification.dart';
import '../../domain/models/booking.dart';
import '../../domain/models/booking_status.dart';
import '../../domain/models/payment_method.dart';
import '../../core/constants/platform_commission.dart';
import 'booking_repository.dart';

Booking _withCommission({
  required String id,
  required String propertyId,
  required String propertyTitle,
  required String guestId,
  required String guestName,
  required DateTime checkIn,
  required DateTime checkOut,
  required int guests,
  required int totalEtb,
  required BookingStatus status,
  required PaymentMethod paymentMethod,
  required PaymentStatus paymentStatus,
  required DateTime createdAt,
  String depositStatus = 'not_due',
}) {
  final fee = (totalEtb * PlatformCommission.rate).round();
  return Booking(
    id: id,
    propertyId: propertyId,
    propertyTitle: propertyTitle,
    guestId: guestId,
    guestName: guestName,
    checkIn: checkIn,
    checkOut: checkOut,
    guests: guests,
    totalEtb: totalEtb,
    subtotalEtb: totalEtb,
    platformFeeEtb: fee,
    hostPayoutEtb: totalEtb - fee,
    depositEtb: fee,
    balanceOnArrivalEtb: totalEtb - fee,
    depositStatus: depositStatus,
    depositDueAt: checkIn.subtract(const Duration(days: 1)),
    depositWhatsappHref: null,
    status: status,
    paymentMethod: paymentMethod,
    paymentStatus: paymentStatus,
    createdAt: createdAt,
  );
}

class MockBookingRepository implements BookingRepository {
  final List<Booking> _bookings = [
    _withCommission(
      id: 'bk_seed',
      propertyId: 'prop_1',
      propertyTitle: 'Green View Guest House',
      guestId: 'guest_1',
      guestName: 'Demo Guest',
      checkIn: DateTime.now().add(const Duration(days: 5)),
      checkOut: DateTime.now().add(const Duration(days: 7)),
      guests: 2,
      totalEtb: 2400,
      status: BookingStatus.pendingApproval,
      paymentMethod: PaymentMethod.payOnArrival,
      paymentStatus: PaymentStatus.unpaid,
      createdAt: DateTime.now(),
    ),
  ];

  final List<AppNotification> _notifications = [];

  @override
  Future<List<Booking>> listForGuest(String guestId) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return _bookings.where((b) => b.guestId == guestId).toList();
  }

  @override
  Future<List<Booking>> listForHost(String hostId, {BookingStatus? status}) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    const hostProperties = {'prop_1', 'prop_2'};
    var list = _bookings.where((b) => hostProperties.contains(b.propertyId));
    if (status != null) {
      list = list.where((b) => b.status == status);
    }
    return list.toList();
  }

  @override
  Future<Booking> createRequest({
    required String propertyId,
    required String propertyTitle,
    required String guestId,
    required String guestName,
    required DateTime checkIn,
    required DateTime checkOut,
    required int guests,
    required int nightlyRateEtb,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    final nights = checkOut.difference(checkIn).inDays;
    final total = nights * nightlyRateEtb;
    final booking = _withCommission(
      id: 'bk_${DateTime.now().millisecondsSinceEpoch}',
      propertyId: propertyId,
      propertyTitle: propertyTitle,
      guestId: guestId,
      guestName: guestName,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: guests,
      totalEtb: total,
      status: BookingStatus.pendingApproval,
      paymentMethod: PaymentMethod.payOnArrival,
      paymentStatus: PaymentStatus.unpaid,
      createdAt: DateTime.now(),
    );
    _bookings.add(booking);
    return booking;
  }

  @override
  Future<Booking> approve(String bookingId) async {
    return _updateStatus(bookingId, BookingStatus.confirmed);
  }

  @override
  Future<Booking> decline(String bookingId) async {
    return _updateStatus(bookingId, BookingStatus.declined);
  }

  @override
  Future<Booking> markPaid(String bookingId) async {
    final index = _bookings.indexWhere((b) => b.id == bookingId);
    if (index < 0) throw StateError('Booking not found');
    final old = _bookings[index];
    final updated = _withCommission(
      id: old.id,
      propertyId: old.propertyId,
      propertyTitle: old.propertyTitle,
      guestId: old.guestId,
      guestName: old.guestName,
      checkIn: old.checkIn,
      checkOut: old.checkOut,
      guests: old.guests,
      totalEtb: old.totalEtb,
      status: old.status,
      paymentMethod: old.paymentMethod,
      paymentStatus: PaymentStatus.paid,
      createdAt: old.createdAt,
      depositStatus: old.depositStatus,
    );
    _bookings[index] = updated;
    return updated;
  }

  @override
  Future<Booking> markDepositPaid(String bookingId) async {
    final index = _bookings.indexWhere((b) => b.id == bookingId);
    if (index < 0) throw StateError('Booking not found');
    final old = _bookings[index];
    final updated = _withCommission(
      id: old.id,
      propertyId: old.propertyId,
      propertyTitle: old.propertyTitle,
      guestId: old.guestId,
      guestName: old.guestName,
      checkIn: old.checkIn,
      checkOut: old.checkOut,
      guests: old.guests,
      totalEtb: old.totalEtb,
      status: old.status,
      paymentMethod: old.paymentMethod,
      paymentStatus: old.paymentStatus,
      createdAt: old.createdAt,
      depositStatus: 'paid',
    );
    _bookings[index] = updated;
    return updated;
  }

  @override
  Future<Booking> cancel(String bookingId) async {
    return _updateStatus(bookingId, BookingStatus.cancelled);
  }

  @override
  Future<List<AppNotification>> listNotifications({bool unreadOnly = false}) async {
    await Future<void>.delayed(const Duration(milliseconds: 100));
    if (unreadOnly) {
      return _notifications.where((n) => n.isUnread).toList();
    }
    return List.of(_notifications);
  }

  @override
  Future<void> markNotificationRead(String notificationId) async {
    final i = _notifications.indexWhere((n) => n.id == notificationId);
    if (i < 0) return;
    final n = _notifications[i];
    _notifications[i] = AppNotification(
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      bookingId: n.bookingId,
      readAt: DateTime.now(),
      createdAt: n.createdAt,
    );
  }

  Future<Booking> _updateStatus(String bookingId, BookingStatus status) async {
    final index = _bookings.indexWhere((b) => b.id == bookingId);
    if (index < 0) throw StateError('Booking not found');
    final old = _bookings[index];
    final updated = _withCommission(
      id: old.id,
      propertyId: old.propertyId,
      propertyTitle: old.propertyTitle,
      guestId: old.guestId,
      guestName: old.guestName,
      checkIn: old.checkIn,
      checkOut: old.checkOut,
      guests: old.guests,
      totalEtb: old.totalEtb,
      status: status,
      paymentMethod: old.paymentMethod,
      paymentStatus: old.paymentStatus,
      createdAt: old.createdAt,
      depositStatus: old.depositStatus,
    );
    _bookings[index] = updated;
    return updated;
  }
}
