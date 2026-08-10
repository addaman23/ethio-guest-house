import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/constants/ethiopia.dart';
import '../../core/constants/international_guest.dart';
import '../../core/widgets/host_listing_preview.dart';
import '../../core/widgets/property_image_gallery.dart';
import '../../data/repositories/property_repository.dart';
import '../../domain/models/property.dart';

class HostManagePhotosScreen extends StatefulWidget {
  const HostManagePhotosScreen({super.key, required this.propertyId});

  final String propertyId;

  @override
  State<HostManagePhotosScreen> createState() => _HostManagePhotosScreenState();
}

class _HostManagePhotosScreenState extends State<HostManagePhotosScreen> {
  final _picker = ImagePicker();
  final _title = TextEditingController();
  final _address = TextEditingController();
  final _description = TextEditingController();
  final _rate = TextEditingController();
  final _maxGuests = TextEditingController();
  Property? _property;
  String _city = EthiopiaConstants.majorCities.first;
  bool _loading = false;
  bool _uploading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _address.dispose();
    _description.dispose();
    _rate.dispose();
    _maxGuests.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final p = await context.read<PropertyRepository>().getById(widget.propertyId);
      if (p != null && mounted) {
        _title.text = p.title;
        _city = p.city;
        _address.text = p.address;
        _description.text = p.description;
        _rate.text =
            '${InternationalGuestConstants.etbToUsd(p.nightlyRateEtb).round()}';
        _maxGuests.text = '${p.maxGuests}';
        setState(() => _property = p);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveDetails() async {
    setState(() => _saving = true);
    try {
      final updated = await context.read<PropertyRepository>().updateListing(
            propertyId: widget.propertyId,
            title: _title.text.trim(),
            city: _city,
            address: _address.text.trim().isEmpty ? _city : _address.text.trim(),
            description: _description.text.trim(),
            nightlyRateEtb: int.parse(_rate.text.trim()),
            maxGuests: int.parse(_maxGuests.text.trim()),
          );
      if (mounted) {
        setState(() => _property = updated);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Description and price updated')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _addPhotos() async {
    final picked = await _picker.pickMultiImage(imageQuality: 85, maxWidth: 2000);
    if (picked.isEmpty) return;

    setState(() => _uploading = true);
    try {
      final uploads = <({String filename, List<int> bytes})>[];
      for (final photo in picked.take(10)) {
        uploads.add((filename: photo.name, bytes: await photo.readAsBytes()));
      }
      final updated = await context.read<PropertyRepository>().uploadPhotos(
            propertyId: widget.propertyId,
            photos: uploads,
          );
      if (mounted) {
        setState(() => _property = updated);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${uploads.length} photo(s) uploaded')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _property;
    final rate = int.tryParse(_rate.text.trim()) ?? 0;
    final guests = int.tryParse(_maxGuests.text.trim()) ?? 4;

    return Scaffold(
      appBar: AppBar(title: Text(p?.title ?? 'Edit listing')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : p == null
              ? const Center(child: Text('Property not found'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    HostListingPreview(
                      title: _title.text,
                      city: _city,
                      description: _description.text,
                      nightlyRateUsd: rate,
                      maxGuests: guests,
                    ),
                    const SizedBox(height: 16),
                    PropertyImageGallery(imageUrls: p.imageUrls, title: p.title),
                    const SizedBox(height: 16),
                    const Text('Edit details', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _title,
                      decoration: const InputDecoration(labelText: 'Name'),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _city,
                      decoration: const InputDecoration(labelText: 'City'),
                      items: EthiopiaConstants.majorCities
                          .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (v) => setState(() => _city = v!),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _description,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Description'),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _rate,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Price per night (USD, min \$50)',
                        helperText: rate >= InternationalGuestConstants.minNightlyUsd
                            ? InternationalGuestConstants.formatEtbWithHints(
                                InternationalGuestConstants.usdToEtb(rate),
                              )
                            : 'Minimum \$50 USD',
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _maxGuests,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Max guests'),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _saving ? null : _saveDetails,
                      child: _saving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save description & price'),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: _uploading ? null : _addPhotos,
                      icon: const Icon(Icons.add_photo_alternate_outlined),
                      label: Text(_uploading ? 'Uploading…' : 'Add more photos'),
                    ),
                  ],
                ),
    );
  }
}
