import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:seedha_properties_mobile/config/constants.dart';

class VisualLocationDiscoveryWidget extends StatefulWidget {
  const VisualLocationDiscoveryWidget({
    super.key,
    this.initialState,
    this.initialCity,
    required this.onLocationSelected,
    this.onCancel,
  });

  final String? initialState;
  final String? initialCity;
  final void Function(String state, String city, double lat, double lng) onLocationSelected;
  final VoidCallback? onCancel;

  @override
  State<VisualLocationDiscoveryWidget> createState() => _VisualLocationDiscoveryWidgetState();
}

class _VisualLocationDiscoveryWidgetState extends State<VisualLocationDiscoveryWidget> {
  String? _selectedState;
  String? _selectedCity;
  bool _isDetectingGps = false;
  String? _gpsMessage;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _selectedState = widget.initialState;
    _selectedCity = widget.initialCity;
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _handleUseGps() async {
    setState(() {
      _isDetectingGps = true;
      _gpsMessage = null;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _isDetectingGps = false;
          _gpsMessage = 'Location services are disabled on your device. Please pick your location manually below.';
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _isDetectingGps = false;
            _gpsMessage = 'Location permission denied. Please choose your State and City manually below.';
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _isDetectingGps = false;
          _gpsMessage = 'Location permissions are permanently denied. Please choose your State and City manually below.';
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          timeLimit: Duration(seconds: 8),
        ),
      );

      // Find nearest city from AppConstants.cityCentroids
      String? bestCity;
      String? bestState;
      double minDistance = double.infinity;

      AppConstants.cityCentroids.forEach((city, coords) {
        final dist = Geolocator.distanceBetween(
          position.latitude,
          position.longitude,
          coords[0],
          coords[1],
        );
        if (dist < minDistance) {
          minDistance = dist;
          bestCity = city;
        }
      });

      if (bestCity != null) {
        // Resolve state
        for (final entry in AppConstants.citiesByState.entries) {
          if (entry.value.contains(bestCity)) {
            bestState = entry.key;
            break;
          }
        }

        if (bestState != null) {
          final String targetCity = bestCity!;
          final String targetState = bestState;
          final coords = AppConstants.cityCentroids[targetCity] ?? [position.latitude, position.longitude];
          widget.onLocationSelected(targetState, targetCity, coords[0], coords[1]);
          return;
        }
      }

      setState(() {
        _isDetectingGps = false;
      });
    } catch (_) {
      setState(() {
        _isDetectingGps = false;
        _gpsMessage = 'Unable to detect location. Please choose your State and City manually below.';
      });
    }
  }

  void _onStateTap(String state) {
    setState(() {
      _selectedState = state;
      _selectedCity = null;
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          380.0,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  void _onCityTap(String city) {
    if (_selectedState == null) return;
    final coords = AppConstants.cityCentroids[city] ?? [17.3850, 78.4867];
    widget.onLocationSelected(_selectedState!, city, coords[0], coords[1]);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: ListView(
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // Direct Owner Marketplace Badge
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_rounded, size: 14, color: Color(0xFF16A34A)),
                    SizedBox(width: 4),
                    Text(
                      'Direct Owner Marketplace',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF15803D),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (widget.onCancel != null)
                TextButton(
                  onPressed: widget.onCancel,
                  child: const Text('Cancel', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                ),
            ],
          ),
          const SizedBox(height: 10),

          // Main Header
          const Text(
            'Where are you looking?',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Browse verified 0% brokerage direct-owner properties. State selection is required first.',
            style: TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.4),
          ),
          const SizedBox(height: 16),

          // GPS Button
          ElevatedButton.icon(
            onPressed: _isDetectingGps ? null : _handleUseGps,
            icon: _isDetectingGps
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.my_location_rounded, size: 18),
            label: Text(
              _isDetectingGps ? 'Detecting Location...' : 'Use Device GPS (Nearby Properties)',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F766E),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
          ),

          // GPS Message / Error Alert
          if (_gpsMessage != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline_rounded, size: 18, color: Color(0xFFD97706)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _gpsMessage!,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF92400E), height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),

          // Step 1: Select State
          Row(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(
                  color: Color(0xFF0F766E),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Text(
                  '1',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'SELECT STATE',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF475569),
                  letterSpacing: 0.5,
                ),
              ),
              const Spacer(),
              if (_selectedState != null)
                Text(
                  _selectedState!,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F766E),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // State Cards Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 2.2,
            ),
            itemCount: AppConstants.operatingStates.length,
            itemBuilder: (context, index) {
              final state = AppConstants.operatingStates[index];
              final isSelected = _selectedState == state;
              final cityCount = AppConstants.citiesByState[state]?.length ?? 0;

              return InkWell(
                onTap: () => _onStateTap(state),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                      width: isSelected ? 1.8 : 1.0,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.location_city_rounded,
                          size: 14,
                          color: isSelected ? Colors.white : const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              state,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                                color: isSelected ? const Color(0xFF14532D) : const Color(0xFF0F172A),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              '$cityCount cities',
                              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 24),

          if (_selectedState != null) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.arrow_circle_down_rounded, size: 22, color: Color(0xFF16A34A)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '$_selectedState selected! Tap your city below to continue:',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF15803D),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Step 2: Choose City
          Row(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: _selectedState != null ? const Color(0xFF0F766E) : const Color(0xFFCBD5E1),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Text(
                  '2',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _selectedState != null ? 'EXPLORE CITIES IN ${_selectedState!.toUpperCase()}' : 'CHOOSE CITY',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: _selectedState != null ? const Color(0xFF475569) : const Color(0xFF94A3B8),
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (_selectedState == null)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Center(
                child: Column(
                  children: [
                    Icon(Icons.touch_app_rounded, size: 28, color: Color(0xFF94A3B8)),
                    SizedBox(height: 8),
                    Text(
                      'City selection is locked',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Please tap one of the operating States above first.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
            )
          else ...[
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 2.3,
              ),
              itemCount: (AppConstants.citiesByState[_selectedState!] ?? []).length,
              itemBuilder: (context, index) {
                final city = AppConstants.citiesByState[_selectedState!]![index];
                final isSelected = _selectedCity == city;

                return InkWell(
                  onTap: () => _onCityTap(city),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFCBD5E1),
                        width: isSelected ? 1.8 : 1.0,
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x08000000),
                          blurRadius: 4,
                          offset: Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.apartment_rounded,
                          size: 18,
                          color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                city,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: isSelected ? const Color(0xFF14532D) : const Color(0xFF0F172A),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const Text(
                                'Explore homes',
                                style: TextStyle(fontSize: 10.5, color: Color(0xFF16A34A)),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 12,
                          color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFCBD5E1),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}
