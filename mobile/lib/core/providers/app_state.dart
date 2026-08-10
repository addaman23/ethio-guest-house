import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/api/model_parsers.dart';
import '../../domain/models/app_user.dart';
import '../../domain/models/user_role.dart';

class AppState extends ChangeNotifier {
  AppUser? _user;
  String? _token;
  bool _isAuthenticated = false;
  bool _restoring = true;

  AppUser? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _isAuthenticated;
  bool get restoring => _restoring;
  UserRole? get activeRole => _user?.activeRole;

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    final userJson = prefs.getString('user_json');
    if (_token != null && userJson != null) {
      final map = jsonDecode(userJson) as Map<String, dynamic>;
      final active = UserRole.values.firstWhere(
        (r) => r.name == (map['activeRole'] as String? ?? 'guest'),
        orElse: () => UserRole.guest,
      );
      _user = parseUser(map, activeRole: active);
      _isAuthenticated = true;
    }
    _restoring = false;
    notifyListeners();
  }

  Future<void> setSession({required String token, required AppUser user}) async {
    _token = token;
    _user = user;
    _isAuthenticated = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('user_json', jsonEncode(userToJson(user)));
    notifyListeners();
  }

  void switchRole(UserRole role) {
    if (_user == null || !_user!.roles.contains(role)) return;
    _user = AppUser(
      id: _user!.id,
      phone: _user!.phone,
      name: _user!.name,
      roles: _user!.roles,
      activeRole: role,
      hostVerified: _user!.hostVerified,
    );
    _persistUser();
    notifyListeners();
  }

  Future<void> _persistUser() async {
    if (_user == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_json', jsonEncode(userToJson(_user!)));
  }

  Future<void> signOut() async {
    _user = null;
    _token = null;
    _isAuthenticated = false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_json');
    notifyListeners();
  }
}
