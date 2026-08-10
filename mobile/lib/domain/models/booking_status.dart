enum BookingStatus {
  pendingApproval,
  confirmed,
  declined,
  cancelled,
  completed,
}

extension BookingStatusLabel on BookingStatus {
  String get label {
    switch (this) {
      case BookingStatus.pendingApproval:
        return 'Awaiting host approval';
      case BookingStatus.confirmed:
        return 'Confirmed — pay on arrival';
      case BookingStatus.declined:
        return 'Declined';
      case BookingStatus.cancelled:
        return 'Cancelled';
      case BookingStatus.completed:
        return 'Completed';
    }
  }
}
