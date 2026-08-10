import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/api/api_client.dart';
import 'core/providers/app_state.dart';
import 'data/repositories/api_booking_repository.dart';
import 'data/repositories/api_property_repository.dart';
import 'data/repositories/booking_repository.dart';
import 'data/repositories/property_repository.dart';
import 'data/services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final appState = AppState();
  await appState.restoreSession();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AppState>.value(value: appState),
        ProxyProvider<AppState, ApiClient>(
          update: (_, app, __) => ApiClient(getToken: () => app.token),
        ),
        ProxyProvider<ApiClient, AuthService>(
          update: (_, api, __) => AuthService(api),
        ),
        ProxyProvider<ApiClient, PropertyRepository>(
          update: (_, api, __) => ApiPropertyRepository(api),
        ),
        ProxyProvider<ApiClient, BookingRepository>(
          update: (_, api, __) => ApiBookingRepository(api),
        ),
      ],
      child: const EthioGuestHouseApp(),
    ),
  );
}
