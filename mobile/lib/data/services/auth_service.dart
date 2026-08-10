import '../../core/api/api_client.dart';
import '../../domain/models/app_user.dart';
import '../api/model_parsers.dart';

class AuthResult {
  const AuthResult({required this.token, required this.user});

  final String token;
  final AppUser user;
}

class AuthService {
  AuthService(this._api);

  final ApiClient _api;

  Future<String?> requestOtp(String phone) async {
    final res = await _api.post(
      '/auth/otp/request',
      body: {'phone': phone},
      auth: false,
    );
    return res['demoHint'] as String?;
  }

  Future<AuthResult> verifyOtp({
    required String phone,
    required String code,
    String? name,
    String? guestCountry,
  }) async {
    final res = await _api.post(
      '/auth/otp/verify',
      body: {
        'phone': phone,
        'code': code,
        if (name != null && name.isNotEmpty) 'name': name,
        if (guestCountry != null && guestCountry.isNotEmpty) 'guestCountry': guestCountry,
      },
      auth: false,
    );
    final user = parseUser(res['user'] as Map<String, dynamic>);
    return AuthResult(
      token: res['token'] as String,
      user: user,
    );
  }
}
