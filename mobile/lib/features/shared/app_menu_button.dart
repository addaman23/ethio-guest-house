import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/providers/app_state.dart';

class AppMenuButton extends StatelessWidget {
  const AppMenuButton({super.key});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      onSelected: (v) async {
        if (v == 'logout') {
          await context.read<AppState>().signOut();
          if (context.mounted) context.go('/login');
        } else if (v == 'role') {
          context.go('/role');
        }
      },
      itemBuilder: (_) => const [
        PopupMenuItem(value: 'role', child: Text('Switch guest/host')),
        PopupMenuItem(value: 'logout', child: Text('Sign out')),
      ],
    );
  }
}
