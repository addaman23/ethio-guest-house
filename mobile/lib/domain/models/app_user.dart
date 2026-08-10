import 'package:equatable/equatable.dart';

import 'user_role.dart';

class AppUser extends Equatable {
  const AppUser({
    required this.id,
    required this.phone,
    required this.name,
    required this.roles,
    required this.activeRole,
    this.hostVerified = false,
    this.guestCountry,
  });

  final String id;
  final String phone;
  final String name;
  final List<UserRole> roles;
  final UserRole activeRole;
  final bool hostVerified;
  final String? guestCountry;

  bool get canBeGuest => roles.contains(UserRole.guest);
  bool get canBeHost => roles.contains(UserRole.host);

  @override
  List<Object?> get props => [id, phone, activeRole, roles];
}
