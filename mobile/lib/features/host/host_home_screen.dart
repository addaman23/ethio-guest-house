import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/providers/app_state.dart';
import '../../data/repositories/property_repository.dart';
import '../../domain/models/property.dart';
import '../../domain/models/user_role.dart';
import '../shared/app_menu_button.dart';
import '../shared/role_switch_tile.dart';

class HostHomeScreen extends StatelessWidget {
  const HostHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final repo = context.read<PropertyRepository>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Host dashboard'),
        actions: [
          IconButton(
            icon: const Badge(
              label: Text('!'),
              child: Icon(Icons.inbox),
            ),
            onPressed: () => context.push('/host/reservations'),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!app.user!.hostVerified)
            const MaterialBanner(
              content: Text('Your host account is pending admin verification.'),
              leading: Icon(Icons.info_outline),
            ),
          const RoleSwitchTile(targetRole: UserRole.guest, label: 'Switch to guest mode'),
          Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton.icon(
              onPressed: app.user!.hostVerified
                  ? () => context.push('/host/add-property')
                  : null,
              icon: const Icon(Icons.add),
              label: Text(
                app.user!.hostVerified
                    ? 'Add property'
                    : 'Add property (awaiting verification)',
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text('Your properties', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          Expanded(
            child: FutureBuilder<List<Property>>(
              future: repo.listByHost(app.user!.id),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final list = snapshot.data ?? [];
                if (list.isEmpty) {
                  return const Center(child: Text('No properties yet.'));
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  itemBuilder: (_, i) {
                    final p = list[i];
                    return Card(
                      child: ListTile(
                        title: Text(p.title),
                        subtitle: Text('${p.city} · ${p.nightlyRateEtb} ETB / night · ${p.imageUrls.length} photo(s)'),
                        trailing: const Icon(Icons.photo_library_outlined),
                        onTap: () => context.push('/host/property/${p.id}/photos'),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
