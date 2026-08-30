import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:seedha_properties_mobile/features/location/providers/location_providers.dart';
import 'package:seedha_properties_mobile/shared/widgets/seedha_state_view.dart';

class LocationSearchScreen extends ConsumerStatefulWidget {
  const LocationSearchScreen({super.key});

  @override
  ConsumerState<LocationSearchScreen> createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends ConsumerState<LocationSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  List<SelectedLocation> _suggestions = [];
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    if (query.trim().isEmpty) {
      setState(() {
        _suggestions = [];
        _isLoading = false;
        _errorMessage = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    try {
      final service = ref.read(locationServiceProvider);
      final results = await service.searchLocations(query);
      if (mounted) {
        setState(() {
          _suggestions = results;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().contains('Network error')
              ? 'Check your internet connection and try again.'
              : 'Unable to find locations.';
        });
      }
    }
  }

  Future<void> _useCurrentLocation() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final loc = await ref
          .read(locationStateProvider.notifier)
          .detectAndSetCurrentLocation();

      if (mounted) {
        if (loc != null) {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/');
          }
        } else {
          setState(() {
            _isLoading = false;
            _errorMessage =
                'Unable to detect GPS position. Please check location permissions or select an area below.';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Where are you looking?'),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _searchController,
                  autofocus: true,
                  decoration: InputDecoration(
                    hintText: 'Search city, locality or area',
                    prefixIcon: const Icon(Icons.search, color: AppTheme.primaryColor),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _onSearchChanged('');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.grey[100],
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: _onSearchChanged,
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: _useCurrentLocation,
                  icon: const Icon(Icons.my_location),
                  label: const Text('Use my current location'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    side: const BorderSide(color: AppTheme.primaryColor),
                    foregroundColor: AppTheme.primaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 1),
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppTheme.primaryColor),
            SizedBox(height: 16),
            Text('Finding locations...', style: TextStyle(color: AppTheme.textSecondary)),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Padding(
        padding: const EdgeInsets.all(24.0),
        child: SeedhaStateView(
          type: SeedhaStateType.serverError,
          title: 'Unable to find locations',
          description: _errorMessage,
          primaryAction: StateActionConfig(
            label: 'Retry',
            icon: Icons.refresh,
            onPressed: () {
              if (_searchController.text.isNotEmpty) {
                _performSearch(_searchController.text);
              }
            },
          ),
        ),
      );
    }

    if (_searchController.text.isEmpty) {
      return const Center(
        child: Text(
          'Start typing to search for locations',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
      );
    }

    if (_suggestions.isEmpty) {
      return const Center(
        child: Text(
          'No locations found.\nTry a different city, locality or area.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppTheme.textSecondary),
        ),
      );
    }

    return ListView.separated(
      itemCount: _suggestions.length,
      separatorBuilder: (context, index) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final loc = _suggestions[index];
        return ListTile(
          leading: const Icon(Icons.location_on_outlined, color: AppTheme.primaryColor),
          title: Text(loc.locality.isNotEmpty ? loc.locality : loc.city, style: const TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text('${loc.city}, ${loc.state}, ${loc.country}'),
          onTap: () async {
            await ref.read(locationStateProvider.notifier).setLocation(loc);
            if (context.mounted) {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/');
              }
            }
          },
        );
      },
    );
  }
}
