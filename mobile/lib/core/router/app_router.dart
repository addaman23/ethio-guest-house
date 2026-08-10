import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/providers/app_state.dart';
import '../../domain/models/user_role.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/role_picker_screen.dart';
import '../../features/guest/booking_request_screen.dart';
import '../../features/guest/guest_home_screen.dart';
import '../../features/guest/my_bookings_screen.dart';
import '../../features/guest/property_detail_screen.dart';
import '../../features/host/host_add_property_screen.dart';
import '../../features/host/host_home_screen.dart';
import '../../features/host/host_manage_photos_screen.dart';
import '../../features/host/host_reservations_screen.dart';
import '../../features/shared/splash_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/role', builder: (_, __) => const RolePickerScreen()),
      GoRoute(path: '/guest', builder: (_, __) => const GuestHomeScreen()),
      GoRoute(
        path: '/guest/property/:id',
        builder: (context, state) =>
            PropertyDetailScreen(propertyId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/guest/book/:id',
        builder: (context, state) =>
            BookingRequestScreen(propertyId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/guest/bookings', builder: (_, __) => const MyBookingsScreen()),
      GoRoute(path: '/host', builder: (_, __) => const HostHomeScreen()),
      GoRoute(path: '/host/reservations', builder: (_, __) => const HostReservationsScreen()),
      GoRoute(path: '/host/add-property', builder: (_, __) => const HostAddPropertyScreen()),
      GoRoute(
        path: '/host/property/:id/photos',
        builder: (context, state) =>
            HostManagePhotosScreen(propertyId: state.pathParameters['id']!),
      ),
    ],
    redirect: (context, state) {
      final app = context.read<AppState>();
      final loc = state.matchedLocation;
      final public = {'/', '/login', '/role'};

      if (!app.isAuthenticated && !public.contains(loc)) {
        return '/login';
      }
      if (app.isAuthenticated && loc == '/login') {
        return app.activeRole == UserRole.host ? '/host' : '/guest';
      }
      return null;
    },
  );
}
