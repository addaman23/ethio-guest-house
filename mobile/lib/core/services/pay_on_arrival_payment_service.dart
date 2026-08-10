import 'payment_service.dart';

class PayOnArrivalPaymentService implements PaymentService {
  @override
  Future<PaymentResult> initiatePayment({
    required String bookingId,
    required int amountEtb,
  }) async {
    return PaymentResult(
      success: true,
      message:
          'No online payment required. Pay $amountEtb ETB when you arrive. '
          'Show your booking ID to the host.',
    );
  }
}
