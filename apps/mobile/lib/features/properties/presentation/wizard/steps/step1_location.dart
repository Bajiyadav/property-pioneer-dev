import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../../../../config/theme.dart';
import '../../../../location/models/selected_location.dart';
import '../../../../location/providers/location_providers.dart';
import '../../../providers/listing_wizard_provider.dart';

/// Step 1 — where the property actually is.
///
/// This step used to collect city, locality and address as free text, so a
/// listing could never carry coordinates and never appeared on the customer
/// map. It now resolves a real place through the existing Geoapify-backed
/// [LocationService], shows it on the existing flutter_map/OpenStreetMap stack,
/// and requires the owner to confirm it before continuing.
///
/// The address, pincode and landmark fields remain free text on purpose: they
/// describe the door, not the pin, and are not what the map uses.
class Step1Location extends ConsumerStatefulWidget {
  final VoidCallback onNext;

  const Step1Location({super.key, required this.onNext});

  @override
  ConsumerState<Step1Location> createState() => _Step1LocationState();
}

enum _SearchPhase { idle, searching, results, noResults, error }

class _Step1LocationState extends ConsumerState<Step1Location> {
  final _formKey = GlobalKey<FormState>();
  final _searchController = TextEditingController();
  late TextEditingController _addressController;
  late TextEditingController _pincodeController;
  late TextEditingController _landmarkController;

  final MapController _mapController = MapController();

  _SearchPhase _phase = _SearchPhase.idle;
  List<SelectedLocation> _results = const [];
  SelectedLocation? _selected;
  bool _confirmed = false;
  String? _searchError;
  Timer? _debounce;
  String? _locationFieldError;

