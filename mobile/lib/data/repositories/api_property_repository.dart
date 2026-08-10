import 'dart:convert';

import '../../core/api/api_client.dart';
import '../../domain/models/property.dart';
import '../api/model_parsers.dart';
import 'property_repository.dart';
import 'package:http/http.dart' as http;

class ApiPropertyRepository implements PropertyRepository {
  ApiPropertyRepository(this._api);

  final ApiClient _api;

  @override
  Future<List<Property>> search({String? city}) async {
    final query = <String, String>{};
    if (city != null && city.isNotEmpty) query['city'] = city;
    final res = await _api.get('/properties', query: query.isEmpty ? null : query);
    final list = res['properties'] as List<dynamic>;
    return list.map((e) => parseProperty(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<Property?> getById(String id) async {
    final res = await _api.get('/properties/$id');
    return parseProperty(res['property'] as Map<String, dynamic>);
  }

  @override
  Future<List<Property>> listByHost(String hostId) async {
    final res = await _api.get('/host/properties');
    final list = res['properties'] as List<dynamic>;
    return list.map((e) => parseProperty(e as Map<String, dynamic>)).toList();
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
    final res = await _api.post(
      '/host/properties',
      body: {
        'title': title,
        'city': city,
        'address': address,
        'description': description,
        'nightlyRateUsd': nightlyRateEtb,
        'maxGuests': maxGuests,
        'amenities': amenities,
      },
    );
    return parseProperty(res['property'] as Map<String, dynamic>);
  }

  @override
  Future<Property> uploadPhotos({
    required String propertyId,
    required List<({String filename, List<int> bytes})> photos,
  }) async {
    final files = photos
        .map(
          (p) => http.MultipartFile.fromBytes(
            'photos',
            p.bytes,
            filename: p.filename,
          ),
        )
        .toList();
    final res = await _api.postMultipart(
      '/host/properties/$propertyId/photos',
      files: files,
    );
    return parseProperty(res['property'] as Map<String, dynamic>);
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
    final files = photos
        .map(
          (p) => http.MultipartFile.fromBytes(
            'photos',
            p.bytes,
            filename: p.filename,
          ),
        )
        .toList();
    final res = await _api.postMultipart(
      '/host/properties/listing',
      files: files,
      fields: {
        'title': title,
        'city': city,
        'address': address,
        'description': description,
        'nightlyRateUsd': nightlyRateEtb.toString(),
        'maxGuests': maxGuests.toString(),
        'amenities': jsonEncode(amenities),
      },
    );
    return parseProperty(res['property'] as Map<String, dynamic>);
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
    final res = await _api.patch(
      '/host/properties/$propertyId',
      body: {
        'title': title,
        'city': city,
        'address': address,
        'description': description,
        // Host UI collects USD; API field name is nightlyRateUsd.
        'nightlyRateUsd': nightlyRateEtb,
        'maxGuests': maxGuests,
        if (amenities != null) 'amenities': amenities,
      },
    );
    return parseProperty(res['property'] as Map<String, dynamic>);
  }
}
