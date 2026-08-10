import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/constants/ethiopia.dart';
import '../../core/constants/international_guest.dart';
import '../../core/widgets/host_listing_preview.dart';
import '../../data/repositories/property_repository.dart';

class HostAddPropertyScreen extends StatefulWidget {
  const HostAddPropertyScreen({super.key});

  @override
  State<HostAddPropertyScreen> createState() => _HostAddPropertyScreenState();
}

class _HostAddPropertyScreenState extends State<HostAddPropertyScreen> {
  final _title = TextEditingController();
  final _address = TextEditingController();
  final _description = TextEditingController(
    text: 'Quiet rooms with breakfast. Perfect for travelers visiting Ethiopia.',
  );
  final _rate = TextEditingController(text: '50');
  final _maxGuests = TextEditingController(text: '4');
  final _picker = ImagePicker();
  String _city = EthiopiaConstants.majorCities.first;
  bool _loading = false;
  final List<XFile> _photos = [];
  final List<Uint8List> _photoPreviews = [];

  @override
  void initState() {
    super.initState();
    for (final c in [_title, _description, _rate, _maxGuests]) {
      c.addListener(_refreshPreview);
    }
  }

  @override
  void dispose() {
    for (final c in [_title, _description, _rate, _maxGuests]) {
      c.removeListener(_refreshPreview);
    }
    _title.dispose();
    _address.dispose();
    _description.dispose();
    _rate.dispose();
    _maxGuests.dispose();
    super.dispose();
  }

  void _refreshPreview() => setState(() {});

  int get _parsedRate => int.tryParse(_rate.text.trim()) ?? 0;
  int get _parsedGuests => int.tryParse(_maxGuests.text.trim()) ?? 4;

  Future<void> _pickPhotos() async {
    final picked = await _picker.pickMultiImage(imageQuality: 85, maxWidth: 2000);
    if (picked.isEmpty) return;
    setState(() {
      _photos.addAll(picked);
      if (_photos.length > 10) {
        _photos.removeRange(10, _photos.length);
      }
    });
    _photoPreviews.clear();
    for (final p in _photos) {
      _photoPreviews.add(await p.readAsBytes());
    }
    if (mounted) setState(() {});
  }

  void _removePhoto(int index) {
    setState(() {
      _photos.removeAt(index);
      _photoPreviews.removeAt(index);
    });
  }

  Future<void> _submit() async {
    if (_title.text.trim().length < 3) {
      _error('Enter a guest house title (e.g. Green View Guest House)');
      return;
    }
    if (_description.text.trim().length < 10) {
      _error('Enter a description (at least 10 characters)');
      return;
    }
    if (_parsedRate < InternationalGuestConstants.minNightlyUsd) {
      _error('Nightly price must be at least \$50 USD');
      return;
    }
    if (_photos.isEmpty) {
      _error('Add at least one photo');
      return;
    }
    setState(() => _loading = true);
    try {
      final uploads = <({String filename, List<int> bytes})>[];
      for (final photo in _photos) {
        uploads.add((filename: photo.name, bytes: await photo.readAsBytes()));
      }
      await context.read<PropertyRepository>().createListing(
            title: _title.text.trim(),
            city: _city,
            address: _address.text.trim().isEmpty ? _city : _address.text.trim(),
            description: _description.text.trim(),
            nightlyRateEtb: _parsedRate,
            maxGuests: _parsedGuests,
            photos: uploads,
          );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Listing published with photos, description, and price. Admin will review before guests can book.',
          ),
        ),
      );
      context.pop();
    } on ApiException catch (e) {
      _error(e.message);
    } catch (e) {
      _error(e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _error(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('List your guest house')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          HostListingPreview(
            title: _title.text,
            city: _city,
            description: _description.text,
            nightlyRateUsd: _parsedRate,
            maxGuests: _parsedGuests,
            photoPreviews: _photoPreviews,
          ),
          const SizedBox(height: 20),
          const Text(
            'Details guests will see when browsing',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _title,
            decoration: const InputDecoration(
              labelText: 'Guest house name',
              hintText: 'e.g. Green View Guest House',
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _city,
            decoration: const InputDecoration(labelText: 'City'),
            items: EthiopiaConstants.majorCities
                .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                .toList(),
            onChanged: (v) => setState(() => _city = v!),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _address,
            decoration: const InputDecoration(
              labelText: 'Address (optional)',
              hintText: 'Bole, Addis Ababa',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _description,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Description',
              hintText: 'Describe rooms, breakfast, location…',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _rate,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Price per night (USD)',
              hintText: '50',
              helperText: 'Minimum \$50 USD. Guests pay the ETB equivalent on arrival.',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _maxGuests,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Maximum guests'),
          ),
          const SizedBox(height: 20),
          const Text(
            'Photos',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _loading ? null : _pickPhotos,
            icon: const Icon(Icons.add_photo_alternate_outlined),
            label: Text(_photos.isEmpty ? 'Choose photos (up to 10)' : 'Add more photos'),
          ),
          if (_photos.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _photos.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) => Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.memory(
                        _photoPreviews[i],
                        width: 100,
                        height: 100,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned(
                      top: 0,
                      right: 0,
                      child: IconButton(
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black54,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.zero,
                          minimumSize: const Size(28, 28),
                        ),
                        icon: const Icon(Icons.close, size: 16),
                        onPressed: _loading ? null : () => _removePhoto(i),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Publish listing'),
          ),
        ),
      ),
    );
  }
}
