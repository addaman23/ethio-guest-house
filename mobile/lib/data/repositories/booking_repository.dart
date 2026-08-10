import '../../domain/models/booking.dart';
import '../../domain/models/booking_status.dart';

abstract class BookingRepository {
  Future<List<Booking>> listForGuest(String guestId);
  Future<List<Booking>> listForHost(String hostId, {BookingStatus? status});
  Future<Booking> createRequest({
    required String propertyId,
    required String propertyTitle,
    required String guestId,
    required String guestName,
    required DateTime checkIn,
    required DateTime checkOut,
    required int guests,
    required int nightlyRateEtb,
  });
  Future<Booking> approve(String bookingId);
  Future<Booking> decline(String bookingId);
  Future<Booking> markPaid(String bookingId);
  Future<Booking> cancel(String bookingId);
}
