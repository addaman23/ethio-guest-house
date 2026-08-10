import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/ethiopia.dart';
import '../../core/constants/international_guest.dart';
import '../../core/widgets/property_image_gallery.dart';
import '../../core/providers/app_state.dart';
import '../../data/repositories/property_repository.dart';
import '../../domain/models/property.dart';
import '../../domain/models/user_role.dart';
import '../shared/app_menu_button.dart';
import '../shared/role_switch_tile.dart';
import '../../core/api/api_exception.dart';

class GuestHomeScreen extends StatefulWidget {
  const GuestHomeScreen({super.key});

  @override
  State<GuestHomeScreen> createState() => _GuestHomeScreenState();
}

class _GuestHomeScreenState extends State<GuestHomeScreen> {
  String? _city;
  late Future<List<Property>> _properties;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final repo = context.read<PropertyRepository>();
    _properties = repo.search(city: _city);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find a guest house'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month),
            onPressed: () => context.push('/guest/bookings'),
          ),
        ],
      ),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Card(
              child: ListTile(
                leading: Icon(Icons.public, color: Color(0xFF0D6E4F)),
                title: Text('Traveling from abroad?'),
                subtitle: Text(
                  'Guests from the USA, Canada, and Europe can browse photos and book — prices shown in ETB with USD/EUR estimates.',
                ),
                dense: true,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: DropdownButtonFormField<String>(
              value: _city,
              decoration: const InputDecoration(labelText: 'City'),
              items: [
                const DropdownMenuItem(value: null, child: Text('All cities')),
                ...EthiopiaConstants.majorCities.map(
                  (c) => DropdownMenuItem(value: c, child: Text(c)),
                ),
              ],
              onChanged: (v) {
                setState(() {
                  _city = v;
                  _load();
                });
              },
            ),
          ),
          const RoleSwitchTile(targetRole: UserRole.host, label: 'Switch to host mode'),
          Expanded(
            child: FutureBuilder<List<Property>>(
              future: _properties,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  final msg = snapshot.error is ApiException
                      ? (snapshot.error as ApiException).message
                      : 'Cannot reach API. Start backend: cd backend && npm run dev';
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(msg, textAlign: TextAlign.center),
                    ),
                  );
                }
                final list = snapshot.data ?? [];
                if (list.isEmpty) {
                  return const Center(child: Text('No listings in this city yet.'));
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  itemBuilder: (_, i) => _PropertyTile(property: list[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PropertyTile extends StatelessWidget {
  const _PropertyTile({required this.property});

  final Property property;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/guest/property/${property.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PropertyThumbnail(
                imageUrl: property.primaryImageUrl,
                imageUrls: property.imageUrls,
                title: property.title,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(property.title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(property.city),
                    const SizedBox(height: 4),
                    Text(
                      InternationalGuestConstants.formatEtbWithHints(property.nightlyRateEtb),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}
