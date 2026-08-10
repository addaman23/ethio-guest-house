import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../constants/international_guest.dart';

/// Preview of how the listing appears to guests (title, photos, price, description).
class HostListingPreview extends StatelessWidget {
  const HostListingPreview({
    super.key,
    required this.title,
    required this.city,
    required this.description,
    required this.nightlyRateUsd,
    required this.maxGuests,
    this.photoPreviews = const [],
  });

  final String title;
  final String city;
  final String description;
  final int nightlyRateUsd;
  final int maxGuests;
  final List<Uint8List> photoPreviews;

  @override
  Widget build(BuildContext context) {
    final displayTitle = title.trim().isEmpty ? 'Your guest house name' : title.trim();
    final displayCity = city.trim().isEmpty ? 'City' : city.trim();
    final rate = nightlyRateUsd > 0 ? nightlyRateUsd : 0;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.visibility_outlined, size: 18, color: Color(0xFF0D6E4F)),
                const SizedBox(width: 6),
                Text(
                  'Guest preview',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: const Color(0xFF0D6E4F),
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              '$displayTitle — $displayCity',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'Click a photo to view full size',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            if (photoPreviews.isEmpty)
              Container(
                height: 90,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8EDE9),
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: const Text('Your photos will appear here', style: TextStyle(color: Colors.black45)),
              )
            else
              SizedBox(
                height: 90,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: photoPreviews.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.memory(photoPreviews[i], width: 140, height: 90, fit: BoxFit.cover),
                  ),
                ),
              ),
            const SizedBox(height: 10),
            Text(
              rate >= InternationalGuestConstants.minNightlyUsd
                  ? '${InternationalGuestConstants.formatEtbWithHints(InternationalGuestConstants.usdToEtb(rate))} · max $maxGuests guests'
                  : 'Enter nightly rate (USD, min \$50) · max $maxGuests guests',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54),
            ),
            if (description.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(description.trim(), style: Theme.of(context).textTheme.bodyMedium),
            ],
          ],
        ),
      ),
    );
  }
}
