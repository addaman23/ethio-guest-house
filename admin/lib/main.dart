import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'api/admin_api.dart';

final _api = AdminApi();

void main() {
  runApp(const AdminApp());
}

class AdminApp extends StatelessWidget {
  const AdminApp({super.key});

  static final _router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (_, __) => const AdminShell(child: DashboardPage())),
      GoRoute(path: '/hosts', builder: (_, __) => const AdminShell(child: HostVerificationPage())),
      GoRoute(path: '/listings', builder: (_, __) => const AdminShell(child: ListingsPage())),
      GoRoute(path: '/bookings', builder: (_, __) => const AdminShell(child: BookingsPage())),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AddisAbaba Guest Houses Admin',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1A365D)),
      ),
      routerConfig: _router,
    );
  }
}

class AdminShell extends StatelessWidget {
  const AdminShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _indexFor(loc),
            onDestinationSelected: (i) {
              const paths = ['/', '/hosts', '/listings', '/bookings'];
              context.go(paths[i]);
            },
            labelType: NavigationRailLabelType.all,
            destinations: const [
              NavigationRailDestination(icon: Icon(Icons.dashboard), label: Text('Dashboard')),
              NavigationRailDestination(icon: Icon(Icons.verified_user), label: Text('Hosts')),
              NavigationRailDestination(icon: Icon(Icons.home_work), label: Text('Listings')),
              NavigationRailDestination(icon: Icon(Icons.event_note), label: Text('Bookings')),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: child),
        ],
      ),
    );
  }

  int _indexFor(String path) {
    if (path.startsWith('/hosts')) return 1;
    if (path.startsWith('/listings')) return 2;
    if (path.startsWith('/bookings')) return 3;
    return 0;
  }
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  Map<String, dynamic>? _stats;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await _api.stats();
      setState(() {
        _stats = r['stats'] as Map<String, dynamic>;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: 'Dashboard',
      onRefresh: _load,
      child: _error != null
          ? Text(_error!, style: const TextStyle(color: Colors.red))
          : _stats == null
              ? const Center(child: CircularProgressIndicator())
              : Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: [
                    _StatCard(label: 'Users', value: '${_stats!['users']}', icon: Icons.people),
                    _StatCard(
                      label: 'Live listings',
                      value: '${_stats!['liveListings']}',
                      icon: Icons.home_work,
                    ),
                    _StatCard(
                      label: 'Pending hosts',
                      value: '${_stats!['pendingHostVerification']}',
                      icon: Icons.pending,
                    ),
                    _StatCard(
                      label: 'Bookings (30d)',
                      value: '${_stats!['bookingsLast30Days']}',
                      icon: Icons.calendar_month,
                    ),
                  ],
                ),
    );
  }
}

class HostVerificationPage extends StatefulWidget {
  const HostVerificationPage({super.key});

  @override
  State<HostVerificationPage> createState() => _HostVerificationPageState();
}

class _HostVerificationPageState extends State<HostVerificationPage> {
  List<dynamic> _users = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final all = await _api.users();
      setState(() {
        _users = all.where((u) {
          final roles = (u['roles'] as List).cast<String>();
          return roles.contains('host') && u['hostVerified'] != true;
        }).toList();
        _error = null;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: 'Host verification',
      onRefresh: _load,
      child: _error != null
          ? Text(_error!)
          : _users.isEmpty
              ? const Text('No hosts awaiting verification.')
              : ListView.builder(
                  itemCount: _users.length,
                  itemBuilder: (_, i) {
                    final u = _users[i] as Map<String, dynamic>;
                    return Card(
                      child: ListTile(
                        title: Text(u['name'] as String),
                        subtitle: Text(u['phone'] as String),
                        trailing: FilledButton(
                          onPressed: () async {
                            await _api.verifyHost(u['id'] as String);
                            _load();
                          },
                          child: const Text('Verify'),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class ListingsPage extends StatefulWidget {
  const ListingsPage({super.key});

  @override
  State<ListingsPage> createState() => _ListingsPageState();
}

class _ListingsPageState extends State<ListingsPage> {
  List<dynamic> _list = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _api.properties(status: 'pending_review');
    setState(() => _list = list);
  }

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: 'Listings moderation',
      onRefresh: _load,
      child: _list.isEmpty
          ? const Text('No listings pending review.')
          : ListView.builder(
              itemCount: _list.length,
              itemBuilder: (_, i) {
                final p = _list[i] as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    title: Text(p['title'] as String),
                    subtitle: Text('${p['city']} · ${p['nightlyRateEtb']} ETB'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        FilledButton(
                          onPressed: () async {
                            await _api.approveProperty(p['id'] as String);
                            _load();
                          },
                          child: const Text('Approve'),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton(
                          onPressed: () async {
                            await _api.suspendProperty(p['id'] as String);
                            _load();
                          },
                          child: const Text('Suspend'),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class BookingsPage extends StatefulWidget {
  const BookingsPage({super.key});

  @override
  State<BookingsPage> createState() => _BookingsPageState();
}

class _BookingsPageState extends State<BookingsPage> {
  List<dynamic> _list = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _list = await _api.bookings());
  }

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: 'All bookings',
      onRefresh: _load,
      child: ListView.builder(
        itemCount: _list.length,
        itemBuilder: (_, i) {
          final b = _list[i] as Map<String, dynamic>;
          return Card(
            child: ListTile(
              title: Text(b['propertyTitle']?.toString() ?? b['propertyId'].toString()),
              subtitle: Text(
                '${b['guestName']} · ${b['checkIn']} → ${b['checkOut']}\n'
                '${b['totalEtb']} ETB · ${b['status']}',
              ),
              isThreeLine: true,
            ),
          );
        },
      ),
    );
  }
}

class _PageScaffold extends StatelessWidget {
  const _PageScaffold({
    required this.title,
    required this.child,
    this.onRefresh,
  });

  final String title;
  final Widget child;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineSmall),
              const Spacer(),
              if (onRefresh != null)
                IconButton(icon: const Icon(Icons.refresh), onPressed: onRefresh),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 200,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon),
              const SizedBox(height: 8),
              Text(value, style: Theme.of(context).textTheme.headlineMedium),
              Text(label),
            ],
          ),
        ),
      ),
    );
  }
}
