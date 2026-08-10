import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/providers/app_state.dart';
import '../../data/repositories/booking_repository.dart';
import '../../domain/models/booking.dart';
import '../../domain/models/booking_status.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  late Future<List<Booking>> _bookings;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  void _refresh() {
    final app = context.read<AppState>();
    _bookings = context.read<BookingRepository>().listForGuest(app.user!.id);
  }

  Future<void> _cancel(Booking b) async {
    await context.read<BookingRepository>().cancel(b.id);
    setState(_refresh);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking cancelled')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My bookings')),
      body: FutureBuilder<List<Booking>>(
        future: _bookings,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final list = snapshot.data ?? [];
          if (list.isEmpty) {
            return const Center(child: Text('No bookings yet.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final b = list[i];
              final canCancel = b.status == BookingStatus.pendingApproval ||
                  b.status == BookingStatus.confirmed;
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  title: Text(b.propertyTitle),
                  subtitle: Text(
                    '${b.checkIn.toString().split(' ').first} → ${b.checkOut.toString().split(' ').first}\n'
                    'Pay ${b.totalEtb} ETB on arrival · ${b.status.label}',
                  ),
                  isThreeLine: true,
                  trailing: _statusIcon(b.status),
                  onTap: canCancel
                      ? () => showDialog<void>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Cancel booking?'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx),
                                  child: const Text('No'),
                                ),
                                FilledButton(
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    _cancel(b);
                                  },
                                  child: const Text('Yes, cancel'),
                                ),
                              ],
                            ),
                          )
                      : null,
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _statusIcon(BookingStatus status) {
    switch (status) {
      case BookingStatus.pendingApproval:
        return const Icon(Icons.hourglass_top, color: Colors.orange);
      case BookingStatus.confirmed:
        return const Icon(Icons.check_circle, color: Colors.green);
      case BookingStatus.declined:
        return const Icon(Icons.cancel, color: Colors.red);
      default:
        return const Icon(Icons.info_outline);
    }
  }
}
