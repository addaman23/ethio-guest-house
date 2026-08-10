/// Payment abstraction — MVP uses pay on arrival; Telebirr in Phase 2.
abstract class PaymentService {
  Future<PaymentResult> initiatePayment({
    required String bookingId,
    required int amountEtb,
  });
}

class PaymentResult {
  const PaymentResult({
    required this.success,
    required this.message,
    this.transactionId,
  });

  final bool success;
  final String message;
  final String? transactionId;
}
