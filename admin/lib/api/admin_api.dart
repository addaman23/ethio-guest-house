import 'dart:convert';

import 'package:http/http.dart' as http;

class AdminApi {
  AdminApi({this.baseUrl = 'http://localhost:3000/v1', this.adminKey = 'dev-admin-key'});

  final String baseUrl;
  final String adminKey;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      };

  Future<Map<String, dynamic>> _get(String path) async {
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: _headers);
    return _decode(res);
  }

  Future<Map<String, dynamic>> _post(String path) async {
    final res = await http.post(Uri.parse('$baseUrl$path'), headers: _headers);
    return _decode(res);
  }

  Map<String, dynamic> _decode(http.Response res) {
    final body = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
  }

  Future<Map<String, dynamic>> stats() => _get('/admin/stats');
  Future<List<dynamic>> users() async {
    final r = await _get('/admin/users');
    return r['users'] as List<dynamic>;
  }

  Future<List<dynamic>> properties({String status = 'pending_review'}) async {
    final r = await _get('/admin/properties?status=$status');
    return r['properties'] as List<dynamic>;
  }

  Future<List<dynamic>> bookings() async {
    final r = await _get('/admin/bookings');
    return r['bookings'] as List<dynamic>;
  }

  Future<void> verifyHost(String id) => _post('/admin/hosts/$id/verify');
  Future<void> approveProperty(String id) => _post('/admin/properties/$id/approve');
  Future<void> suspendProperty(String id) => _post('/admin/properties/$id/suspend');
}
