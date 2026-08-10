import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/providers/app_state.dart';
import '../../domain/models/user_role.dart';

class RolePickerScreen extends StatelessWidget {
  const RolePickerScreen({super.key});

  void _select(BuildContext context, UserRole role) {
    final app = context.read<AppState>();
    if (!app.user!.roles.contains(role)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            role == UserRole.host
                ? 'This account is not a host. Sign in with +251988013094 or register as host.'
                : 'Guest role not available on this account.',
          ),
        ),
      );
      return;
    }
    app.switchRole(role);
    context.go(role == UserRole.host ? '/host' : '/guest');
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final user = app.user!;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose mode'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await app.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Signed in as ${user.name} (${user.phone})'),
            const SizedBox(height: 24),
            if (user.canBeGuest)
              _RoleCard(
                icon: Icons.travel_explore,
                title: 'Guest',
                subtitle: 'Search and book guest houses',
                onTap: () => _select(context, UserRole.guest),
              ),
            if (user.canBeGuest && user.canBeHost) const SizedBox(height: 16),
            if (user.canBeHost)
              _RoleCard(
                icon: Icons.house_outlined,
                title: 'Host',
                subtitle: 'Manage properties and reservations',
                onTap: () => _select(context, UserRole.host),
              ),
          ],
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Icon(icon, size: 40, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
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
