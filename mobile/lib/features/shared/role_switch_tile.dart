import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/providers/app_state.dart';
import '../../domain/models/user_role.dart';

class RoleSwitchTile extends StatelessWidget {
  const RoleSwitchTile({
    super.key,
    required this.targetRole,
    required this.label,
  });

  final UserRole targetRole;
  final String label;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    if (!app.user!.roles.contains(targetRole)) {
      return const SizedBox.shrink();
    }

    return ListTile(
      dense: true,
      leading: const Icon(Icons.swap_horiz, size: 20),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      onTap: () {
        app.switchRole(targetRole);
        context.go(targetRole == UserRole.host ? '/host' : '/guest');
      },
    );
  }
}
