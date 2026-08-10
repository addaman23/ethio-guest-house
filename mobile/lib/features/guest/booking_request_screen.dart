import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/constants/platform_commission.dart';
import '../../core/widgets/booking_price_summary.dart';
import '../../core/providers/app_state.dart';
import '../../core/services/pay_on_arrival_payment_service.dart';
import '../../data/repositories/booking_repository.dart';
import '../../data/repositories/property_repository.dart';
import '../../domain/models/property.dart';

class BookingRequestScreen extends StatefulWidget {
  const BookingRequestScreen({super.key, required this.propertyId});

  final String propertyId;

  @override
  State<BookingRequestScreen> createState() => _BookingRequestScreenState();
}

class _BookingRequestScreenState extends State<BookingRequestScreen> {
  @override
  void initState() {
    super.initState();
    context.read<PropertyRepository>().getById(widget.propertyId).then((p) {
      if (mounted) setState(() => _property = p);
    });
  }

  DateTime? _checkIn;
  DateTime? _checkOut;
  int _guests = 2;
  bool _submitting = false;
  Property? _property;

  Future<void> _pickDate({required bool isCheckIn}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      initialDate: isCheckIn ? (_checkIn ?? now.add(const Duration(days: 1))) : (_checkOut ?? now.add(const Duration(days: 3))),
    );
    if (picked == null) return;
    setState(() {
      if (isCheckIn) {
        _checkIn = picked;
        if (_checkOut != null && !_checkOut!.isAfter(picked)) {
          _checkOut = picked.add(const Duration(days: 2));
        }
      } else {
        _checkOut = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (_checkIn == null || _checkOut == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select check-in and check-out dates')),
      );
      return;
    }
    if (!_checkOut!.isAfter(_checkIn!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Check-out must be after check-in')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final app = context.read<AppState>();
      final propRepo = context.read<PropertyRepository>();
      final bookRepo = context.read<BookingRepository>();
      final property = await propRepo.getById(widget.propertyId);
      if (property == null || app.user == null) {
        setState(() => _submitting = false);
        return;
      }

      final booking = await bookRepo.createRequest(
        propertyId: property.id,
        propertyTitle: property.title,
        guestId: app.user!.id,
        guestName: app.user!.name,
        checkIn: _checkIn!,
        checkOut: _checkOut!,
        guests: _guests,
        nightlyRateEtb: property.nightlyRateEtb,
      );

      final payment = PayOnArrivalPaymentService();
      final result = await payment.initiatePayment(
        bookingId: booking.id,
        amountEtb: booking.totalEtb,
      );

      if (!mounted) return;
      setState(() => _submitting = false);
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Request sent'),
          content: Text(
            'Status: awaiting host approval.\n\n${result.message}',
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
          ],
        ),
      );
      context.go('/guest/bookings');
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  int _nights() {
    if (_checkIn == null || _checkOut == null) return 2;
    final nights = _checkOut!.difference(_checkIn!).inDays;
    return nights < 1 ? 1 : nights;
  }

  BookingPricingBreakdown? _pricing(Property property) {
    return PlatformCommission.calculate(
      nightlyRateEtb: property.nightlyRateEtb,
      nights: _nights(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Request booking')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            title: const Text('Check-in'),
            subtitle: Text(_checkIn?.toString().split(' ').first ?? 'Select date'),
            trailing: const Icon(Icons.calendar_today),
            onTap: () => _pickDate(isCheckIn: true),
          ),
          ListTile(
            title: const Text('Check-out'),
            subtitle: Text(_checkOut?.toString().split(' ').first ?? 'Select date'),
            trailing: const Icon(Icons.calendar_today),
            onTap: () => _pickDate(isCheckIn: false),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Text('Guests'),
              const Spacer(),
              IconButton(
                onPressed: _guests > 1 ? () => setState(() => _guests--) : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('$_guests'),
              IconButton(
                onPressed: _guests < 10 ? () => setState(() => _guests++) : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
          if (_property != null && _checkIn != null && _checkOut != null) ...[
            const SizedBox(height: 8),
            BookingPriceSummary(breakdown: _pricing(_property!)!),
          ],
          const SizedBox(height: 16),
          const Text(
            'Payment: pay the total shown above in ETB on arrival after the host confirms your booking.',
            style: TextStyle(color: Colors.black54),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Send request to host'),
          ),
        ),
      ),
    );
  }
}
