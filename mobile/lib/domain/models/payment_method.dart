enum PaymentMethod {
  payOnArrival,
  telebirr,
}

extension PaymentMethodLabel on PaymentMethod {
  String get label {
    switch (this) {
      case PaymentMethod.payOnArrival:
        return 'Pay on arrival (ETB)';
      case PaymentMethod.telebirr:
        return 'Telebirr';
    }
  }
}

enum PaymentStatus { unpaid, paid }
