class GuestCountryOption {
  const GuestCountryOption({
    required this.code,
    required this.name,
    required this.dialCode,
    required this.flag,
    required this.currency,
    this.demoPhone,
  });

  final String code;
  final String name;
  final String dialCode;
  final String flag;
  final String currency;
  final String? demoPhone;
}

class InternationalGuestConstants {
  static const countries = [
    GuestCountryOption(
      code: 'ET',
      name: 'Ethiopia',
      dialCode: '+251',
      flag: '🇪🇹',
      currency: 'ETB',
      demoPhone: '+251911000001',
    ),
    GuestCountryOption(
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
      currency: 'USD',
      demoPhone: '+12025550101',
    ),
    GuestCountryOption(
      code: 'CA',
      name: 'Canada',
      dialCode: '+1',
      flag: '🇨🇦',
      currency: 'CAD',
      demoPhone: '+14165550102',
    ),
    GuestCountryOption(
      code: 'GB',
      name: 'United Kingdom',
      dialCode: '+44',
      flag: '🇬🇧',
      currency: 'GBP',
      demoPhone: '+447911123456',
    ),
    GuestCountryOption(
      code: 'DE',
      name: 'Germany',
      dialCode: '+49',
      flag: '🇩🇪',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'FR',
      name: 'France',
      dialCode: '+33',
      flag: '🇫🇷',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'IT',
      name: 'Italy',
      dialCode: '+39',
      flag: '🇮🇹',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'ES',
      name: 'Spain',
      dialCode: '+34',
      flag: '🇪🇸',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'NL',
      name: 'Netherlands',
      dialCode: '+31',
      flag: '🇳🇱',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'BE',
      name: 'Belgium',
      dialCode: '+32',
      flag: '🇧🇪',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'AT',
      name: 'Austria',
      dialCode: '+43',
      flag: '🇦🇹',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'PT',
      name: 'Portugal',
      dialCode: '+351',
      flag: '🇵🇹',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'IE',
      name: 'Ireland',
      dialCode: '+353',
      flag: '🇮🇪',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'SE',
      name: 'Sweden',
      dialCode: '+46',
      flag: '🇸🇪',
      currency: 'SEK',
    ),
    GuestCountryOption(
      code: 'NO',
      name: 'Norway',
      dialCode: '+47',
      flag: '🇳🇴',
      currency: 'NOK',
    ),
    GuestCountryOption(
      code: 'DK',
      name: 'Denmark',
      dialCode: '+45',
      flag: '🇩🇰',
      currency: 'DKK',
    ),
    GuestCountryOption(
      code: 'FI',
      name: 'Finland',
      dialCode: '+358',
      flag: '🇫🇮',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'CH',
      name: 'Switzerland',
      dialCode: '+41',
      flag: '🇨🇭',
      currency: 'CHF',
    ),
    GuestCountryOption(
      code: 'PL',
      name: 'Poland',
      dialCode: '+48',
      flag: '🇵🇱',
      currency: 'PLN',
    ),
    GuestCountryOption(
      code: 'GR',
      name: 'Greece',
      dialCode: '+30',
      flag: '🇬🇷',
      currency: 'EUR',
    ),
    GuestCountryOption(
      code: 'CZ',
      name: 'Czech Republic',
      dialCode: '+420',
      flag: '🇨🇿',
      currency: 'CZK',
    ),
    GuestCountryOption(
      code: 'RO',
      name: 'Romania',
      dialCode: '+40',
      flag: '🇷🇴',
      currency: 'RON',
    ),
    GuestCountryOption(
      code: 'HU',
      name: 'Hungary',
      dialCode: '+36',
      flag: '🇭🇺',
      currency: 'HUF',
    ),
    GuestCountryOption(
      code: 'TR',
      name: 'Turkey',
      dialCode: '+90',
      flag: '🇹🇷',
      currency: 'TRY',
    ),
    GuestCountryOption(
      code: 'AU',
      name: 'Australia',
      dialCode: '+61',
      flag: '🇦🇺',
      currency: 'AUD',
    ),
    GuestCountryOption(
      code: 'NZ',
      name: 'New Zealand',
      dialCode: '+64',
      flag: '🇳🇿',
      currency: 'NZD',
    ),
    GuestCountryOption(
      code: 'AE',
      name: 'United Arab Emirates',
      dialCode: '+971',
      flag: '🇦🇪',
      currency: 'AED',
    ),
    GuestCountryOption(
      code: 'SA',
      name: 'Saudi Arabia',
      dialCode: '+966',
      flag: '🇸🇦',
      currency: 'SAR',
    ),
    GuestCountryOption(
      code: 'ZA',
      name: 'South Africa',
      dialCode: '+27',
      flag: '🇿🇦',
      currency: 'ZAR',
    ),
    GuestCountryOption(
      code: 'IN',
      name: 'India',
      dialCode: '+91',
      flag: '🇮🇳',
      currency: 'INR',
    ),
    GuestCountryOption(
      code: 'JP',
      name: 'Japan',
      dialCode: '+81',
      flag: '🇯🇵',
      currency: 'JPY',
    ),
    GuestCountryOption(
      code: 'CN',
      name: 'China',
      dialCode: '+86',
      flag: '🇨🇳',
      currency: 'CNY',
    ),
    GuestCountryOption(
      code: 'BR',
      name: 'Brazil',
      dialCode: '+55',
      flag: '🇧🇷',
      currency: 'BRL',
    ),
    GuestCountryOption(
      code: 'MX',
      name: 'Mexico',
      dialCode: '+52',
      flag: '🇲🇽',
      currency: 'MXN',
    ),
    GuestCountryOption(
      code: 'EG',
      name: 'Egypt',
      dialCode: '+20',
      flag: '🇪🇬',
      currency: 'EGP',
    ),
    GuestCountryOption(
      code: 'KE',
      name: 'Kenya',
      dialCode: '+254',
      flag: '🇰🇪',
      currency: 'KES',
    ),
    GuestCountryOption(
      code: 'NG',
      name: 'Nigeria',
      dialCode: '+234',
      flag: '🇳🇬',
      currency: 'NGN',
    ),
  ];

  /// Approximate demo rates — listings priced in USD; pay on arrival in ETB.
  static const etbPerUnit = {
    'USD': 57.0,
    'CAD': 42.0,
    'EUR': 62.0,
    'GBP': 72.0,
  };

  static const minNightlyUsd = 50;
  static const usdEtbRate = 57.0;

  static int usdToEtb(num usd) => (usd * usdEtbRate).round();

  static double etbToUsd(int etb) =>
      double.parse((etb / usdEtbRate).toStringAsFixed(2));

  static GuestCountryOption byCode(String code) {
    return countries.firstWhere(
      (c) => c.code == code,
      orElse: () => countries.first,
    );
  }

  static String formatEtbWithHints(int etb) {
    final usd = etbToUsd(etb);
    final usdLabel = usd == usd.roundToDouble()
        ? usd.toInt().toString()
        : usd.toStringAsFixed(2);
    return '\$$usdLabel USD / night · ≈ $etb ETB on arrival';
  }

  static String formatTotalHints(int etb) {
    final usd = etbToUsd(etb);
    final usdLabel = usd == usd.roundToDouble()
        ? usd.toInt().toString()
        : usd.toStringAsFixed(2);
    return '\$$usdLabel USD · ≈ $etb ETB on arrival';
  }
}
