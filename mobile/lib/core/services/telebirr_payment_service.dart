import '../../core/constants/ethiopia.dart';
import 'payment_service.dart';

/// Stub for Ethio Telecom Telebirr merchant integration (Phase 2).
///
/// Real implementation needs: merchant credentials, order API,
/// callback/webhook URL, and app deep link or WebView checkout.
class TelebirrPaymentService implements PaymentService {
  @override
  Future<PaymentResult> initiatePayment({
    required String bookingId,
    required int amountEtb,
  }) async {
    return PaymentResult(
      success: false,
      message:
          '${EthiopiaConstants.telebirrProviderName} is not configured yet. '
          'Use pay on arrival for this booking.',
    );
  }
}