  @override
  void initState() {
    super.initState();
    final data = ref.read(listingWizardProvider);
    _addressController = TextEditingController(text: data.address);
    _pincodeController = TextEditingController(text: data.pincode ?? '');
    _landmarkController = TextEditingController(text: data.landmark ?? '');

    // Coming back into the step must not lose a pin already confirmed.
    if (data.latitude != null && data.longitude != null) {
      _selected = SelectedLocation(
        formattedAddress: [data.locality, data.city]
            .where((e) => e.trim().isNotEmpty)
            .join(', '),
        city: data.city,
        locality: data.locality,
        state: '',
        country: 'India',
        latitude: data.latitude!,
        longitude: data.longitude!,
        isValidated: true,
      );
      _confirmed = true;
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _addressController.dispose();
    _pincodeController.dispose();
    _landmarkController.dispose();
    super.dispose();
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    if (value.trim().length < 3) {
      setState(() {
        _phase = _SearchPhase.idle;
        _results = const [];
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 450), () => _runSearch(value));
  }

  Future<void> _runSearch(String query) async {
    setState(() {
      _phase = _SearchPhase.searching;
      _searchError = null;
    });
    try {
      final results =
          await ref.read(locationServiceProvider).searchLocations(query.trim());
      if (!mounted) return;
      setState(() {
        _results = results;
        _phase = results.isEmpty ? _SearchPhase.noResults : _SearchPhase.results;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _SearchPhase.error;
        _searchError = 'Unable to find this location';
      });
    }
  }

  void _selectResult(SelectedLocation location) {
    setState(() {
      _selected = location;
      _confirmed = false;
      _results = const [];
      _phase = _SearchPhase.idle;
      _locationFieldError = null;
      _searchController.text = location.formattedAddress;
    });
    // Guarded: the map is only attached once the preview is built.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        _mapController.move(LatLng(location.latitude, location.longitude), 15);
      } catch (_) {
        /* controller not ready yet — the map builds at this centre anyway */
      }
    });
  }

  void _saveAndNext() {
    final formOk = _formKey.currentState!.validate();
    final location = _selected;

    if (location == null || !_confirmed) {
      setState(() {
        _locationFieldError = location == null
            ? 'Search for the property location and select it'
            : 'Confirm the pinned location to continue';
      });
      return;
    }
    if (!formOk) return;

    ref.read(listingWizardProvider.notifier).updateData(
          (state) => state.copyWith(
            city: location.city,
            locality: location.locality,
            address: _addressController.text.trim(),
            pincode: _pincodeController.text.trim().isEmpty
                ? null
                : _pincodeController.text.trim(),
            landmark: _landmarkController.text.trim().isEmpty
                ? null
                : _landmarkController.text.trim(),
            // Only ever from a confirmed, validated search result.
            latitude: location.latitude,
            longitude: location.longitude,
          ),
        );
    widget.onNext();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Where is your property located?',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 6),
            const Text(
              'Search for the locality, then confirm the pin. This is what places '
              'your listing on the map buyers browse.',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.35),
            ),
            const SizedBox(height: 18),

            TextField(
              controller: _searchController,
              onChanged: _onQueryChanged,
              textInputAction: TextInputAction.search,
              onSubmitted: _runSearch,
              decoration: InputDecoration(
                labelText: 'Search location *',
                hintText: 'Locality, area or landmark',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _phase == _SearchPhase.searching
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2)),
                      )
                    : (_searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _phase = _SearchPhase.idle;
                                _results = const [];
                              });
                            },
                          )
                        : null),
              ),
            ),

            if (_locationFieldError != null) ...[
              const SizedBox(height: 6),
              Text(_locationFieldError!,
                  style: const TextStyle(color: AppTheme.errorColor, fontSize: 12)),
            ],

            _buildSearchState(),

            if (_selected != null) ...[
              const SizedBox(height: 16),
              _buildMapPreview(_selected!),
              const SizedBox(height: 10),
              _buildConfirmRow(_selected!),
            ],

            const SizedBox(height: 20),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                  labelText: 'Address *', border: OutlineInputBorder()),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _pincodeController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                  labelText: 'Pincode', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _landmarkController,
              decoration: const InputDecoration(
                  labelText: 'Landmark', border: OutlineInputBorder()),
            ),

            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _saveAndNext,
              style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16)),
              child: const Text('Next'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchState() {
    switch (_phase) {
      case _SearchPhase.idle:
        return const SizedBox.shrink();

      case _SearchPhase.searching:
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Text('Searching…',
              style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary)),
        );

      case _SearchPhase.noResults:
        return Padding(
          padding: const EdgeInsets.only(top: 12),
          child: _notice(
            icon: Icons.search_off_outlined,
            title: 'No matching locations',
            body: 'Try a nearby landmark, locality or pincode.',
          ),
        );

      case _SearchPhase.error:
        return Padding(
          padding: const EdgeInsets.only(top: 12),
          child: _notice(
            icon: Icons.cloud_off_outlined,
            title: _searchError ?? 'Unable to find this location',
            body: 'Check your connection and try again.',
            action: TextButton.icon(
              onPressed: () => _runSearch(_searchController.text),
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
            ),
          ),
        );

      case _SearchPhase.results:
        return Container(
          margin: const EdgeInsets.only(top: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.borderSubtle),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _results.length,
            separatorBuilder: (_, __) =>
                const Divider(height: 1, color: AppTheme.borderSubtle),
            itemBuilder: (context, i) {
              final r = _results[i];
              return ListTile(
                dense: true,
                leading: const Icon(Icons.place_outlined,
                    size: 20, color: AppTheme.primaryColor),
                title: Text(r.formattedAddress,
                    style: const TextStyle(
                        fontSize: 13.5, fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                onTap: () => _selectResult(r),
              );
            },
          ),
        );
    }
  }

  Widget _notice(
      {required IconData icon,
      required String title,
      required String body,
      Widget? action}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppTheme.textSecondary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title,
                    style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(body,
              style: const TextStyle(
                  fontSize: 12.5, color: AppTheme.textSecondary, height: 1.3)),
          if (action != null) ...[const SizedBox(height: 4), action],
        ],
      ),
    );
  }

  Widget _buildMapPreview(SelectedLocation location) {
    final point = LatLng(location.latitude, location.longitude);
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: SizedBox(
        height: 190,
        child: FlutterMap(
          mapController: _mapController,
          options: MapOptions(initialCenter: point, initialZoom: 15),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.seedhaproperties.mobile',
            ),
            MarkerLayer(
              markers: [
                Marker(
                  point: point,
                  width: 44,
                  height: 44,
                  child: Container(
                    decoration: BoxDecoration(
                      color: _confirmed
                          ? AppTheme.successColor
                          : AppTheme.primaryColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2.5),
                      boxShadow: const [
                        BoxShadow(
                            color: Colors.black26,
                            blurRadius: 6,
                            offset: Offset(0, 2)),
                      ],
                    ),
                    child: Icon(_confirmed ? Icons.check : Icons.home,
                        color: Colors.white, size: 22),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConfirmRow(SelectedLocation location) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _confirmed
            ? AppTheme.successColor.withValues(alpha: 0.07)
            : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: _confirmed
                ? AppTheme.successColor.withValues(alpha: 0.4)
                : AppTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(_confirmed ? Icons.check_circle : Icons.place,
                  size: 18,
                  color: _confirmed
                      ? AppTheme.successColor
                      : AppTheme.primaryColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  location.formattedAddress,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700, height: 1.3),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: _confirmed
                ? OutlinedButton.icon(
                    onPressed: () => setState(() => _confirmed = false),
                    icon: const Icon(Icons.edit_location_alt_outlined, size: 16),
                    label: const Text('Change location'),
                  )
                : ElevatedButton.icon(
                    onPressed: () => setState(() {
                      _confirmed = true;
                      _locationFieldError = null;
                    }),
                    icon: const Icon(Icons.check, size: 18),
                    label: const Text('Confirm Location',
                        style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
          ),
        ],
      ),
    );
  }
}
