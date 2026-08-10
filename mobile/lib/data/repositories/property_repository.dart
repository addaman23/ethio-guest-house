import '../../domain/models/property.dart';

abstract class PropertyRepository {
  Future<List<Property>> search({String? city});
  Future<Property?> getById(String id);
  Future<List<Property>> listByHost(String hostId);
  Future<Property> create({
    required String title,
    required String city,
    required String address,
    required String description,
    required int nightlyRateEtb,
    required int maxGuests,
    List<String> amenities = const [],
  });
  Future<Property> uploadPhotos({
    required String propertyId,
    required List<({String filename, List<int> bytes})> photos,
  });
  Future<Property> createListing({
    required String title,
    required String city,
    required String address,
    required String description,
    required int nightlyRateEtb,
    required int maxGuests,
    required List<({String filename, List<int> bytes})> photos,
    List<String> amenities = const ['Wi-Fi'],
  });
  Future<Property> updateListing({
    required String propertyId,
    required String title,
    required String city,
    required String address,
    required String description,
    required int nightlyRateEtb,
    required int maxGuests,
    List<String>? amenities,
  });
}
