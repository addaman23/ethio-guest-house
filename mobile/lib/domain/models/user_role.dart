enum UserRole { guest, host, admin }

extension UserRoleLabel on UserRole {
  String get label {
    switch (this) {
      case UserRole.guest:
        return 'Guest';
      case UserRole.host:
        return 'Host';
      case UserRole.admin:
        return 'Admin';
    }
  }
}
