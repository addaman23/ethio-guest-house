import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/providers/app_state.dart';
import '../../domain/models/user_role.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _goNext();
  }

  Future<void> _goNext() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    final app = context.read<AppState>();
    while (app.restoring) {
      await Future<void>.delayed(const Duration(milliseconds: 100));
      if (!mounted) return;
    }
    if (app.isAuthenticated) {
      final role = app.activeRole ?? UserRole.guest;
      context.go(role == UserRole.host ? '/host' : '/guest');
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.home_work_outlined, size: 72, color: Color(0xFF0D6E4F)),
            const SizedBox(height: 16),
            const Text(
              'AddisAbaba Guest House',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text('Book guest houses across Ethiopia'),
            const SizedBox(height: 4),
            Text(
              'Photos, ETB pricing · USA, Canada & Europe welcome',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
