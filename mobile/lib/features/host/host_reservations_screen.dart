import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/providers/app_state.dart';
import '../../core/constants/platform_commission.dart';
import '../../core/widgets/booking_price_summary.dart';
import '../../data/repositories/booking_repository.dart';
import '../../domain/models/booking.dart';
import '../../domain/models/booking_status.dart';
import '../../domain/models/payment_method.dart';

class HostReservationsScreen extends StatefulWidget {
  const HostReservationsScreen({super.key});

  @override
  State<HostReservationsScreen> createState() => _HostReservationsScreenState();
}

class _HostReservationsScreenState extends State<HostReservationsScreen> {
  late Future<List<Booking>> _bookings;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  void _refresh() {
    final app = context.read<AppState>();
    final repo = context.read<BookingRepository>();
    _bookings = repo.listForHost(app.user!.id);
  }

  Future<void> _approve(Booking b) async {
    final repo = context.read<BookingRepository>();
    await repo.approve(b.id);
    setState(_refresh);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking confirmed — guest pays on arrival')),
      );
    }
  }

  Future<void> _markPaid(Booking b) async {
    final repo = context.read<BookingRepository>();
    await repo.markPaid(b.id);
    setState(_refresh);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Marked as paid (ETB on arrival)')),
      );
    }
  }

  Future<void> _decline(Booking b) async {
    final repo = context.read<BookingRepository>();
    await repo.decline(b.id);
    setState(_refresh);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking declined')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reservation requests')),
      body: FutureBuilder<List<Booking>>(
        future: _bookings,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final list = snapshot.data ?? [];
          if (list.isEmpty) {
            return const Center(child: Text('No reservations.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final b = list[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(b.propertyTitle, style: Theme.of(context).textTheme.titleMedium),
                      Text('Guest: ${b.guestName}'),
                      Text(
                        '${b.checkIn.toString().split(' ').first} → ${b.checkOut.toString().split(' ').first} · ${b.guests} guests',
                      ),
                      const SizedBox(height: 8),
                      BookingPriceSummary(
                        breakdown: BookingPricingBreakdown(
                          nights: b.nights,
                          nightlyRateEtb: b.nights > 0 ? b.subtotalEtb ~/ b.nights : b.subtotalEtb,
                          subtotalEtb: b.subtotalEtb,
                          platformFeeEtb: b.platformFeeEtb,
                          hostPayoutEtb: b.hostPayoutEtb,
                          totalEtb: b.totalEtb,
                        ),
                        audience: BookingPriceAudience.host,
                      ),
                      Text('${b.status.label}', style: Theme.of(context).textTheme.bodySmall),
                      if (b.status == BookingStatus.confirmed &&
                          b.paymentStatus == PaymentStatus.unpaid) ...[
                        const SizedBox(height: 12),
                        FilledButton.tonal(
                          onPressed: () => _markPaid(b),
                          child: const Text('Mark paid on arrival'),
                        ),
                      ],
                      if (b.status == BookingStatus.pendingApproval) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => _decline(b),
                                child: const Text('Decline'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: FilledButton(
                                onPressed: () => _approve(b),
                                child: const Text('Approve'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
