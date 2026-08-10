import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/constants/international_guest.dart';
import '../../core/providers/app_state.dart';
import '../../data/services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  GuestCountryOption _country = InternationalGuestConstants.countries.first;
  final _phoneController = TextEditingController(text: '+251911000001');
  final _codeController = TextEditingController(text: '123456');
  final _nameController = TextEditingController();
  bool _otpSent = false;
  bool _loading = false;
  String? _hint;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  void _applyCountry(GuestCountryOption country) {
    setState(() {
      _country = country;
      if (country.demoPhone != null) {
        _phoneController.text = country.demoPhone!;
      } else {
        _phoneController.text = country.dialCode;
      }
    });
  }

  Future<void> _requestOtp() async {
    setState(() {
      _loading = true;
      _hint = null;
    });
    try {
      final hint = await context.read<AuthService>().requestOtp(_phoneController.text.trim());
      setState(() {
        _otpSent = true;
        _hint = hint ?? 'Enter the OTP sent to your phone.';
      });
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    setState(() => _loading = true);
    try {
      final result = await context.read<AuthService>().verifyOtp(
            phone: _phoneController.text.trim(),
            code: _codeController.text.trim(),
            name: _nameController.text.trim().isEmpty ? null : _nameController.text.trim(),
            guestCountry: _country.code,
          );
      await context.read<AppState>().setSession(token: result.token, user: result.user);
      if (!mounted) return;
      context.go('/role');
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _quickLogin(String phone, String countryCode) {
    _applyCountry(InternationalGuestConstants.byCode(countryCode));
    _phoneController.text = phone;
    _codeController.text = '123456';
    setState(() => _otpSent = true);
    _requestOtp().then((_) => _verify());
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Sign in with your mobile number. ${InternationalGuestConstants.countries.length} countries supported including Ethiopia, USA, Canada, UK, Germany, and Europe. Demo OTP: 123456.',
              style: const TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _country.code,
              decoration: const InputDecoration(
                labelText: 'Your country',
                prefixIcon: Icon(Icons.public),
              ),
              items: InternationalGuestConstants.countries
                  .map(
                    (c) => DropdownMenuItem(
                      value: c.code,
                      child: Text('${c.flag} ${c.name} (${c.dialCode})'),
                    ),
                  )
                  .toList(),
              onChanged: (code) {
                if (code == null) return;
                _applyCountry(InternationalGuestConstants.byCode(code));
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Phone (${_country.dialCode}…)',
                prefixIcon: const Icon(Icons.phone),
                helperText: _country.code == 'ET'
                    ? 'Ethiopian format: +251 followed by 9 digits'
                    : 'Include country code, e.g. ${_country.dialCode}…',
              ),
            ),
            if (_otpSent) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _codeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'OTP code',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Name (new users only)',
                ),
              ),
              if (_hint != null) ...[
                const SizedBox(height: 8),
                Text(_hint!, style: const TextStyle(fontSize: 12, color: Colors.green)),
              ],
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading
                  ? null
                  : (_otpSent ? _verify : _requestOtp),
              child: _loading
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_otpSent ? 'Verify & continue' : 'Send OTP'),
            ),
            const SizedBox(height: 24),
            const Text('Quick demo accounts', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  label: const Text('Guest (ET)'),
                  onPressed: _loading ? null : () => _quickLogin('+251911000001', 'ET'),
                ),
                ActionChip(
                  label: const Text('Guest (USA)'),
                  onPressed: _loading ? null : () => _quickLogin('+12025550101', 'US'),
                ),
                ActionChip(
                  label: const Text('Guest (Canada)'),
                  onPressed: _loading ? null : () => _quickLogin('+14165550102', 'CA'),
                ),
                ActionChip(
                  label: const Text('Guest (UK)'),
                  onPressed: _loading ? null : () => _quickLogin('+447911123456', 'GB'),
                ),
                ActionChip(
                  label: const Text('Host'),
                  onPressed: _loading ? null : () => _quickLogin('+251911000002', 'ET'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
