import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/providers/app_state.dart';
import '../../data/repositories/booking_repository.dart';
import '../../domain/models/app_notification.dart';
import '../../domain/models/booking.dart';
import '../../domain/models/booking_status.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  late Future<List<Booking>> _bookings;
  late Future<List<AppNotification>> _notifications;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  void _refresh() {
    final app = context.read<AppState>();
    final repo = context.read<BookingRepository>();
    _bookings = repo.listForGuest(app.user!.id);
    _notifications = repo.listNotifications();
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

  Future<void> _markDepositPaid(Booking b) async {
    await context.read<BookingRepository>().markDepositPaid(b.id);
    setState(_refresh);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Deposit marked paid')),
      );
    }
  }

  Future<void> _openWhatsApp(String href) async {
    final uri = Uri.parse(href);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open WhatsApp')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My bookings')),
      body: RefreshIndicator(
        onRefresh: () async => setState(_refresh),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            FutureBuilder<List<AppNotification>>(
              future: _notifications,
              builder: (context, snapshot) {
                final notes = snapshot.data ?? [];
                if (notes.isEmpty) return const SizedBox.shrink();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Notifications',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    ...notes.take(5).map((n) => Card(
                          color: n.isUnread
                              ? const Color(0xFFE8F5E9)
                              : null,
                          child: ListTile(
                            title: Text(n.title),
                            subtitle: Text(n.body),
                            trailing: n.isUnread
                                ? TextButton(
                                    onPressed: () async {
                                      await context
                                          .read<BookingRepository>()
                                          .markNotificationRead(n.id);
                                      setState(_refresh);
                                    },
                                    child: const Text('Read'),
                                  )
                                : null,
                          ),
                        )),
                    const SizedBox(height: 16),
                  ],
                );
              },
            ),
            FutureBuilder<List<Booking>>(
              future: _bookings,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final list = snapshot.data ?? [];
                if (list.isEmpty) {
                  return const Center(child: Text('No bookings yet.'));
                }
                return Column(
                  children: list.map((b) {
                    final canCancel =
                        b.status == BookingStatus.pendingApproval ||
                            b.status == BookingStatus.confirmed;
                    final due = b.depositDueAt?.toString().split(' ').first;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    b.propertyTitle,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                                _statusIcon(b.status),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${b.checkIn.toString().split(' ').first} → ${b.checkOut.toString().split(' ').first}\n'
                              '${b.status.label}',
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '10% deposit: ${b.depositEtb} ETB'
                              '${due != null ? ' (due $due)' : ''} · ${b.depositStatus}\n'
                              'Balance on arrival: ${b.balanceOnArrivalEtb} ETB',
                            ),
                            if (b.needsDeposit) ...[
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  if (b.depositWhatsappHref != null)
                                    FilledButton.icon(
                                      onPressed: () =>
                                          _openWhatsApp(b.depositWhatsappHref!),
                                      icon: const Icon(Icons.chat),
                                      label: const Text('Pay 10% on WhatsApp'),
                                    ),
                                  OutlinedButton(
                                    onPressed: () => _markDepositPaid(b),
                                    child: const Text('Mark deposit paid'),
                                  ),
                                ],
                              ),
                            ],
                            if (b.depositStatus == 'paid')
                              const Padding(
                                padding: EdgeInsets.only(top: 8),
                                child: Text(
                                  'Deposit paid — pay remaining balance on arrival.',
                                  style: TextStyle(color: Color(0xFF1F9D57)),
                                ),
                              ),
                            if (canCancel)
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () => showDialog<void>(
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
                                  ),
                                  child: const Text('Cancel'),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
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
