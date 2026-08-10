import '../../domain/models/property.dart';
import '../../domain/models/property_status.dart';
import 'property_repository.dart';

class MockPropertyRepository implements PropertyRepository {
  static const _img1 = [
    'https://images.unsplash.com/photo-1566073771259-6a8506094115?w=800&q=80',
    'https://images.unsplash.com/photo-1631049301164-da86cf2d03d4?w=800&q=80',
  ];
  static const _img2 = [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  ];
  static const _img3 = [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
  ];

  static final List<Property> _seed = [
    Property(
      id: 'prop_1',
      hostId: 'host_1',
      title: 'Green View Guest House',
      city: 'Addis Ababa',
      address: 'Bole, Addis Ababa',
      description: 'Quiet rooms near Bole. Breakfast included.',
      nightlyRateEtb: 2850, // $50 USD
      maxGuests: 4,
      amenities: const ['Wi-Fi', 'Breakfast', 'Parking'],
      status: PropertyStatus.live,
      imageUrl: _img1.first,
      imageUrls: _img1,
    ),
    Property(
      id: 'prop_2',
      hostId: 'host_1',
      title: 'Lake Side Lodge',
      city: 'Hawassa',
      address: 'Lake Hawassa shore',
      description: 'Family-friendly guest house with lake view.',
      nightlyRateEtb: 3705, // $65 USD
      maxGuests: 6,
      amenities: const ['Wi-Fi', 'Garden'],
      status: PropertyStatus.live,
      imageUrl: _img2.first,
      imageUrls: _img2,
    ),
    Property(
      id: 'prop_3',
      hostId: 'host_2',
      title: 'Bahir Dar Comfort Stay',
      city: 'Bahir Dar',
      address: 'Kebele 03, Bahir Dar',
      description: 'Close to Nile falls tours.',
      nightlyRateEtb: 4560, // $80 USD
      maxGuests: 3,
      amenities: const ['Wi-Fi', 'Hot water'],
      status: PropertyStatus.live,
      imageUrl: _img3.first,
      imageUrls: _img3,
    ),
  ];

  @override
  Future<List<Property>> search({String? city}) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (city == null || city.isEmpty) return List.unmodifiable(_seed);
    return _seed.where((p) => p.city == city).toList();
  }

  @override
  Future<Property?> getById(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
    try {
      return _seed.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<Property> create({
    required String title,
    required String city,
    required String address,
    required String description,
    required int nightlyRateEtb,
    required int maxGuests,
    List<String> amenities = const [],
  }) async {
    throw UnimplementedError('Use API backend');
  }

  @override
  Future<List<Property>> listByHost(String hostId) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return _seed.where((p) => p.hostId == hostId).toList();
  }

  @override
  Future<Property> uploadPhotos({
    required String propertyId,
    required List<({String filename, List<int> bytes})> photos,
  }) async {
    throw UnimplementedError('Use API backend');
  }

  @override
  Future<Property> createListing({
    required String title,
    required String city,
    required String address,
    required String description,
    required int nightlyRateEtb,
    required int maxGuests,
    required List<({String filename, List<int> bytes})> photos,
    List<String> amenities = const ['Wi-Fi'],
  }) async {
    throw UnimplementedError('Use API backend');
  }

  @override
  Future<Property> updateListing({
    required String propertyId,
    required String title,
    required String city,
    required String address,
    required String description,
    required int nightlyRateEtb,
    required int maxGuests,
    List<String>? amenities,
  }) async {
    throw UnimplementedError('Use API backend');
  }
}
