import 'package:flutter/material.dart';

import '../constants/platform_commission.dart';

class BookingPriceSummary extends StatelessWidget {
  const BookingPriceSummary({
    super.key,
    required this.breakdown,
    this.audience = BookingPriceAudience.guest,
  });

  final BookingPricingBreakdown breakdown;
  final BookingPriceAudience audience;

  @override
  Widget build(BuildContext context) {
    final b = breakdown;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              audience == BookingPriceAudience.host ? 'Payout breakdown' : 'Price breakdown',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            _line('${b.nights} night(s) × ${b.nightlyRateEtb} ETB', '${b.subtotalEtb} ETB'),
            if (audience == BookingPriceAudience.host) ...[
              _line(
                'Platform fee (${PlatformCommission.percentLabel})',
                '− ${b.platformFeeEtb} ETB',
                muted: true,
              ),
              const Divider(height: 16),
              _line('You receive', '${b.hostPayoutEtb} ETB', bold: true),
            ],
            if (audience == BookingPriceAudience.guest) ...[
              const Divider(height: 16),
              _line('Pay on arrival', '${b.totalEtb} ETB', bold: true),
              const SizedBox(height: 6),
              Text(
                'Ethio Guest House connects you with the host. '
                '${PlatformCommission.percentLabel} of the rent supports the platform.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54),
              ),
            ],
            if (audience == BookingPriceAudience.admin) ...[
              _line(
                'Platform fee (${PlatformCommission.percentLabel})',
                '${b.platformFeeEtb} ETB',
              ),
              _line('Host receives', '${b.hostPayoutEtb} ETB'),
              _line('Guest pays', '${b.totalEtb} ETB', bold: true),
            ],
          ],
        ),
      ),
    );
  }

  Widget _line(String label, String value, {bool bold = false, bool muted = false}) {
    final style = TextStyle(
      fontWeight: bold ? FontWeight.bold : FontWeight.normal,
      color: muted ? Colors.black54 : null,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(child: Text(label, style: style)),
          Text(value, style: style),
        ],
      ),
    );
  }
}

enum BookingPriceAudience { guest, host, admin }
