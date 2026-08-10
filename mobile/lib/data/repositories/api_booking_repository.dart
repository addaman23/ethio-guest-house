import '../../core/api/api_client.dart';
import '../../domain/models/booking.dart';
import '../../domain/models/booking_status.dart';
import '../api/model_parsers.dart';
import 'booking_repository.dart';

class ApiBookingRepository implements BookingRepository {
  ApiBookingRepository(this._api);

  final ApiClient _api;

  @override
  Future<List<Booking>> listForGuest(String guestId) async {
    final res = await _api.get('/bookings/mine');
    final list = res['bookings'] as List<dynamic>;
    return list.map((e) => parseBooking(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<Booking>> listForHost(String hostId, {BookingStatus? status}) async {
    final query = <String, String>{};
    if (status != null) {
      query['status'] = _statusParam(status);
    }
    final res = await _api.get('/host/bookings', query: query.isEmpty ? null : query);
    final list = res['bookings'] as List<dynamic>;
    return list.map((e) => parseBooking(e as Map<String, dynamic>)).toList();
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
    final res = await _api.post(
      '/bookings',
      body: {
        'propertyId': propertyId,
        'checkIn': formatDate(checkIn),
        'checkOut': formatDate(checkOut),
        'guests': guests,
      },
    );
    return parseBooking(res['booking'] as Map<String, dynamic>);
  }

  @override
  Future<Booking> approve(String bookingId) async {
    final res = await _api.post('/host/bookings/$bookingId/approve');
    return parseBooking(res['booking'] as Map<String, dynamic>);
  }

  @override
  Future<Booking> decline(String bookingId) async {
    final res = await _api.post('/host/bookings/$bookingId/decline');
    return parseBooking(res['booking'] as Map<String, dynamic>);
  }

  static String _statusParam(BookingStatus status) {
    switch (status) {
      case BookingStatus.pendingApproval:
        return 'pending_approval';
      case BookingStatus.confirmed:
        return 'confirmed';
      case BookingStatus.declined:
        return 'declined';
      case BookingStatus.cancelled:
        return 'cancelled';
      case BookingStatus.completed:
        return 'completed';
    }
  }

  @override
  Future<Booking> markPaid(String bookingId) async {
    final res = await _api.post('/host/bookings/$bookingId/mark-paid');
    return parseBooking(res['booking'] as Map<String, dynamic>);
  }

  @override
  Future<Booking> cancel(String bookingId) async {
    final res = await _api.post('/bookings/$bookingId/cancel');
    return parseBooking(res['booking'] as Map<String, dynamic>);
  }
}
