import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/international_guest.dart';
import '../../core/constants/platform_commission.dart';
import '../../core/widgets/property_image_gallery.dart';
import '../../data/repositories/property_repository.dart';
import '../../domain/models/property.dart';

class PropertyDetailScreen extends StatelessWidget {
  const PropertyDetailScreen({super.key, required this.propertyId});

  final String propertyId;

  @override
  Widget build(BuildContext context) {
    final repo = context.read<PropertyRepository>();

    return FutureBuilder<Property?>(
      future: repo.getById(propertyId),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final p = snapshot.data;
        if (p == null) {
          return const Scaffold(body: Center(child: Text('Property not found')));
        }
        return Scaffold(
          appBar: AppBar(title: Text(p.title)),
          body: ListView(
            children: [
              PropertyImageGallery(imageUrls: p.imageUrls, title: p.title),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.city, style: Theme.of(context).textTheme.titleMedium),
                    Text(p.address),
                    const SizedBox(height: 16),
                    Text(
                      InternationalGuestConstants.formatEtbWithHints(p.nightlyRateEtb),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 8),
                    Text('Up to ${p.maxGuests} guests'),
                    const SizedBox(height: 16),
                    Text(p.description),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      children: p.amenities
                          .map((a) => Chip(label: Text(a), visualDensity: VisualDensity.compact))
                          .toList(),
                    ),
                    const SizedBox(height: 24),
                    const Card(
                      child: ListTile(
                        leading: Icon(Icons.public),
                        title: Text('International guests welcome'),
                        subtitle: Text(
                          'Travelers from the USA, Canada, UK, and Europe can book with their mobile number. Pay in ETB on arrival after the host approves your stay.',
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Card(
                      child: ListTile(
                        leading: Icon(Icons.payments_outlined),
                        title: Text('Pay on arrival'),
                        subtitle: Text(
                          'Host approves your request first. Pay in ETB when you check in. '
                          'AddisAbaba Guest House charges the host ${PlatformCommission.percentLabel} of rent for connecting guests and guest houses.',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: FilledButton(
                onPressed: () => context.push('/guest/book/${p.id}'),
                child: const Text('Request booking'),
              ),
            ),
          ),
        );
      },
    );
  }
}
