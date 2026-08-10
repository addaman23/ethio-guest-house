class BookingPricingBreakdown {
  const BookingPricingBreakdown({
    required this.nights,
    required this.nightlyRateEtb,
    required this.subtotalEtb,
    required this.platformFeeEtb,
    required this.hostPayoutEtb,
    required this.totalEtb,
  });

  final int nights;
  final int nightlyRateEtb;
  final int subtotalEtb;
  final int platformFeeEtb;
  final int hostPayoutEtb;
  final int totalEtb;
}

class PlatformCommission {
  static const rate = 0.10;
  static const percentLabel = '10%';

  static BookingPricingBreakdown calculate({
    required int nightlyRateEtb,
    required int nights,
  }) {
    final n = nights < 1 ? 1 : nights;
    final subtotal = nightlyRateEtb * n;
    final fee = (subtotal * rate).round();
    return BookingPricingBreakdown(
      nights: n,
      nightlyRateEtb: nightlyRateEtb,
      subtotalEtb: subtotal,
      platformFeeEtb: fee,
      hostPayoutEtb: subtotal - fee,
      totalEtb: subtotal,
    );
  }
}
