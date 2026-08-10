import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient({String? baseUrl, String? Function()? getToken})
      : _baseUrl = baseUrl ?? ApiConfig.baseUrl,
        _getToken = getToken;

  final String _baseUrl;
  final String? Function()? _getToken;

  Uri _uri(String path, [Map<String, String>? query]) {
    final base = _baseUrl.endsWith('/') ? _baseUrl : '$_baseUrl/';
    final clean = path.startsWith('/') ? path.substring(1) : path;
    return Uri.parse('$base$clean').replace(queryParameters: query);
  }

  Map<String, String> _headers({bool auth = true}) {
    final h = <String, String>{'Content-Type': 'application/json'};
    if (auth) {
      final token = _getToken?.call();
      if (token != null && token.isNotEmpty) {
        h['Authorization'] = 'Bearer $token';
      }
    }
    return h;
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? query,
    bool auth = true,
  }) async {
    final res = await http.get(_uri(path, query), headers: _headers(auth: auth));
    return _decode(res);
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    final res = await http.post(
      _uri(path),
      headers: _headers(auth: auth),
      body: body == null ? null : jsonEncode(body),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    final res = await http.patch(
      _uri(path),
      headers: _headers(auth: auth),
      body: body == null ? null : jsonEncode(body),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> postMultipart(
    String path, {
    required List<http.MultipartFile> files,
    Map<String, String>? fields,
    bool auth = true,
  }) async {
    final request = http.MultipartRequest('POST', _uri(path));
    if (auth) {
      final token = _getToken?.call();
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
    }
    if (fields != null) {
      request.fields.addAll(fields);
    }
    request.files.addAll(files);
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return _decode(res);
  }

  Map<String, dynamic> _decode(http.Response res) {
    Map<String, dynamic> data = {};
    if (res.body.isNotEmpty) {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) data = decoded;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return data;
    }
    final msg = data['error']?.toString() ?? 'Request failed (${res.statusCode})';
    throw ApiException(msg, statusCode: res.statusCode);
  }
}
