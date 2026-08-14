import 'package:equatable/equatable.dart';

class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    this.bookingId,
    this.readAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final String? bookingId;
  final DateTime? readAt;
  final DateTime createdAt;

  bool get isUnread => readAt == null;

  @override
  List<Object?> get props => [id, type, readAt];
}
