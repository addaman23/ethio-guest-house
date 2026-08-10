import 'package:equatable/equatable.dart';

import 'booking_status.dart';
import 'payment_method.dart';

class Booking extends Equatable {
  const Booking({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.guestId,
    required this.guestName,
    required this.checkIn,
    required this.checkOut,
    required this.guests,
    required this.totalEtb,
    required this.subtotalEtb,
    required this.platformFeeEtb,
    required this.hostPayoutEtb,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.createdAt,
  });

  final String id;
  final String propertyId;
  final String propertyTitle;
  final String guestId;
  final String guestName;
  final DateTime checkIn;
  final DateTime checkOut;
  final int guests;
  final int totalEtb;
  final int subtotalEtb;
  final int platformFeeEtb;
  final int hostPayoutEtb;
  final BookingStatus status;
  final PaymentMethod paymentMethod;
  final PaymentStatus paymentStatus;
  final DateTime createdAt;

  int get nights => checkOut.difference(checkIn).inDays;

  @override
  List<Object?> get props => [id, propertyId, status, checkIn, checkOut];
}
