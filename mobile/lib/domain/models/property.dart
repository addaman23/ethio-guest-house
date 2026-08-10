import 'package:equatable/equatable.dart';

import 'property_status.dart';

class Property extends Equatable {
  const Property({
    required this.id,
    required this.hostId,
    required this.title,
    required this.city,
    required this.address,
    required this.description,
    required this.nightlyRateEtb,
    required this.maxGuests,
    required this.amenities,
    required this.status,
    this.imageUrl,
    this.imageUrls = const [],
  });

  final String id;
  final String hostId;
  final String title;
  final String city;
  final String address;
  final String description;
  final int nightlyRateEtb;
  final int maxGuests;
  final List<String> amenities;
  final PropertyStatus status;
  final String? imageUrl;
  final List<String> imageUrls;

  String? get primaryImageUrl =>
      imageUrls.isNotEmpty ? imageUrls.first : imageUrl;

  @override
  List<Object?> get props => [id, hostId, title, city, nightlyRateEtb, status];
}
