import 'package:flutter/foundation.dart';

/// API base URL for the Node backend.
///
/// - Web / Windows / iOS simulator: localhost
/// - Android emulator: 10.0.2.2
class ApiConfig {
  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;

    if (kIsWeb) return 'http://localhost:3000/v1';

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:3000/v1';
      default:
        return 'http://localhost:3000/v1';
    }
  }

  /// Origin for uploaded images (`/uploads/...`), without `/v1`.
  static String get assetBaseUrl {
    final api = baseUrl;
    if (api.endsWith('/v1')) return api.substring(0, api.length - 3);
    return api;
  }
}
